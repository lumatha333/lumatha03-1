import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNotes } from '../../context/NotesContext';
import { LumaNote } from '../../types';
import { parseNoteForEditor, serializeEditorToNote } from './editorUtils';
import { AddPanel } from './AddPanel';
import { BottomToolbar } from './BottomToolbar';
import { ColorPanel } from './ColorPanel';
import { DrawingSheet } from './DrawingSheet';
import { EditorBody } from './EditorBody';
import { MenuSheet } from './MenuSheet';
import { TopBar } from './TopBar';
import { EditorMediaItem, EditorTypography } from './types';
import { TypographyPanel } from './TypographyPanel';
import { useNoteEditorState } from '../../hooks/useNoteEditorState';
import { uploadNoteMedia } from '../../utils/supabaseUpload';

interface EditorScreenProps {
  noteId: string;
  onClose: () => void;
}

const SWIPE_THRESHOLD = 70;
const THEME_BACKGROUNDS: Record<LumaNote['theme'], string> = {
  deepNavy: '#070B14',
  purpleMist: '#150C2A',
  warmDark: '#221707',
  pureBlack: '#000000',
  midnightGreen: '#0B1B12',
  roseDark: '#2A0F1A',
  oceanBlue: '#0A132A',
  ember: '#221707',
  forest: '#0B1B12',
  slate: '#F5F3EB',
};

