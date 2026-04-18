import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, PenLine, Globe } from 'lucide-react';

interface HomeFeedProps {
  activeTab: string;
}

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type PostWithProfile = Post & { profiles?: Profile };

export function HomeFeed({ activeTab }: HomeFeedProps) {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'profile' && profile?.id) {
      navigate(`/profile/${profile.id}`);
      return;
    }
    fetchPosts();
  }, [activeTab, user, profile]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      // Filter based on active tab
      switch (activeTab) {
        case 'regional':
          query = query.eq('visibility', 'public').eq('category', 'explore');
          break;
        case 'global':
          query = query.eq('visibility', 'public').in('category', ['inspire', 'knowledge', 'creative', 'fun', 'explore']);
          break;
        case 'friends':
          const { data: following } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);
          const followingIds = following?.map(f => f.following_id) || [];
          if (followingIds.length > 0) {
            query = query.eq('visibility', 'public').in('user_id', followingIds);
          } else {
            setPosts([]);
            setLoading(false);
            return;
          }
          break;
        case 'videos':
          query = query.eq('visibility', 'public').ilike('file_type', '%video%');
          break;
        case 'private':
          query = query.eq('user_id', user.id).eq('visibility', 'private');
          break;
        default:
          query = query.eq('visibility', 'public');
      }

      const { data: postsData } = await query.limit(20);
      setPosts(postsData || []);

      // Fetch saved and liked posts in parallel
      const [savedResult, likedResult] = await Promise.all([
        supabase.from('saved').select('post_id').eq('user_id', user.id),
        supabase.from('likes').select('post_id').eq('user_id', user.id)
      ]);

      setSavedPosts(new Set(savedResult.data?.map(s => s.post_id) || []));
      setLikedPosts(new Set(likedResult.data?.map(l => l.post_id) || []));

      // Batch fetch like counts
      if (postsData && postsData.length > 0) {
        const postIds = postsData.map(p => p.id);
        const { data: allLikes } = await supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds);
        
        const counts: Record<string, number> = {};
        postIds.forEach(id => { counts[id] = 0; });
        allLikes?.forEach(like => {
          counts[like.post_id] = (counts[like.post_id] || 0) + 1;
        });
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
    } else {
      await supabase.from('saved').insert({ post_id: postId, user_id: user.id });
      setSavedPosts(prev => new Set(prev).add(postId));
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
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      setLikedPosts(prev => new Set(prev).add(postId));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
  };

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const updatePost = async (postId: string, updates: Partial<Post>) => {
    await supabase.from('posts').update(updates).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="glass-card border-border">
        <CardContent className="py-12 text-center space-y-4">
          {activeTab === 'friends' ? (
            <>
              <Users className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <h3 className="text-xl font-semibold">No Friends Posts Yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Follow some users to see their posts here! Explore the global feed to find interesting people.
              </p>
              <Button onClick={() => navigate('/public')} className="gap-2">
                <Globe className="w-4 h-4" />
                Explore Public Feed
              </Button>
            </>
          ) : activeTab === 'private' ? (
            <>
              <PenLine className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <h3 className="text-xl font-semibold">No Private Posts Yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Create a private post to keep your thoughts safe and personal.
              </p>
              <Button onClick={() => navigate('/create')} className="gap-2">
                <PenLine className="w-4 h-4" />
                Create Your First Post
              </Button>
            </>
          ) : (
            <>
              <Globe className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <h3 className="text-xl font-semibold">No Posts Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Be the first to share something in this category!
              </p>
              <Button onClick={() => navigate('/create')} className="gap-2">
                <PenLine className="w-4 h-4" />
                Create a Post
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          isSaved={savedPosts.has(post.id)}
          isLiked={likedPosts.has(post.id)}
          likesCount={likeCounts[post.id] || 0}
          currentUserId={user?.id || ''}
          onToggleSave={toggleSave}
          onToggleLike={toggleLike}
          onDelete={deletePost}
          onUpdate={updatePost}
        />
      ))}
    </div>
  );
}
