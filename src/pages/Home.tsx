import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Users, Lock, User, Image, Video, Shuffle, MapPin, Plus, Sparkles, FileText } from 'lucide-react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { FeedGrid } from '@/components/FeedGrid';
import { ProfileShortcuts } from '@/components/ProfileShortcuts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type PostWithProfile = Post & { profiles?: Profile };

// Main feed tabs - properly separated
const mainTabs = [
  { id: 'all', label: 'All', icon: Shuffle, color: 'from-primary to-secondary' },
  { id: 'regional', label: 'Regional', icon: MapPin, color: 'from-orange-500 to-red-500' },
  { id: 'global', label: 'Global', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'following', label: 'Following', icon: Users, color: 'from-green-500 to-emerald-500' },
  { id: 'private', label: 'Private', icon: Lock, color: 'from-pink-500 to-rose-500' },
  { id: 'create', label: 'Create', icon: Plus, color: 'from-violet-500 to-purple-500' },
  { id: 'profile', label: 'Profile', icon: User, color: 'from-indigo-500 to-blue-500' },
];

// Content type subtabs - only for feed tabs
const contentTabs = [
  { id: 'mixed', label: 'Mixed', icon: Shuffle },
  { id: 'photos', label: 'Photos', icon: Image },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'documents', label: 'Docs', icon: FileText },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('all');
  const [contentType, setContentType] = useState<'mixed' | 'photos' | 'videos' | 'documents'>('mixed');
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to create page if Create tab is selected
    if (activeTab === 'create') {
      navigate('/create');
      setActiveTab('all');
      return;
    }
    if (user) fetchPosts();
  }, [activeTab, user, profile]);

  const fetchPosts = async () => {
    if (!user || activeTab === 'create' || activeTab === 'profile') return;
    setLoading(true);

    try {
      let query = supabase
        .from('posts')
        .select('*, profiles(*)');

      // Filter based on active tab - PROPERLY SEPARATED
      switch (activeTab) {
        case 'all':
          // All public posts - mixed feed
          query = query.eq('visibility', 'public');
          break;
        case 'regional':
          // Filter by user's country/region - only public posts from same region
          query = query.eq('visibility', 'public');
          if (profile?.country) {
            const { data: regionalUsers } = await supabase
              .from('profiles')
              .select('id')
              .eq('country', profile.country);
            const userIds = regionalUsers?.map(u => u.id) || [];
            if (userIds.length > 0) {
              query = query.in('user_id', userIds);
            }
          }
          break;
        case 'global':
          // All public posts worldwide (same as all for now)
          query = query.eq('visibility', 'public');
          break;
        case 'following':
          // ONLY following users' posts - NO suggestions, NO regional, NO global
          const { data: following } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);
          
          // Also get accepted friends
          const { data: friendReqs } = await supabase
            .from('friend_requests')
            .select('sender_id, receiver_id')
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
          
          const followingIds = following?.map(f => f.following_id) || [];
          const friendIds = friendReqs?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || [];
          const allIds = [...new Set([...followingIds, ...friendIds])];
          
          if (allIds.length > 0) {
            // ONLY show posts from following - public posts only
            query = query.eq('visibility', 'public').in('user_id', allIds);
          } else {
            // No following - show empty state
            setPosts([]);
            setLoading(false);
            return;
          }
          break;
        case 'private':
          // ONLY user's own private posts - nothing else
          query = query.eq('user_id', user.id).eq('visibility', 'private');
          break;
        default:
          query = query.eq('visibility', 'public');
      }

      // Order by date, limit results
      query = query.order('created_at', { ascending: false }).limit(50);

      const { data: postsData } = await query;
      
      // Shuffle for 'all' tab to get mixed feed
      let processedPosts = postsData || [];
      if (activeTab === 'all') {
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

      // Fetch like counts
      if (processedPosts.length > 0) {
        const postIds = processedPosts.map(p => p.id);
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
    
    // Check if user already liked this post
    const isLiked = likedPosts.has(postId);
    
    if (isLiked) {
      // Unlike - remove the like
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      setLikeCounts(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 1) - 1) }));
    } else {
      // Like - only one like per user per post
      const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      if (!error) {
        setLikedPosts(prev => new Set(prev).add(postId));
        setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      } else {
        // Already liked (constraint violation)
        toast.error('You already liked this post');
      }
    }
  };

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success('Post deleted');
  };

  const shareToFeed = async (post: PostWithProfile) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.content || '', url: window.location.href });
      } else {
        navigator.clipboard.writeText(`${post.title}\n${post.content}\n\nShared from Crown of Creation`);
        toast.success('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  if (!user) {
    return (
      <div className="space-y-4 pb-20 px-1">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Check which tabs should show content type filters
  const showContentFilters = ['all', 'regional', 'global', 'following', 'private'].includes(activeTab);

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 flex flex-col">
      {/* Header - Compact */}
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Feed</h1>
        </div>
        <Link to="/create">
          <Button size="sm" className="gap-1.5 rounded-full h-8 px-3 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Create
          </Button>
        </Link>
      </div>

      {/* Main Feed Tabs - Scrollable */}
      <div className="flex gap-1.5 overflow-x-auto py-2 px-1 scrollbar-hide">
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all shrink-0",
                isActive 
                  ? "bg-gradient-to-r text-white shadow-md" 
                  : "bg-card/60 text-muted-foreground hover:bg-card",
                isActive && tab.color
              )}
            >
              <tab.icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Type Tabs - only for feed tabs */}
      {showContentFilters && (
        <div className="flex gap-0.5 bg-muted/30 p-0.5 rounded-lg w-fit mx-1 mb-2">
          {contentTabs.map((tab) => {
            const isActive = contentType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setContentType(tab.id as typeof contentType)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                  isActive 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content - Flex grow to fill space */}
      <div className="flex-1 overflow-y-auto px-1">
        {activeTab === 'profile' ? (
          <ProfileShortcuts />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="glass-card border-border">
            <CardContent className="py-8 text-center space-y-3">
              {activeTab === 'following' ? (
                <>
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No Posts from Following</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Follow people or add friends to see their posts here!
                  </p>
                </>
              ) : activeTab === 'private' ? (
                <>
                  <Lock className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No Private Posts</h3>
                  <p className="text-sm text-muted-foreground">Create a private post to keep it just for yourself.</p>
                  <Button onClick={() => navigate('/create')} size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Create Private Post
                  </Button>
                </>
              ) : (
                <>
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No Posts Yet</h3>
                  <p className="text-sm text-muted-foreground">Be the first to share something!</p>
                  <Button onClick={() => navigate('/create')} size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Create Post
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <FeedGrid
            posts={posts}
            savedPosts={savedPosts}
            likedPosts={likedPosts}
            likeCounts={likeCounts}
            currentUserId={user.id}
            onToggleSave={toggleSave}
            onToggleLike={toggleLike}
            onDelete={deletePost}
            onShare={shareToFeed}
            viewMode={contentType === 'documents' ? 'mixed' : contentType}
          />
        )}
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}