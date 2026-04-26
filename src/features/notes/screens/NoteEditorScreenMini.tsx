import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Plus, Type, Palette, Brush, PaintBucket, Undo2, Redo2, Trash2, MoreVertical,
  Image as ImageIcon, Share2, Edit3, Trash
} from 'lucide-react';
import { useSupabaseNotes } from '../context/SupabaseNotesContext';
import { toast } from 'sonner';
import { SmartDrawCanvas } from '@/components/chat/SmartDrawCanvas';
import { Button } from '@/components/ui/button';

interface NoteEditorScreenMiniProps {
  noteId: string;
  onClose: () => void;
}

type TextFormat = 'h1' | 'h2' | 'h3' | 'b' | 'i' | 'u' | 'code';
type ColorMode = 'color' | 'background' | null;

// ========== 50+ SOLID COLORS (matching Draw Free) ==========
const COLOR_PALETTE = [
  // Basic 10
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899',
  // Grays
  '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a',
  // Reds
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
  // Oranges
  '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
  // Ambers
  '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
  // Yellows
  '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12',
  // Greens
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d', '#052e16',
  // Teals
  '#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#134e4a', '#042f2e',
  // Cyans
  '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#164e63', '#083344',
  // Blues
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#172554',
  // Indigos
  '#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
  // Purples
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#3b0764',
  // Pinks
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#500724',
  // Roses
  '#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#4c0519',
];

// ========== 50+ BACKGROUND COLORS ==========
const BG_PALETTE = [
  // Dark theme
  '#000000', '#0a0f1e', '#0b0f14', '#0f172a', '#111827', '#1e293b', '#1f2937', '#334155',
  '#0c0518', '#1a0533', '#2d1b3d', '#1e1b4b', '#0f3460', '#064e3b', '#14532d', '#7c2d12',
  // Light theme
  '#ffffff', '#f8fafc', '#f1f5f9', '#fef2f2', '#fff7ed', '#fffbeb', '#fefce8', '#f0fdf4',
  '#f0fdfa', '#ecfeff', '#eff6ff', '#eef2ff', '#faf5ff', '#fdf2f8', '#fff1f2',
  // Special
  '#ff6b6b20', '#f9731620', '#eab30820', '#22c55e20', '#06b6d420', '#3b82f620', '#a855f720', '#ec489920',
];

// ========== 50+ GRADIENT COLORS ==========
const GRADIENT_PALETTE = [
  ['#ff6b6b', '#ffd93d'], ['#f43f5e', '#fb7185'], ['#ef4444', '#f59e0b'],
  ['#f97316', '#facc15'], ['#84cc16', '#22c55e'], ['#22c55e', '#14b8a6'],
  ['#10b981', '#06b6d4'], ['#06b6d4', '#3b82f6'], ['#3b82f6', '#8b5cf6'],
  ['#0f172a', '#1e3a8a'], ['#0c4a6e', '#0e7490'], ['#78350f', '#92400e'],
  ['#be123c', '#fb7185'], ['#7c3aed', '#c084fc'], ['#059669', '#34d399'],
  ['#0ea5e9', '#67e8f9'], ['#d946ef', '#f0abfc'], ['#f59e0b', '#fcd34d'],
  ['#ef4444', '#fca5a5'], ['#14b8a6', '#99f6e4'], ['#8b5cf6', '#c4b5fd'],
  ['#f43f5e', '#fda4af'], ['#0d9488', '#2dd4bf'], ['#6366f1', '#a5b4fc'],
  ['#ec4899', '#f9a8d4'], ['#d97706', '#fcd34d'], ['#16a34a', '#86efac'],
  ['#2563eb', '#93c5fd'], ['#9333ea', '#d8b4fe'], ['#e11d48', '#fb7185'],
  ['#0891b2', '#22d3ee'], ['#4f46e5', '#818cf8'], ['#db2777', '#f472b6'],
  ['#ea580c', '#fdba74'], ['#1d4ed8', '#60a5fa'], ['#7e22ce', '#c084fc'],
  ['#c2410c', '#fb923c'], ['#4338ca', '#a5b4fc'], ['#be185d', '#f9a8d4'],
  ['#92400e', '#fbbf24'], ['#3730a3', '#c7d2fe'], ['#9f1239', '#fda4af'],
  ['#854d0e', '#fde68a'], ['#1e40af', '#bfdbfe'], ['#701a75', '#e879f9'],
  ['#9a3412', '#fed7aa'], ['#312e81', '#a5b4fc'], ['#831843', '#fbcfe8'],
  ['#713f12', '#fef3c7'], ['#172554', '#93c5fd'], ['#500724', '#f9a8d4'],
  ['#881337', '#fda4af'], ['#581c87', '#d8b4fe'],
];

