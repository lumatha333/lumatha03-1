import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Plus, Search, MoreVertical, Pin, Bell, Archive, Trash2, 
  Type, Image as ImageIcon, Video, Pencil, 
  Palette, MoreHorizontal, ChevronLeft, Share2, 
  Copy, X, Bold, Italic, Underline, 
  Heading1, Heading2, CaseSensitive, ChevronRight,
  Clock, Calendar, Trash, Star, Save, ArrowLeft, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

// --- DESIGN TOKENS (PIXEL PERFECT) ---
const TOKENS = {
  colors: {
    bg: '#070B14',
    card: '#0F1629',
    primary: '#7B61FF', // Primary Purple
    textPrimary: '#E6E9F2',
    textSecondary: '#8A90A2',
    glass: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  radius: '18px',
  spacing: '20px',
  animation: {
    duration: 0.28,
    curve: [0.2, 0.8, 0.2, 1], // Custom cubic-bezier
  }
};

const THEMES = [
  { id: 'dark', label: 'Default Dark', bg: '#070B14', text: '#E6E9F2', primary: '#7B61FF' },
  { id: 'black', label: 'Pure Black', bg: '#000000', text: '#FFFFFF', primary: '#FFFFFF' },
  { id: 'paper', label: 'Paper', bg: '#F5F5F7', text: '#1D1D1F', primary: '#007AFF' },
  { id: 'forest', label: 'Forest', bg: '#0A1A12', text: '#E2E8F0', primary: '#4ADE80' },
  { id: 'violet', label: 'Violet', bg: '#130B1A', text: '#F5F3FF', primary: '#C084FC' },
  { id: 'amber', label: 'Amber', bg: '#1A140B', text: '#FFFBEB', primary: '#FBBF24' },
];

// --- TYPES ---
interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'drawing';
  url: string;
}

interface Note {
  id: string;
  title: string;
  body: string;
  media: MediaItem[];
  pinned: boolean;
  saved: boolean;
  theme: string;
  fontSize: number;
  textColor: string;
  updatedAt: number;
}

