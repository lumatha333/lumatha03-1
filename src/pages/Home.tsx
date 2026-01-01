import { useState, useEffect } from 'react';
import { Globe, Users, Lock, Image, Video, Shuffle, MapPin, Sparkles, Bookmark, Search } from 'lucide-react';
import { EnhancedPostCard } from '@/components/EnhancedPostCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Film, Trash2, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type PostWithProfile = Post & { profiles?: Profile };

// Main tabs
const mainTabs = [
  { id: 'feed', label: 'Feed', icon: Globe },
  { id: 'create', label: 'Create', icon: Sparkles },
  { id: 'private', label: 'Private', icon: Lock },
];

// Feed sub-tabs
const feedSubTabs = [
  { id: 'global', label: 'Global', icon: Globe },
  { id: 'regional', label: 'Regional', icon: MapPin },
  { id: 'following', label: 'Friends', icon: Users },
];

// Content filters
const contentFilters = [
  { id: 'mixed', label: 'Mix', icon: Shuffle },
  { id: 'photos', label: 'Pic', icon: Image },
  { id: 'videos', label: 'Vdo', icon: Video },
];

// Private sub-tabs
const privateSubTabs = [
  { id: 'own', label: 'Own', icon: Lock },
  { id: 'saved', label: 'Saved', icon: Bookmark },
];

// Country flags
const countryFlags: Record<string, string> = {
  'nepal': '🇳🇵', 'india': '🇮🇳', 'usa': '🇺🇸', 'uk': '🇬🇧', 'canada': '🇨🇦',
  'australia': '🇦🇺', 'germany': '🇩🇪', 'france': '🇫🇷', 'japan': '🇯🇵', 'china': '🇨🇳',
  'brazil': '🇧🇷', 'mexico': '🇲🇽', 'russia': '🇷🇺', 'south korea': '🇰🇷', 'italy': '🇮🇹',
  'spain': '🇪🇸', 'netherlands': '🇳🇱', 'sweden': '🇸🇪', 'switzerland': '🇨🇭', 'singapore': '🇸🇬', 'uae': '🇦🇪',
};

