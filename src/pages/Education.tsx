import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { BookOpen, Upload, Search, Download, Trash2, Lock, Globe, FileText, CheckSquare, Plus, StickyNote } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];
type Todo = Database['public']['Tables']['todos']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];

export default function Education() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docSearch, setDocSearch] = useState('');
  const [docLoading, setDocLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [uploading, setUploading] = useState(false);
  const [docTab, setDocTab] = useState<'my' | 'public'>('my');

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [todoLoading, setTodoLoading] = useState(false);

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
      const { data } = await supabase.from('documents').select('*')
        .or(`user_id.eq.${user.id},visibility.eq.public`)
        .order('created_at', { ascending: false });
      setDocuments(data || []);
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
      await supabase.storage.from('documents').remove([filePath]);
      await supabase.from('documents').delete().eq('id', docId);
      toast.success('Deleted');
      fetchDocuments();
    } catch { toast.error('Delete failed'); }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    window.URL.revokeObjectURL(url); document.body.removeChild(a);
  };

  const fetchTodos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('todos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setTodos(data || []);
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    setTodoLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('todos').insert({ user_id: user.id, text: newTodo, completed: false, visibility: 'private' });
      setNewTodo(''); fetchTodos();
    } finally { setTodoLoading(false); }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    await supabase.from('todos').update({ completed: !completed }).eq('id', id);
    fetchTodos();
  };

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    fetchTodos();
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

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          📚 Education
        </h1>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 btn-cosmic w-full sm:w-auto">
              <Upload className="w-4 h-4" />Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-md mx-4">
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">File</Label><Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="glass-card text-sm" /></div>
              <div><Label className="text-xs">Title</Label><Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="glass-card" /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} className="glass-card" rows={2} /></div>
              <RadioGroup value={visibility} onValueChange={(val) => setVisibility(val as 'private' | 'public')} className="flex gap-4">
                <div className="flex items-center gap-2"><RadioGroupItem value="private" id="private" /><Label htmlFor="private" className="flex items-center gap-1 text-xs cursor-pointer"><Lock className="w-3 h-3" />Private</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="public" id="public" /><Label htmlFor="public" className="flex items-center gap-1 text-xs cursor-pointer"><Globe className="w-3 h-3" />Public</Label></div>
              </RadioGroup>
              <Button onClick={handleUpload} disabled={uploading} className="w-full">{uploading ? 'Uploading...' : 'Upload'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-3 h-auto p-1">
          <TabsTrigger value="documents" className="gap-1 text-xs sm:text-sm py-2">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Documents</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1 text-xs sm:text-sm py-2">
            <StickyNote className="w-3 h-3 sm:w-4 sm:h-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="todos" className="gap-1 text-xs sm:text-sm py-2">
            <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">To-Do</span>
            <span className="sm:hidden">Tasks</span>
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={docSearch} onChange={(e) => setDocSearch(e.target.value)} className="pl-9 glass-card" />
          </div>

          <Tabs value={docTab} onValueChange={(val) => setDocTab(val as 'my' | 'public')}>
            <TabsList className="glass-card w-full grid grid-cols-2 h-auto p-1">
              <TabsTrigger value="my" className="text-xs sm:text-sm py-1.5"><Lock className="w-3 h-3 mr-1" />My ({myDocuments.length})</TabsTrigger>
              <TabsTrigger value="public" className="text-xs sm:text-sm py-1.5"><Globe className="w-3 h-3 mr-1" />Public ({publicDocuments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="my" className="mt-3">
              {docLoading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> : filteredMyDocs.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-8 text-center"><BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No documents yet</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredMyDocs.map((doc) => (
                    <Card key={doc.id} className="glass-card hover-lift">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <BookOpen className="w-5 h-5 text-primary shrink-0" />
                            <Badge variant={doc.visibility === 'public' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                              {doc.visibility === 'public' ? <Globe className="w-2.5 h-2.5 mr-0.5" /> : <Lock className="w-2.5 h-2.5 mr-0.5" />}
                              {doc.visibility}
                            </Badge>
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handleDeleteDoc(doc.id, doc.file_url)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                          <p className="text-[10px] text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleDownload(doc.file_url, doc.file_name)}>
                            <Download className="w-3 h-3 mr-1" />Download
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><BookOpen className="w-3 h-3 mr-1" />Open</a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="public" className="mt-3">
              {filteredPublicDocs.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-8 text-center"><Globe className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No public documents</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPublicDocs.map((doc) => (
                    <Card key={doc.id} className="glass-card hover-lift">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /><Badge className="text-[10px]"><Globe className="w-2.5 h-2.5 mr-0.5" />Public</Badge></div>
                        <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleDownload(doc.file_url, doc.file_name)}><Download className="w-3 h-3 mr-1" />Download</Button>
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" asChild><a href={doc.file_url} target="_blank" rel="noopener noreferrer"><BookOpen className="w-3 h-3 mr-1" />Open</a></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteVisibility('private'); }}>
                  <Plus className="w-4 h-4 mr-1" />New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card max-w-md mx-4">
                <DialogHeader><DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">Title</Label><Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="glass-card" /></div>
                  <div><Label className="text-xs">Content</Label><Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="glass-card min-h-[120px]" placeholder="Write your notes..." /></div>
                  <RadioGroup value={noteVisibility} onValueChange={(val) => setNoteVisibility(val as 'private' | 'public')} className="flex gap-4">
                    <div className="flex items-center gap-2"><RadioGroupItem value="private" id="note-private" /><Label htmlFor="note-private" className="flex items-center gap-1 text-xs cursor-pointer"><Lock className="w-3 h-3" />Private</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="public" id="note-public" /><Label htmlFor="note-public" className="flex items-center gap-1 text-xs cursor-pointer"><Globe className="w-3 h-3" />Public</Label></div>
                  </RadioGroup>
                  <Button onClick={handleSaveNote} className="w-full">{editingNote ? 'Update' : 'Save'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {notes.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-8 text-center"><StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No notes yet</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notes.map((note) => (
                <Card key={note.id} className="glass-card hover-lift">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm truncate flex-1">{note.title}</h3>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingNote(note); setNoteTitle(note.title); setNoteContent(note.content || ''); setNoteVisibility(note.visibility as 'private' | 'public'); setNoteDialogOpen(true); }}>
                          <StickyNote className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteNote(note.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {note.content && <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">
                        {note.visibility === 'public' ? <Globe className="w-2.5 h-2.5 mr-0.5" /> : <Lock className="w-2.5 h-2.5 mr-0.5" />}
                        {note.visibility}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(note.created_at || '').toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Todos Tab */}
        <TabsContent value="todos" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Input placeholder="Add a task..." value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()} className="glass-card flex-1" />
            <Button onClick={handleAddTodo} disabled={todoLoading} size="icon"><Plus className="w-4 h-4" /></Button>
          </div>

          {todos.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-8 text-center"><CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No tasks yet</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <Card key={todo.id} className="glass-card">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Checkbox checked={todo.completed || false} onCheckedChange={() => toggleTodo(todo.id, todo.completed || false)} />
                    <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>{todo.text}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteTodo(todo.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
