import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { BookOpen, Upload, Search, Download, Trash2, Lock, Globe, FileText, CheckSquare, Plus, StickyNote, FolderOpen, Scan, Brain, GraduationCap } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];
type Todo = Database['public']['Tables']['todos']['Row'];
type Note = Database['public']['Tables']['notes']['Row'];

export default function Education() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');
  
  // Documents State
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

  // Todos State
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [todoLoading, setTodoLoading] = useState(false);

  // Notes State
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
    
    const channel = supabase.channel('education-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, fetchDocuments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, fetchTodos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, fetchNotes)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Document Functions
  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('documents').select('*').or(`user_id.eq.${user.id},visibility.eq.public`).order('created_at', { ascending: false });
      setDocuments(data || []);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setDocLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) return toast.error('Please provide a file and title');
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${uploadFile.name}`;
      await supabase.storage.from('documents').upload(fileName, uploadFile);
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
      await supabase.from('documents').insert({ user_id: user.id, title: uploadTitle, description: uploadDescription || null, file_url: publicUrl, file_name: uploadFile.name, file_type: fileExt || 'unknown', visibility });
      toast.success('Document uploaded!');
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setVisibility('private');
      setUploadDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string, fileUrl: string) => {
    try {
      const filePath = fileUrl.split('/documents/')[1];
      await supabase.storage.from('documents').remove([filePath]);
      await supabase.from('documents').delete().eq('id', docId);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // Todo Functions
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
      setNewTodo('');
      fetchTodos();
    } catch (error) {
      toast.error('Failed to add todo');
    } finally {
      setTodoLoading(false);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    await supabase.from('todos').update({ completed: !completed }).eq('id', id);
    fetchTodos();
  };

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    fetchTodos();
  };

  // Notes Functions
  const fetchNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) return toast.error('Title is required');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (editingNote) {
        await supabase.from('notes').update({ title: noteTitle, content: noteContent, visibility: noteVisibility }).eq('id', editingNote.id);
        toast.success('Note updated!');
      } else {
        await supabase.from('notes').insert({ user_id: user.id, title: noteTitle, content: noteContent, visibility: noteVisibility });
        toast.success('Note created!');
      }
      setNoteTitle('');
      setNoteContent('');
      setNoteVisibility('private');
      setEditingNote(null);
      setNoteDialogOpen(false);
      fetchNotes();
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    fetchNotes();
  };

  const myDocuments = documents.filter(doc => doc.user_id === currentUser?.id);
  const publicDocuments = documents.filter(doc => doc.visibility === 'public');
  const filteredMyDocs = myDocuments.filter(doc => doc.title?.toLowerCase().includes(docSearch.toLowerCase()));
  const filteredPublicDocs = publicDocuments.filter(doc => doc.title?.toLowerCase().includes(docSearch.toLowerCase()));

  const quickTools = [
    { icon: '📄', name: 'PDF Viewer', desc: 'View PDFs' },
    { icon: '📝', name: 'Note Maker', desc: 'Create notes' },
    { icon: '📸', name: 'Scanner', desc: 'Scan docs' },
    { icon: '🧠', name: 'AI Summary', desc: 'Summarize PDF' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          📚 Education
        </h1>
        <div className="flex gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 btn-cosmic"><Upload className="w-4 h-4" />Upload</Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>File (PDF, DOC, PPT)</Label><Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="glass-card" /></div>
                <div><Label>Title</Label><Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="glass-card" /></div>
                <div><Label>Description</Label><Textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} className="glass-card" /></div>
                <div>
                  <Label>Visibility</Label>
                  <RadioGroup value={visibility} onValueChange={(val) => setVisibility(val as 'private' | 'public')} className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="private" id="private" /><Label htmlFor="private" className="flex items-center gap-2 cursor-pointer"><Lock className="w-4 h-4" />Private</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="public" id="public" /><Label htmlFor="public" className="flex items-center gap-2 cursor-pointer"><Globe className="w-4 h-4" />Public</Label></div>
                  </RadioGroup>
                </div>
                <Button onClick={handleUpload} disabled={uploading} className="w-full">{uploading ? 'Uploading...' : 'Upload'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Tools */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickTools.map((tool, i) => (
          <Card key={i} className="glass-card hover-lift cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">{tool.icon}</div>
              <p className="font-semibold text-sm">{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full justify-start mb-6">
          <TabsTrigger value="documents" className="gap-2 flex-1">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2 flex-1">
            <StickyNote className="w-4 h-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="todos" className="gap-2 flex-1">
            <CheckSquare className="w-4 h-4" />
            To-Do
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search documents..." value={docSearch} onChange={(e) => setDocSearch(e.target.value)} className="pl-10 glass-card" />
          </div>

          <Tabs value={docTab} onValueChange={(val) => setDocTab(val as 'my' | 'public')} className="w-full">
            <TabsList className="glass-card w-full justify-start mb-4">
              <TabsTrigger value="my" className="gap-2 flex-1"><Lock className="w-4 h-4" />My Documents ({myDocuments.length})</TabsTrigger>
              <TabsTrigger value="public" className="gap-2 flex-1"><Globe className="w-4 h-4" />Public ({publicDocuments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="my">
              {docLoading ? <div className="text-center py-12">Loading...</div> : filteredMyDocs.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-12 text-center"><BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No documents yet. Upload your first!</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMyDocs.map((doc) => (
                    <Card key={doc.id} className="glass-card hover-lift">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-primary" />
                            <Badge variant={doc.visibility === 'public' ? 'default' : 'secondary'}>{doc.visibility === 'public' ? <><Globe className="w-3 h-3 mr-1" />Public</> : <><Lock className="w-3 h-3 mr-1" />Private</>}</Badge>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteDoc(doc.id, doc.file_url)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                        <div>
                          <h3 className="font-semibold truncate">{doc.title}</h3>
                          {doc.description && <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => handleDownload(doc.file_url, doc.file_name)}><Download className="w-4 h-4 mr-1" />Download</Button>
                          <Button size="sm" variant="outline" className="flex-1" asChild><a href={doc.file_url} target="_blank" rel="noopener noreferrer"><BookOpen className="w-4 h-4 mr-1" />Open</a></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="public">
              {filteredPublicDocs.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-12 text-center"><Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No public documents available</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPublicDocs.map((doc) => (
                    <Card key={doc.id} className="glass-card hover-lift">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" /><Badge><Globe className="w-3 h-3 mr-1" />Public</Badge></div>
                        <div><h3 className="font-semibold truncate">{doc.title}</h3>{doc.description && <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>}</div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => handleDownload(doc.file_url, doc.file_name)}><Download className="w-4 h-4 mr-1" />Download</Button>
                          <Button size="sm" variant="outline" className="flex-1" asChild><a href={doc.file_url} target="_blank" rel="noopener noreferrer"><BookOpen className="w-4 h-4 mr-1" />Open</a></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteVisibility('private'); }}>
                  <Plus className="w-4 h-4 mr-2" />New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card max-w-lg">
                <DialogHeader><DialogTitle>{editingNote ? 'Edit Note' : 'Create Note'}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Title</Label><Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="glass-card" /></div>
                  <div><Label>Content</Label><Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="glass-card min-h-[200px]" placeholder="Write your notes here... (Markdown supported)" /></div>
                  <div>
                    <Label>Visibility</Label>
                    <RadioGroup value={noteVisibility} onValueChange={(val) => setNoteVisibility(val as 'private' | 'public')} className="flex gap-4 mt-2">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="private" id="note-private" /><Label htmlFor="note-private" className="flex items-center gap-2 cursor-pointer"><Lock className="w-4 h-4" />Private</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="public" id="note-public" /><Label htmlFor="note-public" className="flex items-center gap-2 cursor-pointer"><Globe className="w-4 h-4" />Public</Label></div>
                    </RadioGroup>
                  </div>
                  <Button onClick={handleSaveNote} className="w-full">{editingNote ? 'Update Note' : 'Save Note'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {notes.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-12 text-center"><StickyNote className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No notes yet. Create your first note!</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <Card key={note.id} className="glass-card hover-lift">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold truncate flex-1">{note.title}</h3>
                      <Badge variant={note.visibility === 'public' ? 'default' : 'secondary'}>{note.visibility}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{note.content || 'No content'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(note.created_at!).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingNote(note); setNoteTitle(note.title); setNoteContent(note.content || ''); setNoteVisibility(note.visibility as 'private' | 'public'); setNoteDialogOpen(true); }}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteNote(note.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todos" className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Add a new task..." value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()} className="glass-card flex-1" />
            <Button onClick={handleAddTodo} disabled={todoLoading}><Plus className="w-4 h-4" /></Button>
          </div>

          {todos.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-12 text-center"><CheckSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No tasks yet. Add your first task!</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <Card key={todo.id} className={`glass-card transition-all ${todo.completed ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Checkbox checked={todo.completed ?? false} onCheckedChange={() => toggleTodo(todo.id, todo.completed ?? false)} />
                    <span className={`flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>{todo.text}</span>
                    <Button size="sm" variant="ghost" onClick={() => deleteTodo(todo.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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