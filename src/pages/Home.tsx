import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Users, Lock, Image, Video, Shuffle, MapPin, Sparkles, Bookmark, Sun, Moon, Search, Flag } from 'lucide-react';
import { FeedGrid } from '@/components/FeedGrid';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type PostWithProfile = Post & { profiles?: Profile };

// Main tabs - Feed, Create, Private
const mainTabs = [
  { id: 'feed', label: 'Feed', icon: Globe },
  { id: 'create', label: 'Create', icon: Sparkles },
  { id: 'private', label: 'Private', icon: Lock },
];

// Feed sub-tabs: Global, Regional, Friends/Following
const feedSubTabs = [
  { id: 'global', label: 'Global', icon: Globe },
  { id: 'regional', label: 'Regional', icon: MapPin },
  { id: 'following', label: 'Friends', icon: Users },
];

// Content filters: Mix, Pic, Vdo
const contentFilters = [
  { id: 'mixed', label: 'Mix', icon: Shuffle },
  { id: 'photos', label: 'Pic', icon: Image },
  { id: 'videos', label: 'Vdo', icon: Video },
];

// Private sub-tabs: Own, Saved
const privateSubTabs = [
  { id: 'own', label: 'Own', icon: Lock },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

// Country flag mapping
const countryFlags: Record<string, string> = {
  'india': '🇮🇳',
  'usa': '🇺🇸',
  'uk': '🇬🇧',
  'canada': '🇨🇦',
  'australia': '🇦🇺',
  'germany': '🇩🇪',
  'france': '🇫🇷',
  'japan': '🇯🇵',
  'china': '🇨🇳',
  'brazil': '🇧🇷',
  'mexico': '🇲🇽',
  'russia': '🇷🇺',
  'south korea': '🇰🇷',
  'italy': '🇮🇹',
  'spain': '🇪🇸',
  'netherlands': '🇳🇱',
  'sweden': '🇸🇪',
  'switzerland': '🇨🇭',
  'singapore': '🇸🇬',
  'uae': '🇦🇪',
};

export default function Home() {
  const [activeTab, setActiveTab] = useState('feed');
  const [feedSubTab, setFeedSubTab] = useState('global');
  const [privateSubTab, setPrivateSubTab] = useState('own');
  const [contentType, setContentType] = useState<'mixed' | 'photos' | 'videos'>('mixed');
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(() => !document.body.classList.contains('light'));
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Toggle theme
  const toggleTheme = () => {
    document.body.classList.toggle('light');
    setIsDark(!isDark);
  };

  // Get country flag
  const getCountryFlag = () => {
    if (!profile?.country) return '🌍';
    const country = profile.country.toLowerCase();
    return countryFlags[country] || '🌍';
  };

  useEffect(() => {
    if (activeTab === 'create') {
      navigate('/create');
      setActiveTab('feed');
      return;
    }
    if (user) fetchPosts();
  }, [activeTab, feedSubTab, privateSubTab, user, profile]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from('posts')
        .select('*, profiles(*)');

      if (activeTab === 'feed') {
        // Feed tab - filter by sub-tab
        switch (feedSubTab) {
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
              if (userIds.length > 0) {
                query = query.in('user_id', userIds);
              }
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
        }
      } else if (activeTab === 'private') {
        if (privateSubTab === 'own') {
          // Own private posts
          query = query.eq('user_id', user.id).eq('visibility', 'private');
        } else if (privateSubTab === 'saved') {
          // Saved posts
          const { data: savedData } = await supabase
            .from('saved')
            .select('post_id')
            .eq('user_id', user.id);
          
          const savedPostIds = savedData?.map(s => s.post_id) || [];
          if (savedPostIds.length > 0) {
            query = query.in('id', savedPostIds);
          } else {
            setPosts([]);
            setLoading(false);
            return;
          }
        }
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      query = query.order('created_at', { ascending: false }).limit(50);

      const { data: postsData } = await query;
      
      let processedPosts = postsData || [];
      if (activeTab === 'feed' && feedSubTab === 'global') {
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
      } else {
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
      <div className="space-y-4 pb-20 px-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4 flex flex-col">
      {/* Top Header - Crown of Creation, Notification, Theme */}
      <div className="flex items-center justify-between py-3 px-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <h1 className="text-lg font-bold gradient-text">Crown of Creation</h1>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Main Tabs - Feed, Create, Private */}
      <div className="flex gap-1 px-3 py-2 border-b border-border/20">
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feed Tab Content */}
      {activeTab === 'feed' && (
        <>
          {/* Search Bar */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="pl-10 h-10 glass-card"
                onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
              />
            </div>
          </div>

          {/* Feed Sub-tabs: Global, Regional, Friends */}
          <div className="flex gap-1.5 px-3 py-1.5">
            {feedSubTabs.map((tab) => {
              const isActive = feedSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFeedSubTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    isActive 
                      ? "bg-primary/20 text-primary border border-primary/30" 
                      : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  {tab.id === 'regional' ? (
                    <span className="text-sm">{getCountryFlag()}</span>
                  ) : (
                    <tab.icon className="w-3.5 h-3.5" />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Filters: Mix, Pic, Vdo */}
          <div className="flex gap-0.5 bg-muted/20 mx-3 p-0.5 rounded-lg w-fit mb-2">
            {contentFilters.map((filter) => {
              const isActive = contentType === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setContentType(filter.id as typeof contentType)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all",
                    isActive 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <filter.icon className="w-3 h-3" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Private Tab Content */}
      {activeTab === 'private' && (
        <div className="flex gap-1.5 px-3 py-2">
          {privateSubTabs.map((tab) => {
            const isActive = privateSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPrivateSubTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary/20 text-primary border border-primary/30" 
                    : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="glass-card border-border">
            <CardContent className="py-8 text-center space-y-3">
              {activeTab === 'feed' && feedSubTab === 'following' ? (
                <>
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No Posts from Friends</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Follow people or add friends to see their posts here!
                  </p>
                </>
              ) : activeTab === 'private' && privateSubTab === 'own' ? (
                <>
                  <Lock className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No Private Posts</h3>
                  <p className="text-sm text-muted-foreground">Create a private post to keep it just for yourself.</p>
                  <Button onClick={() => navigate('/create')} size="sm" className="gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Create Private Post
                  </Button>
                </>
              ) : activeTab === 'private' && privateSubTab === 'saved' ? (
                <>
                  <Bookmark className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No Saved Posts</h3>
                  <p className="text-sm text-muted-foreground">Save posts to view them here later.</p>
                </>
              ) : (
                <>
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No Posts Yet</h3>
                  <p className="text-sm text-muted-foreground">Be the first to share something!</p>
                  <Button onClick={() => navigate('/create')} size="sm" className="gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Create Post
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
            viewMode={contentType}
          />
        )}
      </div>
    </div>
  );
}
