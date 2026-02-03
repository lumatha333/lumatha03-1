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
import { BookOpen, Search, Lock, Globe, FileText, CheckSquare, Plus, StickyNote, Trash2, Bookmark, RotateCcw, Sparkles, GraduationCap, Video, ExternalLink, Download, FolderOpen, Folder, FolderPlus, X, Filter, File, FileSpreadsheet, FileImage } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { DEFAULT_DAILY_TODOS, DEFAULT_WEEKLY_TODOS, DEFAULT_MONTHLY_TODOS, DEFAULT_YEARLY_TODOS, TODO_CATEGORIES, TodoCategory, getDefaultTodos } from '@/data/defaultTodos';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

// File type filter options
const FILE_TYPE_FILTERS = [
  { id: 'all', label: 'All Types', icon: File },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'doc', label: 'DOC/DOCX', icon: FileText },
  { id: 'ppt', label: 'PPT/PPTX', icon: FileImage },
  { id: 'xls', label: 'XLS/XLSX', icon: FileSpreadsheet },
] as const;

type FileTypeFilter = typeof FILE_TYPE_FILTERS[number]['id'];

// Default folder categories
const DEFAULT_FOLDERS = ['General', 'Work', 'Study', 'Personal', 'Projects'] as const;

// Education Section: To-Do, Notes, Education
export default function Education() {
  const { user: currentUser, profile } = useAuth();
  const navigate = useNavigate();
  
  // Main tab: todos, notes, education
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('zenpeace_education_tab');
    return saved && ['todos', 'notes', 'education'].includes(saved) ? saved : 'todos';
  });
  
  // Education sub-tabs: public, private, create
  const [educationTab, setEducationTab] = useState<'public' | 'private' | 'create'>('public');
  // Public sub-tabs: docs, vdos only (no all, no images)
  const [publicSubTab, setPublicSubTab] = useState<'docs' | 'vdos'>('docs');
  const [privateSubTab, setPrivateSubTab] = useState<'own' | 'saved'>('own');
  
  // Save active tab preference
  useEffect(() => {
    localStorage.setItem('zenpeace_education_tab', activeTab);
  }, [activeTab]);
  
  // Documents state
  const [documents, setDocuments] = useState<DocumentWithProfile[]>([]);
  const [savedDocIds, setSavedDocIds] = useState<Set<string>>(new Set());
  const [docSearch, setDocSearch] = useState('');
  const [docLoading, setDocLoading] = useState(true);
  
  // File type filter state
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  
  // Folder/Category state
  const [folders, setFolders] = useState<string[]>(() => {
    const saved = localStorage.getItem('zenpeace_doc_folders');
    return saved ? JSON.parse(saved) : [...DEFAULT_FOLDERS];
  });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [docFolderMap, setDocFolderMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('zenpeace_doc_folder_map');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Video posts from home section
  const [videoPosts, setVideoPosts] = useState<PostWithProfile[]>([]);
  const [videoLoading, setVideoLoading] = useState(true);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  
  // Video folder state
  const [videoFolderMap, setVideoFolderMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('zenpeace_video_folder_map');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Create state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<string>('General');

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

  // Save folder data to localStorage
  useEffect(() => {
    localStorage.setItem('zenpeace_doc_folders', JSON.stringify(folders));
  }, [folders]);
  
  useEffect(() => {
    localStorage.setItem('zenpeace_doc_folder_map', JSON.stringify(docFolderMap));
  }, [docFolderMap]);
  
  useEffect(() => {
    localStorage.setItem('zenpeace_video_folder_map', JSON.stringify(videoFolderMap));
  }, [videoFolderMap]);

  useEffect(() => {
    fetchDocuments();
    fetchVideoPosts();
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

      const savedDocs = localStorage.getItem('zenpeace_saved_docs');
      if (savedDocs) setSavedDocIds(new Set(JSON.parse(savedDocs)));
    } finally {
      setDocLoading(false);
    }
  };

  // Fetch video posts from home section (posts table)
  const fetchVideoPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .neq('category', 'ghost')
        .or(`user_id.eq.${user.id},visibility.eq.public`)
        .order('created_at', { ascending: false });
      
      // Filter to only video posts
      const videoOnlyPosts = (data || []).filter(post => {
        const types = post.media_types || [];
        return types.some((t: string) => t?.startsWith('video')) || 
               (post.file_type && ['mp4', 'mov', 'webm', 'avi'].includes(post.file_type.toLowerCase()));
      });
      
      setVideoPosts(videoOnlyPosts);
      
      // Fetch saved status
      const { data: savedData } = await supabase
        .from('saved')
        .select('post_id')
        .eq('user_id', user.id);
      setSavedPostIds(new Set(savedData?.map(s => s.post_id) || []));
    } finally {
      setVideoLoading(false);
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

  const toggleSavePost = async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    if (savedPostIds.has(postId)) {
      await supabase.from('saved').delete().eq('user_id', user.id).eq('post_id', postId);
      setSavedPostIds(prev => { const next = new Set(prev); next.delete(postId); return next; });
      toast.success('Removed from saved');
    } else {
      await supabase.from('saved').insert({ user_id: user.id, post_id: postId });
      setSavedPostIds(prev => new Set([...prev, postId]));
      toast.success('Saved!');
    }
  };

  // Folder management functions
  const handleAddFolder = () => {
    if (!newFolderName.trim()) return toast.error('Folder name required');
    if (folders.includes(newFolderName.trim())) return toast.error('Folder already exists');
    setFolders([...folders, newFolderName.trim()]);
    setNewFolderName('');
    setFolderDialogOpen(false);
    toast.success('Folder created!');
  };
  
  const handleDeleteFolder = (folderName: string) => {
    if (DEFAULT_FOLDERS.includes(folderName as any)) {
      return toast.error('Cannot delete default folders');
    }
    setFolders(folders.filter(f => f !== folderName));
    // Move items from deleted folder to General
    const newDocMap = { ...docFolderMap };
    const newVideoMap = { ...videoFolderMap };
    Object.keys(newDocMap).forEach(key => {
      if (newDocMap[key] === folderName) newDocMap[key] = 'General';
    });
    Object.keys(newVideoMap).forEach(key => {
      if (newVideoMap[key] === folderName) newVideoMap[key] = 'General';
    });
    setDocFolderMap(newDocMap);
    setVideoFolderMap(newVideoMap);
    if (selectedFolder === folderName) setSelectedFolder(null);
    toast.success('Folder deleted');
  };
  
  const moveDocToFolder = (docId: string, folder: string) => {
    setDocFolderMap(prev => ({ ...prev, [docId]: folder }));
    toast.success(`Moved to ${folder}`);
  };
  
  const moveVideoToFolder = (postId: string, folder: string) => {
    setVideoFolderMap(prev => ({ ...prev, [postId]: folder }));
    toast.success(`Moved to ${folder}`);
  };
  
  // Filter documents by file type
  const filterByFileType = (docs: DocumentWithProfile[], filter: FileTypeFilter) => {
    if (filter === 'all') return docs;
    return docs.filter(doc => {
      const ext = doc.file_type?.toLowerCase() || '';
      switch (filter) {
        case 'pdf': return ext === 'pdf';
        case 'doc': return ['doc', 'docx'].includes(ext);
        case 'ppt': return ['ppt', 'pptx'].includes(ext);
        case 'xls': return ['xls', 'xlsx'].includes(ext);
        default: return true;
      }
    });
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return toast.error('File and title required');
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = uploadFile.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${user.id}/${Date.now()}_${uploadFile.name}`;
      
      // Determine if it's a video or document
      const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(fileExt);
      
      if (isVideo) {
        // Upload video as a post
        await supabase.storage.from('posts-media').upload(fileName, uploadFile);
        const { data: { publicUrl } } = supabase.storage.from('posts-media').getPublicUrl(fileName);
        const { data: insertedPost } = await supabase.from('posts').insert({
          user_id: user.id,
          title: uploadTitle,
          content: uploadDescription || null,
          media_urls: [publicUrl],
          media_types: [uploadFile.type || 'video/mp4'],
          category: 'knowledge',
          visibility
        }).select().single();
        
        // Assign to folder
        if (insertedPost) {
          setVideoFolderMap(prev => ({ ...prev, [insertedPost.id]: uploadFolder }));
        }
      } else {
        // Upload as document
        await supabase.storage.from('documents').upload(fileName, uploadFile);
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
        const { data: insertedDoc } = await supabase.from('documents').insert({ 
          user_id: user.id, title: uploadTitle, description: uploadDescription || null, 
          file_url: publicUrl, file_name: uploadFile.name, file_type: fileExt, visibility 
        }).select().single();
        
        // Assign to folder
        if (insertedDoc) {
          setDocFolderMap(prev => ({ ...prev, [insertedDoc.id]: uploadFolder }));
        }
      }
      
      toast.success('Uploaded!');
      setUploadFile(null); setUploadTitle(''); setUploadDescription('');
      setVisibility('private'); setUploadFolder('General');
      fetchDocuments();
      fetchVideoPosts();
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

  // Open file in browser (Google Docs Viewer for PDFs/Office, direct for others)
  const handleOpenInBrowser = (fileUrl: string, fileType: string) => {
    const ext = fileType?.toLowerCase() || '';
    const encodedUrl = encodeURIComponent(fileUrl);
    
    // Use Google Docs Viewer for PDFs and Office files
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      window.open(`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`, '_blank');
    } else {
      // Direct open for other files
      window.open(fileUrl, '_blank');
    }
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
    toast.success('Note deleted');
  };

  // Filter documents and posts
  const myDocuments = documents.filter(doc => doc.user_id === currentUser?.id);
  const publicDocuments = documents.filter(doc => doc.visibility === 'public');
  const savedDocuments = documents.filter(doc => savedDocIds.has(doc.id));
  
  const myVideoPosts = videoPosts.filter(post => post.user_id === currentUser?.id);
  const publicVideoPosts = videoPosts.filter(post => post.visibility === 'public');
  const savedVideoPosts = videoPosts.filter(post => savedPostIds.has(post.id));

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

  // Get file type badge color
  const getFileTypeBadgeColor = (fileType: string) => {
    const ext = fileType?.toLowerCase() || '';
    if (ext === 'pdf') return 'bg-red-500/20 text-red-400';
    if (['doc', 'docx'].includes(ext)) return 'bg-blue-500/20 text-blue-400';
    if (['ppt', 'pptx'].includes(ext)) return 'bg-orange-500/20 text-orange-400';
    if (['xls', 'xlsx'].includes(ext)) return 'bg-green-500/20 text-green-400';
    return 'bg-muted text-muted-foreground';
  };

  // Document Card Component
  const DocCard = ({ doc, showDelete = false, showFolderSelect = false }: { doc: DocumentWithProfile; showDelete?: boolean; showFolderSelect?: boolean }) => (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{doc.title}</h4>
            {doc.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{doc.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Avatar className="w-4 h-4">
                <AvatarImage src={doc.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-[8px]">{doc.profiles?.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground truncate">{doc.profiles?.name || 'Unknown'}</span>
              <span className={cn("text-[9px] px-1.5 py-0.5 rounded uppercase font-medium", getFileTypeBadgeColor(doc.file_type || ''))}>
                {doc.file_type}
              </span>
              {docFolderMap[doc.id] && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5">
                  <Folder className="w-2.5 h-2.5" />
                  {docFolderMap[doc.id]}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7"
                onClick={() => handleOpenInBrowser(doc.file_url, doc.file_type || '')}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7"
                onClick={() => handleSaveDoc(doc.id)}
              >
                <Bookmark className={cn("w-3.5 h-3.5", savedDocIds.has(doc.id) && "fill-primary text-primary")} />
              </Button>
              {showDelete && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDeleteDoc(doc.id, doc.file_url)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            {showFolderSelect && (
              <Select value={docFolderMap[doc.id] || 'General'} onValueChange={(val) => moveDocToFolder(doc.id, val)}>
                <SelectTrigger className="h-6 text-[9px] w-20">
                  <Folder className="w-2.5 h-2.5 mr-0.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folders.map(folder => (
                    <SelectItem key={folder} value={folder} className="text-[10px]">{folder}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Video Card Component
  const VideoCard = ({ post, showDelete = false, showFolderSelect = false }: { post: PostWithProfile; showDelete?: boolean; showFolderSelect?: boolean }) => {
    const videoUrl = post.media_urls?.[0] || post.file_url || '';
    
    return (
      <Card className="glass-card overflow-hidden">
        <div className="relative aspect-video bg-black">
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        </div>
        <CardContent className="p-3">
          <h4 className="font-medium text-sm line-clamp-1">{post.title}</h4>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Avatar className="w-5 h-5">
                <AvatarImage src={post.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-[8px]">{post.profiles?.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground truncate">{post.profiles?.name || 'Unknown'}</span>
              {videoFolderMap[post.id] && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5">
                  <Folder className="w-2.5 h-2.5" />
                  {videoFolderMap[post.id]}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={() => toggleSavePost(post.id)}
                >
                  <Bookmark className={cn("w-3.5 h-3.5", savedPostIds.has(post.id) && "fill-primary text-primary")} />
                </Button>
              </div>
              {showFolderSelect && (
                <Select value={videoFolderMap[post.id] || 'General'} onValueChange={(val) => moveVideoToFolder(post.id, val)}>
                  <SelectTrigger className="h-6 text-[9px] w-20">
                    <Folder className="w-2.5 h-2.5 mr-0.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map(folder => (
                      <SelectItem key={folder} value={folder} className="text-[10px]">{folder}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Main Tabs: To-Do, Notes, Education */}
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
          <TabsTrigger value="education" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <GraduationCap className="w-3 h-3" />
            Education
          </TabsTrigger>
        </TabsList>

        {/* To-Do Tab */}
        <TabsContent value="todos" className="space-y-3 mt-3">
          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TODO_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                size="sm"
                variant={todoCategory === cat.id ? 'default' : 'ghost'}
                onClick={() => setTodoCategory(cat.id)}
                className={cn(
                  "text-[10px] h-8 px-2 gap-1 flex-shrink-0",
                  todoCategory === cat.id && "bg-primary text-primary-foreground"
                )}
              >
                <span>{cat.emoji}</span>
                {cat.label}
                <span className="ml-1 text-[9px] opacity-70">
                  {getCompletionPercentage(cat.id)}%
                </span>
              </Button>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${getCompletionPercentage(todoCategory)}%` }}
            />
          </div>

          {/* Add Todo */}
          <div className="flex gap-2">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder={`Add ${todoCategory} task...`}
              className="flex-1 h-9 text-xs glass-card"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            />
            <Button onClick={handleAddTodo} disabled={todoLoading} size="sm" className="h-9">
              <Plus className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9"
              onClick={() => resetCategoryTodos(todoCategory)}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Todo List */}
          <div className="space-y-1.5">
            {getTodosByCategory(todoCategory).map(todo => (
              <Card 
                key={todo.id}
                className={cn(
                  "glass-card cursor-pointer transition-all",
                  todo.completed && "opacity-60"
                )}
                onClick={() => toggleTodo(todo.id, todo.completed || false)}
              >
                <CardContent className="p-2.5 flex items-center gap-2">
                  <div className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                    todo.completed ? "bg-primary border-primary" : "border-muted-foreground/50"
                  )}>
                    {todo.completed && <CheckSquare className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={cn(
                    "text-xs flex-1",
                    todo.completed && "line-through text-muted-foreground"
                  )}>
                    {getTodoDisplayText(todo.text)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
                <DialogHeader>
                  <DialogTitle className="text-sm">{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-[10px]">Title</Label>
                    <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title" className="h-8 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Content</Label>
                    <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Write your note..." className="text-xs mt-1" rows={4} />
                  </div>
                  <RadioGroup value={noteVisibility} onValueChange={(val) => setNoteVisibility(val as 'private' | 'public')} className="flex gap-3">
                    <div className="flex items-center gap-1">
                      <RadioGroupItem value="private" id="note-priv" />
                      <Label htmlFor="note-priv" className="flex items-center gap-0.5 text-[10px] cursor-pointer"><Lock className="w-3 h-3" />Private</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <RadioGroupItem value="public" id="note-pub" />
                      <Label htmlFor="note-pub" className="flex items-center gap-0.5 text-[10px] cursor-pointer"><Globe className="w-3 h-3" />Public</Label>
                    </div>
                  </RadioGroup>
                  <Button onClick={handleSaveNote} className="w-full h-8 text-xs">{editingNote ? 'Update' : 'Create'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {notes.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-8 text-center">
                <StickyNote className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">No notes yet. Create your first note!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {notes.map(note => (
                <Card key={note.id} className="glass-card cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setEditingNote(note); setNoteTitle(note.title); setNoteContent(note.content || ''); setNoteVisibility(note.visibility as 'private' | 'public'); setNoteDialogOpen(true); }}>
                  <CardContent className="p-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-medium line-clamp-1">{note.title}</h4>
                      {note.visibility === 'private' ? <Lock className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" /> : <Globe className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{note.content || 'No content'}</p>
                    <div className="flex justify-end mt-1.5">
                      <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}>
                        <Trash2 className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-2 mt-3">
          {/* Education Sub-tabs: Public, Private, Create */}
          <Tabs value={educationTab} onValueChange={(v) => setEducationTab(v as any)} className="w-full">
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

            {/* PUBLIC - Docs and VDOs only */}
            <TabsContent value="public" className="space-y-2 mt-2">
              {/* Sub-tabs: Docs, VDOs only */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={publicSubTab === 'docs' ? 'default' : 'ghost'}
                    onClick={() => setPublicSubTab('docs')}
                    className="text-[10px] h-7 px-3"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Docs
                  </Button>
                  <Button
                    size="sm"
                    variant={publicSubTab === 'vdos' ? 'default' : 'ghost'}
                    onClick={() => setPublicSubTab('vdos')}
                    className="text-[10px] h-7 px-3"
                  >
                    <Video className="w-3 h-3 mr-1" />
                    VDOs
                  </Button>
                </div>
                
                {/* Folder Management Button */}
                <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
                      <FolderPlus className="w-3 h-3" />
                      Folders
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card max-w-xs mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-sm flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-primary" />
                        Manage Folders
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="New folder name..."
                          className="h-8 text-xs flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                        />
                        <Button size="sm" onClick={handleAddFolder} className="h-8">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {folders.map(folder => (
                          <div key={folder} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex items-center gap-2">
                              <Folder className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs">{folder}</span>
                            </div>
                            {!DEFAULT_FOLDERS.includes(folder as any) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive"
                                onClick={() => handleDeleteFolder(folder)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* File Type Filter (for Docs only) */}
              {publicSubTab === 'docs' && (
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {FILE_TYPE_FILTERS.map(filter => (
                    <Button
                      key={filter.id}
                      size="sm"
                      variant={fileTypeFilter === filter.id ? 'secondary' : 'ghost'}
                      onClick={() => setFileTypeFilter(filter.id)}
                      className={cn(
                        "text-[9px] h-6 px-2 gap-1 flex-shrink-0",
                        fileTypeFilter === filter.id && "bg-primary/20 text-primary"
                      )}
                    >
                      <filter.icon className="w-2.5 h-2.5" />
                      {filter.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Folder Filter */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                <Button
                  size="sm"
                  variant={selectedFolder === null ? 'secondary' : 'ghost'}
                  onClick={() => setSelectedFolder(null)}
                  className={cn(
                    "text-[9px] h-6 px-2 gap-1 flex-shrink-0",
                    selectedFolder === null && "bg-primary/20 text-primary"
                  )}
                >
                  <FolderOpen className="w-2.5 h-2.5" />
                  All
                </Button>
                {folders.map(folder => (
                  <Button
                    key={folder}
                    size="sm"
                    variant={selectedFolder === folder ? 'secondary' : 'ghost'}
                    onClick={() => setSelectedFolder(folder)}
                    className={cn(
                      "text-[9px] h-6 px-2 gap-1 flex-shrink-0",
                      selectedFolder === folder && "bg-primary/20 text-primary"
                    )}
                  >
                    <Folder className="w-2.5 h-2.5" />
                    {folder}
                  </Button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                <Input 
                  placeholder={`Search ${publicSubTab}...`}
                  value={docSearch} 
                  onChange={(e) => setDocSearch(e.target.value)} 
                  className="pl-8 h-8 text-xs border-primary/30 focus:border-primary bg-primary/5"
                />
              </div>

              {/* Content */}
              {publicSubTab === 'docs' ? (
                docLoading ? (
                  <p className="text-center py-6 text-muted-foreground text-xs">Loading...</p>
                ) : (() => {
                  const filteredDocs = filterByFileType(publicDocuments, fileTypeFilter)
                    .filter(d => d.title?.toLowerCase().includes(docSearch.toLowerCase()))
                    .filter(d => !selectedFolder || docFolderMap[d.id] === selectedFolder);
                  return filteredDocs.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="py-8 text-center">
                        <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">No documents found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {filteredDocs.map(doc => <DocCard key={doc.id} doc={doc} />)}
                    </div>
                  );
                })()
              ) : (
                videoLoading ? (
                  <p className="text-center py-6 text-muted-foreground text-xs">Loading...</p>
                ) : (() => {
                  const filteredVideos = publicVideoPosts
                    .filter(p => p.title?.toLowerCase().includes(docSearch.toLowerCase()))
                    .filter(p => !selectedFolder || videoFolderMap[p.id] === selectedFolder);
                  return filteredVideos.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="py-8 text-center">
                        <Video className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">No videos found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredVideos.map(post => <VideoCard key={post.id} post={post} />)}
                    </div>
                  );
                })()
              )}
            </TabsContent>

            {/* PRIVATE - Own / Saved */}
            <TabsContent value="private" className="space-y-2 mt-2">
              <div className="flex items-center justify-between gap-2">
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
              </div>

              {/* File Type Filter for Private Docs */}
              {privateSubTab === 'own' && (
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {FILE_TYPE_FILTERS.map(filter => (
                    <Button
                      key={filter.id}
                      size="sm"
                      variant={fileTypeFilter === filter.id ? 'secondary' : 'ghost'}
                      onClick={() => setFileTypeFilter(filter.id)}
                      className={cn(
                        "text-[9px] h-6 px-2 gap-1 flex-shrink-0",
                        fileTypeFilter === filter.id && "bg-primary/20 text-primary"
                      )}
                    >
                      <filter.icon className="w-2.5 h-2.5" />
                      {filter.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Folder Filter for Private */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                <Button
                  size="sm"
                  variant={selectedFolder === null ? 'secondary' : 'ghost'}
                  onClick={() => setSelectedFolder(null)}
                  className={cn(
                    "text-[9px] h-6 px-2 gap-1 flex-shrink-0",
                    selectedFolder === null && "bg-primary/20 text-primary"
                  )}
                >
                  <FolderOpen className="w-2.5 h-2.5" />
                  All
                </Button>
                {folders.map(folder => (
                  <Button
                    key={folder}
                    size="sm"
                    variant={selectedFolder === folder ? 'secondary' : 'ghost'}
                    onClick={() => setSelectedFolder(folder)}
                    className={cn(
                      "text-[9px] h-6 px-2 gap-1 flex-shrink-0",
                      selectedFolder === folder && "bg-primary/20 text-primary"
                    )}
                  >
                    <Folder className="w-2.5 h-2.5" />
                    {folder}
                  </Button>
                ))}
              </div>

              {privateSubTab === 'own' ? (
                (() => {
                  const filteredMyDocs = filterByFileType(myDocuments, fileTypeFilter)
                    .filter(d => !selectedFolder || docFolderMap[d.id] === selectedFolder);
                  const filteredMyVideos = myVideoPosts
                    .filter(p => !selectedFolder || videoFolderMap[p.id] === selectedFolder);
                  
                  return filteredMyDocs.length === 0 && filteredMyVideos.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="py-8 text-center">
                        <Lock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">
                          {selectedFolder ? `No content in "${selectedFolder}"` : 'Your content will appear here'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {filteredMyDocs.map(doc => <DocCard key={doc.id} doc={doc} showDelete showFolderSelect />)}
                      {filteredMyVideos.map(post => <VideoCard key={post.id} post={post} showDelete showFolderSelect />)}
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const filteredSavedDocs = savedDocuments
                    .filter(d => !selectedFolder || docFolderMap[d.id] === selectedFolder);
                  const filteredSavedVideos = savedVideoPosts
                    .filter(p => !selectedFolder || videoFolderMap[p.id] === selectedFolder);
                  
                  return filteredSavedDocs.length === 0 && filteredSavedVideos.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="py-8 text-center">
                        <Bookmark className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">No saved content</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {filteredSavedDocs.map(doc => <DocCard key={doc.id} doc={doc} showFolderSelect />)}
                      {filteredSavedVideos.map(post => <VideoCard key={post.id} post={post} showFolderSelect />)}
                    </div>
                  );
                })()
              )}
            </TabsContent>

            {/* CREATE */}
            <TabsContent value="create" className="space-y-3 mt-2">
              <Card className="glass-card border-dashed border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    Upload Content
                  </h3>
                  
                  <div>
                    <Label className="text-[10px]">File (Documents or Videos)</Label>
                    <Input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.mov,.webm,.avi" 
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                      className="glass-card text-xs h-8 mt-1"
                    />
                    <p className="text-[9px] text-muted-foreground mt-1">
                      Supported: PDF, DOC, PPT, XLS, TXT, MP4, MOV, WEBM
                    </p>
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
                    <Label className="text-[10px]">Description (optional)</Label>
                    <Textarea 
                      value={uploadDescription} 
                      onChange={(e) => setUploadDescription(e.target.value)} 
                      placeholder="Add description..."
                      className="glass-card text-xs mt-1" 
                      rows={2}
                    />
                  </div>
                  
                  {/* Folder Selection */}
                  <div>
                    <Label className="text-[10px]">Folder</Label>
                    <Select value={uploadFolder} onValueChange={setUploadFolder}>
                      <SelectTrigger className="h-8 text-xs mt-1 glass-card">
                        <Folder className="w-3 h-3 mr-1 text-primary" />
                        <SelectValue placeholder="Select folder" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map(folder => (
                          <SelectItem key={folder} value={folder} className="text-xs">
                            <span className="flex items-center gap-1">
                              <Folder className="w-3 h-3" />
                              {folder}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <><Plus className="w-3.5 h-3.5" /> Upload</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
