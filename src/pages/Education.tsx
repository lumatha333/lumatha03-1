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
import { BookOpen, Search, Lock, Globe, FileText, CheckSquare, Plus, StickyNote, Trash2, Bookmark, RotateCcw, Sparkles, GraduationCap, Image, Video, Flag } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import DocumentCard from '@/components/DocumentCard';
import { DEFAULT_DAILY_TODOS, DEFAULT_WEEKLY_TODOS, DEFAULT_MONTHLY_TODOS, DEFAULT_YEARLY_TODOS, TODO_CATEGORIES, TodoCategory, getDefaultTodos } from '@/data/defaultTodos';
import { cn } from '@/lib/utils';
import { LearnMediaCard } from '@/components/zenpeace/LearnMediaCard';

type Document = Database['public']['Tables']['documents']['Row'];
type Todo = Database['public']['Tables']['todos']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type DocumentWithProfile = Document & { profiles?: Profile };

interface CategorizedTodo extends Todo {
  category?: TodoCategory;
}

// Education Section: To-Do, Notes, Learn
export default function Education() {
  const { user: currentUser, profile } = useAuth();
  const navigate = useNavigate();
  // Default to 'todos' tab (Tasks first)
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('zenpeace_education_tab');
    return saved && ['todos', 'notes', 'learn'].includes(saved) ? saved : 'todos';
  });
  
  // Learn sub-tabs and filters
  const [learnTab, setLearnTab] = useState<'public' | 'private' | 'create'>('public');
  const [learnSubTab, setLearnSubTab] = useState<'all' | 'docs' | 'images' | 'vdos'>('all');
  const [learnScope, setLearnScope] = useState<'global' | 'regional'>('global');
  const [privateSubTab, setPrivateSubTab] = useState<'own' | 'saved'>('own');
  
  // Save active tab preference
  useEffect(() => {
    localStorage.setItem('zenpeace_education_tab', activeTab);
  }, [activeTab]);
  
  const [documents, setDocuments] = useState<DocumentWithProfile[]>([]);
  const [savedDocIds, setSavedDocIds] = useState<Set<string>>(new Set());
  const [docSearch, setDocSearch] = useState('');
  const [docLoading, setDocLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [uploading, setUploading] = useState(false);
  const [docTab, setDocTab] = useState<'public' | 'own' | 'saved'>('public');

  const [todos, setTodos] = useState<CategorizedTodo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [todoLoading, setTodoLoading] = useState(false);
  const [todoCategory, setTodoCategory] = useState<TodoCategory>('daily');

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'private' | 'public'>('private');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    fetchDocuments();
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

      // Fetch saved document IDs (using localStorage for now, could be a DB table)
      const savedDocs = localStorage.getItem('zenpeace_saved_docs');
      if (savedDocs) setSavedDocIds(new Set(JSON.parse(savedDocs)));
    } finally {
      setDocLoading(false);
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
    localStorage.setItem('zenpeace_saved_docs', JSON.stringify([...newSaved]));
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return toast.error('File and title required');
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${uploadFile.name}`;
      await supabase.storage.from('documents').upload(fileName, uploadFile);
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
      await supabase.from('documents').insert({ 
        user_id: user.id, title: uploadTitle, description: uploadDescription || null, 
        file_url: publicUrl, file_name: uploadFile.name, file_type: fileExt || 'unknown', visibility 
      });
      toast.success('Uploaded!');
      setUploadFile(null); setUploadTitle(''); setUploadDescription('');
      setVisibility('private'); setUploadDialogOpen(false);
      fetchDocuments();
    } catch { toast.error('Upload failed'); } 
    finally { setUploading(false); }
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

  const fetchTodos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('todos').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    
    // Parse category from text if stored
    const todosWithCategory = (data || []).map(todo => {
      let category: TodoCategory = 'daily';
      if (todo.text.startsWith('[weekly]')) category = 'weekly';
      else if (todo.text.startsWith('[monthly]')) category = 'monthly';
      else if (todo.text.startsWith('[yearly]')) category = 'yearly';
      return { ...todo, category };
    });
    
    setTodos(todosWithCategory);
    
    // Initialize default todos if empty
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
    if (!completed) {
      toast.success('Great job! ⭐');
    }
  };

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    setTodos(todos.filter(t => t.id !== id));
    toast.success('Task deleted');
  };

  const resetCategoryTodos = async (category: TodoCategory) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Delete existing todos in this category
    const toDelete = todos.filter(t => t.category === category);
    for (const todo of toDelete) {
      await supabase.from('todos').delete().eq('id', todo.id);
    }
    
    // Re-add default todos
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

  const myDocuments = documents.filter(doc => doc.user_id === currentUser?.id);
  const publicDocuments = documents.filter(doc => doc.visibility === 'public');
  const savedDocuments = documents.filter(doc => savedDocIds.has(doc.id));
  const filteredDocs = docTab === 'public' 
    ? publicDocuments.filter(doc => doc.title?.toLowerCase().includes(docSearch.toLowerCase()))
    : docTab === 'own'
    ? myDocuments.filter(doc => doc.title?.toLowerCase().includes(docSearch.toLowerCase()))
    : savedDocuments.filter(doc => doc.title?.toLowerCase().includes(docSearch.toLowerCase()));

  // Filter todos by category
  const getTodosByCategory = (category: TodoCategory) => 
    todos.filter(t => t.category === category || t.text.startsWith(`[${category}]`));

  const getTodoDisplayText = (text: string) => {
    return text.replace(/^\[(daily|weekly|monthly|yearly)\]/, '');
  };

  const getCompletionPercentage = (category: TodoCategory) => {
    const categoryTodos = getTodosByCategory(category);
    if (categoryTodos.length === 0) return 0;
    const completed = categoryTodos.filter(t => t.completed).length;
    return Math.round((completed / categoryTodos.length) * 100);
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Tabs - Order: Tasks, Notes, Docs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-3 h-auto p-0.5">
          <TabsTrigger value="todos" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <CheckSquare className="w-3 h-3" />
            To-Do
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <StickyNote className="w-3 h-3" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="learn" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <GraduationCap className="w-3 h-3" />
            Learn
          </TabsTrigger>
        </TabsList>

        {/* Learn Tab - New Structure with Public/Private/Create */}
        <TabsContent value="learn" className="space-y-2 mt-3">
          {/* Learn Category Tabs */}
          <Tabs value={learnTab} onValueChange={(v) => setLearnTab(v as any)} className="w-full">
            <TabsList className="glass-card w-full grid grid-cols-3 h-auto p-0.5">
              <TabsTrigger value="public" className="text-[10px] py-1.5 gap-1">
                <Globe className="w-3 h-3" />
                Public
              </TabsTrigger>
              <TabsTrigger value="private" className="text-[10px] py-1.5 gap-1">
                <Lock className="w-3 h-3" />
                Private
              </TabsTrigger>
              <TabsTrigger value="create" className="text-[10px] py-1.5 gap-1">
                <Plus className="w-3 h-3" />
                Create
              </TabsTrigger>
            </TabsList>

            {/* PUBLIC - Sub-tabs: All, Docs, Images, VDOs + Global/Regional filter */}
            <TabsContent value="public" className="space-y-2 mt-2">
              {/* Sub-tabs + Scope Filter */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1 overflow-x-auto">
                  {['all', 'docs', 'images', 'vdos'].map((tab) => (
                    <Button
                      key={tab}
                      size="sm"
                      variant={learnSubTab === tab ? 'default' : 'ghost'}
                      onClick={() => setLearnSubTab(tab as any)}
                      className="text-[10px] h-7 px-2"
                    >
                      {tab === 'all' && <Sparkles className="w-3 h-3 mr-0.5" />}
                      {tab === 'docs' && <FileText className="w-3 h-3 mr-0.5" />}
                      {tab === 'images' && <Image className="w-3 h-3 mr-0.5" />}
                      {tab === 'vdos' && <Video className="w-3 h-3 mr-0.5" />}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Button>
                  ))}
                </div>
                {/* Global/Regional Toggle */}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={learnScope === 'global' ? 'default' : 'outline'}
                    onClick={() => setLearnScope('global')}
                    className="text-[10px] h-7 px-2"
                  >
                    <Globe className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={learnScope === 'regional' ? 'default' : 'outline'}
                    onClick={() => setLearnScope('regional')}
                    className="text-[10px] h-7 px-2"
                  >
                    <Flag className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                <Input 
                  placeholder="Search learn content..." 
                  value={docSearch} 
                  onChange={(e) => setDocSearch(e.target.value)} 
                  className="pl-8 h-8 text-xs border-primary/30 focus:border-primary bg-primary/5"
                />
              </div>

              {/* Content Grid */}
              {docLoading ? (
                <p className="text-center py-6 text-muted-foreground text-xs">Loading...</p>
              ) : publicDocuments.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-8 text-center">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">No public content yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {publicDocuments
                    .filter(doc => {
                      if (learnSubTab === 'docs') return ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(doc.file_type || '');
                      if (learnSubTab === 'images') return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(doc.file_type || '');
                      if (learnSubTab === 'vdos') return ['mp4', 'mov', 'webm', 'avi'].includes(doc.file_type || '');
                      return true;
                    })
                    .filter(doc => doc.title?.toLowerCase().includes(docSearch.toLowerCase()))
                    .slice(0, 20)
                    .map((doc) => (
                      <LearnMediaCard
                        key={doc.id}
                        id={doc.id}
                        mediaUrls={[doc.file_url]}
                        mediaTypes={[
                          ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(doc.file_type || '') ? 'image' :
                          ['mp4', 'mov', 'webm', 'avi'].includes(doc.file_type || '') ? 'video' : 'document'
                        ]}
                        title={doc.title}
                        description={doc.description || ''}
                        authorId={doc.user_id}
                        authorName={doc.profiles?.name || 'Unknown'}
                        authorAvatar={doc.profiles?.avatar_url || undefined}
                        visibility={doc.visibility as 'public' | 'private'}
                        isSaved={savedDocIds.has(doc.id)}
                        isLiked={false}
                        likesCount={0}
                        onToggleSave={() => handleSaveDoc(doc.id)}
                        onToggleLike={() => {}}
                        onComment={() => {}}
                        createdAt={doc.created_at}
                      />
                    ))
                  }
                </div>
              )}
            </TabsContent>

            {/* PRIVATE - Own / Saved sub-tabs */}
            <TabsContent value="private" className="space-y-2 mt-2">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={privateSubTab === 'own' ? 'default' : 'ghost'}
                  onClick={() => setPrivateSubTab('own')}
                  className="text-[10px] h-7"
                >
                  <Lock className="w-3 h-3 mr-0.5" />
                  Own
                </Button>
                <Button
                  size="sm"
                  variant={privateSubTab === 'saved' ? 'default' : 'ghost'}
                  onClick={() => setPrivateSubTab('saved')}
                  className="text-[10px] h-7"
                >
                  <Bookmark className="w-3 h-3 mr-0.5" />
                  Saved
                </Button>
              </div>

              {privateSubTab === 'own' ? (
                myDocuments.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="py-8 text-center">
                      <Lock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground">Your private content will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
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
                )
              ) : (
                savedDocuments.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="py-8 text-center">
                      <Bookmark className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground">No saved content</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
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
                )
              )}
            </TabsContent>

            {/* CREATE - Upload new content */}
            <TabsContent value="create" className="space-y-3 mt-2">
              <Card className="glass-card border-dashed border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    Create New Content
                  </h3>
                  
                  <div>
                    <Label className="text-[10px]">Upload File (Docs, Images, Videos)</Label>
                    <Input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm,.avi" 
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                      className="glass-card text-xs h-8 mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-[10px]">Title</Label>
                    <Input 
                      value={uploadTitle} 
                      onChange={(e) => setUploadTitle(e.target.value)} 
                      placeholder="Enter title..." 
                      className="glass-card h-8 text-xs mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-[10px]">Description</Label>
                    <Textarea 
                      value={uploadDescription} 
                      onChange={(e) => setUploadDescription(e.target.value)} 
                      placeholder="Add description..."
                      className="glass-card text-xs mt-1" 
                      rows={2}
                    />
                  </div>
                  
                  <RadioGroup value={visibility} onValueChange={(val) => setVisibility(val as 'private' | 'public')} className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <RadioGroupItem value="private" id="create-priv" />
                      <Label htmlFor="create-priv" className="flex items-center gap-1 text-[10px] cursor-pointer">
                        <Lock className="w-3 h-3" />Private
                      </Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <RadioGroupItem value="public" id="create-pub" />
                      <Label htmlFor="create-pub" className="flex items-center gap-1 text-[10px] cursor-pointer">
                        <Globe className="w-3 h-3" />Public
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  <Button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle.trim()} className="w-full h-9 text-xs gap-1">
                    {uploading ? (
                      <>Uploading...</>
                    ) : (
                      <><Plus className="w-3.5 h-3.5" /> Create Content</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-2 mt-3">
          <div className="flex justify-end">
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 text-xs" onClick={() => { setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteVisibility('private'); }}>
                  <Plus className="w-3 h-3 mr-0.5" />New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card max-w-sm mx-4">
                <DialogHeader><DialogTitle className="text-sm">{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle></DialogHeader>
                <div className="space-y-2">
                  <div><Label className="text-[10px]">Title</Label><Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="glass-card h-8 text-xs" /></div>
                  <div><Label className="text-[10px]">Content</Label><Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="glass-card min-h-[80px] text-xs" placeholder="Write your notes..." /></div>
                  <RadioGroup value={noteVisibility} onValueChange={(val) => setNoteVisibility(val as 'private' | 'public')} className="flex gap-3">
                    <div className="flex items-center gap-1"><RadioGroupItem value="private" id="note-priv" /><Label htmlFor="note-priv" className="flex items-center gap-0.5 text-[10px] cursor-pointer"><Lock className="w-2.5 h-2.5" />Private</Label></div>
                    <div className="flex items-center gap-1"><RadioGroupItem value="public" id="note-pub" /><Label htmlFor="note-pub" className="flex items-center gap-0.5 text-[10px] cursor-pointer"><Globe className="w-2.5 h-2.5" />Public</Label></div>
                  </RadioGroup>
                  <Button onClick={handleSaveNote} className="w-full h-8 text-xs">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {notes.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-6 text-center"><StickyNote className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground">No notes yet</p></CardContent></Card>
          ) : (
            <div className="grid gap-2">
              {notes.map((note) => (
                <Card key={note.id} className="glass-card p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-sm flex items-center gap-1">
                      {note.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {note.title}
                    </h3>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingNote(note); setNoteTitle(note.title); setNoteContent(note.content || ''); setNoteVisibility(note.visibility as 'private' | 'public'); setNoteDialogOpen(true); }}>✏️</Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteNote(note.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Todos Tab - Enhanced with categories and reset */}
        <TabsContent value="todos" className="space-y-3 mt-3">
          {/* Category Selector */}
          <div className="grid grid-cols-4 gap-1.5">
            {TODO_CATEGORIES.map((cat) => {
              const percentage = getCompletionPercentage(cat.id);
              const isActive = todoCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setTodoCategory(cat.id)}
                  className={cn(
                    "p-2 rounded-xl transition-all text-center relative overflow-hidden",
                    isActive 
                      ? "bg-primary/20 border-2 border-primary" 
                      : "glass-card hover:bg-muted/50"
                  )}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <p className="text-[10px] font-medium mt-0.5">{cat.label}</p>
                  <p className="text-[8px] text-muted-foreground">{percentage}%</p>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add Task */}
          <div className="flex gap-1.5">
            <Input
              placeholder={`Add ${todoCategory} task...`}
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              className="h-8 text-xs glass-card"
            />
            <Button onClick={handleAddTodo} size="icon" className="h-8 w-8 shrink-0" disabled={todoLoading}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Reset Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full h-7 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={() => resetCategoryTodos(todoCategory)}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset {todoCategory} tasks to defaults
          </Button>

          {/* Todo List */}
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {getTodosByCategory(todoCategory).length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-4 text-center">
                  <Sparkles className="w-8 h-8 mx-auto text-primary/50 mb-2" />
                  <p className="text-xs text-muted-foreground">No {todoCategory} tasks. Add some!</p>
                </CardContent>
              </Card>
            ) : (
              getTodosByCategory(todoCategory).map((todo) => (
                <div 
                  key={todo.id} 
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg transition-all group",
                    todo.completed 
                      ? "bg-primary/10 border border-primary/30" 
                      : "glass-card hover:bg-muted/30"
                  )}
                >
                  <button 
                    onClick={() => toggleTodo(todo.id, todo.completed || false)} 
                    className="shrink-0"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      todo.completed 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-muted-foreground hover:border-primary"
                    )}>
                      {todo.completed && <span className="text-[10px]">✓</span>}
                    </div>
                  </button>
                  <span className={cn(
                    "flex-1 text-xs",
                    todo.completed && "line-through text-muted-foreground"
                  )}>
                    {getTodoDisplayText(todo.text)}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}