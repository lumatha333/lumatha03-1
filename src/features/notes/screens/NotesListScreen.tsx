import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { isToday, isThisWeek } from 'date-fns';
import { useNotes } from '../context/NotesContext';
import { NoteCard } from '../components/NoteCard';
import { NoteEditorScreen } from './NoteEditorScreen';

type FilterTab = 'all' | 'pinned' | 'archived';

export const NotesListScreen: React.FC = () => {
  const { notes, addNote, deleteNote, updateNote } = useNotes();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  useEffect(() => {
    const openNote = (event: Event) => {
      const custom = event as CustomEvent<{ noteId?: string }>;
      if (custom.detail?.noteId) setEditingNoteId(custom.detail.noteId);
    };

    window.addEventListener('lumatha:open-note', openNote as EventListener);
    return () => window.removeEventListener('lumatha:open-note', openNote as EventListener);
  }, []);

  const filteredNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

    return sorted
      .filter((note) => {
        if (activeFilter === 'pinned') return note.isPinned && !note.isArchived;
        if (activeFilter === 'archived') return Boolean(note.isArchived);
        return !note.isArchived;
      })
      .filter((note) => {
        if (!searchQuery) return true;
        const target = `${note.title} ${note.previewText}`.toLowerCase();
        return target.includes(searchQuery.toLowerCase());
      });
  }, [notes, activeFilter, searchQuery]);

  const groups = useMemo(() => {
    const withDate = filteredNotes.map((note) => ({ note, updatedDate: new Date(note.updatedAt) }));
    const today = withDate.filter((item) => isToday(item.updatedDate)).map((item) => item.note);
    const thisWeek = withDate.filter((item) => !isToday(item.updatedDate) && isThisWeek(item.updatedDate)).map((item) => item.note);
    const earlier = withDate.filter((item) => !isToday(item.updatedDate) && !isThisWeek(item.updatedDate)).map((item) => item.note);
    return { today, thisWeek, earlier };
  }, [filteredNotes]);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pinned', label: 'Pinned' },
    { id: 'archived', label: 'Archived' },
  ];

  const renderSection = (title: string, items: typeof notes) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-6" key={title}>
        <h3 className="text-[12px] font-medium tracking-[0.22em] text-[#8A90A2] uppercase mb-3">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => setEditingNoteId(note.id)}
              onDelete={() => deleteNote(note.id)}
              onPin={() => updateNote(note.id, { isPinned: !note.isPinned })}
              onArchive={() => updateNote(note.id, { isArchived: !note.isArchived })}
              onCopy={() => {
                const created = addNote();
                updateNote(created.id, {
                  title: `${note.title || 'Untitled'} (copy)`,
                  blocks: note.blocks,
                  previewText: note.previewText,
                  wordCount: note.wordCount,
                  firstImageUrl: note.firstImageUrl,
                });
              }}
              onShare={async () => {
                try {
                  await navigator.clipboard.writeText(`${note.title}\n\n${note.previewText}`);
                } catch {
                  // no-op
                }
              }}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#070B14] text-[#E6E9F2]">
      <div className="px-5 pt-5 pb-4 space-y-4 shrink-0">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${activeFilter === tab.id ? 'bg-[#7B61FF] text-white' : 'bg-white/5 text-[#8A90A2] hover:text-[#E6E9F2]'}`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => {
              const n = addNote();
              setEditingNoteId(n.id);
            }}
            className="ml-auto w-9 h-9 rounded-full bg-[#7B61FF] flex items-center justify-center"
            aria-label="Create note"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>

        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A90A2]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes"
            className="w-full h-11 rounded-[14px] bg-[#0F1629] border border-white/10 pl-10 pr-3 text-[14px] text-[#E6E9F2] placeholder:text-[#8A90A2] outline-none focus:border-[#7B61FF]/70 focus:shadow-[0_0_0_4px_rgba(123,97,255,0.16)] transition-all"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {filteredNotes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-[#8A90A2] text-sm">
            {searchQuery ? 'No notes found' : 'No notes yet. Tap + to create one.'}
          </div>
        ) : (
          <>
            {renderSection('Today', groups.today)}
            {renderSection('This Week', groups.thisWeek)}
            {renderSection('Earlier', groups.earlier)}
          </>
        )}
      </div>

      <AnimatePresence>
        {editingNoteId && <NoteEditorScreen noteId={editingNoteId} onClose={() => setEditingNoteId(null)} />}
      </AnimatePresence>
    </div>
  );
};
