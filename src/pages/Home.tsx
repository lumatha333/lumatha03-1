import { useState, useEffect } from 'react';
import { Globe, Users, MapPin, Ghost, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { EnhancedPostCard } from '@/components/EnhancedPostCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type PostWithProfile = Post & { profiles?: Profile };

// Feed Vibe options
const feedVibes = [
  { id: 'global', icon: Globe, label: 'Global', desc: 'Worldwide posts' },
  { id: 'regional', icon: MapPin, label: 'Regional', desc: 'From your country' },
  { id: 'friends', icon: Users, label: 'Friends', desc: 'People you follow' },
  { id: 'ghost', icon: Ghost, label: 'Ghost', desc: 'Disappears in 24h' },
];

export default function Home() {
  const [feedVibe, setFeedVibe] = useState('global');
  const [vibeExpanded, setVibeExpanded] = useState(false);
  const [contentFilter, setContentFilter] = useState('all');
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Listen for filter changes from SubNavigation
  useEffect(() => {
    const handleFilterChange = (e: CustomEvent) => {
      setContentFilter(e.detail);
    };
    window.addEventListener('feedFilterChange', handleFilterChange as EventListener);
    
    // Check initial filter
    const savedFilter = localStorage.getItem('zenpeace_feed_filter');
    if (savedFilter) setContentFilter(savedFilter);
    
    return () => {
      window.removeEventListener('feedFilterChange', handleFilterChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (user) fetchPosts();
  }, [feedVibe, contentFilter, user, profile]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase.from('posts').select('*, profiles(*)');

      // Apply feed vibe filter
      switch (feedVibe) {
        case 'global':
          query = query.eq('visibility', 'public');
          break;
        case 'regional':
          query = query.eq('visibility', 'public');
          if (profile?.country) {
            const { data: regionalUsers } = await supabase
              .from('profiles')
              .select('id')
              .eq('country', profile.country);
            const userIds = regionalUsers?.map(u => u.id) || [];
            if (userIds.length > 0) query = query.in('user_id', userIds);
          }
          break;
        case 'friends':
          const { data: following } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);
          const { data: friendReqs } = await supabase
            .from('friend_requests')
            .select('sender_id, receiver_id')
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
          const followingIds = following?.map(f => f.following_id) || [];
          const friendIds = friendReqs?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || [];
          const allIds = [...new Set([...followingIds, ...friendIds])];
          if (allIds.length > 0) {
            query = query.eq('visibility', 'public').in('user_id', allIds);
          } else {
            setPosts([]);
            setLoading(false);
            return;
          }
          break;
        case 'ghost':
          // Ghost posts - posts from last 24 hours only
          const yesterday = new Date();
          yesterday.setHours(yesterday.getHours() - 24);
          query = query.eq('visibility', 'public').gte('created_at', yesterday.toISOString());
          break;
      }

      // Apply content filter from SubNavigation
      if (contentFilter === 'videos') {
        query = query.or('file_type.ilike.%video%,media_types.cs.{video}');
      }

      query = query.order('created_at', { ascending: false }).limit(50);
      const { data: postsData } = await query;
      
      let processedPosts = postsData || [];
      
      // For global, shuffle posts to mix content
      if (feedVibe === 'global') {
        processedPosts = processedPosts.sort(() => Math.random() - 0.5);
      }
      
      setPosts(processedPosts);

      // Fetch saved and liked posts
      const [savedResult, likedResult] = await Promise.all([
        supabase.from('saved').select('post_id').eq('user_id', user.id),
        supabase.from('likes').select('post_id').eq('user_id', user.id)
      ]);

      setSavedPosts(new Set(savedResult.data?.map(s => s.post_id) || []));
      setLikedPosts(new Set(likedResult.data?.map(l => l.post_id) || []));

      if (processedPosts.length > 0) {
        const postIds = processedPosts.map(p => p.id);
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
  };

  const currentVibe = feedVibes.find(v => v.id === feedVibe) || feedVibes[0];
  const CurrentVibeIcon = currentVibe.icon;

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
      {/* Feed Vibe Selector - Expandable Icon-Based */}
      <div className="relative">
        <button
          onClick={() => setVibeExpanded(!vibeExpanded)}
          className="w-full glass-card rounded-xl p-2.5 flex items-center justify-between hover:bg-primary/5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <CurrentVibeIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{currentVibe.label}</p>
              <p className="text-[10px] text-muted-foreground">{currentVibe.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {feedVibe === 'regional' && profile?.country && (
              <span className="text-xs">{profile.country}</span>
            )}
            {vibeExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded Vibe Options */}
        {vibeExpanded && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-xl p-2 z-20 shadow-lg border border-border animate-in fade-in slide-in-from-top-2 duration-200">
            {feedVibes.map((vibe) => {
              const Icon = vibe.icon;
              const isActive = feedVibe === vibe.id;
              return (
                <button
                  key={vibe.id}
                  onClick={() => {
                    setFeedVibe(vibe.id);
                    setVibeExpanded(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all",
                    isActive 
                      ? "bg-primary/15 text-primary" 
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center",
                    isActive ? "bg-primary/20" : "bg-muted/50"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{vibe.label}</p>
                    <p className="text-[10px] text-muted-foreground">{vibe.desc}</p>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Ghost Mode Notice */}
      {feedVibe === 'ghost' && (
        <Card className="glass-card border-primary/30 bg-primary/5">
          <CardContent className="p-3 text-center">
            <Ghost className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-xs text-muted-foreground">
              Ghost posts disappear after 24 hours ✨
            </p>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <CurrentVibeIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {feedVibe === 'friends' 
                ? 'Follow some users to see their posts here!' 
                : feedVibe === 'ghost'
                ? 'No ghost posts in the last 24 hours'
                : feedVibe === 'regional'
                ? 'No posts from your region yet'
                : 'No posts found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
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
    </div>
  );
}