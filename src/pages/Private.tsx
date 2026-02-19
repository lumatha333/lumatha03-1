import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Bookmark, Heart } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { EnhancedPostCard } from '@/components/EnhancedPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type PostWithProfile = Post & { profiles?: Profile };

export default function Private() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('own');
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) fetchPosts();
  }, [activeTab, user]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let postsData: PostWithProfile[] = [];

      if (activeTab === 'own') {
        const { data } = await supabase
          .from('posts')
          .select('*, profiles(*)')
          .eq('user_id', user.id)
          .eq('visibility', 'private')
          .order('created_at', { ascending: false });
        postsData = data || [];
      } else if (activeTab === 'liked') {
        // Fetch liked posts
        const { data: likedData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);
        const likedPostIds = likedData?.map(l => l.post_id) || [];
        if (likedPostIds.length > 0) {
          const { data } = await supabase
            .from('posts')
            .select('*, profiles(*)')
            .in('id', likedPostIds)
            .order('created_at', { ascending: false });
          postsData = data || [];
        }
      } else if (activeTab === 'saved') {
        const { data: savedData } = await supabase
          .from('saved')
          .select('post_id')
          .eq('user_id', user.id);
        const savedPostIds = savedData?.map(s => s.post_id) || [];
        if (savedPostIds.length > 0) {
          const { data } = await supabase
            .from('posts')
            .select('*, profiles(*)')
            .in('id', savedPostIds)
            .order('created_at', { ascending: false });
          postsData = data || [];
        }
      }

      setPosts(postsData);

      // Fetch user's saved and liked posts
      const [savedResult, likedResult] = await Promise.all([
        supabase.from('saved').select('post_id').eq('user_id', user.id),
        supabase.from('likes').select('post_id').eq('user_id', user.id)
      ]);

      setSavedPosts(new Set(savedResult.data?.map(s => s.post_id) || []));
      setLikedPosts(new Set(likedResult.data?.map(l => l.post_id) || []));

      // Fetch like counts
      if (postsData.length > 0) {
        const postIds = postsData.map(p => p.id);
        const { data: allLikes } = await supabase.from('likes').select('post_id').in('post_id', postIds);
        const counts: Record<string, number> = {};
        postIds.forEach(id => { counts[id] = 0; });
        allLikes?.forEach(like => { counts[like.post_id] = (counts[like.post_id] || 0) + 1; });
        setLikeCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (postId: string) => {
    if (!user) return;
    const isSaved = savedPosts.has(postId);
    if (isSaved) {
      await supabase.from('saved').delete().eq('post_id', postId).eq('user_id', user.id);
      setSavedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      toast.success('Removed from saved');
    } else {
      await supabase.from('saved').insert({ post_id: postId, user_id: user.id });
      setSavedPosts(prev => new Set(prev).add(postId));
      toast.success('Saved!');
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      setLikeCounts(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 1) - 1) }));
    } else {
      const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      if (!error) {
        setLikedPosts(prev => new Set(prev).add(postId));
        setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      }
    }
  };

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success('Post deleted');
  };

  if (!user) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-12 w-full rounded-xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold">Private Zone</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-3 h-auto p-0.5">
          <TabsTrigger value="own" className="gap-1.5 text-xs py-2">
            <Lock className="w-3.5 h-3.5" />
            Own Posts
          </TabsTrigger>
          <TabsTrigger value="liked" className="gap-1.5 text-xs py-2">
            <Heart className="w-3.5 h-3.5" />
            Liked
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-1.5 text-xs py-2">
            <Bookmark className="w-3.5 h-3.5" />
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="own" className="space-y-3 mt-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
            </div>
          ) : posts.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No private posts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create a post with visibility set to "Private"</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <EnhancedPostCard
                  key={post.id}
                  post={post}
                  isSaved={savedPosts.has(post.id)}
                  isLiked={likedPosts.has(post.id)}
                  likesCount={likeCounts[post.id] || 0}
                  currentUserId={user.id}
                  onToggleSave={() => toggleSave(post.id)}
                  onToggleLike={() => toggleLike(post.id)}
                  onDelete={() => deletePost(post.id)}
                  onUpdate={fetchPosts}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked" className="space-y-3 mt-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
            </div>
          ) : posts.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No liked posts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Like posts to see them here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <EnhancedPostCard
                  key={post.id}
                  post={post}
                  isSaved={savedPosts.has(post.id)}
                  isLiked={likedPosts.has(post.id)}
                  likesCount={likeCounts[post.id] || 0}
                  currentUserId={user.id}
                  onToggleSave={() => toggleSave(post.id)}
                  onToggleLike={() => toggleLike(post.id)}
                  onDelete={() => deletePost(post.id)}
                  onUpdate={fetchPosts}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-3 mt-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
            </div>
          ) : posts.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No saved posts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Bookmark posts to save them here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <EnhancedPostCard
                  key={post.id}
                  post={post}
                  isSaved={savedPosts.has(post.id)}
                  isLiked={likedPosts.has(post.id)}
                  likesCount={likeCounts[post.id] || 0}
                  currentUserId={user.id}
                  onToggleSave={() => toggleSave(post.id)}
                  onToggleLike={() => toggleLike(post.id)}
                  onDelete={() => deletePost(post.id)}
                  onUpdate={fetchPosts}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}