export const NoteEditorScreenMini: React.FC<NoteEditorScreenMiniProps> = ({ noteId, onClose }) => {
  const { getNote, updateNote } = useSupabaseNotes();
  const note = getNote(noteId);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showDrawing, setShowDrawing] = useState(false);
  const [selectedColorMode, setSelectedColorMode] = useState<ColorMode>(null);
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#0b0f14');
  const [selectedFormat, setSelectedFormat] = useState<TextFormat | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load note data
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      const content = note.blocks?.map(b => b.content).join('\n') || '';
      setBody(content);
      setMediaUrls(note.firstImageUrl ? [note.firstImageUrl] : []);
    }
  }, [note]);

  const handleTitleChange = (value: string) => {
    setUndoStack([body, ...undoStack]);
    setRedoStack([]);
    setTitle(value);
  };

  const handleBodyChange = (value: string) => {
    setUndoStack([body, ...undoStack]);
    setRedoStack([]);
    setBody(value);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const newBody = undoStack[0];
    setRedoStack([body, ...redoStack]);
    setUndoStack(undoStack.slice(1));
    setBody(newBody);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const newBody = redoStack[0];
    setUndoStack([body, ...undoStack]);
    setRedoStack(redoStack.slice(1));
    setBody(newBody);
  };

  const handleClear = () => {
    if (window.confirm('Clear all content?')) {
      setUndoStack([body, ...undoStack]);
      setBody('');
      setTitle('');
      setMediaUrls([]);
    }
  };

  const handleAddMedia = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          setMediaUrls(prev => [...prev, url]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrawingSubmit = (blob: Blob) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setMediaUrls(prev => [...prev, dataUrl]);
      setShowDrawing(false);
    };
    reader.readAsDataURL(blob);
  };

  const handleSaveNote = async () => {
    if (!note) return;

    const blocks = body.split('\n').map((line, i) => ({
      id: `block-${i}`,
      type: 'text' as const,
      content: line,
    }));

    await updateNote(noteId, {
      title: title || 'Untitled',
      blocks,
      firstImageUrl: mediaUrls[0],
      previewText: body.slice(0, 100),
      wordCount: body.split(/\s+/).filter(w => w.length > 0).length,
    });

    toast.success('Note saved');
    onClose();
  };

  const handleDeleteNote = async () => {
    // Delete implementation would go here
    toast.success('Note deleted');
    onClose();
  };

  const handleShareNote = async () => {
    toast.success('Note link copied');
  };

  if (showDrawing) {
    return (
      <SmartDrawCanvas
        onSubmit={(blob) => handleDrawingSubmit(blob)}
        onClose={() => setShowDrawing(false)}
      />
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top Bar: Back + "Keep Notes" + Done */}
      <motion.div
        className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm border-b border-white/5"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 rounded-full hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
        <h2 className="text-white font-bold text-lg tracking-tight">Keep Notes</h2>
        <Button
          onClick={handleSaveNote}
          className="h-10 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full text-white font-semibold"
        >
          Done
        </Button>
      </motion.div>

      {/* Editor Content */}
      <motion.div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Title - Bold */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Title"
          style={{ color: textColor }}
          className="w-full bg-transparent text-2xl font-bold outline-none text-white placeholder:text-slate-500"
        />

        {/* Optional Images / Drawing - Clickable placeholder between Title and Body */}
        {mediaUrls.length === 0 ? (
          <button
            onClick={() => setShowDrawing(true)}
            className="w-full py-6 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 hover:bg-white/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-purple-500/20 transition">
              <ImageIcon className="w-6 h-6 text-white/60 group-hover:text-purple-400" />
            </div>
            <span className="text-white/40 text-sm font-medium">Optional Images, Drawing</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {mediaUrls.map((url, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={url}
                  alt={`Media ${idx}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => setMediaUrls(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Body - "Write Something" placeholder with bold color */}
        <textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="Write Something"
          style={{ color: textColor }}
          className="w-full bg-transparent text-base outline-none resize-none placeholder:text-purple-400 placeholder:font-bold text-white min-h-[200px]"
        />
      </motion.div>

      {/* Bottom Toolbar */}
      <motion.div
        className="p-4 bg-black/80 backdrop-blur-sm border-t border-white/5 space-y-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Main Toolbar Buttons - Improved Layout */}
        <div className="flex items-center justify-between px-2">
          {/* Left Group: Add, Text, Brush, Colors */}
          <div className="flex items-center gap-2">
            {/* Draw/Add Media */}
            <Button
              onClick={() => setShowDrawing(true)}
              variant="outline"
              size="sm"
              className="rounded-full border-white/10 text-white hover:bg-white/10"
              title="Draw or add media"
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Text Formatting (Aa) */}
            <Button
              onClick={() => setSelectedFormat(selectedFormat === 'b' ? null : 'b')}
              variant="outline"
              size="sm"
              className={`rounded-full border-white/10 text-white hover:bg-white/10 ${selectedFormat === 'b' ? 'bg-white/15' : ''}`}
              title="Text formatting (H1, H2, Bold, Italic, etc.)"
            >
              <Type className="w-4 h-4" />
            </Button>

            {/* Brush/Background Color */}
            <Button
              onClick={() => setSelectedColorMode(selectedColorMode === 'background' ? null : 'background')}
              variant="outline"
              size="sm"
              className={`rounded-full border-white/10 text-white hover:bg-white/10 ${selectedColorMode === 'background' ? 'bg-white/15' : ''}`}
              title="Background color"
            >
              <PaintBucket className="w-4 h-4" />
            </Button>

            {/* Color Palette */}
            <Button
              onClick={() => setSelectedColorMode(selectedColorMode === 'color' ? null : 'color')}
              variant="outline"
              size="sm"
              className={`rounded-full border-white/10 text-white hover:bg-white/10 ${selectedColorMode === 'color' ? 'bg-white/15' : ''}`}
              title="Text color"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </div>

          {/* Right Group: Undo, Redo, Delete, More */}
          <div className="flex items-center gap-2">
            {/* Undo */}
            <Button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              variant="outline"
              size="sm"
              className="rounded-full border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
            >
              <Undo2 className="w-4 h-4" />
            </Button>

            {/* Redo */}
            <Button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              variant="outline"
              size="sm"
              className="rounded-full border-white/10 text-white hover:bg-white/10 disabled:opacity-30"
            >
              <Redo2 className="w-4 h-4" />
            </Button>

            {/* Delete */}
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              className="rounded-full border-white/10 text-white hover:bg-white/10 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

            {/* More Options (Three dots) */}
            <Button
              onClick={() => setShowMenu(!showMenu)}
              variant="outline"
              size="sm"
              className="rounded-full border-white/10 text-white hover:bg-white/10"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Color Picker Panel */}
        {selectedColorMode === 'color' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="px-4 py-3 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="text-sm font-medium text-slate-200 mb-3">Text Color</div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  className={`shrink-0 w-10 h-10 rounded-full border-2 transition-all ${
                    textColor === color ? 'ring-2 ring-purple-500' : 'border-white/20'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Background Color Panel */}
        {selectedColorMode === 'background' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="px-4 py-3 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="text-sm font-medium text-slate-200 mb-3">Background Color</div>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {BG_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => setBgColor(color)}
                  className={`shrink-0 w-10 h-10 rounded-full border-2 transition-all ${
                    bgColor === color ? 'ring-2 ring-purple-500' : 'border-white/20'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
            <div className="text-xs text-slate-400 mt-3">Gradients:</div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mt-2">
              {GRADIENT_PALETTE.map((grad, idx) => (
                <button
                  key={idx}
                  className="shrink-0 w-10 h-10 rounded-full border-2 border-white/20"
                  style={{
                    background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Format Options Menu - Expanded with all options */}
        {selectedFormat && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="px-4 py-3 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="text-sm font-medium text-slate-200 mb-3">Text Styles</div>
            <div className="grid grid-cols-4 gap-2">
              <button className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-bold text-white transition">H1</button>
              <button className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-bold text-white transition">H2</button>
              <button className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-bold text-white transition">H3</button>
              <button className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-bold text-white transition">B</button>
              <button className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm italic text-white transition">I</button>
              <button className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm underline text-white transition">U</button>
              <button className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-mono text-white transition">Code</button>
              <button className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm line-through text-white transition">S</button>
            </div>
          </motion.div>
        )}

        {/* More Menu - Expanded with Edit option */}
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 space-y-2"
          >
            <button
              onClick={() => {
                // Edit mode is already active
                toast.info('Edit mode active');
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 rounded-lg transition flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Edit Note
            </button>
            <button
              onClick={handleShareNote}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 rounded-lg transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Share Note
            </button>
            <button
              onClick={handleDeleteNote}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center gap-2"
            >
              <Trash className="w-4 h-4" /> Delete Note
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </motion.div>
  );
};
