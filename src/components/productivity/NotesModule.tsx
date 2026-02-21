import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Search, Folder, FolderPlus, StickyNote, Trash2, Edit2, Bookmark, BookmarkCheck, ArrowLeft, Pin, PinOff, MoreHorizontal, Clock } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { NotesAnalytics } from './NotesAnalytics';
import { EmptyNotes, EmptySaved, EmptyFolders } from '@/components/EmptyStates';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Note { id: string; title: string; content: string; folder?: string; pinned?: boolean; saved?: boolean; created_at: string; updated_at: string; color?: string; }
interface NoteFolder { id: string; name: string; color?: string; }

const NOTES_KEY = 'lumatha_notes_v2';
const FOLDERS_KEY = 'lumatha_note_folders_v2';

const FOLDER_COLORS = [
  { name: 'Blue', class: 'accent-card-primary', dot: 'bg-blue-400' },
  { name: 'Teal', class: 'accent-card-teal', dot: 'bg-teal-400' },
  { name: 'Violet', class: 'accent-card-violet', dot: 'bg-violet-400' },
  { name: 'Coral', class: 'accent-card-coral', dot: 'bg-orange-400' },
  { name: 'Amber', class: 'accent-card-amber', dot: 'bg-amber-400' },
  { name: 'Rose', class: 'accent-card-rose', dot: 'bg-rose-400' },
  { name: 'Mint', class: 'accent-card-mint', dot: 'bg-emerald-400' },
];

const NOTE_COLORS = [
  { name: 'Default', class: '' },
  { name: 'Warm', class: 'accent-card-coral' },
  { name: 'Cool', class: 'accent-card-teal' },
  { name: 'Purple', class: 'accent-card-violet' },
  { name: 'Golden', class: 'accent-card-amber' },
];

