import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, Plus, RotateCcw, Trophy, Flame, Star, FolderPlus, Folder, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TODO_CATEGORIES, TodoCategory, getDefaultTodos } from '@/data/defaultTodos';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: TodoCategory;
  folder?: string;
  created_at: string;
}

interface CustomFolder {
  id: string;
  name: string;
  todos: { id: string; text: string; completed: boolean }[];
}

const STORAGE_KEY = 'lumatha_todos';
const CUSTOM_FOLDERS_KEY = 'lumatha_custom_folders';
const STREAK_KEY = 'lumatha_streak';
const XP_KEY = 'lumatha_xp';

export function TodoModule() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<TodoCategory>('daily');
  const [todos, setTodos] = useState<Record<TodoCategory, Todo[]>>({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
    lifetime: [],
    custom: []
  });
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Custom folders
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderTodo, setNewFolderTodo] = useState('');
  
  // Gamification
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [showReward, setShowReward] = useState(false);

  // Load todos from localStorage + Supabase
  useEffect(() => {
    loadTodos();
    loadCustomFolders();
    loadGamification();
  }, [user]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      // Load from localStorage first for instant UI
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setTodos(JSON.parse(cached));
      }

      if (!user) {
        // Initialize with defaults for non-logged users
        initializeDefaults();
        return;
      }

      // Fetch from Supabase
      const { data } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        const categorized: Record<TodoCategory, Todo[]> = {
          daily: [], weekly: [], monthly: [], yearly: [], lifetime: [], custom: []
        };
        
        data.forEach(todo => {
          const category = extractCategory(todo.text);
          const cleanText = todo.text.replace(/^\[(daily|weekly|monthly|yearly|lifetime)\]\s*/, '');
          categorized[category].push({
            id: todo.id,
            text: cleanText,
            completed: todo.completed || false,
            category,
            created_at: todo.created_at || new Date().toISOString()
          });
        });
        
        setTodos(categorized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(categorized));
      } else {
        initializeDefaults();
      }
    } finally {
      setLoading(false);
    }
  };

  const extractCategory = (text: string): TodoCategory => {
    const match = text.match(/^\[(daily|weekly|monthly|yearly|lifetime)\]/);
    return (match?.[1] as TodoCategory) || 'daily';
  };

  const initializeDefaults = async () => {
    const defaults: Record<TodoCategory, Todo[]> = {
      daily: getDefaultTodos('daily').map((text, i) => ({
        id: `daily-${i}`, text, completed: false, category: 'daily', created_at: new Date().toISOString()
      })),
      weekly: getDefaultTodos('weekly').map((text, i) => ({
        id: `weekly-${i}`, text, completed: false, category: 'weekly', created_at: new Date().toISOString()
      })),
      monthly: getDefaultTodos('monthly').map((text, i) => ({
        id: `monthly-${i}`, text, completed: false, category: 'monthly', created_at: new Date().toISOString()
      })),
      yearly: getDefaultTodos('yearly').map((text, i) => ({
        id: `yearly-${i}`, text, completed: false, category: 'yearly', created_at: new Date().toISOString()
      })),
      lifetime: getDefaultTodos('lifetime').map((text, i) => ({
        id: `lifetime-${i}`, text, completed: false, category: 'lifetime', created_at: new Date().toISOString()
      })),
      custom: []
    };
    
    setTodos(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    
    // Sync to Supabase if logged in
    if (user) {
      const allTodos = Object.entries(defaults).flatMap(([cat, items]) =>
        items.map(t => ({
          user_id: user.id,
          text: `[${cat}] ${t.text}`,
          completed: false,
          visibility: 'private'
        }))
      );
      await supabase.from('todos').insert(allTodos);
    }
  };

  const loadCustomFolders = () => {
    const saved = localStorage.getItem(CUSTOM_FOLDERS_KEY);
    if (saved) setCustomFolders(JSON.parse(saved));
  };

  const loadGamification = () => {
    const savedStreak = localStorage.getItem(STREAK_KEY);
    const savedXp = localStorage.getItem(XP_KEY);
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedXp) setXp(parseInt(savedXp));
  };

  const saveGamification = (newStreak: number, newXp: number) => {
    setStreak(newStreak);
    setXp(newXp);
    localStorage.setItem(STREAK_KEY, newStreak.toString());
    localStorage.setItem(XP_KEY, newXp.toString());
  };

  const toggleTodo = async (category: TodoCategory, todoId: string) => {
    const updated = { ...todos };
    const todoIndex = updated[category].findIndex(t => t.id === todoId);
    if (todoIndex === -1) return;
    
    const wasCompleted = updated[category][todoIndex].completed;
    updated[category][todoIndex].completed = !wasCompleted;
    
    setTodos(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Award XP for completing
    if (!wasCompleted) {
      const newXp = xp + 10;
      saveGamification(streak, newXp);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 1500);
    }
    
    // Sync to Supabase
    if (user && !todoId.includes('-')) {
      await supabase.from('todos').update({ completed: !wasCompleted }).eq('id', todoId);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    
    const todo: Todo = {
      id: `${activeCategory}-${Date.now()}`,
      text: newTodo.trim(),
      completed: false,
      category: activeCategory,
      created_at: new Date().toISOString()
    };
    
    const updated = { ...todos };
    updated[activeCategory] = [...updated[activeCategory], todo];
    setTodos(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNewTodo('');
    
    if (user) {
      const { data } = await supabase.from('todos').insert({
        user_id: user.id,
        text: `[${activeCategory}] ${newTodo.trim()}`,
        completed: false,
        visibility: 'private'
      }).select().single();
      
      if (data) {
        updated[activeCategory][updated[activeCategory].length - 1].id = data.id;
        setTodos(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    }
    
    toast.success('Task added!');
  };

  const resetCategory = async (category: TodoCategory) => {
    const defaults = getDefaultTodos(category);
    const updated = { ...todos };
    updated[category] = defaults.map((text, i) => ({
      id: `${category}-${i}`,
      text,
      completed: false,
      category,
      created_at: new Date().toISOString()
    }));
    
    setTodos(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    if (user) {
      await supabase.from('todos').delete().eq('user_id', user.id).ilike('text', `[${category}]%`);
      const newTodos = defaults.map(text => ({
        user_id: user.id,
        text: `[${category}] ${text}`,
        completed: false,
        visibility: 'private'
      }));
      await supabase.from('todos').insert(newTodos);
    }
    
    toast.success('Reset to defaults!');
  };

  // Custom folder functions
  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: CustomFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      todos: []
    };
    const updated = [...customFolders, folder];
    setCustomFolders(updated);
    localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(updated));
    setNewFolderName('');
    setFolderDialogOpen(false);
    toast.success('Folder created!');
  };

  const deleteFolder = (folderId: string) => {
    const updated = customFolders.filter(f => f.id !== folderId);
    setCustomFolders(updated);
    localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(updated));
    if (selectedFolder === folderId) setSelectedFolder(null);
    toast.success('Folder deleted');
  };

  const addFolderTodo = (folderId: string) => {
    if (!newFolderTodo.trim()) return;
    const updated = customFolders.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          todos: [...f.todos, { id: `todo-${Date.now()}`, text: newFolderTodo.trim(), completed: false }]
        };
      }
      return f;
    });
    setCustomFolders(updated);
    localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(updated));
    setNewFolderTodo('');
  };

  const toggleFolderTodo = (folderId: string, todoId: string) => {
    const updated = customFolders.map(f => {
      if (f.id === folderId) {
        return {
          ...f,
          todos: f.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t)
        };
      }
      return f;
    });
    setCustomFolders(updated);
    localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(updated));
    
    // Award XP
    const folder = customFolders.find(f => f.id === folderId);
    const todo = folder?.todos.find(t => t.id === todoId);
    if (todo && !todo.completed) {
      saveGamification(streak, xp + 10);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 1500);
    }
  };

  const getCompletedCount = (category: TodoCategory) => {
    return todos[category].filter(t => t.completed).length;
  };

  const getTotalCount = (category: TodoCategory) => {
    return todos[category].length;
  };

  const getBadge = () => {
    if (xp >= 1000) return { name: 'Gold', color: 'text-yellow-400', icon: '🏆' };
    if (xp >= 500) return { name: 'Silver', color: 'text-gray-300', icon: '🥈' };
    if (xp >= 100) return { name: 'Bronze', color: 'text-orange-400', icon: '🥉' };
    return { name: 'Starter', color: 'text-muted-foreground', icon: '🌱' };
  };

  const badge = getBadge();

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium">{streak} day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{xp} XP</span>
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5", badge.color)}>
          <span>{badge.icon}</span>
          <span className="text-sm font-medium">{badge.name}</span>
        </div>
      </div>

      {/* Reward Animation */}
      {showReward && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="text-4xl animate-bounce">+10 ⭐</div>
        </div>
      )}

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as TodoCategory)}>
        <TabsList className="w-full grid grid-cols-6 h-auto p-1">
          {TODO_CATEGORIES.map(cat => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="flex flex-col gap-0.5 py-2 text-xs"
            >
              <span>{cat.emoji}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TODO_CATEGORIES.filter(c => c.id !== 'custom').map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="mt-4 space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{cat.label}</span>
                <span className="text-sm text-muted-foreground">
                  {getCompletedCount(cat.id)}/{getTotalCount(cat.id)} completed
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetCategory(cat.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(getCompletedCount(cat.id) / Math.max(getTotalCount(cat.id), 1)) * 100}%` }}
              />
            </div>

            {/* Todo List */}
            <div className="space-y-2">
              {todos[cat.id].map(todo => (
                <button
                  key={todo.id}
                  onClick={() => toggleTodo(cat.id, todo.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    todo.completed 
                      ? "bg-primary/10 border-primary/20" 
                      : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    todo.completed 
                      ? "bg-primary border-primary" 
                      : "border-muted-foreground"
                  )}>
                    {todo.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={cn(
                    "flex-1 text-sm transition-all",
                    todo.completed && "line-through text-muted-foreground"
                  )}>
                    {todo.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Add New */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                className="flex-1"
              />
              <Button onClick={addTodo} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        ))}

        {/* Custom Tab */}
        <TabsContent value="custom" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Custom Folders</span>
            <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <FolderPlus className="w-4 h-4 mr-1" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Folder name (e.g., Morning Routine)"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                  />
                  <Button onClick={createFolder} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {customFolders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No custom folders yet</p>
              <p className="text-sm">Create folders to organize your personal tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customFolders.map(folder => (
                <Card key={folder.id} className="overflow-hidden">
                  <CardHeader 
                    className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-primary" />
                        <CardTitle className="text-sm">{folder.name}</CardTitle>
                        <span className="text-xs text-muted-foreground">
                          ({folder.todos.filter(t => t.completed).length}/{folder.todos.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-transform",
                          selectedFolder === folder.id && "rotate-90"
                        )} />
                      </div>
                    </div>
                  </CardHeader>
                  
                  {selectedFolder === folder.id && (
                    <CardContent className="p-3 pt-0 space-y-2">
                      {folder.todos.map(todo => (
                        <button
                          key={todo.id}
                          onClick={() => toggleFolderTodo(folder.id, todo.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-md transition-all text-left",
                            todo.completed ? "opacity-60" : ""
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center",
                            todo.completed ? "bg-primary border-primary" : "border-muted-foreground"
                          )}>
                            {todo.completed && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                          </div>
                          <span className={cn(
                            "text-sm",
                            todo.completed && "line-through"
                          )}>
                            {todo.text}
                          </span>
                        </button>
                      ))}
                      
                      <div className="flex gap-2 pt-2">
                        <Input
                          placeholder="Add task..."
                          value={newFolderTodo}
                          onChange={(e) => setNewFolderTodo(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addFolderTodo(folder.id)}
                          className="flex-1 h-8 text-sm"
                        />
                        <Button size="sm" className="h-8" onClick={() => addFolderTodo(folder.id)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
