import { useState, useEffect } from 'react';
import { Globe, Users, Ghost, ChevronDown, ChevronUp, Plus, Flag } from 'lucide-react';
import { EnhancedPostCard } from '@/components/EnhancedPostCard';
import { ShortsViewer } from '@/components/ShortsViewer';
import { CommentsDialog } from '@/components/CommentsDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { FeedInterleaver } from '@/components/feed/FeedInterleaver';
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

const feedCategories = [
  { id: 'global', icon: Globe, label: 'Global', desc: 'Worldwide posts', color: 'text-blue-500' },
  { id: 'regional', icon: Flag, label: 'Regional', desc: 'Your country', color: 'text-green-500' },
  { id: 'following', icon: Users, label: 'Following', desc: 'People you follow', color: 'text-purple-500' },
  { id: 'ghost', icon: Ghost, label: 'Ghost', desc: '24h posts only', color: 'text-orange-500' },
];

export default function Home() {
  const [feedCategory, setFeedCategory] = useState(() => localStorage.getItem('lumatha_feed_category') || 'global');
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [contentFilter, setContentFilter] = useState('all');
  const [videoType, setVideoType] = useState<'all' | 'short' | 'long'>('all');
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [showShortsViewer, setShowShortsViewer] = useState(false);
  const [shortsData, setShortsData] = useState<any[]>([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Listen for filter changes from SubNavigation
  useEffect(() => {
    const handleFilterChange = (e: CustomEvent) => { setContentFilter(e.detail); };
    window.addEventListener('feedFilterChange', handleFilterChange as EventListener);
    const savedFilter = localStorage.getItem('lumatha_feed_filter');
    if (savedFilter) setContentFilter(savedFilter);
    return () => { window.removeEventListener('feedFilterChange', handleFilterChange as EventListener); };
  }, []);

  useEffect(() => { localStorage.setItem('lumatha_feed_category', feedCategory); }, [feedCategory]);
  useEffect(() => { if (user) fetchPosts(); }, [feedCategory, contentFilter, videoType, user, profile]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase.from('posts').select('*, profiles(*)');
      const userCountry = profile?.country || '';

      switch (feedCategory) {
        case 'global':
          query = query.eq('visibility', 'public').neq('category', 'ghost');
          break;
        case 'regional':
          query = query.eq('visibility', 'public').neq('category', 'ghost');
          break;
        case 'following':
          const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
          const { data: friendReqs } = await supabase.from('friend_requests').select('sender_id, receiver_id').eq('status', 'accepted').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
          const followingIds = following?.map(f => f.following_id) || [];
          const friendIds = friendReqs?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || [];
          const allIds = [...new Set([...followingIds, ...friendIds])];
          if (allIds.length > 0) {
            query = query.eq('visibility', 'public').neq('category', 'ghost').in('user_id', allIds);
          } else {
            setPosts([]); setLoading(false); return;
          }
          break;
        case 'ghost':
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          query = query.eq('visibility', 'public').eq('category', 'ghost').gte('created_at', yesterday);
          break;
      }

      if (contentFilter === 'videos') {
        query = query.or('file_type.ilike.%video%,media_types.cs.{video}');
        if (feedCategory !== 'ghost') query = query.neq('category', 'ghost');
      }

      query = query.order('created_at', { ascending: false }).limit(50);
      let { data: postsData } = await query;

      // Duration-based filtering is handled when opening shorts viewer
      // Short = ≤60s, Long = >60s (checked via video element duration at playback)

      let processedPosts = postsData || [];
      if (feedCategory === 'regional' && userCountry) processedPosts = processedPosts.filter(p => p.profiles?.country === userCountry);
      if (feedCategory === 'global') processedPosts = processedPosts.sort(() => Math.random() - 0.5);
      setPosts(processedPosts);

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

  const renderPost = (post: PostWithProfile) => (
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
  );

  return (
    <div className="space-y-2 pb-20">
      {/* Row A: Create Post + Category Dropdown */}
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate('/create')} className="flex-1 gap-2 h-[52px] rounded-[14px]" variant="outline">
          <Plus className="w-4 h-4" />
          Create Post
        </Button>
        <div className="relative">
          <button
            onClick={() => setCategoryExpanded(!categoryExpanded)}
            className="glass-card rounded-[14px] px-3 py-2 flex items-center gap-2 hover:bg-primary/5 transition-all min-w-[120px]"
          >
            <CurrentCategoryIcon className={`w-4 h-4 ${currentCategory.color}`} />
            <span className="text-sm font-medium">{currentCategory.label}</span>
            {categoryExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {categoryExpanded && (
            <div className="absolute top-full right-0 mt-1 glass-card rounded-2xl p-2 z-20 shadow-lg border border-border animate-in fade-in slide-in-from-top-2 duration-200 min-w-[180px]">
              {feedCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = feedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setFeedCategory(cat.id); setCategoryExpanded(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-xl transition-all",
                      isActive ? "bg-primary/15 text-primary" : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", cat.color)} />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-xs">{cat.label}</p>
                      <p className="text-[9px] text-muted-foreground">{cat.desc}</p>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Video Duration Filter — Classic: Short (≤1min) / Long (>1min) */}
      {contentFilter === 'videos' && (
        <div className="flex items-center gap-2">
          {(['all', 'short', 'long'] as const).map((type) => (
            <Button
              key={type}
              size="sm"
              variant={videoType === type ? 'default' : 'ghost'}
              className={cn(
                "h-8 text-xs px-4 rounded-full transition-all",
                videoType === type && "shadow-md"
              )}
              onClick={() => setVideoType(type)}
            >
              {type === 'all' ? 'All' : type === 'short' ? 'Short' : 'Long'}
            </Button>
          ))}
        </div>
      )}

      {/* Ghost Mode Notice */}
      {feedCategory === 'ghost' && (
        <Card className="glass-card border-orange-500/30 bg-orange-500/5 rounded-2xl">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-orange-400 flex items-center justify-center gap-1">
              <Ghost className="w-3 h-3" /> Ghost Mode: Only 24-hour posts
            </p>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed with Interleaving */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
        </div>
      ) : posts.length === 0 ? (
        <Card className="glass-card rounded-2xl">
          <CardContent className="py-12 text-center">
            <CurrentCategoryIcon className={`h-12 w-12 mx-auto mb-3 ${currentCategory.color}`} />
            <p className="text-muted-foreground text-sm">
              {feedCategory === 'following' ? 'Follow some users to see their posts here!'
                : feedCategory === 'regional' ? 'No posts from your region yet'
                : feedCategory === 'ghost' ? 'No ghost posts in the last 24 hours'
                : contentFilter === 'videos' ? 'No videos found'
                : 'No posts found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <FeedInterleaver posts={posts} renderPost={(post) => renderPost(post)} />
      )}

      {/* Shorts Viewer */}
      {showShortsViewer && shortsData.length > 0 && (
        <ShortsViewer
          videos={shortsData} initialIndex={0} onClose={() => setShowShortsViewer(false)}
          onLike={(videoId) => toggleLike(videoId)} onSave={(videoId) => toggleSave(videoId)}
          onDelete={(videoId) => {
            deletePost(videoId);
            const newData = shortsData.filter((v: any) => v.id !== videoId);
            if (newData.length === 0) setShowShortsViewer(false);
            else setShortsData(newData);
          }}
          onComment={(videoId) => { setSelectedPostId(videoId); setCommentDialogOpen(true); }}
          onShare={(videoId) => { setSelectedPostId(videoId); setShareDialogOpen(true); }}
          onProfileClick={(userId) => { setShowShortsViewer(false); navigate(`/profile/${userId}`); }}
        />
      )}

      <CommentsDialog postId={selectedPostId} open={commentDialogOpen} onOpenChange={setCommentDialogOpen} postTitle="" />
      <ShareDialog postId={selectedPostId} open={shareDialogOpen} onOpenChange={setShareDialogOpen} />
    </div>
  );
}
