import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export function useSupabaseData() {
  const [posts, setPosts] = useState<(Post & { profiles?: Profile })[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [likes, setLikes] = useState<{ post_id: string }[]>([]);
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const cleanup = setupRealtime();
    return cleanup;
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Fetch posts with profile info
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles(*)')
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

      // Fetch saved posts
      const { data: savedData } = await supabase
        .from('saved')
        .select('post_id')
        .eq('user_id', user.id);

      setSaved(savedData?.map(s => s.post_id) || []);

      // Fetch user's likes
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id);

      setLikes(likesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => fetchData()
      )
      .subscribe();

    const likesChannel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
    };
  };

  const toggleSave = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (saved.includes(postId)) {
        await supabase
          .from('saved')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        setSaved(saved.filter(id => id !== postId));
      } else {
        await supabase
          .from('saved')
          .insert({ user_id: user.id, post_id: postId });

        setSaved([...saved, postId]);
      }
    } catch (error: any) {
      toast.error('Failed to update saved status');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      setPosts(posts.filter(p => p.id !== postId));
      toast.success('Post deleted');
    } catch (error: any) {
      toast.error('Failed to delete post');
    }
  };

  const updatePost = async (postId: string, updates: Partial<Post>) => {
    try {
      await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId);

      setPosts(posts.map(p => p.id === postId ? { ...p, ...updates } : p));
      toast.success('Post updated');
    } catch (error: any) {
      toast.error('Failed to update post');
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isLiked = likes.some(l => l.post_id === postId);
      
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        setLikes(likes.filter(l => l.post_id !== postId));
        setLikesCount(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }));
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: postId });

        setLikes([...likes, { post_id: postId }]);
        setLikesCount(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      }
    } catch (error: any) {
      toast.error('Failed to update like status');
    }
  };

  return {
    posts,
    profile,
    saved,
    likes,
    likesCount,
    loading,
    toggleSave,
    toggleLike,
    deletePost,
    updatePost,
    refreshData: fetchData
  };
}
