import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  BookOpen, Search, Lock, Globe, FileText, CheckSquare, Plus, StickyNote, Trash2, 
  Bookmark, RotateCcw, Sparkles, Image, Video, BookmarkCheck, ChevronLeft, ChevronRight,
  Target, Compass
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import DocumentCard from '@/components/DocumentCard';
import { LearnMediaCard } from '@/components/lumatha/LearnMediaCard';
import { TruncatedText } from '@/components/adventure/TruncatedText';
import { DEFAULT_DAILY_TODOS, DEFAULT_WEEKLY_TODOS, DEFAULT_MONTHLY_TODOS, DEFAULT_YEARLY_TODOS, TODO_CATEGORIES, TodoCategory, getDefaultTodos } from '@/data/defaultTodos';
import { cn } from '@/lib/utils';

type Document = Database['public']['Tables']['documents']['Row'];
type Todo = Database['public']['Tables']['todos']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];

type DocumentWithProfile = Document & { profiles?: Profile };
type PostWithProfile = Post & { profiles?: Profile };

interface CategorizedTodo extends Todo {
  category?: TodoCategory;
}

type MainTab = 'public' | 'private' | 'create';
type PublicSubTab = 'all' | 'docs' | 'images' | 'vdos';
type PrivateSubTab = 'own' | 'saved';
type PublicFilter = 'global' | 'regional';

