import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedPostCard } from '@/components/EnhancedPostCard';
import { LazyImage } from '@/components/LazyImage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FriendTick } from '@/components/zenpeace/FriendTick';
import { SymbolicHeart } from '@/components/zenpeace/SymbolicHeart';
import { 
  ArrowLeft, UserPlus, UserMinus, Settings, User, Image, FileText, Mountain, ShoppingBag,
  MapPin, Calendar, Phone, Globe, Briefcase, Star, Trophy, Eye, MessageCircle, UserCheck, Clock, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'] & { profiles?: Profile };
type Document = Database['public']['Tables']['documents']['Row'];

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [likes, setLikes] = useState<{ post_id: string }[]>([]);
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [adventurePoints, setAdventurePoints] = useState({ challenges: 0, discovery: 0, explore: 0, total: 0 });
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const { sendFriendRequest, acceptFriendRequest, friends } = useFriends();

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setProfile(profileData);

      // Fetch user's posts with profile info
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('user_id', userId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      setPosts(postsData || []);

      // Fetch user's documents
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      setDocuments(docsData || []);

      // Fetch adventure points
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (userPoints) {
        setAdventurePoints({
          challenges: Math.floor(userPoints.total_points * 0.4),
          discovery: Math.floor(userPoints.total_points * 0.35),
          explore: Math.floor(userPoints.total_points * 0.25),
          total: userPoints.total_points
        });
      }

      // Fetch likes count for each post
      if (postsData) {
        const counts: Record<string, number> = {};
        for (const post of postsData) {
          const { count } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          counts[post.id] = count || 0;
        }
        setLikesCount(counts);
      }

      if (currentUser) {
        // Check if following
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)
          .single();

        setIsFollowing(!!followData);

        // Fetch saved posts
        const { data: savedData } = await supabase
          .from('saved')
          .select('post_id')
          .eq('user_id', currentUser.id);

        setSaved(savedData?.map(s => s.post_id) || []);

        // Fetch user's likes
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUser.id);

        setLikes(likesData || []);

        // Check friend status
        const { data: friendData } = await supabase
          .from('friend_requests')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
          .single();

        if (friendData) {
          if (friendData.status === 'accepted') {
            setIsFriend(true);
            setFriendRequestStatus('accepted');
          } else if (friendData.status === 'pending') {
            if (friendData.sender_id === currentUser.id) {
              setFriendRequestStatus('pending_sent');
            } else {
              setFriendRequestStatus('pending_received');
            }
          }
        } else {
          setIsFriend(false);
          setFriendRequestStatus('none');
        }
      }

      // Get friends count (accepted friend requests)
      const { count: friendsCountData } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted');

      setFriendsCount(friendsCountData || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Please login to follow users');
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: userId });
        setIsFollowing(true);
        toast.success('Following!');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const toggleSave = async (postId: string) => {
    if (!currentUser) return;

    try {
      if (saved.includes(postId)) {
        await supabase
          .from('saved')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', postId);
        setSaved(saved.filter(id => id !== postId));
      } else {
        await supabase
          .from('saved')
          .insert({ user_id: currentUser.id, post_id: postId });
        setSaved([...saved, postId]);
      }
    } catch (error) {
      toast.error('Failed to update saved status');
    }
  };

  const toggleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      const isLiked = likes.some(l => l.post_id === postId);
      
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', postId);
        setLikes(likes.filter(l => l.post_id !== postId));
        setLikesCount(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }));
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: currentUser.id, post_id: postId });
        setLikes([...likes, { post_id: postId }]);
        setLikesCount(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      }
    } catch (error) {
      toast.error('Failed to update like status');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const mediaPosts = posts.filter(post => post.file_url || (post.media_urls && post.media_urls.length > 0));

  const getLevel = (points: number) => {
    if (points >= 5000) return { level: 5, title: 'Legend', stars: 5 };
    if (points >= 2000) return { level: 4, title: 'Expert', stars: 4 };
    if (points >= 1000) return { level: 3, title: 'Advanced', stars: 3 };
    if (points >= 500) return { level: 2, title: 'Intermediate', stars: 2 };
    return { level: 1, title: 'Beginner', stars: 1 };
  };

  const levelInfo = getLevel(adventurePoints.total);

  return (
    <div className="max-w-3xl mx-auto space-y-4 p-3 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 h-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {isOwnProfile && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} className="gap-1.5 h-8">
            <Settings className="w-4 h-4" /> Settings
          </Button>
        )}
      </div>

      {/* Profile Header Card */}
      <Card className="glass-card border-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Avatar - Tap to view full size */}
            <div className="relative">
              <Avatar 
                className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-primary/20 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setAvatarOpen(true)}
              >
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                  {profile.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-2">
              {/* Name with FriendTick prominently displayed */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-bold">{profile.name}</h1>
                <FriendTick friendsCount={friendsCount} showLabel />
              </div>
              
              {/* Zenpeace Stats - Friends & Posts only (no follower counts) */}
              <div className="flex gap-6 justify-center sm:justify-start text-center">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <div className="font-bold text-lg">{friendsCount}</div>
                  <div className="text-[10px] text-muted-foreground">Friends</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="font-bold text-lg">{posts.length}</div>
                  <div className="text-[10px] text-muted-foreground">Posts</div>
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              )}

              {/* Action Buttons - Follow, Friend, Message */}
              {!isOwnProfile && currentUser && (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                  {/* Follow Button */}
                  <Button
                    size="sm"
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className="gap-1.5"
                  >
                    {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>

                  {/* Friend Request Button */}
                  {friendRequestStatus === 'none' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        sendFriendRequest(userId!);
                        setFriendRequestStatus('pending_sent');
                      }}
                      className="gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Friend
                    </Button>
                  )}
                  {friendRequestStatus === 'pending_sent' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="gap-1.5"
                    >
                      <Clock className="w-4 h-4" />
                      Request Sent
                    </Button>
                  )}
                  {friendRequestStatus === 'pending_received' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={async () => {
                        const { data } = await supabase
                          .from('friend_requests')
                          .select('id')
                          .eq('sender_id', userId)
                          .eq('receiver_id', currentUser.id)
                          .single();
                        if (data) {
                          acceptFriendRequest(data.id, userId!);
                          setFriendRequestStatus('accepted');
                          setIsFriend(true);
                        }
                      }}
                      className="gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      Accept Request
                    </Button>
                  )}
                  {friendRequestStatus === 'accepted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/30"
                    >
                      <UserCheck className="w-4 h-4" />
                      Friends
                    </Button>
                  )}

                  {/* Message Button - Only for friends */}
                  {isFriend ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate('/chat')}
                      className="gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="gap-1.5 opacity-50"
                      title="Only friends can message"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Screen Avatar Dialog */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="max-w-sm p-0 bg-black/95 border-none">
          <img 
            src={profile.avatar_url || '/placeholder.svg'} 
            alt={profile.name} 
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>

      {/* Profile Tabs with Icons */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-5 h-auto p-0.5">
          <TabsTrigger value="info" className="flex flex-col gap-0.5 py-2 text-[10px]">
            <User className="w-4 h-4" /> Info
          </TabsTrigger>
          <TabsTrigger value="media" className="flex flex-col gap-0.5 py-2 text-[10px]">
            <Image className="w-4 h-4" /> Media
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex flex-col gap-0.5 py-2 text-[10px]">
            <FileText className="w-4 h-4" /> Docs
          </TabsTrigger>
          <TabsTrigger value="adventure" className="flex flex-col gap-0.5 py-2 text-[10px]">
            <Mountain className="w-4 h-4" /> Adventure
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex flex-col gap-0.5 py-2 text-[10px]">
            <ShoppingBag className="w-4 h-4" /> Market
          </TabsTrigger>
        </TabsList>

        {/* INFO TAB */}
        <TabsContent value="info" className="space-y-3 mt-4">
          <Card className="glass-card border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm mb-3">Profile Information</h3>
              
              {profile.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {profile.country && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{profile.country}</span>
                </div>
              )}
              
              {profile.age_group && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>Age: {profile.age_group}</span>
                </div>
              )}
              
              {profile.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {profile.website}
                  </a>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Joined {new Date(profile.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MEDIA TAB */}
        <TabsContent value="media" className="space-y-3 mt-4">
          {mediaPosts.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="py-12 text-center">
                <Image className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No media posts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mediaPosts.map((post) => (
                <EnhancedPostCard
                  key={post.id}
                  post={post}
                  isSaved={saved.includes(post.id)}
                  isLiked={likes.some(l => l.post_id === post.id)}
                  likesCount={likesCount[post.id] || 0}
                  currentUserId={currentUser?.id || ''}
                  onToggleSave={toggleSave}
                  onToggleLike={toggleLike}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* EDUCATION DOCS TAB */}
        <TabsContent value="docs" className="space-y-3 mt-4">
          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Documents</h3>
                <span className="text-xs text-muted-foreground">{documents.length} documents</span>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">No public documents</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <FileText className="w-8 h-8 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.file_type || 'Document'}</p>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVENTURE TAB */}
        <TabsContent value="adventure" className="space-y-3 mt-4">
          <Card className="glass-card border-border">
            <CardContent className="p-4">
              {/* Level & Stars */}
              <div className="text-center mb-6">
                <div className="flex justify-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < levelInfo.stars ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} 
                    />
                  ))}
                </div>
                <h3 className="text-xl font-bold">{levelInfo.title}</h3>
                <p className="text-xs text-muted-foreground">Level {levelInfo.level}</p>
              </div>

              {/* Points Breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-blue-500/10">
                  <Trophy className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <p className="font-bold">{adventurePoints.challenges}</p>
                  <p className="text-[9px] text-muted-foreground">Challenges</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <Mountain className="w-5 h-5 mx-auto text-green-500 mb-1" />
                  <p className="font-bold">{adventurePoints.discovery}</p>
                  <p className="text-[9px] text-muted-foreground">Discovery</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-500/10">
                  <Globe className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                  <p className="font-bold">{adventurePoints.explore}</p>
                  <p className="text-[9px] text-muted-foreground">Explore</p>
                </div>
              </div>

              {/* Total Points */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
                <p className="text-3xl font-bold gradient-text">{adventurePoints.total}</p>
                <p className="text-xs text-muted-foreground">Total Adventure Points</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MARKETPLACE TAB */}
        <TabsContent value="marketplace" className="space-y-3 mt-4">
          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-4">Marketplace Listings</h3>
              
              {/* Categories */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🛒', label: 'Sell / Buy', count: 0 },
                  { icon: '🏠', label: 'Rent', count: 0 },
                  { icon: '💼', label: 'Business', count: 0 },
                  { icon: '💚', label: 'NGOs', count: 0 },
                  { icon: '👔', label: 'Jobs', count: 0 },
                ].map((category) => (
                  <div 
                    key={category.label}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium">{category.label}</p>
                      <p className="text-[10px] text-muted-foreground">{category.count} listings</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center py-8 mt-4">
                <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No marketplace listings yet</p>
                {isOwnProfile && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('/marketplace')}>
                    Create Listing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}