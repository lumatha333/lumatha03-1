import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/PostCard';
import { LazyImage } from '@/components/LazyImage';
import { ArrowLeft, UserPlus, UserMinus, Grid3x3, LayoutGrid, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'] & { profiles?: Profile };

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [likes, setLikes] = useState<{ post_id: string }[]>([]);
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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
      }

      // Get followers/following count
      const { count: followersCountData } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      const { count: followingCountData } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setFollowersCount(followersCountData || 0);
      setFollowingCount(followingCountData || 0);
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
        setFollowersCount(prev => prev - 1);
        toast.success('Unfollowed');
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: userId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
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
  const mediaPosts = posts.filter(post => post.file_url && (post.file_type === 'image' || post.file_type?.startsWith('image/')));

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {isOwnProfile && (
          <Button variant="ghost" onClick={() => navigate('/settings')} className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        )}
      </div>

      <Card className="glass-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <Avatar className="w-32 h-32 border-4 border-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-3xl">{profile.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 w-full space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">{profile.name}</h1>
                {!isOwnProfile && currentUser && (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className="gap-2"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="flex gap-8 justify-center md:justify-start text-center">
                <div>
                  <div className="font-bold text-2xl">{posts.length}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="font-bold text-2xl">{followersCount}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="font-bold text-2xl">{followingCount}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>

              {profile.bio && (
                <div className="text-center md:text-left">
                  <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="glass-card w-full justify-start">
          <TabsTrigger value="posts" className="gap-2 flex-1 md:flex-none">
            <LayoutGrid className="w-4 h-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2 flex-1 md:flex-none">
            <Grid3x3 className="w-4 h-4" />
            Media
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4 mt-6">
          {posts.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="py-16 text-center">
                <LayoutGrid className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No public posts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <PostCard
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

        <TabsContent value="media" className="space-y-4 mt-6">
          {mediaPosts.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="py-16 text-center">
                <Grid3x3 className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No media posts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-2">
              {mediaPosts.map((post) => (
                <div key={post.id} className="aspect-square group relative overflow-hidden rounded-md cursor-pointer hover-lift">
                  <LazyImage
                    src={post.file_url || ''}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-center space-y-1">
                      <p className="font-semibold text-xs md:text-sm line-clamp-2 px-2">{post.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