export const EditorScreen: React.FC<EditorScreenProps> = ({ noteId, onClose }) => {
  const { notes, getNote, updateNote, deleteNote, addNote } = useNotes();
  const note = getNote(noteId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<EditorMediaItem[]>([]);
  const [textColor, setTextColor] = useState('#E6E9F2');
  const [backgroundColor, setBackgroundColor] = useState('#070B14');
  const [typography, setTypography] = useState<EditorTypography>({ size: 'base', bold: false, italic: false, underline: false });
  const [holdPreview, setHoldPreview] = useState<LumaNote | null>(null);
  const [pendingMediaType, setPendingMediaType] = useState<EditorMediaItem['type'] | null>(null);
  const [drawingOpen, setDrawingOpen] = useState(false);
  const swipeStartXRef = useRef<number | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const { activePanel, setActivePanel, isSaving, triggerAutoSave, forceSave, haptic } = useNoteEditorState();

  const sortedNotes = useMemo(
    () => [...notes].filter((n) => !n.isArchived).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [notes]
  );

  const currentIndex = useMemo(() => sortedNotes.findIndex((n) => n.id === noteId), [sortedNotes, noteId]);
  const canNavigate = sortedNotes.length > 1 && currentIndex >= 0;

  useEffect(() => {
    if (!note) return;
    const parsed = parseNoteForEditor(note);
    setTitle(parsed.title);
    setDescription(parsed.description);
    setMedia(parsed.media);
    setBackgroundColor(THEME_BACKGROUNDS[note.theme] ?? '#070B14');
  }, [note]);

  useEffect(() => {
    if (!note) return;
    triggerAutoSave(() => {
      const updates = serializeEditorToNote(note, title, description, media);
      updateNote(note.id, updates);
    });
  }, [note, title, description, media, updateNote, triggerAutoSave]);

  const saveNow = () => {
    forceSave(() => {
      const updates = serializeEditorToNote(note, title, description, media);
      updateNote(note.id, updates);
    });
    toast.success('Saved');
  };

  const moveTo = (target: LumaNote | undefined) => {
    if (!target) return;
    saveNow();
    window.dispatchEvent(new CustomEvent('lumatha:open-note', { detail: { noteId: target.id } }));
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (!canNavigate) return;
    const step = direction === 'prev' ? -1 : 1;
    const target = sortedNotes[(currentIndex + step + sortedNotes.length) % sortedNotes.length];
    moveTo(target);
    haptic();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!note) return;
      if (!(event.ctrlKey || event.metaKey)) return;

      const key = event.key.toLowerCase();
      if (key === 'b') {
        event.preventDefault();
        setTypography((current) => ({ ...current, bold: !current.bold }));
      } else if (key === 'h') {
        event.preventDefault();
        setTypography((current) => ({
          ...current,
          size: current.size === 'h1' ? 'h2' : current.size === 'h2' ? 'base' : 'h1',
        }));
      } else if (key === 'arrowleft') {
        event.preventDefault();
        navigate('prev');
      } else if (key === 'arrowright') {
        event.preventDefault();
        navigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, navigate]);

  const handleSwipe = (deltaX: number) => {
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    navigate(deltaX > 0 ? 'prev' : 'next');
  };

  const reorderMedia = (fromId: string, toId: string) => {
    const fromIndex = media.findIndex((m) => m.id === fromId);
    const toIndex = media.findIndex((m) => m.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...media];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setMedia(next);
  };

  const addMedia = (type: EditorMediaItem['type']) => {
    if (type === 'drawing') {
      setDrawingOpen(true);
      setActivePanel(null);
      return;
    }

    setPendingMediaType(type);
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
      mediaInputRef.current.click();
    }
  };

  const handleMediaSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !pendingMediaType) return;

    const isVideo = pendingMediaType === 'video';
    const isDrawing = pendingMediaType === 'drawing';
    const fileType = isVideo ? 'video' : 'image';

    try {
      toast.info('Adding media...');
      const url = await uploadNoteMedia(file, fileType);
      setMedia((prev) => [...prev, { id: crypto.randomUUID(), type: isDrawing ? 'drawing' : pendingMediaType, url }]);
      setActivePanel(null);
      toast.success(isVideo ? 'Video added' : isDrawing ? 'Drawing added' : 'Image added');
    } catch (error: any) {
      toast.error(error?.message || 'Could not add media');
    } finally {
      setPendingMediaType(null);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const handleDrawingSave = async (file: File) => {
    try {
      toast.info('Saving drawing...');
      const url = await uploadNoteMedia(file, 'image');
      setMedia((prev) => [...prev, { id: crypto.randomUUID(), type: 'drawing', url }]);
      setActivePanel(null);
      setDrawingOpen(false);
      toast.success('Drawing added');
    } catch (error: any) {
      toast.error(error?.message || 'Could not save drawing');
    }
  };

  const onDelete = () => {
    if (!window.confirm('Delete this note?')) return;
    deleteNote(note.id);
    onClose();
  };

  const onCopy = () => {
    const created = addNote();
    updateNote(created.id, serializeEditorToNote(created, `${title || 'Untitled'} (copy)`, description, media));
    toast.success('Copied');
    setActivePanel(null);
  };

  const onShare = async () => {
    const payload = `${title || 'Untitled'}\n\n${description}`;
    try {
      await navigator.clipboard.writeText(payload);
      toast.success('Copied for sharing');
    } catch {
      toast.error('Could not copy');
    }
    setActivePanel(null);
  };

  const onReminder = () => {
    toast.info('Reminder coming soon');
    setActivePanel(null);
  };

  const formatTimestamp = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'just now';
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const bodyStyle = {
    color: textColor,
    fontWeight: typography.bold ? 600 : 400,
    fontStyle: typography.italic ? 'italic' : 'normal',
    textDecoration: typography.underline ? 'underline' : 'none',
    fontSize: typography.size === 'h1' ? '24px' : typography.size === 'h2' ? '20px' : typography.size === 'sm' ? '14px' : '16px',
  } as const;

  const holdPreviewNote = (direction: 'prev' | 'next') => {
    if (!canNavigate) return;
    const step = direction === 'prev' ? -1 : 1;
    const target = sortedNotes[(currentIndex + step + sortedNotes.length) % sortedNotes.length];
    setHoldPreview(target);
  };

  if (!note) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
      style={{ backgroundColor }}
      onTouchStart={(e) => {
        const x = e.touches[0]?.clientX ?? 0;
        swipeStartXRef.current = x;
      }}
      onTouchEnd={(e) => {
        const start = swipeStartXRef.current ?? 0;
        const end = e.changedTouches[0]?.clientX ?? 0;
        handleSwipe(end - start);
        swipeStartXRef.current = null;
      }}
    >
      <input
        ref={mediaInputRef}
        type="file"
        accept={pendingMediaType === 'video' ? 'video/*' : 'image/*'}
        className="hidden"
        onChange={handleMediaSelected}
      />

      <TopBar
        onBack={() => {
          saveNow();
          onClose();
        }}
        onSave={saveNow}
        isSaving={isSaving}
      />

      <div className="flex-1 overflow-hidden">
        <EditorBody
          title={title}
          description={description}
          media={media}
          bodyStyle={bodyStyle}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onMediaReorder={reorderMedia}
        />
      </div>

      <BottomToolbar
        activePanel={activePanel}
        onTogglePanel={(panel) => setActivePanel(activePanel === panel ? null : panel)}
        onPrev={() => navigate('prev')}
        onNext={() => navigate('next')}
        canNavigate={canNavigate}
        onNavHoldStart={holdPreviewNote}
        onNavHoldEnd={() => setHoldPreview(null)}
        onMenuOpen={() => setActivePanel(activePanel === 'menu' ? null : 'menu')}
      />

      <AnimatePresence>
        {activePanel && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[72] bg-black/45 backdrop-blur-[2px]" onClick={() => setActivePanel(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {activePanel === 'add' && (
          <AddPanel onAddImage={() => addMedia('image')} onAddDrawing={() => addMedia('drawing')} onAddVideo={() => addMedia('video')} />
        )}
        {activePanel === 'color' && (
          <ColorPanel
            textColor={textColor}
            backgroundColor={backgroundColor}
            onTextColorChange={setTextColor}
            onBackgroundColorChange={setBackgroundColor}
            onThemeChange={(theme) => {
              updateNote(note.id, { theme });
              setBackgroundColor(THEME_BACKGROUNDS[theme] ?? '#070B14');
            }}
          />
        )}
        {activePanel === 'typography' && (
          <TypographyPanel typography={typography} onChange={setTypography} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'menu' && (
          <MenuSheet
            timestamp={formatTimestamp(note.updatedAt)}
            onDelete={onDelete}
            onCopy={onCopy}
            onShare={onShare}
            onPin={() => {
              updateNote(note.id, { isPinned: !note.isPinned });
              setActivePanel(null);
            }}
            onArchive={() => {
              updateNote(note.id, { isArchived: !note.isArchived });
              setActivePanel(null);
            }}
            onReminder={onReminder}
          />
        )}
      </AnimatePresence>

      <DrawingSheet
        open={drawingOpen}
        onClose={() => setDrawingOpen(false)}
        onSave={handleDrawingSave}
      />

      <AnimatePresence>
        {holdPreview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] w-[280px] rounded-2xl bg-[#0F1629]/95 border border-white/15 p-3"
          >
            <p className="text-xs text-[#8A90A2] mb-1">Preview</p>
            <p className="text-sm font-semibold text-[#E6E9F2] truncate">{holdPreview.title || 'Untitled'}</p>
            <p className="text-xs text-[#8A90A2] line-clamp-2 mt-1">{holdPreview.previewText || 'No content'}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
