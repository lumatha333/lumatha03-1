import { useState, useEffect, useCallback } from 'react';
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
import { BookOpen, Search, Lock, Globe, FileText, CheckSquare, Plus, StickyNote, Trash2, Bookmark, RotateCcw, GraduationCap, Video, ExternalLink, FolderOpen, Folder, FolderPlus, X, File, FileSpreadsheet, FileImage, Palette, GripVertical } from 'lucide-react';
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

// Default folder categories with colors
const DEFAULT_FOLDERS = ['General', 'Work', 'Study', 'Personal', 'Projects'] as const;

// Folder color options
const FOLDER_COLORS = [
  { id: 'blue', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'green', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'purple', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'orange', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'pink', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { id: 'teal', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  { id: 'yellow', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'red', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
] as const;

const DEFAULT_FOLDER_COLORS: Record<string, string> = {
  'General': 'blue',
  'Work': 'orange',
  'Study': 'purple',
  'Personal': 'pink',
  'Projects': 'teal',
};

export default function Education() {
  const { user: currentUser, profile } = useAuth();
  const navigate = useNavigate();
  
  // Main tab: todos, notes, education
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('lumatha_education_tab');
    return saved && ['todos', 'notes', 'education'].includes(saved) ? saved : 'todos';
  });
  
  // Education sub-tabs
  const [educationTab, setEducationTab] = useState<'public' | 'private' | 'create'>('public');
  const [publicSubTab, setPublicSubTab] = useState<'docs' | 'vdos'>('docs');
  const [privateSubTab, setPrivateSubTab] = useState<'own' | 'saved'>('own');
  
  useEffect(() => {
    localStorage.setItem('lumatha_education_tab', activeTab);
  }, [activeTab]);
  
  // Documents state
  const [documents, setDocuments] = useState<DocumentWithProfile[]>([]);
  const [savedDocIds, setSavedDocIds] = useState<Set<string>>(new Set());
  const [docSearch, setDocSearch] = useState('');
  const [docLoading, setDocLoading] = useState(true);
  
  // File type filter state
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  
  // Folder/Category state with colors
  const [folders, setFolders] = useState<string[]>(() => {
    const saved = localStorage.getItem('lumatha_doc_folders');
    return saved ? JSON.parse(saved) : [...DEFAULT_FOLDERS];
  });
  const [folderColors, setFolderColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lumatha_folder_colors');
    return saved ? JSON.parse(saved) : { ...DEFAULT_FOLDER_COLORS };
  });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('blue');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [docFolderMap, setDocFolderMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lumatha_doc_folder_map');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Drag and drop state
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);
  
  // Video posts state
  const [videoPosts, setVideoPosts] = useState<PostWithProfile[]>([]);
  const [videoLoading, setVideoLoading] = useState(true);
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  
  const [videoFolderMap, setVideoFolderMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('lumatha_video_folder_map');
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
    localStorage.setItem('lumatha_doc_folders', JSON.stringify(folders));
  }, [folders]);
  
  useEffect(() => {
    localStorage.setItem('lumatha_folder_colors', JSON.stringify(folderColors));
  }, [folderColors]);
  
  useEffect(() => {
    localStorage.setItem('lumatha_doc_folder_map', JSON.stringify(docFolderMap));
  }, [docFolderMap]);
  
  useEffect(() => {
    localStorage.setItem('lumatha_video_folder_map', JSON.stringify(videoFolderMap));
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

      const savedDocs = localStorage.getItem('lumatha_saved_docs');
      if (savedDocs) setSavedDocIds(new Set(JSON.parse(savedDocs)));
    } finally {
      setDocLoading(false);
    }
  };

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
      
      const videoOnlyPosts = (data || []).filter(post => {
        const types = post.media_types || [];
        return types.some((t: string) => t?.startsWith('video')) || 
               (post.file_type && ['mp4', 'mov', 'webm', 'avi'].includes(post.file_type.toLowerCase()));
      });
      
      setVideoPosts(videoOnlyPosts);
      
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
    localStorage.setItem('lumatha_saved_docs', JSON.stringify([...newSaved]));
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

  // Folder management
  const handleAddFolder = () => {
    if (!newFolderName.trim()) return toast.error('Folder name required');
    if (folders.includes(newFolderName.trim())) return toast.error('Folder already exists');
    setFolders([...folders, newFolderName.trim()]);
    setFolderColors(prev => ({ ...prev, [newFolderName.trim()]: newFolderColor }));
    setNewFolderName('');
    setNewFolderColor('blue');
    setFolderDialogOpen(false);
    toast.success('Folder created!');
  };
  
  const handleDeleteFolder = (folderName: string) => {
    if (DEFAULT_FOLDERS.includes(folderName as any)) {
      return toast.error('Cannot delete default folders');
    }
    setFolders(folders.filter(f => f !== folderName));
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
  
  const updateFolderColor = (folderName: string, color: string) => {
    setFolderColors(prev => ({ ...prev, [folderName]: color }));
    toast.success('Color updated!');
  };
  
  const getFolderColorClass = (folderName: string) => {
    const colorId = folderColors[folderName] || 'blue';
    const colorObj = FOLDER_COLORS.find(c => c.id === colorId);
    return colorObj?.color || FOLDER_COLORS[0].color;
  };
  
  const moveDocToFolder = (docId: string, folder: string) => {
    setDocFolderMap(prev => ({ ...prev, [docId]: folder }));
    toast.success(`Moved to ${folder}`);
  };
  
  const moveVideoToFolder = (postId: string, folder: string) => {
    setVideoFolderMap(prev => ({ ...prev, [postId]: folder }));
    toast.success(`Moved to ${folder}`);
  };
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string, type: 'doc' | 'video') => {
    if (type === 'doc') {
      setDraggedDocId(id);
    } else {
      setDraggedVideoId(id);
    }
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDropOnFolder = (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    if (draggedDocId) {
      moveDocToFolder(draggedDocId, folderName);
      setDraggedDocId(null);
    }
    if (draggedVideoId) {
      moveVideoToFolder(draggedVideoId, folderName);
      setDraggedVideoId(null);
    }
  };
  
  const handleDragEnd = () => {
    setDraggedDocId(null);
    setDraggedVideoId(null);
  };
  
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
      
      const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(fileExt);
      
      if (isVideo) {
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
        
        if (insertedPost) {
          setVideoFolderMap(prev => ({ ...prev, [insertedPost.id]: uploadFolder }));
        }
      } else {
        await supabase.storage.from('documents').upload(fileName, uploadFile);
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
        const { data: insertedDoc } = await supabase.from('documents').insert({ 
          user_id: user.id, title: uploadTitle, description: uploadDescription || null, 
          file_url: publicUrl, file_name: uploadFile.name, file_type: fileExt, visibility 
        }).select().single();
        
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

  const handleOpenInBrowser = (fileUrl: string, fileType: string) => {
    const ext = fileType?.toLowerCase() || '';
    const encodedUrl = encodeURIComponent(fileUrl);
    
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      window.open(`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`, '_blank');
    } else {
      window.open(fileUrl, '_blank');
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

  const getFileTypeBadgeColor = (fileType: string) => {
    const ext = fileType?.toLowerCase() || '';
    if (ext === 'pdf') return 'bg-red-500/20 text-red-400';
    if (['doc', 'docx'].includes(ext)) return 'bg-blue-500/20 text-blue-400';
    if (['ppt', 'pptx'].includes(ext)) return 'bg-orange-500/20 text-orange-400';
    if (['xls', 'xlsx'].includes(ext)) return 'bg-green-500/20 text-green-400';
    return 'bg-muted text-muted-foreground';
  };

  // Document Card Component with drag support
  const DocCard = ({ doc, showDelete = false, showFolderSelect = false }: { doc: DocumentWithProfile; showDelete?: boolean; showFolderSelect?: boolean }) => (
    <Card 
      className={cn("glass-card overflow-hidden", draggedDocId === doc.id && "opacity-50")}
      draggable={showFolderSelect}
      onDragStart={(e) => handleDragStart(e, doc.id, 'doc')}
      onDragEnd={handleDragEnd}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {showFolderSelect && (
            <div className="cursor-grab active:cursor-grabbing flex-shrink-0 self-center">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
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
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 border", getFolderColorClass(docFolderMap[doc.id]))}>
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

  // Video Card Component with drag support
  const VideoCard = ({ post, showDelete = false, showFolderSelect = false }: { post: PostWithProfile; showDelete?: boolean; showFolderSelect?: boolean }) => {
    const videoUrl = post.media_urls?.[0] || post.file_url || '';
    
    return (
      <Card 
        className={cn("glass-card overflow-hidden", draggedVideoId === post.id && "opacity-50")}
        draggable={showFolderSelect}
        onDragStart={(e) => handleDragStart(e, post.id, 'video')}
        onDragEnd={handleDragEnd}
      >
        <div className="relative aspect-video bg-black">
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
          {showFolderSelect && (
            <div className="absolute top-2 left-2 cursor-grab active:cursor-grabbing bg-black/50 rounded p-1">
              <GripVertical className="w-4 h-4 text-white" />
            </div>
          )}
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
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 border", getFolderColorClass(videoFolderMap[post.id]))}>
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

  // Folder button with drop support
  const FolderButton = ({ folder, isSelected }: { folder: string; isSelected: boolean }) => (
    <Button
      size="sm"
      variant={isSelected ? 'secondary' : 'ghost'}
      onClick={() => setSelectedFolder(folder)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDropOnFolder(e, folder)}
      className={cn(
        "text-[9px] h-6 px-2 gap-1 flex-shrink-0 border",
        isSelected ? getFolderColorClass(folder) : 'border-transparent hover:border-primary/20'
      )}
    >
      <Folder className="w-2.5 h-2.5" />
      {folder}
    </Button>
  );

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

          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${getCompletionPercentage(todoCategory)}%` }}
            />
          </div>

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

          <div className="space-y-1.5">
            {getTodosByCategory(todoCategory).map(todo => (
              <Card 
                key={todo.id}
                className={cn(
                  "glass-card cursor-pointer",
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
                <Card key={note.id} className="glass-card cursor-pointer hover:border-primary/50" onClick={() => { setEditingNote(note); setNoteTitle(note.title); setNoteContent(note.content || ''); setNoteVisibility(note.visibility as 'private' | 'public'); setNoteDialogOpen(true); }}>
                  <CardContent className="p-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-medium line-clamp-1">{note.title}</h4>
                      {note.visibility === 'private' ? <Lock className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" /> : <Globe className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />}
                    </div>
                    {note.content && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{note.content}</p>
                    )}
                    <div className="flex justify-end mt-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      >
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
          <Tabs value={educationTab} onValueChange={(v) => setEducationTab(v as 'public' | 'private' | 'create')} className="w-full">
            <TabsList className="glass-card w-full grid grid-cols-3 h-auto p-0.5">
              <TabsTrigger value="public" className="gap-1 text-[10px] py-1.5">
                <Globe className="w-3 h-3" />
                Public
              </TabsTrigger>
              <TabsTrigger value="private" className="gap-1 text-[10px] py-1.5">
                <Lock className="w-3 h-3" />
                Private
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-1 text-[10px] py-1.5">
                <Plus className="w-3 h-3" />
                Create
              </TabsTrigger>
            </TabsList>

            {/* PUBLIC */}
            <TabsContent value="public" className="space-y-2 mt-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={publicSubTab === 'docs' ? 'default' : 'ghost'}
                    onClick={() => setPublicSubTab('docs')}
                    className="text-[10px] h-7"
                  >
                    <FileText className="w-3 h-3 mr-0.5" />
                    Docs
                  </Button>
                  <Button
                    size="sm"
                    variant={publicSubTab === 'vdos' ? 'default' : 'ghost'}
                    onClick={() => setPublicSubTab('vdos')}
                    className="text-[10px] h-7"
                  >
                    <Video className="w-3 h-3 mr-0.5" />
                    VDOs
                  </Button>
                </div>
                
                <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]">
                      <FolderPlus className="w-3 h-3 mr-0.5" />
                      Folders
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card max-w-sm mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-sm">Manage Folders</DialogTitle>
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
                        <Select value={newFolderColor} onValueChange={setNewFolderColor}>
                          <SelectTrigger className="w-16 h-8">
                            <Palette className="w-3 h-3" />
                          </SelectTrigger>
                          <SelectContent>
                            {FOLDER_COLORS.map(c => (
                              <SelectItem key={c.id} value={c.id} className="text-[10px]">
                                <div className={cn("w-3 h-3 rounded-full", c.color.split(' ')[0])} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleAddFolder} className="h-8">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {folders.map(folder => (
                          <div key={folder} className={cn("flex items-center justify-between p-2 rounded-lg border", getFolderColorClass(folder))}>
                            <div className="flex items-center gap-2">
                              <Folder className="w-3.5 h-3.5" />
                              <span className="text-xs">{folder}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Select value={folderColors[folder] || 'blue'} onValueChange={(c) => updateFolderColor(folder, c)}>
                                <SelectTrigger className="w-8 h-6 p-0 border-0 bg-transparent">
                                  <Palette className="w-3 h-3" />
                                </SelectTrigger>
                                <SelectContent>
                                  {FOLDER_COLORS.map(c => (
                                    <SelectItem key={c.id} value={c.id} className="text-[10px]">
                                      <div className={cn("w-3 h-3 rounded-full", c.color.split(' ')[0])} />
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

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
                  <FolderButton key={folder} folder={folder} isSelected={selectedFolder === folder} />
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                <Input 
                  placeholder={`Search ${publicSubTab}...`}
                  value={docSearch} 
                  onChange={(e) => setDocSearch(e.target.value)} 
                  className="pl-8 h-8 text-xs border-primary/30 focus:border-primary bg-primary/5"
                />
              </div>

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

            {/* PRIVATE */}
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
                  <FolderButton key={folder} folder={folder} isSelected={selectedFolder === folder} />
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
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          Drag items to folders to organize
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
