import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, User, FileText, Image, Calendar, Sparkles, 
  Play, X, Heart, MessageCircle, Share2, Clock, Trash2, MapPin,
  UserPlus, UserCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isValid, parse, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { CommentsDialog } from '@/components/CommentsDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { toast } from 'sonner';

// Recent Search Item
interface RecentSearch {
  type: 'user' | 'keyword' | 'date';
  value: string;
  label: string;
  timestamp: number;
}

export default function Search() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dateQuery, setDateQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string } | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  
  // Social interactions
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [selectedPostTitle, setSelectedPostTitle] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareContent, setShareContent] = useState({ id: '', title: '', content: '' });

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zenpeace_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 10));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  // Debounced search - 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setUsers([]);
        setPosts([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Date search trigger
  useEffect(() => {
    if (dateQuery && activeTab === 'date') {
      searchByDate();
    }
  }, [dateQuery]);

  // Fetch user's liked posts and following status
  useEffect(() => {
    if (user) {
      supabase.from('likes').select('post_id').eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setLikedPosts(new Set(data.map(l => l.post_id)));
        });
      
      supabase.from('follows').select('following_id').eq('follower_id', user.id)
        .then(({ data }) => {
          if (data) setFollowing(new Set(data.map(f => f.following_id)));
        });
    }
  }, [user]);

  const addRecentSearch = (type: RecentSearch['type'], value: string, label: string) => {
    const newSearch: RecentSearch = { type, value, label, timestamp: Date.now() };
    const updated = [newSearch, ...recentSearches.filter(s => !(s.type === type && s.value === value))].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('zenpeace_recent_searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('zenpeace_recent_searches');
    toast.success('Search history cleared');
  };

  const parseNaturalDate = (input: string): Date | null => {
    const lower = input.toLowerCase().trim();
    
    if (lower === 'today') return new Date();
    if (lower === 'yesterday') return subDays(new Date(), 1);
    
    const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'd MMM yyyy', 'MMM d, yyyy', 'd MMMM yyyy'];
    for (const fmt of formats) {
      const parsed = parse(input, fmt, new Date());
      if (isValid(parsed)) return parsed;
    }
    
    const isoDate = parseISO(input);
    if (isValid(isoDate)) return isoDate;
    
    return null;
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      addRecentSearch('keyword', searchQuery, searchQuery);

      // Search users for all, users tab
      if (activeTab === 'all' || activeTab === 'users') {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .limit(20);
        setUsers(usersData || []);
      }

      // Search posts
      if (activeTab === 'all' || activeTab === 'posts' || activeTab === 'media') {
        let query = supabase
          .from('posts')
          .select('*, profiles(*)')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(50);

        if (activeTab === 'posts') {
          // Text posts only
          query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
            .is('file_url', null);
        } else if (activeTab === 'media') {
          // Media posts only
          query = query.not('file_url', 'is', null);
        } else {
          query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
        }

        const { data: postsData } = await query;
        setPosts(postsData || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchByDate = async () => {
    if (!dateQuery) return;
    setLoading(true);

    try {
      let searchDate = parseNaturalDate(dateQuery);
      
      if (!searchDate) {
        searchDate = parseISO(dateQuery);
      }
      
      if (!isValid(searchDate)) {
        toast.error('Invalid date. Try: today, yesterday, or 2024-12-31');
        setLoading(false);
        return;
      }

      const formattedDate = format(searchDate, 'MMMM d, yyyy');
      addRecentSearch('date', dateQuery, formattedDate);

      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('visibility', 'public')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      setPosts(postsData || []);
      setUsers([]);
    } catch (error) {
      console.error('Date search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);
    
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setLikedPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      setLikedPosts(prev => new Set(prev).add(postId));
    }
  };

  const toggleFollow = async (profileId: string) => {
    if (!user || user.id === profileId) return;
    const isFollowing = following.has(profileId);
    
    try {
      if (isFollowing) {
        await supabase.from('follows').delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileId);
        setFollowing(prev => { const next = new Set(prev); next.delete(profileId); return next; });
        toast.success('Unfollowed');
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: profileId
        });
        setFollowing(prev => new Set(prev).add(profileId));
        toast.success('Following');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const openComments = (id: string, title: string) => {
    setSelectedPostId(id);
    setSelectedPostTitle(title);
    setCommentsOpen(true);
  };

  const openShare = (post: any) => {
    setShareContent({ id: post.id, title: post.title, content: post.content || '' });
    setShareOpen(true);
  };

  const mediaPosts = posts.filter(p => p.file_url || (p.media_urls && p.media_urls.length > 0));
  const textPosts = posts.filter(p => !p.file_url && (!p.media_urls || p.media_urls.length === 0));

  const openMedia = (url: string, type: string) => {
    setSelectedMedia({ url, type });
  };

  // Render skeleton loader
  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={i} className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render user card with follow button
  const renderUserCard = (profile: any, i: number) => {
    const isFollowingUser = following.has(profile.id);
    const isSelf = user?.id === profile.id;
    
    return (
      <Card 
        key={profile.id} 
        className="glass-card transition-all duration-200 hover:bg-muted/30 animate-in fade-in slide-in-from-left"
        style={{ animationDelay: `${i * 40}ms` }}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <Avatar 
            className="w-14 h-14 ring-2 ring-primary/20 cursor-pointer"
            onClick={() => {
              addRecentSearch('user', profile.id, profile.name);
              navigate(`/profile/${profile.id}`);
            }}
          >
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-lg">
              {profile.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              addRecentSearch('user', profile.id, profile.name);
              navigate(`/profile/${profile.id}`);
            }}
          >
            <p className="font-semibold truncate">{profile.name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.bio || 'Zenpeace User'}</p>
            {profile.location && (
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" /> {profile.location}
              </p>
            )}
          </div>
          {!isSelf && (
            <Button
              size="sm"
              variant={isFollowingUser ? "outline" : "default"}
              className="h-8 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleFollow(profile.id);
              }}
            >
              {isFollowingUser ? (
                <><UserCheck className="w-3 h-3" /> Following</>
              ) : (
                <><UserPlus className="w-3 h-3" /> Follow</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render post card with social actions
  const renderPostCard = (post: any, i: number) => {
    const isLiked = likedPosts.has(post.id);
    
    return (
      <Card 
        key={post.id} 
        className="glass-card transition-all duration-200 animate-in fade-in slide-in-from-right"
        style={{ animationDelay: `${i * 40}ms` }}
      >
        <CardContent className="p-3">
          {/* Author */}
          <div 
            className="flex items-center gap-2 mb-2 cursor-pointer"
            onClick={() => navigate(`/profile/${post.user_id}`)}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback className="text-[10px]">{post.profiles?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{post.profiles?.name}</p>
              <p className="text-[9px] text-muted-foreground">
                {format(new Date(post.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <Badge variant="outline" className="text-[8px] ml-auto">{post.category}</Badge>
          </div>
          
          {/* Content */}
          <p className="text-sm font-medium">{post.title}</p>
          {post.content && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.content}</p>}
          
          {/* Media */}
          {post.file_url && (
            <div 
              className="mt-2 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => openMedia(post.file_url, post.file_type)}
            >
              {post.file_type?.includes('video') ? (
                <div className="relative">
                  <video src={post.file_url} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                </div>
              ) : (
                <img src={post.file_url} alt="" className="w-full h-40 object-cover hover:scale-105 transition-transform" />
              )}
            </div>
          )}
          
          {/* Social Actions */}
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/50">
            <button 
              onClick={() => toggleLike(post.id)} 
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
              <span>{post.likes_count || 0}</span>
            </button>
            <button 
              onClick={() => openComments(post.id, post.title)} 
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-4 h-4" />
              Comment
            </button>
            <button 
              onClick={() => openShare(post)} 
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 pb-20 scroll-smooth">
      {/* Search Input - Enhanced with animation */}
      <div className={cn(
        "relative transition-all duration-300",
        isFocused && "transform scale-[1.01]"
      )}>
        <SearchIcon className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
          isFocused ? "text-primary" : "text-muted-foreground"
        )} />
        <Input
          placeholder="Search people, posts, media, or dates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pl-10 h-12 glass-card transition-all duration-300 border-2",
            isFocused ? "border-primary shadow-lg shadow-primary/10" : "border-transparent"
          )}
          autoFocus
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="w-full inline-flex h-auto p-1 glass-card">
            <TabsTrigger 
              value="all" 
              className="text-[11px] py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="text-[11px] py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1"
            >
              <User className="w-3 h-3" />Users
            </TabsTrigger>
            <TabsTrigger 
              value="posts" 
              className="text-[11px] py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1"
            >
              <FileText className="w-3 h-3" />Posts
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="text-[11px] py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-1"
            >
              <Image className="w-3 h-3" />Media
            </TabsTrigger>
            <TabsTrigger 
              value="date" 
              className="text-[11px] py-2 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all gap-1"
            >
              <Sparkles className="w-3 h-3" />Date
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* ============= ALL TAB ============= */}
        <TabsContent value="all" className="space-y-4 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loading ? renderSkeleton() : (
            <>
              {/* People Section */}
              {users.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" /> People
                    </p>
                    {users.length > 5 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px]"
                        onClick={() => setActiveTab('users')}
                      >
                        See more
                      </Button>
                    )}
                  </div>
                  {users.slice(0, 5).map((profile, i) => renderUserCard(profile, i))}
                </div>
              )}

              {/* Posts Section */}
              {posts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Posts
                    </p>
                    {posts.length > 5 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px]"
                        onClick={() => setActiveTab('posts')}
                      >
                        See more
                      </Button>
                    )}
                  </div>
                  {posts.slice(0, 5).map((post, i) => renderPostCard(post, i))}
                </div>
              )}

              {/* Media Section */}
              {mediaPosts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Image className="w-3 h-3" /> Media
                    </p>
                    {mediaPosts.length > 4 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px]"
                        onClick={() => setActiveTab('media')}
                      >
                        See more
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {mediaPosts.slice(0, 4).map((post, i) => (
                      <Card 
                        key={post.id} 
                        className="glass-card overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform animate-in fade-in zoom-in"
                        style={{ animationDelay: `${i * 40}ms` }}
                        onClick={() => openMedia(post.file_url || post.media_urls?.[0], post.file_type)}
                      >
                        <div className="aspect-square relative">
                          {post.file_type?.includes('video') ? (
                            <>
                              <video src={post.file_url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                            </>
                          ) : (
                            <img src={post.file_url || post.media_urls?.[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {!loading && users.length === 0 && posts.length === 0 && searchQuery.length >= 2 && (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-medium">Nothing found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try another word or date</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ============= USERS TAB ============= */}
        <TabsContent value="users" className="space-y-2 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loading ? renderSkeleton() : (
            <>
              {users.map((profile, i) => renderUserCard(profile, i))}
              {users.length === 0 && searchQuery.length >= 2 && (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <User className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No users found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try a different name</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ============= POSTS TAB ============= */}
        <TabsContent value="posts" className="space-y-2 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loading ? renderSkeleton() : (
            <>
              {textPosts.map((post, i) => renderPostCard(post, i))}
              {textPosts.length === 0 && searchQuery.length >= 2 && (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No posts found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try different keywords</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ============= MEDIA TAB ============= */}
        <TabsContent value="media" className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {mediaPosts.map((post, i) => (
                  <Card 
                    key={post.id} 
                    className="glass-card overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform animate-in fade-in zoom-in"
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => openMedia(post.file_url || post.media_urls?.[0], post.file_type)}
                  >
                    <div className="aspect-square relative">
                      {post.file_type?.includes('video') ? (
                        <>
                          <video src={post.file_url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-5 h-5 text-black ml-0.5" />
                            </div>
                          </div>
                          <Badge className="absolute top-2 right-2 text-[8px] bg-black/60">Video</Badge>
                        </>
                      ) : (
                        <img src={post.file_url || post.media_urls?.[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate">{post.title}</p>
                      <p className="text-[10px] text-muted-foreground">{post.profiles?.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {mediaPosts.length === 0 && searchQuery.length >= 2 && (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <Image className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No photos or videos found</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ============= DATE TAB (Magic Feature) ============= */}
        <TabsContent value="date" className="space-y-4 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="glass-card border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent overflow-hidden">
            <CardContent className="p-5 text-center relative">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-1 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                ✨ Magic Date Search
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Find all posts from any day!<br/>
                Try: <span className="text-purple-400">today</span>, <span className="text-pink-400">yesterday</span>, or <span className="text-purple-400">2024-12-31</span>
              </p>
              <Input
                type="text"
                value={dateQuery}
                onChange={(e) => setDateQuery(e.target.value)}
                placeholder="today, yesterday, or 2024-12-31"
                className="glass-card border-2 border-purple-500/30 focus:border-purple-500 text-center"
                onKeyPress={(e) => e.key === 'Enter' && searchByDate()}
              />
              <p className="text-[10px] text-muted-foreground mt-3 flex items-center justify-center gap-2">
                Or pick: 
                <input 
                  type="date" 
                  className="bg-transparent border border-purple-500/50 rounded px-2 py-0.5 text-purple-400 text-[10px]"
                  onChange={(e) => setDateQuery(e.target.value)}
                />
              </p>
            </CardContent>
          </Card>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 animate-pulse" />
                <p className="text-xs text-muted-foreground">Searching...</p>
              </div>
            </div>
          )}

          {dateQuery && posts.length > 0 && !loading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  Posts from {(() => {
                    const d = parseNaturalDate(dateQuery);
                    return d ? format(d, 'MMMM d, yyyy') : dateQuery;
                  })()}
                </p>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600">{posts.length} found</Badge>
              </div>
              
              {posts.map((post, i) => renderPostCard(post, i))}
            </div>
          )}

          {dateQuery && posts.length === 0 && !loading && (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No activity found on this day</p>
                <p className="text-xs text-muted-foreground mt-1">Try selecting a different date</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ============= RECENT SEARCHES ============= */}
      {searchQuery.length < 2 && activeTab !== 'date' && recentSearches.length > 0 && (
        <Card className="glass-card animate-in fade-in duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recent Searches
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] text-muted-foreground hover:text-destructive"
                onClick={clearRecentSearches}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Clear All
              </Button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (search.type === 'user') {
                      navigate(`/profile/${search.value}`);
                    } else if (search.type === 'date') {
                      setActiveTab('date');
                      setDateQuery(search.value);
                    } else {
                      setSearchQuery(search.value);
                    }
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  {search.type === 'user' && <User className="w-3.5 h-3.5 text-primary" />}
                  {search.type === 'keyword' && <SearchIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                  {search.type === 'date' && <Calendar className="w-3.5 h-3.5 text-purple-500" />}
                  <span className="text-sm flex-1 truncate">{search.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {search.type === 'date' ? '📅' : search.type === 'user' ? '👤' : '🔍'}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============= EMPTY STATE ============= */}
      {searchQuery.length < 2 && activeTab !== 'date' && recentSearches.length === 0 && (
        <Card className="glass-card animate-in fade-in duration-500">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <SearchIcon className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Search Zenpeace</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Start typing to explore Zenpeace
            </p>
          </CardContent>
        </Card>
      )}

      {/* ============= FULLSCREEN MEDIA VIEWER ============= */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-3 right-3 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full" 
            onClick={() => setSelectedMedia(null)}
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            {selectedMedia?.type?.includes('video') ? (
              <video 
                src={selectedMedia.url} 
                controls 
                autoPlay 
                className="max-w-full max-h-[85vh] rounded-lg"
              />
            ) : (
              <img 
                src={selectedMedia?.url} 
                alt="Full size" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ============= COMMENTS DIALOG ============= */}
      <CommentsDialog
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={selectedPostId}
        postTitle={selectedPostTitle}
      />

      {/* ============= SHARE DIALOG ============= */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        postId={shareContent.id}
        postTitle={shareContent.title}
        postContent={shareContent.content}
      />
    </div>
  );
}
