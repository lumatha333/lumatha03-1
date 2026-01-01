import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchTodos();
  }, [user]);

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !user) return;
    try {
      const { error } = await supabase.from('todos').insert({
        user_id: user.id,
        text: newTodo.trim(),
        completed: false,
        visibility: 'private'
      });

      if (error) throw error;
      setNewTodo('');
      fetchTodos();
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (!user) return null;

  return (
    <Card className="glass-card border-border h-full">
      <CardHeader className="p-3 border-b border-border/50">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-primary" />
          Quick Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="flex gap-1.5">
          <Input
            placeholder="Add task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            className="h-8 text-xs"
          />
          <Button onClick={addTodo} size="icon" className="h-8 w-8 shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
          ) : todos.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No tasks yet</p>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors group">
                <button onClick={() => toggleTodo(todo.id)} className="shrink-0">
                  {todo.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <span className={`flex-1 text-xs truncate ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {todo.text}
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
      </CardContent>
    </Card>
  );
}
