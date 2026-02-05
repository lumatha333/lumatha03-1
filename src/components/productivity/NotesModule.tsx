import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Search, Folder, FolderPlus, StickyNote, Trash2, Edit2, Bookmark, BookmarkCheck, Pin, PinOff, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  images?: string[];
  folder?: string;
  pinned?: boolean;
  saved?: boolean;
  created_at: string;
  updated_at: string;
}

interface NoteFolder {
  id: string;
  name: string;
  pinned?: boolean;
}

const NOTES_KEY = 'lumatha_notes';
const FOLDERS_KEY = 'lumatha_note_folders';

export function NotesModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'folders' | 'saved'>('all');
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteFolder, setNoteFolder] = useState<string>('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadNotes();
    loadFolders();
  }, [user]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const cached = localStorage.getItem(NOTES_KEY);
      if (cached) setNotes(JSON.parse(cached));

      if (user) {
        const { data } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (data) {
          const mapped = data.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content || '',
            folder: extractFolder(n.content),
            pinned: n.content?.includes('[pinned]'),
            saved: n.content?.includes('[saved]'),
            created_at: n.created_at || new Date().toISOString(),
            updated_at: n.updated_at || new Date().toISOString()
          }));
          setNotes(mapped);
          localStorage.setItem(NOTES_KEY, JSON.stringify(mapped));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const extractFolder = (content?: string | null): string => {
    if (!content) return '';
    const match = content.match(/\[folder:(.*?)\]/);
    return match?.[1] || '';
  };

  const loadFolders = () => {
    const saved = localStorage.getItem(FOLDERS_KEY);
    if (saved) setFolders(JSON.parse(saved));
  };

  const saveFolders = (newFolders: NoteFolder[]) => {
    setFolders(newFolders);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(newFolders));
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: NoteFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim()
    };
    saveFolders([...folders, folder]);
    setNewFolderName('');
    setFolderDialogOpen(false);
    toast.success('Folder created!');
  };

  const deleteFolder = (folderId: string) => {
    saveFolders(folders.filter(f => f.id !== folderId));
    if (selectedFolder === folderId) setSelectedFolder(null);
    toast.success('Folder deleted');
  };

  const togglePinFolder = (folderId: string) => {
    saveFolders(folders.map(f => 
      f.id === folderId ? { ...f, pinned: !f.pinned } : f
    ));
  };

  const openNoteDialog = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setNoteTitle(note.title);
      setNoteContent(note.content);
      setNoteFolder(note.folder || '');
      setNoteImages(note.images || []);
    } else {
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
      setNoteFolder('');
      setNoteImages([]);
    }
    setNoteDialogOpen(true);
  };

  const saveNote = async () => {
    if (!noteTitle.trim()) {
      toast.error('Title required');
      return;
    }

    const metadata = [
      noteFolder && `[folder:${noteFolder}]`,
      editingNote?.pinned && '[pinned]',
      editingNote?.saved && '[saved]'
    ].filter(Boolean).join('');

    const fullContent = `${metadata}${noteContent}`;

    if (editingNote) {
      // Update existing
      const updated = notes.map(n => 
        n.id === editingNote.id 
          ? { ...n, title: noteTitle, content: noteContent, folder: noteFolder, updated_at: new Date().toISOString() }
          : n
      );
      setNotes(updated);
      localStorage.setItem(NOTES_KEY, JSON.stringify(updated));

      if (user) {
        await supabase.from('notes').update({
          title: noteTitle,
          content: fullContent,
          updated_at: new Date().toISOString()
        }).eq('id', editingNote.id);
      }
      toast.success('Note updated!');
    } else {
      // Create new
      const note: Note = {
        id: `note-${Date.now()}`,
        title: noteTitle,
        content: noteContent,
        folder: noteFolder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updated = [note, ...notes];
      setNotes(updated);
      localStorage.setItem(NOTES_KEY, JSON.stringify(updated));

      if (user) {
        const { data } = await supabase.from('notes').insert({
          user_id: user.id,
          title: noteTitle,
          content: fullContent,
          visibility: 'private'
        }).select().single();

        if (data) {
          updated[0].id = data.id;
          setNotes(updated);
          localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
        }
      }
      toast.success('Note created!');
    }

    setNoteDialogOpen(false);
  };

  const deleteNote = async (noteId: string) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    localStorage.setItem(NOTES_KEY, JSON.stringify(updated));

    if (user && !noteId.startsWith('note-')) {
      await supabase.from('notes').delete().eq('id', noteId);
    }
    toast.success('Note deleted');
  };

  const toggleSaveNote = (noteId: string) => {
    const updated = notes.map(n => 
      n.id === noteId ? { ...n, saved: !n.saved } : n
    );
    setNotes(updated);
    localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = !search || 
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'saved') return matchesSearch && n.saved;
    if (activeTab === 'folders' && selectedFolder) {
      const folder = folders.find(f => f.id === selectedFolder);
      return matchesSearch && n.folder === folder?.name;
    }
    return matchesSearch;
  });

  const sortedFolders = [...folders].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setSelectedFolder(null); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            <StickyNote className="w-4 h-4 mr-1.5" />
            All Notes
          </TabsTrigger>
          <TabsTrigger value="folders">
            <Folder className="w-4 h-4 mr-1.5" />
            Folders
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Bookmark className="w-4 h-4 mr-1.5" />
            Saved
          </TabsTrigger>
        </TabsList>

        {/* All Notes */}
        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openNoteDialog()}>
              <Plus className="w-4 h-4 mr-1" />
              New Note
            </Button>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notes yet</p>
              <p className="text-sm">Create your first note to get started</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredNotes.map(note => (
                <Card key={note.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm line-clamp-1">{note.title}</CardTitle>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleSaveNote(note.id)}
                        >
                          {note.saved ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openNoteDialog(note)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteNote(note.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {note.content || 'No content'}
                    </p>
                    {note.folder && (
                      <div className="mt-2">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {note.folder}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Folders */}
        <TabsContent value="folders" className="mt-4 space-y-4">
          {!selectedFolder ? (
            <>
              <div className="flex justify-end">
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
                        placeholder="Folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                      />
                      <Button onClick={createFolder} className="w-full">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {sortedFolders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No folders yet</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {sortedFolders.map(folder => (
                    <Card 
                      key={folder.id} 
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Folder className="w-5 h-5 text-primary" />
                            <span className="font-medium">{folder.name}</span>
                            {folder.pinned && <Pin className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); togglePinFolder(folder.id); }}
                            >
                              {folder.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notes.filter(n => n.folder === folder.name).length} notes
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)}>
                  ← Back to Folders
                </Button>
                <Button size="sm" onClick={() => { setNoteFolder(folders.find(f => f.id === selectedFolder)?.name || ''); openNoteDialog(); }}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Note
                </Button>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredNotes.map(note => (
                  <Card key={note.id} className="group hover:border-primary/50 transition-colors">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">{note.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Saved */}
        <TabsContent value="saved" className="mt-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No saved notes</p>
              <p className="text-sm">Save important notes for quick access</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredNotes.map(note => (
                <Card key={note.id} className="group">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{note.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            <Textarea
              placeholder="Write your note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={6}
            />
            {folders.length > 0 && (
              <select
                value={noteFolder}
                onChange={(e) => setNoteFolder(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">No folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setNoteDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={saveNote}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