export function NotesModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'folders' | 'saved' | 'analytics'>('all');
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
  const [noteColor, setNoteColor] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('accent-card-primary');

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
    saveFolders([...folders, { id: `folder-${Date.now()}`, name: newFolderName.trim(), color: newFolderColor }]);
    setNewFolderName(''); setNewFolderColor('accent-card-primary'); setFolderDialogOpen(false);
    toast.success('Folder created!');
  };

  const deleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    saveFolders(folders.filter(f => f.id !== folderId));
    if (folder) saveNotes(notes.map(n => n.folder === folder.name ? { ...n, folder: '' } : n));
    if (selectedFolder === folderId) setSelectedFolder(null);
    toast.success('Folder deleted');
  };

  const togglePin = (noteId: string) => {
    saveNotes(notes.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n));
  };

  const openNoteDialog = (note?: Note) => {
    if (note) { setEditingNote(note); setNoteTitle(note.title); setNoteContent(note.content); setNoteFolder(note.folder || ''); setNoteColor(note.color || ''); }
    else { setEditingNote(null); setNoteTitle(''); setNoteContent(''); setNoteColor(''); setNoteFolder(selectedFolder ? folders.find(f => f.id === selectedFolder)?.name || '' : ''); }
    setNoteDialogOpen(true);
  };

  const saveNote = () => {
    if (!noteTitle.trim()) { toast.error('Title required'); return; }
    const now = new Date().toISOString();
    if (editingNote) {
      saveNotes(notes.map(n => n.id === editingNote.id ? { ...n, title: noteTitle, content: noteContent, folder: noteFolder, color: noteColor, updated_at: now } : n));
      toast.success('Note updated!');
    } else {
      saveNotes([{ id: `note-${Date.now()}`, title: noteTitle, content: noteContent, folder: noteFolder, color: noteColor, created_at: now, updated_at: now }, ...notes]);
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
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const getPreviewText = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (viewingNote) {
    return (
      <div className="animate-fade-in space-y-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 glass-card rounded-t-2xl border-b border-border/30">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingNote(null)}><ArrowLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-muted-foreground">{viewingNote.folder || 'Uncategorized'}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePin(viewingNote.id)}>
              {viewingNote.pinned ? <PinOff className="w-4 h-4 text-primary" /> : <Pin className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSaveNote(viewingNote.id)}>
              {viewingNote.saved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewingNote(null); openNoteDialog(viewingNote); }}><Edit2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteNote(viewingNote.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
        
        {/* Note content */}
        <Card className={cn("rounded-t-none border-t-0", viewingNote.color)}>
          <CardContent className="p-4 space-y-3">
            <h1 className="text-xl font-bold">{viewingNote.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Edited {getRelativeTime(viewingNote.updated_at)}</span>
            </div>
            <div className="h-px bg-border/30" />
            <div
              className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs"
              dangerouslySetInnerHTML={{ __html: viewingNote.content || '<p class="text-muted-foreground italic">Start writing...</p>' }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 page-enter">
      {/* Search with gradient accent */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl h-10 bg-muted/30 border-border/40 focus:border-primary/50" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setSelectedFolder(null); }}>
        <TabsList className="grid w-full grid-cols-4 rounded-xl h-10">
          <TabsTrigger value="all" className="rounded-lg gap-1.5 text-xs"><StickyNote className="w-3.5 h-3.5" />All</TabsTrigger>
          <TabsTrigger value="folders" className="rounded-lg gap-1.5 text-xs"><Folder className="w-3.5 h-3.5" />Folders</TabsTrigger>
          <TabsTrigger value="saved" className="rounded-lg gap-1.5 text-xs"><Bookmark className="w-3.5 h-3.5" />Saved</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg gap-1.5 text-xs">📊 Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openNoteDialog()} className="gap-1.5 rounded-xl btn-cosmic text-sm h-9">
              <Plus className="w-4 h-4" />New Note
            </Button>
          </div>
          {filteredNotes.length === 0 ? <EmptyNotes /> : (
            <div className="grid gap-2.5 sm:grid-cols-2 animate-stagger">
              {filteredNotes.map(note => (
                <Card
                  key={note.id}
                  className={cn(
                    "cursor-pointer hover-lift rounded-2xl border group relative overflow-hidden",
                    note.color || "hover:border-primary/40"
                  )}
                  onClick={() => setViewingNote(note)}
                >
                  {note.pinned && (
                    <div className="absolute top-2 right-2">
                      <Pin className="w-3 h-3 text-primary rotate-45" />
                    </div>
                  )}
                  <CardHeader className="p-3 pb-1.5">
                    <CardTitle className="text-sm line-clamp-1 pr-5">{note.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-1.5">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{getPreviewText(note.content) || 'No content'}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground/60">{getRelativeTime(note.updated_at)}</span>
                      {note.folder && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">{note.folder}</span>}
                    </div>
                  </CardContent>
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
                  <DialogTrigger asChild><Button size="sm" className="gap-1.5 rounded-xl"><FolderPlus className="w-4 h-4" />New Folder</Button></DialogTrigger>
                  <DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Create Folder</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createFolder()} className="rounded-xl" />
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {FOLDER_COLORS.map(c => (
                            <button key={c.name} onClick={() => setNewFolderColor(c.class)} className={cn("w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center", newFolderColor === c.class ? 'border-primary scale-110' : 'border-transparent')}>
                              <div className={cn("w-5 h-5 rounded-md", c.dot)} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button onClick={createFolder} className="w-full rounded-xl">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {folders.length === 0 ? <EmptyFolders /> : (
                <div className="grid gap-2.5 sm:grid-cols-2 animate-stagger">
                  {folders.map(folder => (
                    <Card key={folder.id} className={cn("cursor-pointer hover-lift rounded-2xl border", folder.color || 'accent-card-primary')} onClick={() => setSelectedFolder(folder.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-background/40 backdrop-blur flex items-center justify-center">
                              <Folder className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <span className="font-semibold text-sm">{folder.name}</span>
                              <p className="text-[10px] text-muted-foreground">{notes.filter(n => n.folder === folder.name).length} notes</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}>
                                <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setSelectedFolder(null)} className="gap-1"><ArrowLeft className="w-4 h-4" />Back</Button>
                <Button size="sm" onClick={() => openNoteDialog()} className="gap-1 rounded-xl"><Plus className="w-4 h-4" />Add Note</Button>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 animate-stagger">
                {filteredNotes.map(note => (
                  <Card key={note.id} className={cn("cursor-pointer hover-lift rounded-2xl", note.color)} onClick={() => setViewingNote(note)}>
                    <CardHeader className="p-3"><CardTitle className="text-sm">{note.title}</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-0"><p className="text-xs text-muted-foreground line-clamp-2">{getPreviewText(note.content)}</p></CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          {filteredNotes.length === 0 ? <EmptySaved /> : (
            <div className="grid gap-2.5 sm:grid-cols-2 animate-stagger">
              {filteredNotes.map(note => (
                <Card key={note.id} className={cn("cursor-pointer hover-lift rounded-2xl", note.color)} onClick={() => setViewingNote(note)}>
                  <CardHeader className="p-3 pb-1"><CardTitle className="text-sm">{note.title}</CardTitle></CardHeader>
                  <CardContent className="p-3 pt-0"><p className="text-xs text-muted-foreground line-clamp-2">{getPreviewText(note.content)}</p></CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <NotesAnalytics />
        </TabsContent>
      </Tabs>

      {/* Note Editor Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="Note title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="rounded-xl text-base font-medium h-11" />
            <RichTextEditor value={noteContent} onChange={setNoteContent} placeholder="Write your note..." />
            {/* Note color picker */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Color</label>
              <div className="flex gap-2">
                {NOTE_COLORS.map(c => (
                  <button key={c.name} onClick={() => setNoteColor(c.class)} className={cn("px-3 py-1.5 rounded-lg text-xs border transition-all", noteColor === c.class ? 'border-primary bg-primary/10' : 'border-border/40')}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            {folders.length > 0 && (
              <select value={noteFolder} onChange={(e) => setNoteFolder(e.target.value)} className="h-9 px-3 rounded-xl border bg-background text-sm w-full">
                <option value="">No folder</option>
                {folders.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl btn-cosmic" onClick={saveNote}>{editingNote ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
