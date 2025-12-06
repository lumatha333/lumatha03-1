import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, CheckCircle2, Circle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Todo() {
  const [todos, setTodos] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [todosRes, notesRes] = await Promise.all([
        supabase.from('todos').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('created_at', { ascending: false })
      ]);

      if (todosRes.error) throw todosRes.error;
      if (notesRes.error) throw notesRes.error;

      setTodos(todosRes.data || []);
      setNotes(notesRes.data || []);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('todos').insert({
        user_id: user.id,
        text: newTodo,
        completed: false,
        visibility: 'private'
      });

      if (error) throw error;
      setNewTodo('');
      fetchData();
      toast.success('Task added');
    } catch (error: any) {
      toast.error('Failed to add task');
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const { error } = await supabase.from('todos').update({
        completed: !todo.completed
      }).eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update task');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
      fetchData();
      toast.success('Task deleted');
    } catch (error: any) {
      toast.error('Failed to delete task');
    }
  };

  const addNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        title: newNoteTitle,
        content: newNoteContent,
        visibility: 'private'
      });

      if (error) throw error;
      setNewNoteTitle('');
      setNewNoteContent('');
      setNoteDialogOpen(false);
      fetchData();
      toast.success('Note created');
    } catch (error: any) {
      toast.error('Failed to create note');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      fetchData();
      toast.success('Note deleted');
    } catch (error: any) {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">To-Do & Notes</h1>
        <p className="text-muted-foreground">Organize your tasks and capture your thoughts</p>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="todos">To-Do List</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new task..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  className="glass-card flex-1"
                />
                <Button onClick={addTodo}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : todos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tasks yet. Add one above!</p>
                ) : (
                  todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 p-3 glass-card rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTodo(todo.id)}
                      className="p-0"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </Button>
                    <span className={`flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {todo.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      placeholder="Note title..."
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="glass-card"
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      placeholder="Write your note..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="glass-card min-h-[300px]"
                    />
                  </div>
                  <Button onClick={addNote} className="w-full">Create Note</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">Loading...</div>
            ) : notes.length === 0 ? (
              <div className="col-span-full">
                <Card className="glass-card border-border">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No notes yet. Create your first note!</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              notes.map((note) => (
                <Card key={note.id} className="glass-card border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
