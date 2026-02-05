import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Search, Folder, FolderPlus, StickyNote, Trash2, Edit2, Bookmark, BookmarkCheck, Pin, PinOff, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Note { id: string; title: string; content: string; images?: string[]; folder?: string; pinned?: boolean; saved?: boolean; created_at: string; updated_at: string; }
interface NoteFolder { id: string; name: string; pinned?: boolean; }

const NOTES_KEY = 'lumatha_notes_v2';
const FOLDERS_KEY = 'lumatha_note_folders_v2';

export function NotesModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'folders' | 'saved'>('all');
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [search, setSearch] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteFolder, setNoteFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem(NOTES_KEY);
    if (cached) setNotes(JSON.parse(cached));
    const savedFolders = localStorage.getItem(FOLDERS_KEY);
    if (savedFolders) setFolders(JSON.parse(savedFolders));
  }, []);

  const saveNotes = (newNotes: Note[]) => { setNotes(newNotes); localStorage.setItem(NOTES_KEY, JSON.stringify(newNotes)); };
  const saveFolders = (newFolders: NoteFolder[]) => { setFolders(newFolders); localStorage.setItem(FOLDERS_KEY, JSON.stringify(newFolders)); };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    saveFolders([...folders, { id: `folder-${Date.now()}`, name: newFolderName.trim() }]);
    setNewFolderName(''); setFolderDialogOpen(false);
    toast.success('Folder created!');
  };

  const deleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    saveFolders(folders.filter(f => f.id !== folderId));
    if (folder) saveNotes(notes.map(n => n.folder === folder.name ? { ...n, folder: '' } : n));
    if (selectedFolder === folderId) setSelectedFolder(null);
    toast.success('Folder deleted');
  };

  const openNoteDialog = (note?: Note) => {
    if (note) { setEditingNote(note); setNoteTitle(note.title); setNoteContent(note.content); setNoteFolder(note.folder || ''); }
    else { setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteFolder(selectedFolder ? folders.find(f => f.id === selectedFolder)?.name || '' : ''); }
    setNoteDialogOpen(true);
  };

  const saveNote = () => {
    if (!noteTitle.trim()) { toast.error('Title required'); return; }
    const now = new Date().toISOString();
    if (editingNote) {
      saveNotes(notes.map(n => n.id === editingNote.id ? { ...n, title: noteTitle, content: noteContent, folder: noteFolder, updated_at: now } : n));
      toast.success('Note updated!');
    } else {
      saveNotes([{ id: `note-${Date.now()}`, title: noteTitle, content: noteContent, folder: noteFolder, created_at: now, updated_at: now }, ...notes]);
      toast.success('Note created!');
    }
    setNoteDialogOpen(false);
  };

  const deleteNote = (noteId: string) => { saveNotes(notes.filter(n => n.id !== noteId)); setViewingNote(null); toast.success('Note deleted'); };
  const toggleSaveNote = (noteId: string) => { saveNotes(notes.map(n => n.id === noteId ? { ...n, saved: !n.saved } : n)); };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'saved') return matchesSearch && n.saved;
    if (activeTab === 'folders' && selectedFolder) { const folder = folders.find(f => f.id === selectedFolder); return matchesSearch && n.folder === folder?.name; }
    return matchesSearch;
  });

  if (viewingNote) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setViewingNote(null)}><ArrowLeft className="w-4 h-4" /></Button>
              <CardTitle className="text-lg">{viewingNote.title}</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => toggleSaveNote(viewingNote.id)}>{viewingNote.saved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}</Button>
              <Button variant="ghost" size="icon" onClick={() => { setViewingNote(null); openNoteDialog(viewingNote); }}><Edit2 className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteNote(viewingNote.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {viewingNote.folder && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{viewingNote.folder}</span>}
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{viewingNote.content || 'No content'}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setSelectedFolder(null); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all"><StickyNote className="w-4 h-4 mr-1.5" />All</TabsTrigger>
          <TabsTrigger value="folders"><Folder className="w-4 h-4 mr-1.5" />Folders</TabsTrigger>
          <TabsTrigger value="saved"><Bookmark className="w-4 h-4 mr-1.5" />Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button onClick={() => openNoteDialog()}><Plus className="w-4 h-4 mr-1" />New Note</Button></div>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No notes yet</p></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredNotes.map(note => (
                <Card key={note.id} className="cursor-pointer hover:border-primary/50" onClick={() => setViewingNote(note)}>
                  <CardHeader className="p-3 pb-2"><CardTitle className="text-sm line-clamp-1">{note.title}</CardTitle></CardHeader>
                  <CardContent className="p-3 pt-0"><p className="text-xs text-muted-foreground line-clamp-3">{note.content || 'No content'}</p></CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="folders" className="mt-4 space-y-4">
          {!selectedFolder ? (
            <>
              <div className="flex justify-end">
                <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><FolderPlus className="w-4 h-4 mr-1" />New Folder</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Create Folder</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4"><Input placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createFolder()} /><Button onClick={createFolder} className="w-full">Create</Button></div>
                  </DialogContent>
                </Dialog>
              </div>
              {folders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Folder className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No folders yet</p></div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {folders.map(folder => (
                    <Card key={folder.id} className="cursor-pointer hover:border-primary/50" onClick={() => setSelectedFolder(folder.id)}>
                      <CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Folder className="w-5 h-5 text-primary" /><span className="font-medium">{folder.name}</span></div><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}><Trash2 className="w-3 h-3" /></Button></div><p className="text-xs text-muted-foreground mt-1">{notes.filter(n => n.folder === folder.name).length} notes</p></CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                <Button size="sm" onClick={() => openNoteDialog()}><Plus className="w-4 h-4 mr-1" />Add Note</Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">{filteredNotes.map(note => (<Card key={note.id} className="cursor-pointer hover:border-primary/50" onClick={() => setViewingNote(note)}><CardHeader className="p-3"><CardTitle className="text-sm">{note.title}</CardTitle></CardHeader></Card>))}</div>
            </>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          {filteredNotes.length === 0 ? (<div className="text-center py-12 text-muted-foreground"><Bookmark className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No saved notes</p></div>) : (<div className="grid gap-3 sm:grid-cols-2">{filteredNotes.map(note => (<Card key={note.id} className="cursor-pointer hover:border-primary/50" onClick={() => setViewingNote(note)}><CardHeader className="p-3"><CardTitle className="text-sm">{note.title}</CardTitle></CardHeader></Card>))}</div>)}
        </TabsContent>
      </Tabs>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="Note title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
            <textarea placeholder="Write your note..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} className="w-full min-h-[200px] p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
            {folders.length > 0 && (<select value={noteFolder} onChange={(e) => setNoteFolder(e.target.value)} className="h-9 px-3 rounded-md border bg-background text-sm w-full"><option value="">No folder</option>{folders.map(f => (<option key={f.id} value={f.name}>{f.name}</option>))}</select>)}
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setNoteDialogOpen(false)}>Cancel</Button><Button className="flex-1" onClick={saveNote}>{editingNote ? 'Update' : 'Create'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