export default function Learn() {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const navigate = useNavigate();
  
  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    const saved = localStorage.getItem('lumatha_learn_main_tab');
    return (saved as MainTab) || 'public';
  });
  
  // Sub-tab states
  const [publicSubTab, setPublicSubTab] = useState<PublicSubTab>('all');
  const [privateSubTab, setPrivateSubTab] = useState<PrivateSubTab>('own');
  const [publicFilter, setPublicFilter] = useState<PublicFilter>('global');
  
  // Save main tab preference
  useEffect(() => {
    localStorage.setItem('lumatha_learn_main_tab', mainTab);
  }, [mainTab]);
  
  // Document state
  const [documents, setDocuments] = useState<DocumentWithProfile[]>([]);
  const [savedDocIds, setSavedDocIds] = useState<Set<string>>(new Set());
  const [docSearch, setDocSearch] = useState('');
  const [docLoading, setDocLoading] = useState(true);
  
  // Media posts for Learn section (images/videos)
  const [mediaPosts, setMediaPosts] = useState<PostWithProfile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  
  // Create section state
  const [createType, setCreateType] = useState<'document' | 'images' | 'video'>('document');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [uploading, setUploading] = useState(false);

  // Todos state
  const [todos, setTodos] = useState<CategorizedTodo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [todoLoading, setTodoLoading] = useState(false);
  const [todoCategory, setTodoCategory] = useState<TodoCategory>('daily');

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'private' | 'public'>('private');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchMediaPosts();
    fetchTodos();
    fetchNotes();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('documents')
        .select('*')
        .or(`user_id.eq.${user.id},visibility.eq.public`)
        .order('created_at', { ascending: false });
      
      if (data) {
        const userIds = [...new Set(data.map(d => d.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const docsWithProfiles = data.map(doc => ({ ...doc, profiles: profilesMap.get(doc.user_id) }));
        setDocuments(docsWithProfiles);
      }

      const savedDocs = localStorage.getItem('lumatha_saved_docs');
      if (savedDocs) setSavedDocIds(new Set(JSON.parse(savedDocs)));
    } finally {
      setDocLoading(false);
    }
  };

  const fetchMediaPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Fetch posts with media (images/videos) - for Learn section
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .neq('category', 'ghost')
        .or(`user_id.eq.${user.id},visibility.eq.public`)
        .order('created_at', { ascending: false });
      
      // Filter to only posts with media
      const postsWithMedia = (data || []).filter(post => 
        post.file_url || (post.media_urls && post.media_urls.length > 0)
      );
      
      setMediaPosts(postsWithMedia);
      
      // Fetch saved and liked status
      const { data: savedData } = await supabase
        .from('saved')
        .select('post_id')
        .eq('user_id', user.id);
      setSavedPostIds(new Set(savedData?.map(s => s.post_id) || []));
      
      const { data: likedData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id);
      setLikedPostIds(new Set(likedData?.map(l => l.post_id) || []));
      
      // Fetch like counts
      const counts: Record<string, number> = {};
      for (const post of postsWithMedia) {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        counts[post.id] = count || 0;
      }
      setLikeCounts(counts);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleSaveDoc = (docId: string) => {
    const newSaved = new Set(savedDocIds);
    if (newSaved.has(docId)) {
      newSaved.delete(docId);
      toast.success('Removed from saved');
    } else {
      newSaved.add(docId);
      toast.success('Saved!');
    }
    setSavedDocIds(newSaved);
    localStorage.setItem('lumatha_saved_docs', JSON.stringify([...newSaved]));
  };

  const toggleSavePost = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    if (savedPostIds.has(postId)) {
      await supabase.from('saved').delete().eq('user_id', user.id).eq('post_id', postId);
      setSavedPostIds(prev => { const next = new Set(prev); next.delete(postId); return next; });
    } else {
      await supabase.from('saved').insert({ user_id: user.id, post_id: postId });
      setSavedPostIds(prev => new Set([...prev, postId]));
    }
  };

  const toggleLikePost = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    if (likedPostIds.has(postId)) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      setLikedPostIds(prev => { const next = new Set(prev); next.delete(postId); return next; });
      setLikeCounts(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 1) - 1) }));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      setLikedPostIds(prev => new Set([...prev, postId]));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
  };

  const handleUpload = async () => {
    if (createType === 'document') {
      if (!uploadFile || !uploadTitle.trim()) return toast.error('File and title required');
    } else {
      if (uploadFiles.length === 0 || !uploadTitle.trim()) return toast.error('Files and title required');
    }
    
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      if (createType === 'document') {
        // Document upload
        const fileExt = uploadFile!.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${uploadFile!.name}`;
        await supabase.storage.from('documents').upload(fileName, uploadFile!);
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
        await supabase.from('documents').insert({ 
          user_id: user.id, title: uploadTitle, description: uploadDescription || null, 
          file_url: publicUrl, file_name: uploadFile!.name, file_type: fileExt || 'unknown', visibility 
        });
      } else {
        // Image/Video upload as post
        const mediaUrls: string[] = [];
        const mediaTypes: string[] = [];
        
        for (const file of uploadFiles) {
          const fileName = `${user.id}/${Date.now()}_${file.name}`;
          await supabase.storage.from('posts-media').upload(fileName, file);
          const { data: { publicUrl } } = supabase.storage.from('posts-media').getPublicUrl(fileName);
          mediaUrls.push(publicUrl);
          mediaTypes.push(file.type);
        }
        
        await supabase.from('posts').insert({
          user_id: user.id,
          title: uploadTitle,
          content: uploadDescription || null,
          media_urls: mediaUrls,
          media_types: mediaTypes,
          category: 'knowledge',
          visibility
        });
      }
      
      toast.success('Uploaded successfully!');
      setUploadFile(null);
      setUploadFiles([]);
      setUploadTitle('');
      setUploadDescription('');
      setVisibility('private');
      fetchDocuments();
      fetchMediaPosts();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string, fileUrl: string) => {
    try {
      const filePath = fileUrl.split('/documents/')[1];
      if (filePath) await supabase.storage.from('documents').remove([filePath]);
      await supabase.from('documents').delete().eq('id', docId);
      toast.success('Deleted');
      fetchDocuments();
    } catch { toast.error('Delete failed'); }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('Downloading...');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleOpenInBrowser = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  // Todos functions
  const fetchTodos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('todos').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    
    const todosWithCategory = (data || []).map(todo => {
      let category: TodoCategory = 'daily';
      if (todo.text.startsWith('[weekly]')) category = 'weekly';
      else if (todo.text.startsWith('[monthly]')) category = 'monthly';
      else if (todo.text.startsWith('[yearly]')) category = 'yearly';
      return { ...todo, category };
    });
    
    setTodos(todosWithCategory);
    
    if (!data || data.length === 0) {
      initializeDefaultTodos(user.id);
    }
  };

  const initializeDefaultTodos = async (userId: string) => {
    const allDefaults = [
      ...DEFAULT_DAILY_TODOS.map(text => ({ user_id: userId, text: `[daily]${text}`, completed: false, visibility: 'private' as const })),
      ...DEFAULT_WEEKLY_TODOS.map(text => ({ user_id: userId, text: `[weekly]${text}`, completed: false, visibility: 'private' as const })),
      ...DEFAULT_MONTHLY_TODOS.map(text => ({ user_id: userId, text: `[monthly]${text}`, completed: false, visibility: 'private' as const })),
      ...DEFAULT_YEARLY_TODOS.map(text => ({ user_id: userId, text: `[yearly]${text}`, completed: false, visibility: 'private' as const })),
    ];
    await supabase.from('todos').insert(allDefaults);
    fetchTodos();
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    setTodoLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('todos').insert({ user_id: user.id, text: `[${todoCategory}]${newTodo}`, completed: false, visibility: 'private' });
      setNewTodo(''); fetchTodos();
      toast.success('Task added! 🎉');
    } finally { setTodoLoading(false); }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    await supabase.from('todos').update({ completed: !completed }).eq('id', id);
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
    if (!completed) toast.success('Great job! ⭐');
  };

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    setTodos(todos.filter(t => t.id !== id));
  };

  const resetCategoryTodos = async (category: TodoCategory) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const toDelete = todos.filter(t => t.category === category);
    for (const todo of toDelete) {
      await supabase.from('todos').delete().eq('id', todo.id);
    }
    
    const defaults = getDefaultTodos(category);
    const newTodos = defaults.map(text => ({
      user_id: user.id,
      text: `[${category}]${text}`,
      completed: false,
      visibility: 'private' as const
    }));
    await supabase.from('todos').insert(newTodos);
    fetchTodos();
    toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} tasks reset! 🔄`);
  };

  // Notes functions
  const fetchNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) return toast.error('Title required');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (editingNote) {
        await supabase.from('notes').update({ title: noteTitle, content: noteContent, visibility: noteVisibility }).eq('id', editingNote.id);
      } else {
        await supabase.from('notes').insert({ user_id: user.id, title: noteTitle, content: noteContent, visibility: noteVisibility });
      }
      toast.success(editingNote ? 'Updated!' : 'Created!');
      setNoteTitle(''); setNoteContent(''); setNoteVisibility('private');
      setEditingNote(null); setNoteDialogOpen(false); fetchNotes();
    } catch { toast.error('Failed to save'); }
  };

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    fetchNotes();
  };

  // Filter logic
  const myDocuments = documents.filter(doc => doc.user_id === currentUser?.id);
  const publicDocuments = documents.filter(doc => doc.visibility === 'public');
  const savedDocuments = documents.filter(doc => savedDocIds.has(doc.id));

  // Filter media posts by type
  const getMediaType = (post: PostWithProfile): 'image' | 'video' | 'mixed' => {
    const types = post.media_types || [];
    const hasImage = types.some(t => t?.startsWith('image'));
    const hasVideo = types.some(t => t?.startsWith('video'));
    if (hasImage && hasVideo) return 'mixed';
    if (hasVideo) return 'video';
    return 'image';
  };

  const filterMediaPosts = () => {
    let filtered = mediaPosts;
    
    // Apply global/regional filter
    if (publicFilter === 'regional' && currentProfile?.country) {
      filtered = filtered.filter(p => p.profiles?.country === currentProfile.country);
    }
    
    // Apply public vs private filter
    if (mainTab === 'public') {
      filtered = filtered.filter(p => p.visibility === 'public');
    } else if (mainTab === 'private') {
      if (privateSubTab === 'own') {
        filtered = filtered.filter(p => p.user_id === currentUser?.id);
      } else {
        filtered = filtered.filter(p => savedPostIds.has(p.id));
      }
    }
    
    // Apply media type filter
    if (publicSubTab === 'images') {
      filtered = filtered.filter(p => getMediaType(p) === 'image');
    } else if (publicSubTab === 'vdos') {
      filtered = filtered.filter(p => getMediaType(p) === 'video' || getMediaType(p) === 'mixed');
    }
    
    return filtered;
  };

  const filteredMediaPosts = filterMediaPosts();
  const filteredDocs = publicFilter === 'regional' && currentProfile?.country
    ? publicDocuments.filter(doc => doc.profiles?.country === currentProfile.country)
    : publicDocuments;

  const getTodosByCategory = (category: TodoCategory) => 
    todos.filter(t => t.category === category || t.text.startsWith(`[${category}]`));

  const getTodoDisplayText = (text: string) => text.replace(/^\[(daily|weekly|monthly|yearly)\]/, '');

  const getCompletionPercentage = (category: TodoCategory) => {
    const categoryTodos = getTodosByCategory(category);
    if (categoryTodos.length === 0) return 0;
    const completed = categoryTodos.filter(t => t.completed).length;
    return Math.round((completed / categoryTodos.length) * 100);
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Main Tabs: Public | Private | Create */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)} className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-3 h-auto p-0.5">
          <TabsTrigger value="public" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <Globe className="w-3 h-3" />
            Public
          </TabsTrigger>
          <TabsTrigger value="private" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <Lock className="w-3 h-3" />
            Private
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <Plus className="w-3 h-3" />
            Create
          </TabsTrigger>
        </TabsList>

        {/* PUBLIC TAB */}
        <TabsContent value="public" className="space-y-3 mt-3">
          {/* Global/Regional Filter */}
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant={publicFilter === 'global' ? 'default' : 'outline'}
              onClick={() => setPublicFilter('global')}
              className="h-7 text-[10px] gap-1"
            >
              <Target className="w-3 h-3" /> Global
            </Button>
            <Button
              size="sm"
              variant={publicFilter === 'regional' ? 'default' : 'outline'}
              onClick={() => setPublicFilter('regional')}
              className="h-7 text-[10px] gap-1"
            >
              <Compass className="w-3 h-3" /> Regional
            </Button>
          </div>

          {/* Sub-tabs: All | Docs | Images | VDOs */}
          <Tabs value={publicSubTab} onValueChange={(v) => setPublicSubTab(v as PublicSubTab)}>
            <TabsList className="glass-card w-full grid grid-cols-4 h-auto p-0.5">
              <TabsTrigger value="all" className="text-[10px] py-1">All</TabsTrigger>
              <TabsTrigger value="docs" className="text-[10px] py-1 gap-0.5">
                <FileText className="w-2.5 h-2.5" /> Docs
              </TabsTrigger>
              <TabsTrigger value="images" className="text-[10px] py-1 gap-0.5">
                <Image className="w-2.5 h-2.5" /> Images
              </TabsTrigger>
              <TabsTrigger value="vdos" className="text-[10px] py-1 gap-0.5">
                <Video className="w-2.5 h-2.5" /> VDOs
              </TabsTrigger>
            </TabsList>

            {/* Content based on sub-tab */}
            <div className="mt-3">
              {publicSubTab === 'all' && (
                <div className="space-y-4">
                  {/* Documents Section */}
                  {filteredDocs.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Documents
                      </h3>
                      <div className="grid gap-2">
                        {filteredDocs.slice(0, 3).map((doc) => (
                          <DocumentCard 
                            key={doc.id}
                            doc={doc}
                            onDelete={handleDeleteDoc}
                            onDownload={handleDownload}
                            onOpenInBrowser={handleOpenInBrowser}
                            onRefresh={fetchDocuments}
                            onSave={() => handleSaveDoc(doc.id)}
                            isSaved={savedDocIds.has(doc.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Media Section */}
                  {filteredMediaPosts.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <Image className="w-3 h-3" /> Media
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredMediaPosts.slice(0, 6).map((post) => (
                          <LearnMediaCard
                            key={post.id}
                            id={post.id}
                            title={post.title}
                            description={post.content || undefined}
                            mediaUrls={post.media_urls || (post.file_url ? [post.file_url] : [])}
                            mediaTypes={post.media_types || (post.file_type ? [post.file_type] : ['image'])}
                            authorId={post.user_id}
                            authorName={post.profiles?.name || 'Anonymous'}
                            authorAvatar={post.profiles?.avatar_url || undefined}
                            visibility={post.visibility as 'public' | 'private'}
                            isSaved={savedPostIds.has(post.id)}
                            isLiked={likedPostIds.has(post.id)}
                            likesCount={likeCounts[post.id] || 0}
                            onToggleSave={() => toggleSavePost(post.id)}
                            onToggleLike={() => toggleLikePost(post.id)}
                            createdAt={post.created_at || ''}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {filteredDocs.length === 0 && filteredMediaPosts.length === 0 && (
                    <Card className="glass-card">
                      <CardContent className="py-8 text-center">
                        <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">No public content yet</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {publicSubTab === 'docs' && (
                <div className="grid gap-2">
                  {docLoading ? (
                    <p className="text-center py-6 text-muted-foreground text-xs">Loading...</p>
                  ) : filteredDocs.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="py-8 text-center">
                        <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">No documents</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredDocs.map((doc) => (
                      <DocumentCard 
                        key={doc.id}
                        doc={doc}
                        onDelete={handleDeleteDoc}
                        onDownload={handleDownload}
                        onOpenInBrowser={handleOpenInBrowser}
                        onRefresh={fetchDocuments}
                        onSave={() => handleSaveDoc(doc.id)}
                        isSaved={savedDocIds.has(doc.id)}
                      />
                    ))
                  )}
                </div>
              )}

              {(publicSubTab === 'images' || publicSubTab === 'vdos') && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {mediaLoading ? (
                    <p className="col-span-full text-center py-6 text-muted-foreground text-xs">Loading...</p>
                  ) : filteredMediaPosts.length === 0 ? (
                    <Card className="glass-card col-span-full">
                      <CardContent className="py-8 text-center">
                        {publicSubTab === 'images' ? (
                          <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        ) : (
                          <Video className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        )}
                        <p className="text-xs text-muted-foreground">
                          No {publicSubTab === 'images' ? 'images' : 'videos'} yet
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredMediaPosts.map((post) => (
                      <LearnMediaCard
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        description={post.content || undefined}
                        mediaUrls={post.media_urls || (post.file_url ? [post.file_url] : [])}
                        mediaTypes={post.media_types || (post.file_type ? [post.file_type] : ['image'])}
                        authorId={post.user_id}
                        authorName={post.profiles?.name || 'Anonymous'}
                        authorAvatar={post.profiles?.avatar_url || undefined}
                        visibility={post.visibility as 'public' | 'private'}
                        isSaved={savedPostIds.has(post.id)}
                        isLiked={likedPostIds.has(post.id)}
                        likesCount={likeCounts[post.id] || 0}
                        onToggleSave={() => toggleSavePost(post.id)}
                        onToggleLike={() => toggleLikePost(post.id)}
                        createdAt={post.created_at || ''}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </Tabs>
        </TabsContent>

        {/* PRIVATE TAB */}
        <TabsContent value="private" className="space-y-3 mt-3">
          {/* Sub-tabs: Own | Saved */}
          <Tabs value={privateSubTab} onValueChange={(v) => setPrivateSubTab(v as PrivateSubTab)}>
            <TabsList className="glass-card w-full grid grid-cols-2 h-auto p-0.5">
              <TabsTrigger value="own" className="text-[10px] py-1 gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Own
              </TabsTrigger>
              <TabsTrigger value="saved" className="text-[10px] py-1 gap-0.5">
                <Bookmark className="w-2.5 h-2.5" /> Saved
              </TabsTrigger>
            </TabsList>

            <TabsContent value="own" className="mt-3 space-y-4">
              {/* Own Documents */}
              {myDocuments.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> My Documents
                  </h3>
                  <div className="grid gap-2">
                    {myDocuments.map((doc) => (
                      <DocumentCard 
                        key={doc.id}
                        doc={doc}
                        onDelete={handleDeleteDoc}
                        onDownload={handleDownload}
                        onOpenInBrowser={handleOpenInBrowser}
                        onRefresh={fetchDocuments}
                        onSave={() => handleSaveDoc(doc.id)}
                        isSaved={savedDocIds.has(doc.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Own Media */}
              {mediaPosts.filter(p => p.user_id === currentUser?.id).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <Image className="w-3 h-3" /> My Media
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mediaPosts.filter(p => p.user_id === currentUser?.id).map((post) => (
                      <LearnMediaCard
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        description={post.content || undefined}
                        mediaUrls={post.media_urls || (post.file_url ? [post.file_url] : [])}
                        mediaTypes={post.media_types || (post.file_type ? [post.file_type] : ['image'])}
                        authorId={post.user_id}
                        authorName={post.profiles?.name || 'Anonymous'}
                        authorAvatar={post.profiles?.avatar_url || undefined}
                        visibility={post.visibility as 'public' | 'private'}
                        isSaved={savedPostIds.has(post.id)}
                        isLiked={likedPostIds.has(post.id)}
                        likesCount={likeCounts[post.id] || 0}
                        onToggleSave={() => toggleSavePost(post.id)}
                        onToggleLike={() => toggleLikePost(post.id)}
                        createdAt={post.created_at || ''}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {myDocuments.length === 0 && mediaPosts.filter(p => p.user_id === currentUser?.id).length === 0 && (
                <Card className="glass-card">
                  <CardContent className="py-8 text-center">
                    <Lock className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">No own content yet</p>
                    <Button 
                      size="sm" 
                      className="mt-3" 
                      onClick={() => setMainTab('create')}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Create something
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-3 space-y-4">
              {/* Saved Documents */}
              {savedDocuments.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Saved Documents
                  </h3>
                  <div className="grid gap-2">
                    {savedDocuments.map((doc) => (
                      <DocumentCard 
                        key={doc.id}
                        doc={doc}
                        onDelete={handleDeleteDoc}
                        onDownload={handleDownload}
                        onOpenInBrowser={handleOpenInBrowser}
                        onRefresh={fetchDocuments}
                        onSave={() => handleSaveDoc(doc.id)}
                        isSaved={true}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Saved Media */}
              {mediaPosts.filter(p => savedPostIds.has(p.id)).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <Image className="w-3 h-3" /> Saved Media
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mediaPosts.filter(p => savedPostIds.has(p.id)).map((post) => (
                      <LearnMediaCard
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        description={post.content || undefined}
                        mediaUrls={post.media_urls || (post.file_url ? [post.file_url] : [])}
                        mediaTypes={post.media_types || (post.file_type ? [post.file_type] : ['image'])}
                        authorId={post.user_id}
                        authorName={post.profiles?.name || 'Anonymous'}
                        authorAvatar={post.profiles?.avatar_url || undefined}
                        visibility={post.visibility as 'public' | 'private'}
                        isSaved={true}
                        isLiked={likedPostIds.has(post.id)}
                        likesCount={likeCounts[post.id] || 0}
                        onToggleSave={() => toggleSavePost(post.id)}
                        onToggleLike={() => toggleLikePost(post.id)}
                        createdAt={post.created_at || ''}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {savedDocuments.length === 0 && mediaPosts.filter(p => savedPostIds.has(p.id)).length === 0 && (
                <Card className="glass-card">
                  <CardContent className="py-8 text-center">
                    <Bookmark className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">No saved content yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* CREATE TAB */}
        <TabsContent value="create" className="space-y-4 mt-3">
          {/* Create type selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setCreateType('document')}
              className={cn(
                "p-3 rounded-xl text-center transition-all",
                createType === 'document' 
                  ? "bg-primary/20 border-2 border-primary" 
                  : "glass-card hover:bg-muted/50"
              )}
            >
              <FileText className="w-6 h-6 mx-auto mb-1" />
              <p className="text-[10px] font-medium">Document</p>
            </button>
            <button
              onClick={() => setCreateType('images')}
              className={cn(
                "p-3 rounded-xl text-center transition-all",
                createType === 'images' 
                  ? "bg-primary/20 border-2 border-primary" 
                  : "glass-card hover:bg-muted/50"
              )}
            >
              <Image className="w-6 h-6 mx-auto mb-1" />
              <p className="text-[10px] font-medium">Images</p>
            </button>
            <button
              onClick={() => setCreateType('video')}
              className={cn(
                "p-3 rounded-xl text-center transition-all",
                createType === 'video' 
                  ? "bg-primary/20 border-2 border-primary" 
                  : "glass-card hover:bg-muted/50"
              )}
            >
              <Video className="w-6 h-6 mx-auto mb-1" />
              <p className="text-[10px] font-medium">Video</p>
            </button>
          </div>

          {/* Upload form */}
          <Card className="glass-card p-4 space-y-3">
            {/* File input */}
            <div>
              <Label className="text-[10px]">
                {createType === 'document' ? 'Document File' : createType === 'images' ? 'Images (multiple)' : 'Video File'}
              </Label>
              <Input 
                type="file" 
                accept={
                  createType === 'document' 
                    ? ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" 
                    : createType === 'images' 
                    ? "image/*" 
                    : "video/*"
                }
                multiple={createType === 'images'}
                onChange={(e) => {
                  if (createType === 'document') {
                    setUploadFile(e.target.files?.[0] || null);
                  } else {
                    setUploadFiles(Array.from(e.target.files || []));
                  }
                }} 
                className="glass-card text-xs h-8" 
              />
              {uploadFiles.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {uploadFiles.length} file(s) selected
                </p>
              )}
            </div>
            
            <div>
              <Label className="text-[10px]">Title</Label>
              <Input 
                value={uploadTitle} 
                onChange={(e) => setUploadTitle(e.target.value)} 
                className="glass-card h-8 text-xs" 
                placeholder="Give it a title..."
              />
            </div>
            
            <div>
              <Label className="text-[10px]">Description</Label>
              <Textarea 
                value={uploadDescription} 
                onChange={(e) => setUploadDescription(e.target.value)} 
                className="glass-card text-xs" 
                rows={2} 
                placeholder="Optional description..."
              />
            </div>
            
            <RadioGroup 
              value={visibility} 
              onValueChange={(val) => setVisibility(val as 'private' | 'public')} 
              className="flex gap-3"
            >
              <div className="flex items-center gap-1">
                <RadioGroupItem value="private" id="priv" />
                <Label htmlFor="priv" className="flex items-center gap-0.5 text-[10px] cursor-pointer">
                  <Lock className="w-2.5 h-2.5" />Private
                </Label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="public" id="pub" />
                <Label htmlFor="pub" className="flex items-center gap-0.5 text-[10px] cursor-pointer">
                  <Globe className="w-2.5 h-2.5" />Public
                </Label>
              </div>
            </RadioGroup>
            
            <Button 
              onClick={handleUpload} 
              disabled={uploading || (!uploadFile && uploadFiles.length === 0) || !uploadTitle.trim()} 
              className="w-full h-8 text-xs"
            >
              {uploading ? 'Uploading...' : `Upload ${createType === 'document' ? 'Document' : createType === 'images' ? 'Images' : 'Video'}`}
            </Button>
          </Card>

          {/* Quick access to Tasks and Notes */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="glass-card p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" /> Tasks
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  {getCompletionPercentage(todoCategory)}% done
                </span>
              </div>
              <div className="flex gap-1">
                <Input
                  placeholder="Add task..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                  className="h-7 text-[10px]"
                />
                <Button onClick={handleAddTodo} size="icon" className="h-7 w-7 shrink-0">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </Card>
            
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogTrigger asChild>
                <Card className="glass-card p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold flex items-center gap-1">
                      <StickyNote className="w-3 h-3" /> Notes
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      {notes.length} saved
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full h-7 text-[10px]">
                    <Plus className="w-3 h-3 mr-1" /> New Note
                  </Button>
                </Card>
              </DialogTrigger>
              <DialogContent className="glass-card max-w-sm mx-4">
                <DialogHeader>
                  <DialogTitle className="text-sm">{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px]">Title</Label>
                    <Input 
                      value={noteTitle} 
                      onChange={(e) => setNoteTitle(e.target.value)} 
                      className="glass-card h-8 text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Content</Label>
                    <Textarea 
                      value={noteContent} 
                      onChange={(e) => setNoteContent(e.target.value)} 
                      className="glass-card min-h-[80px] text-xs" 
                      placeholder="Write your notes..." 
                    />
                  </div>
                  <RadioGroup 
                    value={noteVisibility} 
                    onValueChange={(val) => setNoteVisibility(val as 'private' | 'public')} 
                    className="flex gap-3"
                  >
                    <div className="flex items-center gap-1">
                      <RadioGroupItem value="private" id="note-priv" />
                      <Label htmlFor="note-priv" className="flex items-center gap-0.5 text-[10px] cursor-pointer">
                        <Lock className="w-2.5 h-2.5" />Private
                      </Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <RadioGroupItem value="public" id="note-pub" />
                      <Label htmlFor="note-pub" className="flex items-center gap-0.5 text-[10px] cursor-pointer">
                        <Globe className="w-2.5 h-2.5" />Public
                      </Label>
                    </div>
                  </RadioGroup>
                  <Button onClick={handleSaveNote} className="w-full h-8 text-xs">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
