import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, Folder, FolderPlus, Trash2, ChevronRight, ArrowLeft,
  Check, Edit2, List
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomFolder {
  id: string;
  name: string;
  lists: CustomList[];
}

interface CustomList {
  id: string;
  name: string;
  tasks: { id: string; text: string; completed: boolean }[];
}

interface TodoFolderViewProps {
  folders: CustomFolder[];
  selectedFolder: string | null;
  selectedList: string | null;
  onSelectFolder: (id: string | null) => void;
  onSelectList: (id: string | null) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (id: string) => void;
  onUpdateFolders: (folders: CustomFolder[]) => void;
  folderDialogOpen: boolean;
  setFolderDialogOpen: (open: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  onBack: () => void;
}

export function TodoFolderView({
  folders,
  selectedFolder,
  selectedList,
  onSelectFolder,
  onSelectList,
  onCreateFolder,
  onDeleteFolder,
  onUpdateFolders,
  folderDialogOpen,
  setFolderDialogOpen,
  newFolderName,
  setNewFolderName,
  onBack
}: TodoFolderViewProps) {
  const [newListName, setNewListName] = useState('');
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const currentFolder = folders.find(f => f.id === selectedFolder);
  const currentList = currentFolder?.lists.find(l => l.id === selectedList);

  const createList = () => {
    if (!newListName.trim() || !selectedFolder) return;
    
    const updated = folders.map(f => {
      if (f.id === selectedFolder) {
        return {
          ...f,
          lists: [...f.lists, { id: `list-${Date.now()}`, name: newListName.trim(), tasks: [] }]
        };
      }
      return f;
    });
    
    onUpdateFolders(updated);
    setNewListName('');
    setListDialogOpen(false);
    toast.success('List created!');
  };

  const deleteList = (listId: string) => {
    const updated = folders.map(f => {
      if (f.id === selectedFolder) {
        return { ...f, lists: f.lists.filter(l => l.id !== listId) };
      }
      return f;
    });
    onUpdateFolders(updated);
    if (selectedList === listId) onSelectList(null);
    toast.success('List deleted');
  };

  const addTask = () => {
    if (!newTaskText.trim() || !selectedFolder || !selectedList) return;
    
    const updated = folders.map(f => {
      if (f.id === selectedFolder) {
        return {
          ...f,
          lists: f.lists.map(l => {
            if (l.id === selectedList) {
              return {
                ...l,
                tasks: [...l.tasks, { id: `task-${Date.now()}`, text: newTaskText.trim(), completed: false }]
              };
            }
            return l;
          })
        };
      }
      return f;
    });
    
    onUpdateFolders(updated);
    setNewTaskText('');
    toast.success('Task added!');
  };

  const toggleTask = (taskId: string) => {
    const updated = folders.map(f => {
      if (f.id === selectedFolder) {
        return {
          ...f,
          lists: f.lists.map(l => {
            if (l.id === selectedList) {
              return {
                ...l,
                tasks: l.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
              };
            }
            return l;
          })
        };
      }
      return f;
    });
    onUpdateFolders(updated);
  };

  const deleteTask = (taskId: string) => {
    const updated = folders.map(f => {
      if (f.id === selectedFolder) {
        return {
          ...f,
          lists: f.lists.map(l => {
            if (l.id === selectedList) {
              return { ...l, tasks: l.tasks.filter(t => t.id !== taskId) };
            }
            return l;
          })
        };
      }
      return f;
    });
    onUpdateFolders(updated);
    toast.success('Task deleted');
  };

  // Tasks View
  if (selectedList && currentList) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onSelectList(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">{currentList.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentList.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
          ) : (
            currentList.tasks.map(task => (
              <div
                key={task.id}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl border transition-all",
                  task.completed ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                )}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    task.completed ? "bg-primary border-primary" : "border-muted-foreground"
                  )}
                >
                  {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>
                <span className={cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground")}>
                  {task.text}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
          
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Add task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <Button onClick={addTask} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lists View
  if (selectedFolder && currentFolder) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onSelectFolder(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Folder className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{currentFolder.name}</CardTitle>
            </div>
            <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="List name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createList()}
                  />
                  <Button onClick={createList} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentFolder.lists.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No lists yet. Create one to organize your tasks.
            </p>
          ) : (
            currentFolder.lists.map(list => (
              <div
                key={list.id}
                className="group flex items-center justify-between p-3 rounded-xl border hover:border-primary/50 cursor-pointer transition-all"
                onClick={() => onSelectList(list.id)}
              >
                <div className="flex items-center gap-3">
                  <List className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{list.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {list.tasks.filter(t => t.completed).length}/{list.tasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  // Folders View
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">Custom Folders</CardTitle>
          </div>
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
                  onKeyDown={(e) => e.key === 'Enter' && onCreateFolder()}
                />
                <Button onClick={onCreateFolder} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {folders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No custom folders yet</p>
            <p className="text-sm">Create folders to organize your personal tasks</p>
          </div>
        ) : (
          folders.map(folder => (
            <div
              key={folder.id}
              className="group flex items-center justify-between p-4 rounded-xl border hover:border-primary/50 cursor-pointer transition-all"
              onClick={() => onSelectFolder(folder.id)}
            >
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-medium">{folder.name}</span>
                  <p className="text-xs text-muted-foreground">{folder.lists.length} lists</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
