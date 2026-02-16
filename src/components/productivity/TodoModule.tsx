import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, Plus, RotateCcw, Flame, Trash2, History, Bell, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TODO_CATEGORIES, TodoCategory, getDefaultTodos } from '@/data/defaultTodos';
import { TodoFolderView } from './todo/TodoFolderView';
import { TodoProgressView } from './todo/TodoProgressView';
import { TodoReminderDialog, getReminders } from './TodoReminderDialog';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: TodoCategory;
  created_at: string;
}

interface CustomFolder {
  id: string;
  name: string;
  lists: { id: string; name: string; tasks: { id: string; text: string; completed: boolean }[] }[];
}

const STORAGE_KEY = 'lumatha_todos_v2';
const CUSTOM_FOLDERS_KEY = 'lumatha_custom_folders_v2';
const STREAK_KEY = 'lumatha_streak';

export function TodoModule() {
  const { user } = useAuth();
  const [view, setView] = useState<'main' | 'progress' | 'custom'>('main');
  const [activeCategory, setActiveCategory] = useState<TodoCategory>('daily');
  const [todos, setTodos] = useState<Record<TodoCategory, Todo[]>>({
    daily: [], weekly: [], monthly: [], yearly: [], lifetime: [], custom: []
  });
  const [newTodo, setNewTodo] = useState('');
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  // Reminder state
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderTask, setReminderTask] = useState<{ id: string; text: string } | null>(null);
  const reminders = getReminders();

  useEffect(() => {
    loadTodos();
    loadCustomFolders();
    loadStreak();
  }, [user]);

  const loadTodos = () => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) { setTodos(JSON.parse(cached)); } else { initializeDefaults(); }
  };

  const initializeDefaults = () => {
    const defaults: Record<TodoCategory, Todo[]> = {
      daily: getDefaultTodos('daily').map((text, i) => ({ id: `daily-${i}`, text, completed: false, category: 'daily', created_at: new Date().toISOString() })),
      weekly: getDefaultTodos('weekly').map((text, i) => ({ id: `weekly-${i}`, text, completed: false, category: 'weekly', created_at: new Date().toISOString() })),
      monthly: getDefaultTodos('monthly').map((text, i) => ({ id: `monthly-${i}`, text, completed: false, category: 'monthly', created_at: new Date().toISOString() })),
      yearly: getDefaultTodos('yearly').map((text, i) => ({ id: `yearly-${i}`, text, completed: false, category: 'yearly', created_at: new Date().toISOString() })),
      lifetime: getDefaultTodos('lifetime').map((text, i) => ({ id: `lifetime-${i}`, text, completed: false, category: 'lifetime', created_at: new Date().toISOString() })),
      custom: []
    };
    setTodos(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  };

  const loadCustomFolders = () => {
    const saved = localStorage.getItem(CUSTOM_FOLDERS_KEY);
    if (saved) setCustomFolders(JSON.parse(saved));
  };

  const saveCustomFolders = (folders: CustomFolder[]) => {
    setCustomFolders(folders);
    localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(folders));
  };

  const loadStreak = () => {
    const saved = localStorage.getItem(STREAK_KEY);
    if (saved) setStreak(JSON.parse(saved).count || 0);
  };

  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  const toggleTodo = (category: TodoCategory, todoId: string) => {
    const updated = { ...todos };
    const idx = updated[category].findIndex(t => t.id === todoId);
    if (idx === -1) return;
    const wasCompleted = updated[category][idx].completed;
    updated[category][idx].completed = !wasCompleted;
    setTodos(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Trigger celebration when completing (not uncompleting)
    if (!wasCompleted) {
      setCelebratingId(todoId);
      setTimeout(() => setCelebratingId(null), 900);
    }
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo: Todo = { id: `${activeCategory}-${Date.now()}`, text: newTodo.trim(), completed: false, category: activeCategory, created_at: new Date().toISOString() };
    const updated = { ...todos };
    updated[activeCategory] = [...updated[activeCategory], todo];
    setTodos(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewTodo('');
    toast.success('Task added!');
  };

  const deleteTodo = (category: TodoCategory, todoId: string) => {
    const updated = { ...todos };
    updated[category] = updated[category].filter(t => t.id !== todoId);
    setTodos(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success('Task deleted');
  };

  const resetCategory = (category: TodoCategory) => {
    const defaults = getDefaultTodos(category);
    const updated = { ...todos };
    updated[category] = defaults.map((text, i) => ({ id: `${category}-${i}`, text, completed: false, category, created_at: new Date().toISOString() }));
    setTodos(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success('Reset to defaults!');
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    saveCustomFolders([...customFolders, { id: `folder-${Date.now()}`, name: newFolderName.trim(), lists: [] }]);
    setNewFolderName('');
    setFolderDialogOpen(false);
    toast.success('Folder created!');
  };

  const deleteFolder = (folderId: string) => {
    saveCustomFolders(customFolders.filter(f => f.id !== folderId));
    toast.success('Folder deleted');
  };

  const openReminder = (taskId: string, taskText: string) => {
    setReminderTask({ id: taskId, text: taskText });
    setReminderDialogOpen(true);
  };

  const getCompletedCount = (category: TodoCategory) => todos[category].filter(t => t.completed).length;
  const getTotalCount = (category: TodoCategory) => todos[category].length;
  const categoryCards = TODO_CATEGORIES.filter(c => c.id !== 'custom');

  if (view === 'progress') return <TodoProgressView onBack={() => setView('main')} />;
  
  if (view === 'custom') {
    return (
      <TodoFolderView
        folders={customFolders} selectedFolder={selectedFolder} selectedList={selectedList}
        onSelectFolder={setSelectedFolder} onSelectList={setSelectedList}
        onCreateFolder={createFolder} onDeleteFolder={deleteFolder} onUpdateFolders={saveCustomFolders}
        folderDialogOpen={folderDialogOpen} setFolderDialogOpen={setFolderDialogOpen}
        newFolderName={newFolderName} setNewFolderName={setNewFolderName} onBack={() => setView('main')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setView('progress')} className="gap-1.5">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categoryCards.map(cat => {
          const completed = getCompletedCount(cat.id);
          const total = getTotalCount(cat.id);
          const progress = total > 0 ? (completed / total) * 100 : 0;
          const isActive = activeCategory === cat.id;
          const CatIcon = cat.icon;
          return (
            <Card key={cat.id} className={cn("cursor-pointer transition-all hover:shadow-lg", isActive && "ring-2 ring-primary shadow-lg")} onClick={() => setActiveCategory(cat.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CatIcon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-medium text-sm">{cat.label}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{completed}/{total} completed</p>
              </CardContent>
            </Card>
          );
        })}
        <Card className="cursor-pointer transition-all hover:shadow-lg border-dashed" onClick={() => setView('custom')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-sm">Custom</span>
            </div>
            <p className="text-xs text-muted-foreground">{customFolders.length} folders</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Category Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {(() => { const ActiveIcon = TODO_CATEGORIES.find(c => c.id === activeCategory)?.icon; return ActiveIcon ? <ActiveIcon className="w-5 h-5 text-primary" /> : null; })()}
              {TODO_CATEGORIES.find(c => c.id === activeCategory)?.label}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => resetCategory(activeCategory)}>
              <RotateCcw className="w-4 h-4 mr-1" />Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {todos[activeCategory].map(todo => {
            const isCelebrating = celebratingId === todo.id;
            return (
            <div key={todo.id} className={cn(
              "group flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
              todo.completed ? "bg-primary/5 border-primary/20" : "border-border",
              isCelebrating && "animate-task-complete"
            )}>
              <button 
                onClick={() => toggleTodo(activeCategory, todo.id)} 
                className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                  todo.completed ? "bg-primary border-primary scale-110" : "border-muted-foreground hover:border-primary/60",
                  isCelebrating && "animate-checkbox-fill"
                )}
              >
                {todo.completed && (
                  <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" className={isCelebrating ? "animate-checkmark-draw" : ""} style={isCelebrating ? { strokeDasharray: 24, strokeDashoffset: 0 } : {}} />
                  </svg>
                )}
              </button>
              <span className={cn("flex-1 text-sm transition-all duration-300", todo.completed && "line-through text-muted-foreground")}>{todo.text}</span>
              
              {/* Confetti burst */}
              {isCelebrating && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full animate-confetti-burst"
                      style={{
                        left: '12px',
                        top: '50%',
                        backgroundColor: ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(45, 100%, 60%)', 'hsl(330, 80%, 60%)', 'hsl(150, 70%, 50%)', 'hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(45, 100%, 60%)'][i],
                        animationDelay: `${i * 40}ms`,
                        '--confetti-x': `${Math.cos((i / 8) * Math.PI * 2) * 40}px`,
                        '--confetti-y': `${Math.sin((i / 8) * Math.PI * 2) * 25}px`,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openReminder(todo.id, todo.text)}>
                  <Bell className={cn("w-3 h-3", reminders[todo.id] ? "text-primary" : "text-muted-foreground")} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTodo(activeCategory, todo.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            );
          })}
          <div className="flex gap-2 pt-2">
            <Input placeholder="Add a new task..." value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTodo()} />
            <Button onClick={addTodo} size="icon"><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Dialog */}
      {reminderTask && (
        <TodoReminderDialog
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          taskId={reminderTask.id}
          taskText={reminderTask.text}
        />
      )}
    </div>
  );
}
