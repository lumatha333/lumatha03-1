import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Briefcase, Home as HomeIcon, MapPin, Calendar, Award, MessageCircle, Heart, Bookmark, ArrowLeft, Edit3, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function MarketplaceProfile() {
  const { userId } = useParams();
  const { user, profile: myProfile } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.id === userId;

  const [profile, setProfile] = useState<any>(null);
  const [mpProfile, setMpProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [likedListings, setLikedListings] = useState<any[]>([]);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ sell: 0, job: 0, rent: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
    fetchListings();
    if (isOwner) {
      fetchSaved();
      fetchLiked();
      fetchChats();
    }
  }, [userId]);

  const fetchProfile = async () => {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(p);
    const { data: mp } = await supabase.from('marketplace_profiles').select('*').eq('user_id', userId!).maybeSingle();
    setMpProfile(mp);
    if (mp) {
      setEditBio(mp.bio || '');
      setEditQualification(mp.qualification || '');
    }
  };

  const fetchListings = async () => {
    const { data } = await supabase.from('marketplace_listings').select('*').eq('user_id', userId!).eq('status', 'active').order('created_at', { ascending: false });
    if (data) {
      setListings(data);
      const s = { sell: 0, job: 0, rent: 0 };
      data.forEach(l => { if (l.type in s) (s as any)[l.type]++; });
      setStats(s);
    }
  };

  const fetchSaved = async () => {
    if (!user) return;
    const { data: saved } = await supabase.from('marketplace_saved').select('listing_id').eq('user_id', user.id);
    if (saved?.length) {
      const { data } = await supabase.from('marketplace_listings').select('*').in('id', saved.map(s => s.listing_id));
      setSavedListings(data || []);
    }
  };

  const fetchLiked = async () => {
    if (!user) return;
    const { data: liked } = await supabase.from('marketplace_likes').select('listing_id').eq('user_id', user.id);
    if (liked?.length) {
      const { data } = await supabase.from('marketplace_listings').select('*').in('id', liked.map(l => l.listing_id));
      setLikedListings(data || []);
    }
  };

  const fetchChats = async () => {
    if (!user) return;
    const { data: msgs } = await supabase.from('messages').select('sender_id, receiver_id').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(30);
    if (msgs) {
      const otherIds = [...new Set(msgs.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))].slice(0, 10);
      if (otherIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url, username').in('id', otherIds);
        setChatUsers(profiles || []);
      }
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    const payload = { user_id: user.id, bio: editBio.slice(0, 120), qualification: editQualification };
    if (mpProfile) {
      await supabase.from('marketplace_profiles').update(payload).eq('user_id', user.id);
    } else {
      await supabase.from('marketplace_profiles').insert(payload);
    }
    setEditOpen(false);
    fetchProfile();
  };

  const filteredListings = filter === 'all' ? listings : listings.filter(l => l.type === filter);

  const typeColors: Record<string, string> = {
    sell: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    job: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
    rent: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  };

  if (!profile) return null;

  return (
    <div className="space-y-4 pb-24">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')} className="gap-1 -ml-2">
        <ArrowLeft className="w-4 h-4" />Back to Marketplace
      </Button>

      {/* Profile Header */}
      <Card className="border-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 backdrop-blur-xl overflow-hidden">
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 ring-2 ring-primary/30">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xl font-bold">{profile.name?.[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg">{profile.name}</h2>
              {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
              {(mpProfile?.bio || profile.bio) && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mpProfile?.bio || profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {(mpProfile?.location || profile.detected_city) && (
                  <Badge variant="outline" className="text-[10px] gap-1"><MapPin className="w-3 h-3" />{mpProfile?.location || `${profile.detected_city}${profile.country ? `, ${profile.country}` : ''}`}</Badge>
                )}
                {mpProfile?.qualification && (
                  <Badge variant="outline" className="text-[10px] gap-1"><Award className="w-3 h-3" />{mpProfile.qualification}</Badge>
                )}
                <Badge variant="outline" className="text-[10px] gap-1"><Calendar className="w-3 h-3" />Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</Badge>
              </div>
            </div>
          </div>
          {isOwner && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="mt-3 w-full gap-1 text-xs border-primary/20">
              <Edit3 className="w-3 h-3" />Edit Marketplace Profile
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Sell', value: stats.sell, icon: ShoppingBag, gradient: 'from-emerald-500/20 to-emerald-600/5' },
          { label: 'Jobs', value: stats.job, icon: Briefcase, gradient: 'from-violet-500/20 to-violet-600/5' },
          { label: 'Rent', value: stats.rent, icon: HomeIcon, gradient: 'from-amber-500/20 to-amber-600/5' },
        ].map(s => (
          <Card key={s.label} className={`border-0 bg-gradient-to-br ${s.gradient} backdrop-blur-sm`}>
            <CardContent className="py-3 text-center">
              <s.icon className="w-5 h-5 mx-auto text-foreground/70" />
              <p className="text-lg font-bold mt-1">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`w-full grid ${isOwner ? 'grid-cols-4' : 'grid-cols-1'}`}>
          <TabsTrigger value="posts" className="text-xs gap-1"><ShoppingBag className="w-3.5 h-3.5" />Posts</TabsTrigger>
          {isOwner && <TabsTrigger value="chats" className="text-xs gap-1"><MessageCircle className="w-3.5 h-3.5" />Chats</TabsTrigger>}
          {isOwner && <TabsTrigger value="saved" className="text-xs gap-1"><Bookmark className="w-3.5 h-3.5" />Saved</TabsTrigger>}
          {isOwner && <TabsTrigger value="liked" className="text-xs gap-1"><Heart className="w-3.5 h-3.5" />Liked</TabsTrigger>}
        </TabsList>

        <TabsContent value="posts" className="mt-3 space-y-3">
          {/* Filter */}
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32 h-8 text-xs"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sell">Buy/Sell</SelectItem>
                <SelectItem value="job">Jobs</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredListings.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No listings yet</p>
          ) : filteredListings.map(l => (
            <ListingMiniCard key={l.id} listing={l} onChat={() => navigate(`/chat/${l.user_id}`)} isOwner={isOwner} />
          ))}
        </TabsContent>

        {isOwner && (
          <TabsContent value="chats" className="mt-3 space-y-2">
            {chatUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No marketplace chats yet</p>
            ) : chatUsers.map(u => (
              <Card key={u.id} className="border-border/30 bg-gradient-to-r from-card/80 to-card/40 cursor-pointer hover:from-primary/5 transition-all" onClick={() => navigate(`/chat/${u.id}`)}>
                <CardContent className="py-2.5 px-3 flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{u.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    {u.username && <p className="text-[10px] text-muted-foreground">@{u.username}</p>}
                  </div>
                  <MessageCircle className="w-4 h-4 text-primary" />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}

        {isOwner && (
          <TabsContent value="saved" className="mt-3 space-y-2">
            {savedListings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No saved listings</p>
            ) : savedListings.map(l => (
              <ListingMiniCard key={l.id} listing={l} onChat={() => navigate(`/chat/${l.user_id}`)} isOwner={false} />
            ))}
          </TabsContent>
        )}

        {isOwner && (
          <TabsContent value="liked" className="mt-3 space-y-2">
            {likedListings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No liked listings</p>
            ) : likedListings.map(l => (
              <ListingMiniCard key={l.id} listing={l} onChat={() => navigate(`/chat/${l.user_id}`)} isOwner={false} />
            ))}
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Marketplace Profile</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Bio (max 120 chars)</label>
              <Textarea value={editBio} onChange={e => setEditBio(e.target.value.slice(0, 120))} placeholder="What you do on the marketplace..." rows={2} maxLength={120} />
              <p className="text-[10px] text-muted-foreground text-right">{editBio.length}/120</p>
            </div>
            <div>
              <label className="text-xs font-medium">Qualification</label>
              <Input value={editQualification} onChange={e => setEditQualification(e.target.value)} placeholder="e.g. Certified Mechanic, MBA" />
            </div>
            <Button onClick={saveProfile} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListingMiniCard({ listing, onChat, isOwner }: { listing: any; onChat: () => void; isOwner: boolean }) {
  const typeIcons: Record<string, any> = { sell: ShoppingBag, job: Briefcase, rent: HomeIcon };
  const TypeIcon = typeIcons[listing.type] || ShoppingBag;
  const typeLabels: Record<string, string> = { sell: 'Buy/Sell', job: 'Job', rent: 'Rent' };
  const typeBg: Record<string, string> = {
    sell: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    job: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    rent: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };

  return (
    <Card className="border-border/30 bg-gradient-to-r from-card/80 to-card/40 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {listing.media_urls?.[0] && (
            <img src={listing.media_urls[0]} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" alt="" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold truncate">{listing.title}</h4>
              <Badge className={`text-[9px] shrink-0 ${typeBg[listing.type] || ''}`}>
                <TypeIcon className="w-3 h-3 mr-0.5" />{typeLabels[listing.type] || listing.type}
              </Badge>
            </div>
            {listing.description && <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{listing.description}</p>}
            <div className="flex items-center gap-2 mt-1">
              {listing.price != null && <span className="text-xs font-medium text-primary">NPR {listing.price.toLocaleString()}</span>}
              {listing.location && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" />{listing.location}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{listing.likes_count || 0}</span>
              <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{listing.comments_count || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
