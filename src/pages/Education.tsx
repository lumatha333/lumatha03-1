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
import { BookOpen, Search, Lock, Globe, FileText, CheckSquare, Plus, StickyNote, Calendar, CalendarDays, CalendarRange, Trash2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import DocumentCard from '@/components/DocumentCard';

type Document = Database['public']['Tables']['documents']['Row'];
type Todo = Database['public']['Tables']['todos']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type DocumentWithProfile = Document & { profiles?: Profile };

// Default todos by category
const DEFAULT_DAILY_TODOS = [
  "Wake up and stay clean",
  "Eat healthy food",
  "Drink water",
  "Move your body",
  "Study or work",
  "Help someone",
  "Relax your mind",
  "Sleep on time"
];

const DEFAULT_WEEKLY_TODOS = [
  "Clean your room/home",
  "Spend time with family",
  "Learn something new",
  "Play or enjoy a hobby",
  "Go outside",
  "Do a good deed",
  "Reduce screen time",
  "Plan next week"
];

const DEFAULT_MONTHLY_TODOS = [
  "Think about your progress",
  "Set small goals",
  "Learn a new life skill",
  "Remove unused things",
  "Try something new",
  "Check your health",
  "Save money",
  "Say thank you and feel grateful"
];

type TodoCategory = 'daily' | 'weekly' | 'monthly';

interface CategorizedTodo extends Todo {
  category?: TodoCategory;
}

export default function Education() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('documents');
  
  const [documents, setDocuments] = useState<DocumentWithProfile[]>([]);
  const [docSearch, setDocSearch] = useState('');
  const [docLoading, setDocLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [uploading, setUploading] = useState(false);
  const [docTab, setDocTab] = useState<'my' | 'public'>('my');

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
    } finally {
      setDocLoading(false);
    }
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
    } finally { setTodoLoading(false); }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    await supabase.from('todos').update({ completed: !completed }).eq('id', id);
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
  };

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    setTodos(todos.filter(t => t.id !== id));
    toast.success('Task deleted');
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
  const filteredMyDocs = myDocuments.filter(doc => doc.title?.toLowerCase().includes(docSearch.toLowerCase()));
  const filteredPublicDocs = publicDocuments.filter(doc => doc.title?.toLowerCase().includes(docSearch.toLowerCase()));

  // Filter todos by category
  const dailyTodos = todos.filter(t => t.category === 'daily' || t.text.startsWith('[daily]'));
  const weeklyTodos = todos.filter(t => t.category === 'weekly' || t.text.startsWith('[weekly]'));
  const monthlyTodos = todos.filter(t => t.category === 'monthly' || t.text.startsWith('[monthly]'));

  const getTodoDisplayText = (text: string) => {
    return text.replace(/^\[(daily|weekly|monthly)\]/, '');
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-3 h-auto p-0.5">
          <TabsTrigger value="documents" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <FileText className="w-3 h-3" />
            <span className="hidden xs:inline">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <StickyNote className="w-3 h-3" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="todos" className="gap-1 text-[11px] sm:text-xs py-1.5">
            <CheckSquare className="w-3 h-3" />
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-2 mt-3">
          {/* Search Bar - Highlighted */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
            <Input 
              placeholder="Search documents..." 
              value={docSearch} 
              onChange={(e) => setDocSearch(e.target.value)} 
              className="pl-8 h-8 text-xs border-primary/30 focus:border-primary bg-primary/5"
            />
          </div>

          {/* Upload Button below search */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="w-full gap-1.5 h-8 border-dashed border-primary/50 hover:bg-primary/10">
                <Plus className="w-3.5 h-3.5" />Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card max-w-sm mx-4">
              <DialogHeader><DialogTitle className="text-sm">Upload Document</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <div><Label className="text-[10px]">File</Label><Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="glass-card text-xs h-8" /></div>
                <div><Label className="text-[10px]">Title</Label><Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="glass-card h-8 text-xs" /></div>
                <div><Label className="text-[10px]">Description</Label><Textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} className="glass-card text-xs" rows={2} /></div>
                <RadioGroup value={visibility} onValueChange={(val) => setVisibility(val as 'private' | 'public')} className="flex gap-3">
                  <div className="flex items-center gap-1"><RadioGroupItem value="private" id="priv" /><Label htmlFor="priv" className="flex items-center gap-0.5 text-[10px] cursor-pointer"><Lock className="w-2.5 h-2.5" />Private</Label></div>
                  <div className="flex items-center gap-1"><RadioGroupItem value="public" id="pub" /><Label htmlFor="pub" className="flex items-center gap-0.5 text-[10px] cursor-pointer"><Globe className="w-2.5 h-2.5" />Public</Label></div>
                </RadioGroup>
                <Button onClick={handleUpload} disabled={uploading} className="w-full h-8 text-xs">{uploading ? 'Uploading...' : 'Upload'}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Tabs value={docTab} onValueChange={(val) => setDocTab(val as 'my' | 'public')}>
            <TabsList className="glass-card w-full grid grid-cols-2 h-auto p-0.5">
              <TabsTrigger value="my" className="text-[10px] py-1"><Lock className="w-2.5 h-2.5 mr-0.5" />My ({myDocuments.length})</TabsTrigger>
              <TabsTrigger value="public" className="text-[10px] py-1"><Globe className="w-2.5 h-2.5 mr-0.5" />Public ({publicDocuments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="my" className="mt-2">
              {docLoading ? <p className="text-center py-6 text-muted-foreground text-xs">Loading...</p> : filteredMyDocs.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-6 text-center"><BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground">No documents yet</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredMyDocs.map((doc) => (
                    <DocumentCard 
                      key={doc.id}
                      doc={doc}
                      onDelete={handleDeleteDoc}
                      onDownload={handleDownload}
                      onOpenInBrowser={handleOpenInBrowser}
                      onRefresh={fetchDocuments}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="public" className="mt-2">
              {filteredPublicDocs.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-6 text-center"><Globe className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground">No public documents</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredPublicDocs.map((doc) => (
                    <DocumentCard 
                      key={doc.id}
                      doc={doc}
                      onDelete={handleDeleteDoc}
                      onDownload={handleDownload}
                      onOpenInBrowser={handleOpenInBrowser}
                      onRefresh={fetchDocuments}
                    />
                  ))}
                </div>
              )}
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
                  <Button onClick={handleSaveNote} className="w-full h-8 text-xs">{editingNote ? 'Update' : 'Save'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {notes.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-6 text-center"><StickyNote className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground">No notes yet</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {notes.map((note) => (
                <Card key={note.id} className="glass-card">
                  <CardContent className="p-2.5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <StickyNote className="w-3.5 h-3.5 text-yellow-500" />
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${note.visibility === 'public' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{note.visibility}</span>
                      </div>
                      <div className="flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setEditingNote(note); setNoteTitle(note.title); setNoteContent(note.content || ''); setNoteVisibility(note.visibility as 'private' | 'public'); setNoteDialogOpen(true); }}>
                          <FileText className="w-2.5 h-2.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => deleteNote(note.id)}>
                          <Trash2 className="w-2.5 h-2.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-medium text-xs">{note.title}</h3>
                    {note.content && <p className="text-[10px] text-muted-foreground line-clamp-2">{note.content}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Todos Tab */}
        <TabsContent value="todos" className="space-y-3 mt-3">
          {/* Add todo input */}
          <div className="flex gap-1.5">
            <Input placeholder="Add new task..." value={newTodo} onChange={(e) => setNewTodo(e.target.value)} className="glass-card flex-1 h-8 text-xs"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()} />
            <select 
              value={todoCategory} 
              onChange={(e) => setTodoCategory(e.target.value as TodoCategory)}
              className="h-8 px-2 text-[10px] rounded-md border border-border bg-background"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <Button onClick={handleAddTodo} disabled={todoLoading} className="h-8 w-8 p-0"><Plus className="w-3.5 h-3.5" /></Button>
          </div>

          {/* Daily Todos */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-green-500" />
              <span>🌞 DAILY ({dailyTodos.length})</span>
            </div>
            <div className="space-y-1">
              {dailyTodos.map((todo) => (
                <Card key={todo.id} className={`glass-card ${todo.completed ? 'opacity-50' : ''}`}>
                  <CardContent className="p-2 flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => toggleTodo(todo.id, todo.completed || false)}>
                      <CheckSquare className={`w-3.5 h-3.5 ${todo.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <span className={`flex-1 text-[11px] ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>{getTodoDisplayText(todo.text)}</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => deleteTodo(todo.id)}>
                      <Trash2 className="w-2.5 h-2.5 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Weekly Todos */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
              <span>📅 WEEKLY ({weeklyTodos.length})</span>
            </div>
            <div className="space-y-1">
              {weeklyTodos.map((todo) => (
                <Card key={todo.id} className={`glass-card ${todo.completed ? 'opacity-50' : ''}`}>
                  <CardContent className="p-2 flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => toggleTodo(todo.id, todo.completed || false)}>
                      <CheckSquare className={`w-3.5 h-3.5 ${todo.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <span className={`flex-1 text-[11px] ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>{getTodoDisplayText(todo.text)}</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => deleteTodo(todo.id)}>
                      <Trash2 className="w-2.5 h-2.5 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Monthly Todos */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <CalendarRange className="w-3.5 h-3.5 text-purple-500" />
              <span>🗓️ MONTHLY ({monthlyTodos.length})</span>
            </div>
            <div className="space-y-1">
              {monthlyTodos.map((todo) => (
                <Card key={todo.id} className={`glass-card ${todo.completed ? 'opacity-50' : ''}`}>
                  <CardContent className="p-2 flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => toggleTodo(todo.id, todo.completed || false)}>
                      <CheckSquare className={`w-3.5 h-3.5 ${todo.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <span className={`flex-1 text-[11px] ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>{getTodoDisplayText(todo.text)}</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => deleteTodo(todo.id)}>
                      <Trash2 className="w-2.5 h-2.5 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