const CATEGORIES = [
  { value: 'general', label: '📝 General' },
  { value: 'regional', label: '🏠 Regional' },
  { value: 'global', label: '🌍 Global' },
  { value: 'education', label: '📚 Education' },
  { value: 'music', label: '🎵 Music' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 10;

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
  const { user, profile } = useAuth();

  // Create tab state
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get country flag
  const getCountryFlag = () => {
    if (!profile?.country) return '🌍';
    const country = profile.country.toLowerCase();
    return countryFlags[country] || '🌍';
  };

  useEffect(() => {
    if (user && activeTab !== 'create') fetchPosts();
  }, [activeTab, feedSubTab, privateSubTab, user, profile]);

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem('coc_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setContent(parsed.content || '');
        setTitle(parsed.title || '');
        setCategory(parsed.category || 'general');
      } catch { setContent(draft); }
    }
  }, []);

  // Save draft
  useEffect(() => {
    if (activeTab === 'create') {
      localStorage.setItem('coc_draft', JSON.stringify({ content, title, category }));
    }
  }, [content, title, category, activeTab]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase.from('posts').select('*, profiles(*)');

      if (activeTab === 'feed') {
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
              if (userIds.length > 0) query = query.in('user_id', userIds);
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
          query = query.eq('user_id', user.id).eq('visibility', 'private');
        } else if (privateSubTab === 'saved') {
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

  // Create post functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} too large. Max 50MB`);
        return false;
      }
      return true;
    });

    const newFiles = [...mediaFiles, ...validFiles].slice(0, MAX_FILES);
    setMediaFiles(newFiles);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviews);
    setCurrentPreviewIndex(0);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    setCurrentPreviewIndex(Math.min(currentPreviewIndex, previewUrls.length - 2));
  };

  const handleClear = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setContent(''); setTitle(''); setCategory('general');
    setMediaFiles([]); setPreviewUrls([]); setCurrentPreviewIndex(0);
    localStorage.removeItem('coc_draft');
  };

  const handleCreate = async () => {
    if (!content.trim() || !title.trim()) return toast.error('Add title and content');
    if (!user) return toast.error('Please login');

    setCreateLoading(true);
    setUploadProgress(0);
    
    try {
      const uploadedUrls: string[] = [];
      const uploadedTypes: string[] = [];

      if (mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage.from('posts-media').upload(fileName, file, {
            cacheControl: '31536000', contentType: file.type
          });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('posts-media').getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
          uploadedTypes.push(file.type.startsWith('video') ? 'video' : 'image');
          setUploadProgress(((i + 1) / mediaFiles.length) * 100);
        }
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        file_url: uploadedUrls[0] || null,
        file_type: uploadedTypes[0] || null,
        media_urls: uploadedUrls,
        media_types: uploadedTypes,
        category,
        visibility
      });

      if (error) throw error;

      toast.success('Post created!');
      handleClear();
      setActiveTab('feed');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setCreateLoading(false);
      setUploadProgress(0);
    }
  };

  const isVideo = (file: File) => file.type.startsWith('video');
  const totalSize = mediaFiles.reduce((acc, f) => acc + f.size, 0);

  if (!user) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-12 w-full rounded-xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Main Tabs - Feed, Create, Private */}
      <div className="flex gap-1 p-2 border-b border-border/20 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="pl-9 h-9"
                onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
              />
            </div>
          </div>

          {/* Feed Sub-tabs */}
          <div className="flex gap-1.5 px-2 py-1">
            {feedSubTabs.map((tab) => {
              const isActive = feedSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFeedSubTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
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

          {/* Content Filters */}
          <div className="flex gap-0.5 bg-muted/20 mx-2 p-0.5 rounded-lg w-fit mb-2">
            {contentFilters.map((filter) => {
              const isActive = contentType === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setContentType(filter.id as typeof contentType)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all",
                    isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <filter.icon className="w-3 h-3" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Posts */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
            ) : posts.length === 0 ? (
              <Card className="glass-card border-border">
                <CardContent className="py-8 text-center space-y-3">
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No Posts Yet</h3>
                  <p className="text-sm text-muted-foreground">Be the first to share!</p>
                  <Button onClick={() => setActiveTab('create')} size="sm" className="gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Create Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              posts.map(post => (
                <EnhancedPostCard
                  key={post.id}
                  post={post}
                  isSaved={savedPosts.has(post.id)}
                  isLiked={likedPosts.has(post.id)}
                  likesCount={likeCounts[post.id] || 0}
                  currentUserId={user.id}
                  onToggleSave={toggleSave}
                  onToggleLike={toggleLike}
                  onDelete={post.user_id === user.id ? deletePost : undefined}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Tab Content */}
      {activeTab === 'create' && (
        <div className="flex-1 overflow-y-auto p-2 pb-4">
          <Card className="glass-card">
            <CardContent className="p-3 space-y-3">
              {/* Visibility & Category */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px]">Visibility</Label>
                  <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as any)} className="flex gap-1.5 mt-1">
                    <label className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer flex-1 justify-center ${visibility === 'public' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <RadioGroupItem value="public" className="sr-only" />🌐 Public
                    </label>
                    <label className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer flex-1 justify-center ${visibility === 'private' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <RadioGroupItem value="private" className="sr-only" />🔒 Private
                    </label>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-[11px]">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label className="text-[11px]">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your post a title..." className="h-9 mt-1 text-sm" />
              </div>

              {/* Content */}
              <div>
                <Label className="text-[11px]">Content</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts..." className="min-h-[80px] mt-1 text-sm" />
              </div>

              {/* Media Upload */}
              <div>
                <Label className="text-[11px]">Media (Max {MAX_FILES} files, 50MB each)</Label>
                <div className="flex gap-1.5 mt-1">
                  <label className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer">
                    <ImageIcon className="w-4 h-4 text-primary" /><span className="text-[11px]">Photos</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer">
                    <Film className="w-4 h-4 text-primary" /><span className="text-[11px]">Videos</span>
                    <input type="file" accept="video/*" multiple onChange={handleFileSelect} className="hidden" />
                  </label>
                </div>
                {mediaFiles.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {mediaFiles.length} file(s) • {(totalSize / (1024 * 1024)).toFixed(1)} MB
                  </p>
                )}
              </div>

              {/* Preview Gallery */}
              {previewUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-primary/30 bg-black/5">
                    {isVideo(mediaFiles[currentPreviewIndex]) ? (
                      <video src={previewUrls[currentPreviewIndex]} className="w-full max-h-48 object-contain" controls />
                    ) : (
                      <img src={previewUrls[currentPreviewIndex]} alt="Preview" className="w-full max-h-48 object-contain" />
                    )}
                    
                    {previewUrls.length > 1 && (
                      <>
                        <Button size="icon" variant="ghost" className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 bg-background/80"
                          onClick={() => setCurrentPreviewIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length)}>
                          <ChevronLeft className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 bg-background/80"
                          onClick={() => setCurrentPreviewIndex((prev) => (prev + 1) % previewUrls.length)}>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded-full">
                          {currentPreviewIndex + 1}/{previewUrls.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    {previewUrls.map((url, i) => (
                      <div key={i} className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer ${i === currentPreviewIndex ? 'border-primary' : 'border-border'}`}
                        onClick={() => setCurrentPreviewIndex(i)}>
                        {isVideo(mediaFiles[i]) ? (
                          <div className="w-full h-full bg-black/80 flex items-center justify-center"><Film className="w-3 h-3 text-white" /></div>
                        ) : (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        )}
                        <button className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive text-white flex items-center justify-center"
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {createLoading && uploadProgress > 0 && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground text-center">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button onClick={handleCreate} disabled={createLoading} className="flex-1 gap-1.5 h-9">
                  <Sparkles className="w-4 h-4" />{createLoading ? 'Creating...' : 'Create'}
                </Button>
                <Button onClick={handleClear} variant="outline" disabled={createLoading} className="gap-1.5 h-9">
                  <Trash2 className="w-4 h-4" />Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Private Tab Content */}
      {activeTab === 'private' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Private Sub-tabs */}
          <div className="flex gap-1.5 p-2">
            {privateSubTabs.map((tab) => {
              const isActive = privateSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPrivateSubTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
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

          {/* Posts */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
            ) : posts.length === 0 ? (
              <Card className="glass-card border-border">
                <CardContent className="py-8 text-center space-y-3">
                  {privateSubTab === 'own' ? (
                    <>
                      <Lock className="w-12 h-12 mx-auto text-muted-foreground/50" />
                      <h3 className="text-lg font-semibold">No Private Posts</h3>
                      <p className="text-sm text-muted-foreground">Create a private post to keep it just for yourself.</p>
                      <Button onClick={() => setActiveTab('create')} size="sm" className="gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Create Private Post
                      </Button>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-12 h-12 mx-auto text-muted-foreground/50" />
                      <h3 className="text-lg font-semibold">No Saved Posts</h3>
                      <p className="text-sm text-muted-foreground">Save posts to view them here later.</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              posts.map(post => (
                <EnhancedPostCard
                  key={post.id}
                  post={post}
                  isSaved={savedPosts.has(post.id)}
                  isLiked={likedPosts.has(post.id)}
                  likesCount={likeCounts[post.id] || 0}
                  currentUserId={user.id}
                  onToggleSave={toggleSave}
                  onToggleLike={toggleLike}
                  onDelete={post.user_id === user.id ? deletePost : undefined}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
