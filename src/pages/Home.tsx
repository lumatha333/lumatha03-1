import { useState, useEffect } from 'react';
import { Globe, Users, MapPin, Ghost, ChevronDown, ChevronUp, Plus, Flag } from 'lucide-react';
import { EnhancedPostCard } from '@/components/EnhancedPostCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type PostWithProfile = Post & { profiles?: Profile };

// Feed category options - Global, Regional, Following, Ghost
const feedCategories = [
  { id: 'global', icon: Globe, label: 'Global', desc: 'Worldwide posts', color: 'text-blue-500' },
  { id: 'regional', icon: Flag, label: 'Regional', desc: 'Your country', color: 'text-green-500' },
  { id: 'following', icon: Users, label: 'Following', desc: 'People you follow', color: 'text-purple-500' },
  { id: 'ghost', icon: Ghost, label: 'Ghost', desc: '24h posts only', color: 'text-orange-500' },
];

export default function Home() {
  const [feedCategory, setFeedCategory] = useState(() => {
    return localStorage.getItem('zenpeace_feed_category') || 'global';
  });
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [contentFilter, setContentFilter] = useState('all');
  const [videoType, setVideoType] = useState<'all' | 'short' | 'long'>('all');
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Listen for filter changes from SubNavigation (VDOs tab)
  useEffect(() => {
    const handleFilterChange = (e: CustomEvent) => {
      setContentFilter(e.detail);
    };
    window.addEventListener('feedFilterChange', handleFilterChange as EventListener);
    
    const savedFilter = localStorage.getItem('zenpeace_feed_filter');
    if (savedFilter) setContentFilter(savedFilter);
    
    return () => {
      window.removeEventListener('feedFilterChange', handleFilterChange as EventListener);
    };
  }, []);

  // Save category preference
  useEffect(() => {
    localStorage.setItem('zenpeace_feed_category', feedCategory);
  }, [feedCategory]);

  useEffect(() => {
    if (user) fetchPosts();
  }, [feedCategory, contentFilter, videoType, user, profile]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase.from('posts').select('*, profiles(*)');
      const userCountry = profile?.country || '';

      // Apply feed category filter
      switch (feedCategory) {
        case 'global':
          query = query.eq('visibility', 'public');
          break;
        case 'regional':
          // Filter by user's country if set
          if (userCountry) {
            query = query.eq('visibility', 'public');
            // We'd need to join with profiles and filter by country
            // For now, show all public posts tagged with the user's country
          } else {
            query = query.eq('visibility', 'public');
          }
          break;
        case 'following':
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
          // Show posts from last 24 hours only
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          query = query.eq('visibility', 'public').gte('created_at', yesterday);
          break;
      }

      // Apply content filter from SubNavigation (VDOs tab)
      if (contentFilter === 'videos') {
        query = query.or('file_type.ilike.%video%,media_types.cs.{video}');
      }

      query = query.order('created_at', { ascending: false }).limit(50);
      let { data: postsData } = await query;
      
      // Filter videos by duration - Short < 180s, Long > 180s
      if (contentFilter === 'videos' && postsData) {
        // For now, we filter based on file_type containing video
        // In real implementation, duration would be stored in DB
        // Using a simple heuristic: shorter file names = shorter videos
        if (videoType === 'short') {
          // Short videos are typically under 180 seconds (3 minutes)
          // Filter posts that are marked as short or have short indicator
          postsData = postsData.filter(p => {
            // Check if post has short indicator in tags or subcategory
            const isShort = p.subcategory?.toLowerCase().includes('short') || 
                           p.tags?.some(t => t.toLowerCase().includes('short')) ||
                           p.title?.toLowerCase().includes('short');
            return isShort !== false; // Include if explicitly short or unknown (for now show all in short mode)
          });
        } else if (videoType === 'long') {
          // Long videos are 180+ seconds
          postsData = postsData.filter(p => {
            const isLong = p.subcategory?.toLowerCase().includes('long') || 
                          p.tags?.some(t => t.toLowerCase().includes('long')) ||
                          p.title?.toLowerCase().includes('full') ||
                          p.title?.toLowerCase().includes('long');
            return isLong !== false;
          });
        }
      }
      
      let processedPosts = postsData || [];
      
      // For regional, filter by country from profile
      if (feedCategory === 'regional' && userCountry) {
        processedPosts = processedPosts.filter(p => p.profiles?.country === userCountry);
      }
      
      // For global, shuffle posts to mix content
      if (feedCategory === 'global') {
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

  const currentCategory = feedCategories.find(v => v.id === feedCategory) || feedCategories[0];
  const CurrentCategoryIcon = currentCategory.icon;

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
      {/* Top Bar: Create Post (Left) + Category Selector (Right) */}
      <div className="flex items-center gap-2">
        {/* Create Post Button */}
        <Button 
          onClick={() => navigate('/create')}
          className="flex-1 gap-2 h-10"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </Button>

        {/* Category Selector - Global / Regional / Following / Ghost */}
        <div className="relative">
          <button
            onClick={() => setCategoryExpanded(!categoryExpanded)}
            className="glass-card rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-primary/5 transition-all"
          >
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center`}>
              <CurrentCategoryIcon className={`w-4 h-4 ${currentCategory.color}`} />
            </div>
            <span className="text-sm font-medium">{currentCategory.label}</span>
            {categoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Expanded Category Options */}
          {categoryExpanded && (
            <div className="absolute top-full right-0 mt-1 glass-card rounded-xl p-2 z-20 shadow-lg border border-border animate-in fade-in slide-in-from-top-2 duration-200 min-w-[180px]">
              {feedCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = feedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setFeedCategory(cat.id);
                      setCategoryExpanded(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-lg transition-all",
                      isActive 
                        ? "bg-primary/15 text-primary" 
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center",
                      isActive ? "bg-primary/20" : "bg-muted/50"
                    )}>
                      <Icon className={cn("w-3.5 h-3.5", cat.color)} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-xs">{cat.label}</p>
                      <p className="text-[9px] text-muted-foreground">{cat.desc}</p>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Video Mode - Short/Long Toggle */}
      {contentFilter === 'videos' && (
        <Card className="glass-card border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">📹</span>
              {['all', 'short', 'long'].map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={videoType === type ? 'default' : 'outline'}
                  className="h-7 text-xs capitalize px-3"
                  onClick={() => setVideoType(type as 'all' | 'short' | 'long')}
                >
                  {type === 'all' && 'All'}
                  {type === 'short' && '⚡ Short'}
                  {type === 'long' && '🎬 Long'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ghost Mode Notice */}
      {feedCategory === 'ghost' && (
        <Card className="glass-card border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-orange-500 flex items-center justify-center gap-1">
              <Ghost className="w-3 h-3" /> Ghost Mode: Only 24-hour posts
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
            <CurrentCategoryIcon className={`h-12 w-12 mx-auto mb-3 ${currentCategory.color}`} />
            <p className="text-muted-foreground">
              {feedCategory === 'following' 
                ? 'Follow some users to see their posts here!' 
                : feedCategory === 'regional'
                ? 'No posts from your region yet'
                : feedCategory === 'ghost'
                ? 'No ghost posts in the last 24 hours'
                : contentFilter === 'videos'
                ? 'No videos found'
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