// --- CORE COMPONENT ---
export function NotesSection() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pinned' | 'Saved'>('All');
  const [isSaving, setIsSaving] = useState(false);

  // Load Persistence
  useEffect(() => {
    const saved = localStorage.getItem('premium_notes_v2');
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  // Auto-Save Effect
  useEffect(() => {
    if (notes.length > 0) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        localStorage.setItem('premium_notes_v2', JSON.stringify(notes));
        setIsSaving(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [notes]);

  const activeNote = useMemo(() => notes.find(n => n.id === selectedId) || null, [notes, selectedId]);

  const handleCreate = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      body: '',
      media: [],
      pinned: false,
      saved: false,
      theme: 'dark',
      fontSize: 16,
      textColor: TOKENS.colors.textPrimary,
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setSelectedId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setSelectedId(null);
    toast.success('Note moved to Archive');
  };

  return (
    <div className="h-full w-full bg-[#070B14] text-[#E6E9F2] font-sans selection:bg-[#7B61FF]/30 overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!selectedId ? (
          <NotesListView 
            notes={notes}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelect={setSelectedId}
            onCreate={handleCreate}
          />
        ) : (
          <EditorView 
            note={activeNote!}
            isSaving={isSaving}
            onClose={() => setSelectedId(null)}
            onUpdate={(u) => updateNote(selectedId, u)}
            onDelete={() => deleteNote(selectedId)}
            onNext={() => {
              const idx = notes.findIndex(n => n.id === selectedId);
              if (idx < notes.length - 1) setSelectedId(notes[idx + 1].id);
            }}
            onPrev={() => {
              const idx = notes.findIndex(n => n.id === selectedId);
              if (idx > 0) setSelectedId(notes[idx - 1].id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- ðŸ§© LIST VIEW ---
function NotesListView({ notes, activeTab, setActiveTab, searchQuery, setSearchQuery, onSelect, onCreate }: any) {
  const filtered = notes.filter((n: Note) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.body.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'Pinned') return n.pinned && matchesSearch;
    if (activeTab === 'Saved') return n.saved && matchesSearch;
    return matchesSearch;
  });

  const sections = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    return [
      { label: 'TODAY', items: filtered.filter((n: Note) => now - n.updatedAt < day) },
      { label: 'THIS WEEK', items: filtered.filter((n: Note) => now - n.updatedAt >= day && now - n.updatedAt < day * 7) },
      { label: 'EARLIER', items: filtered.filter((n: Note) => now - n.updatedAt >= day * 7) },
    ].filter(s => s.items.length > 0);
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col p-5">
      <div className="mb-8 mt-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A90A2] group-focus-within:text-[#7B61FF] transition-colors" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes"
            className="w-full bg-[#0F1629] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B61FF]/20 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-8 mb-6 border-b border-white/5 px-2">
        {['All', 'Pinned', 'Saved'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-[#E6E9F2]' : 'text-[#8A90A2]'}`}
          >
            {tab}
            {activeTab === tab && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7B61FF]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-10 pb-32">
        {sections.map(s => (
          <div key={s.label}>
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#8A90A2] mb-4 opacity-50">{s.label}</h3>
            <div className="grid gap-3">
              {s.items.map((n: Note) => (
                <NoteCard key={n.id} note={n} onClick={() => onSelect(n.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={onCreate} className="fixed bottom-10 right-8 w-16 h-16 bg-[#7B61FF] rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-transform z-50">
        <Plus className="w-8 h-8 text-white" />
      </button>
    </motion.div>
  );
}

function NoteCard({ note, onClick }: { note: Note, onClick: () => void }) {
  return (
    <motion.div 
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="bg-[#0F1629] p-5 rounded-[18px] border border-white/5 relative group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-semibold text-base truncate pr-6">{note.title || 'Untitled'}</h4>
        <MoreVertical className="w-4 h-4 text-[#8A90A2] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm text-[#8A90A2] line-clamp-2 leading-relaxed mb-4">{note.body || 'No additional text'}</p>
      <div className="flex justify-between items-center text-[10px] font-medium text-[#8A90A2]/40">
        <span>{new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {note.pinned && <Pin className="w-3 h-3 text-[#7B61FF] fill-[#7B61FF]" />}
      </div>
    </motion.div>
  );
}

// --- ðŸ“ EDITOR VIEW ---
function EditorView({ note, isSaving, onClose, onUpdate, onDelete, onNext, onPrev }: any) {
  const [activePanel, setActivePanel] = useState<'add' | 'color' | 'typo' | 'menu' | null>(null);
  const theme = THEMES.find(t => t.id === note.theme) || THEMES[0];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [note.body]);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', ...TOKENS.animation }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/5 flex-shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/5 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
        
        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5">
          <button onClick={onPrev} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 rounded-full transition-all">Prev</button>
          <div className="w-[1px] h-3 bg-white/10 mx-1" />
          <button onClick={onNext} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 rounded-full transition-all">Next</button>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {isSaving && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-bold uppercase tracking-widest text-[#7B61FF]">Saving...</motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setActivePanel('menu')} className="p-2 -mr-2 hover:bg-white/5 rounded-full"><MoreVertical className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar">
        <input 
          value={note.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Untitled"
          className="w-full bg-transparent border-none text-2xl font-bold placeholder:opacity-20 mb-6 focus:outline-none"
        />

        {/* Media Row */}
        {note.media.length > 0 && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8 pb-2">
            <LayoutGroup>
              {note.media.map((m: MediaItem) => (
                <motion.div 
                  layout
                  key={m.id} 
                  className="min-w-[140px] h-32 rounded-2xl bg-white/5 border border-white/5 overflow-hidden flex-shrink-0 relative group"
                >
                  <img src={m.url} className="w-full h-full object-cover" alt="" />
                  <button 
                    onClick={() => onUpdate({ media: note.media.filter((item: MediaItem) => item.id !== m.id) })}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </motion.div>
              ))}
            </LayoutGroup>
          </div>
        )}

        <textarea 
          ref={textareaRef}
          value={note.body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          placeholder="Start writing..."
          style={{ fontSize: note.fontSize, color: note.textColor }}
          className="w-full bg-transparent border-none resize-none focus:outline-none placeholder:opacity-20 leading-relaxed min-h-[40vh]"
        />
      </div>

      {/* Floating Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-[60]">
        {/* Layered Typography Panel (Docks Above) */}
        <AnimatePresence>
          {activePanel === 'typo' && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-[#0F1629]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-6 shadow-2xl"
            >
              <button onClick={() => onUpdate({ fontSize: Math.max(12, note.fontSize - 2) })} className="p-2 opacity-60 hover:opacity-100">A-</button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button onClick={() => onUpdate({ fontSize: 24 })} className="text-lg font-bold">H1</button>
              <button onClick={() => onUpdate({ fontSize: 20 })} className="text-md font-bold">H2</button>
              <button onClick={() => onUpdate({ fontSize: 16 })} className="text-sm font-medium">Aa</button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button className="p-2 opacity-60"><Bold className="w-4 h-4" /></button>
              <button className="p-2 opacity-60"><Italic className="w-4 h-4" /></button>
              <button className="p-2 opacity-60"><Underline className="w-4 h-4" /></button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button onClick={() => setActivePanel(null)} className="p-1"><X className="w-4 h-4 text-[#F2565A]" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white/5 backdrop-blur-2xl rounded-[24px] px-6 py-4 flex items-center gap-8 border border-white/10 shadow-2xl">
          <button onClick={() => setActivePanel(activePanel === 'add' ? null : 'add')} className={`transition-colors ${activePanel === 'add' ? 'text-[#7B61FF]' : 'opacity-60'}`}><Plus className="w-6 h-6" /></button>
          <button onClick={() => setActivePanel(activePanel === 'color' ? null : 'color')} className={`transition-colors ${activePanel === 'color' ? 'text-[#7B61FF]' : 'opacity-60'}`}><Palette className="w-6 h-6" /></button>
          <button onClick={() => setActivePanel(activePanel === 'typo' ? null : 'typo')} className={`transition-colors ${activePanel === 'typo' ? 'text-[#7B61FF]' : 'opacity-60'}`}><Type className="w-6 h-6" /></button>
          <div className="flex gap-4 px-6 border-x border-white/10">
            <button onClick={onPrev} className="opacity-60 active:scale-90 transition-transform"><ArrowLeft className="w-5 h-5" /></button>
            <button onClick={onNext} className="opacity-60 active:scale-90 transition-transform"><ArrowRight className="w-5 h-5" /></button>
          </div>
          <button onClick={() => setActivePanel('menu')} className="opacity-60"><MoreHorizontal className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Panels (Slide Up) */}
      <AnimatePresence>
        {activePanel === 'add' && (
          <SlidePanel onClose={() => setActivePanel(null)}>
            <div className="grid grid-cols-3 gap-8 p-6">
              <PanelItem icon={ImageIcon} label="Image" onClick={() => {
                onUpdate({ media: [...note.media, { id: Date.now().toString(), type: 'image', url: 'https://picsum.photos/800/600?random=' + Math.random() }] });
                setActivePanel(null);
              }} />
              <PanelItem icon={Pencil} label="Drawing" onClick={() => setActivePanel(null)} />
              <PanelItem icon={Video} label="Video" onClick={() => setActivePanel(null)} />
            </div>
          </SlidePanel>
        )}
        {activePanel === 'color' && (
          <SlidePanel onClose={() => setActivePanel(null)}>
            <div className="p-6 space-y-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold tracking-[0.2em] opacity-40 uppercase">Themes</h4>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => onUpdate({ theme: t.id })}
                      className={`p-4 rounded-2xl border-2 transition-all text-[11px] font-bold ${note.theme === t.id ? 'border-[#7B61FF]' : 'border-white/5'}`}
                      style={{ backgroundColor: t.bg, color: t.text }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold tracking-[0.2em] opacity-40 uppercase">Text Color</h4>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {['#E6E9F2', '#7B61FF', '#4ADE80', '#FBBF24', '#F2565A', '#C084FC'].map(c => (
                    <button 
                      key={c}
                      onClick={() => onUpdate({ textColor: c })}
                      className={`min-w-[44px] h-11 rounded-full border-2 transition-all ${note.textColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </SlidePanel>
        )}
        {activePanel === 'menu' && (
          <SlidePanel onClose={() => setActivePanel(null)}>
            <div className="p-4 space-y-2">
              <MenuItem icon={Star} label={note.pinned ? "Unpin Note" : "Pin Note"} onClick={() => { onUpdate({ pinned: !note.pinned }); setActivePanel(null); }} />
              <MenuItem icon={Save} label={note.saved ? "Unsave" : "Save to workspace"} onClick={() => { onUpdate({ saved: !note.saved }); setActivePanel(null); }} />
              <MenuItem icon={Copy} label="Make a copy" onClick={() => { /* duplicate logic */ setActivePanel(null); }} />
              <MenuItem icon={Share2} label="Share" onClick={() => setActivePanel(null)} />
              <div className="pt-4 mt-2 border-t border-white/5">
                <MenuItem icon={Trash2} label="Delete" color="#F2565A" onClick={onDelete} />
              </div>
              <div className="text-[10px] text-center pt-6 opacity-20 font-bold uppercase tracking-widest">
                Written at: {new Date(note.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          </SlidePanel>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- ðŸ›  UI HELPERS ---
function SlidePanel({ children, onClose }: any) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]" />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 bg-[#0F1629] border-t border-white/10 rounded-t-[32px] z-[80] pb-12 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />
        {children}
      </motion.div>
    </>
  );
}

function PanelItem({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 active:scale-95 transition-transform group">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-[#7B61FF]/10 group-hover:border-[#7B61FF]/30 transition-all">
        <Icon className="w-7 h-7" />
      </div>
      <span className="text-[10px] font-bold tracking-[0.1em] uppercase opacity-40">{label}</span>
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick, color }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-5 px-6 py-4 hover:bg-white/5 rounded-2xl transition-all group">
      <Icon className="w-5 h-5" style={{ color: color || 'inherit' }} />
      <span className="text-sm font-semibold flex-1 text-left" style={{ color: color || 'inherit' }}>{label}</span>
      <ChevronRight className="w-4 h-4 opacity-10 group-hover:opacity-30" />
    </button>
  );
}

