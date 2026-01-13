import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, User, FileText, Image, Calendar, Sparkles, Play, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

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

  // Debounced search
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

  useEffect(() => {
    if (dateQuery && activeTab === 'date') {
      searchByDate();
    }
  }, [dateQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      if (activeTab === 'all' || activeTab === 'users') {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .limit(20);
        setUsers(usersData || []);
      }

      if (activeTab === 'all' || activeTab === 'posts' || activeTab === 'media') {
        let query = supabase
          .from('posts')
          .select('*, profiles(*)')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(30);

        if (activeTab === 'posts') {
          // Text posts only - no media
          query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
            .is('file_url', null)
            .or('media_urls.is.null,media_urls.eq.{}');
        } else if (activeTab === 'media') {
          // Media posts only - with images or videos
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
      const searchDate = parseISO(dateQuery);
      if (!isValid(searchDate)) {
        setLoading(false);
        return;
      }

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

  const mediaPosts = posts.filter(p => p.file_url || (p.media_urls && p.media_urls.length > 0));
  const textPosts = posts.filter(p => !p.file_url && (!p.media_urls || p.media_urls.length === 0));

  const openMedia = (url: string, type: string) => {
    setSelectedMedia({ url, type });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Enhanced Search Input with Animation */}
      <div className={cn(
        "relative transition-all duration-300",
        isFocused && "transform scale-[1.02]"
      )}>
        <SearchIcon className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
          isFocused ? "text-primary" : "text-muted-foreground"
        )} />
        <Input
          placeholder="Search users, posts, media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pl-10 h-12 glass-card transition-all duration-300 border-2",
            isFocused ? "border-primary shadow-lg shadow-primary/20" : "border-transparent"
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

      {/* Tabs with smooth transitions */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-5 h-auto p-1 glass-card">
          <TabsTrigger value="all" className="text-[10px] py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            All
          </TabsTrigger>
          <TabsTrigger value="users" className="text-[10px] py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <User className="w-3 h-3 mr-0.5" />Users
          </TabsTrigger>
          <TabsTrigger value="posts" className="text-[10px] py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <FileText className="w-3 h-3 mr-0.5" />Posts
          </TabsTrigger>
          <TabsTrigger value="media" className="text-[10px] py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Image className="w-3 h-3 mr-0.5" />Media
          </TabsTrigger>
          <TabsTrigger value="date" className="text-[10px] py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all">
            <Sparkles className="w-3 h-3 mr-0.5" />Magic
          </TabsTrigger>
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-4 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {users.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Users ({users.length})
                  </p>
                  {users.slice(0, 5).map((profile, i) => (
                    <Card 
                      key={profile.id} 
                      className="glass-card cursor-pointer hover:bg-muted/30 transition-all duration-200 hover:scale-[1.01] animate-in fade-in slide-in-from-left duration-300"
                      style={{ animationDelay: `${i * 50}ms` }}
                      onClick={() => navigate(`/profile/${profile.id}`)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                            {profile.name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{profile.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.bio || profile.location || 'Zenpeace User'}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px]">View</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {posts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Posts ({posts.length})
                  </p>
                  {posts.slice(0, 10).map((post, i) => (
                    <Card 
                      key={post.id} 
                      className="glass-card transition-all duration-200 hover:scale-[1.01] animate-in fade-in slide-in-from-right duration-300"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={post.profiles?.avatar_url} />
                            <AvatarFallback className="text-[10px]">{post.profiles?.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-medium">{post.profiles?.name}</p>
                          <Badge variant="outline" className="text-[8px] ml-auto">{post.category}</Badge>
                        </div>
                        <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                        {post.content && <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>}
                        {post.file_url && (
                          <div 
                            className="mt-2 rounded-lg overflow-hidden cursor-pointer"
                            onClick={() => openMedia(post.file_url, post.file_type)}
                          >
                            {post.file_type?.includes('video') ? (
                              <div className="relative">
                                <video src={post.file_url} className="w-full h-32 object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <Play className="w-8 h-8 text-white" />
                                </div>
                              </div>
                            ) : (
                              <img src={post.file_url} alt="" className="w-full h-32 object-cover hover:scale-105 transition-transform" />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && users.length === 0 && posts.length === 0 && searchQuery.length >= 2 && (
                <Card className="glass-card animate-in fade-in duration-300">
                  <CardContent className="py-12 text-center">
                    <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                    <p className="text-xs text-muted-foreground mt-1">Try different keywords or check spelling</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-2 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {users.map((profile, i) => (
            <Card 
              key={profile.id} 
              className="glass-card cursor-pointer hover:bg-muted/30 transition-all duration-200 hover:scale-[1.01] animate-in fade-in slide-in-from-left duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => navigate(`/profile/${profile.id}`)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-lg">
                    {profile.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{profile.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.bio || 'Zenpeace User'}</p>
                  {profile.location && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">📍 {profile.location}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {users.length === 0 && searchQuery.length >= 2 && !loading && (
            <Card className="glass-card animate-in fade-in duration-300">
              <CardContent className="py-8 text-center">
                <User className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Posts Tab (Text Only) */}
        <TabsContent value="posts" className="space-y-2 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {textPosts.map((post, i) => (
            <Card 
              key={post.id} 
              className="glass-card transition-all duration-200 animate-in fade-in slide-in-from-right duration-300"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={post.profiles?.avatar_url} />
                    <AvatarFallback className="text-[10px]">{post.profiles?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-medium">{post.profiles?.name}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {format(new Date(post.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">{post.title}</p>
                {post.content && <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{post.content}</p>}
              </CardContent>
            </Card>
          ))}
          {textPosts.length === 0 && searchQuery.length >= 2 && !loading && (
            <Card className="glass-card animate-in fade-in duration-300">
              <CardContent className="py-8 text-center">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No text posts found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Media Tab (Images + Videos) */}
        <TabsContent value="media" className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-2">
            {mediaPosts.map((post, i) => (
              <Card 
                key={post.id} 
                className="glass-card overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] animate-in fade-in zoom-in duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
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
          {mediaPosts.length === 0 && searchQuery.length >= 2 && !loading && (
            <Card className="glass-card animate-in fade-in duration-300">
              <CardContent className="py-8 text-center">
                <Image className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No media found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Magic Date Tab */}
        <TabsContent value="date" className="space-y-4 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="glass-card border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />
            <CardContent className="p-5 text-center relative">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-1 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                ✨ Magic Date Search
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Enter any date to discover ALL posts from that day!<br/>
                Images, videos, and text posts - everything!
              </p>
              <Input
                type="date"
                value={dateQuery}
                onChange={(e) => setDateQuery(e.target.value)}
                className="glass-card border-2 border-purple-500/30 focus:border-purple-500 transition-colors"
              />
            </CardContent>
          </Card>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
          )}

          {dateQuery && posts.length > 0 && !loading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Posts from {format(parseISO(dateQuery), 'MMMM d, yyyy')}
                </p>
                <Badge variant="outline" className="bg-purple-500/10">{posts.length} found</Badge>
              </div>
              
              {posts.map((post, i) => (
                <Card 
                  key={post.id} 
                  className="glass-card animate-in fade-in slide-in-from-bottom duration-300"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={post.profiles?.avatar_url} />
                        <AvatarFallback className="text-[10px]">{post.profiles?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <p className="text-xs font-medium flex-1">{post.profiles?.name}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(post.created_at), 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{post.title}</p>
                    {post.content && <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>}
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
                          <img src={post.file_url} alt="" className="w-full h-40 object-cover" />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {dateQuery && posts.length === 0 && !loading && (
            <Card className="glass-card animate-in fade-in duration-300">
              <CardContent className="py-10 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No posts found from this date</p>
                <p className="text-xs text-muted-foreground mt-1">Try selecting a different date</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Empty state when no search */}
      {searchQuery.length < 2 && activeTab !== 'date' && (
        <Card className="glass-card animate-in fade-in duration-500">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <SearchIcon className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Search Zenpeace</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Find users, posts, photos, and videos. Or use Magic Date to explore posts from any day!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fullscreen Media Viewer */}
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
    </div>
  );
}
