import { useState, useEffect } from 'react';
import { ShoppingBag, Briefcase, Home as HomeIcon, Heart, Bookmark, MapPin, Award, BarChart3, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function MarketplaceController() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ sell: 0, buy: 0, job: 0, rent: 0, totalLikes: 0, totalViews: 0 });
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [likedListings, setLikedListings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data: listings } = await supabase.from('marketplace_listings').select('type, likes_count, views_count').eq('user_id', user.id);
      if (listings) {
        const s = { sell: 0, buy: 0, job: 0, rent: 0, totalLikes: 0, totalViews: 0 };
        listings.forEach(l => {
          if (l.type in s) (s as any)[l.type]++;
          s.totalLikes += l.likes_count || 0;
          s.totalViews += l.views_count || 0;
        });
        setStats(s);
      }

      const { data: saved } = await supabase
        .from('marketplace_saved')
        .select('listing_id')
        .eq('user_id', user.id);
      if (saved?.length) {
        const { data: sListings } = await supabase
          .from('marketplace_listings')
          .select('id, title, type, media_urls, price')
          .in('id', saved.map(s => s.listing_id));
        setSavedListings(sListings || []);
      }

      const { data: liked } = await supabase
        .from('marketplace_likes')
        .select('listing_id')
        .eq('user_id', user.id);
      if (liked?.length) {
        const { data: lListings } = await supabase
          .from('marketplace_listings')
          .select('id, title, type, media_urls, price')
          .in('id', liked.map(l => l.listing_id));
        setLikedListings(lListings || []);
      }
    };
    fetchStats();
  }, [user]);

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <Card className="glass-card border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">{profile?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-bold text-sm">{profile?.name}</h3>
              {profile?.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
              {profile?.location && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</p>}
              {profile?.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Sell', value: stats.sell, icon: ShoppingBag, color: 'text-emerald-400' },
          { label: 'Buy', value: stats.buy, icon: ShoppingBag, color: 'text-blue-400' },
          { label: 'Jobs', value: stats.job, icon: Briefcase, color: 'text-purple-400' },
          { label: 'Rent', value: stats.rent, icon: HomeIcon, color: 'text-amber-400' },
        ].map(s => (
          <Card key={s.label} className="glass-card">
            <CardContent className="py-3 text-center">
              <s.icon className={`w-5 h-5 mx-auto ${s.color}`} />
              <p className="text-lg font-bold mt-1">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className="glass-card">
          <CardContent className="py-3 text-center">
            <Heart className="w-5 h-5 mx-auto text-red-400" />
            <p className="text-lg font-bold mt-1">{stats.totalLikes}</p>
            <p className="text-[10px] text-muted-foreground">Total Likes</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="py-3 text-center">
            <Eye className="w-5 h-5 mx-auto text-cyan-400" />
            <p className="text-lg font-bold mt-1">{stats.totalViews}</p>
            <p className="text-[10px] text-muted-foreground">Total Views</p>
          </CardContent>
        </Card>
      </div>

      {/* Saved & Liked tabs */}
      <Tabs defaultValue="saved">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="saved" className="text-xs gap-1"><Bookmark className="w-3.5 h-3.5" />Saved</TabsTrigger>
          <TabsTrigger value="liked" className="text-xs gap-1"><Heart className="w-3.5 h-3.5" />Liked</TabsTrigger>
        </TabsList>
        <TabsContent value="saved" className="mt-2 space-y-2">
          {savedListings.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No saved listings</p>
          ) : savedListings.map(l => (
            <MiniListingCard key={l.id} listing={l} />
          ))}
        </TabsContent>
        <TabsContent value="liked" className="mt-2 space-y-2">
          {likedListings.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No liked listings</p>
          ) : likedListings.map(l => (
            <MiniListingCard key={l.id} listing={l} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MiniListingCard({ listing }: { listing: any }) {
  const typeColors: Record<string, string> = { sell: 'bg-emerald-500/20 text-emerald-400', buy: 'bg-blue-500/20 text-blue-400', job: 'bg-purple-500/20 text-purple-400', rent: 'bg-amber-500/20 text-amber-400' };
  return (
    <Card className="glass-card">
      <CardContent className="py-2 px-3 flex items-center gap-3">
        {listing.media_urls?.[0] && (
          <img src={listing.media_urls[0]} className="w-10 h-10 rounded-lg object-cover" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{listing.title}</p>
          {listing.price && <p className="text-[10px] text-muted-foreground">NPR {listing.price.toLocaleString()}</p>}
        </div>
        <Badge className={`text-[9px] ${typeColors[listing.type] || ''}`}>{listing.type}</Badge>
      </CardContent>
    </Card>
  );
}
