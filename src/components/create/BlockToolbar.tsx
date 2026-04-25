import { motion, AnimatePresence } from 'framer-motion';
import { Type, Image, Film, MapPin, BarChart3, Link2, Plus } from 'lucide-react';
import { BlockType } from './ContentBlock';
import { useState } from 'react';

interface BlockToolbarProps {
  onAddBlock: (type: BlockType) => void;
}

const BLOCK_OPTIONS: { type: BlockType; icon: typeof Type; label: string; bg: string }[] = [
  { type: 'text', icon: Type, label: 'Text', bg: 'linear-gradient(135deg, #1D4ED8, #3B82F6)' },
  { type: 'image', icon: Image, label: 'Image', bg: 'linear-gradient(135deg, #BE185D, #7C3AED)' },
  { type: 'video', icon: Film, label: 'Video', bg: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' },
  { type: 'poll', icon: BarChart3, label: 'Poll', bg: 'linear-gradient(135deg, #B45309, #D97706)' },
  { type: 'location', icon: MapPin, label: 'Location', bg: 'linear-gradient(135deg, #059669, #14b8a6)' },
  { type: 'link', icon: Link2, label: 'Link', bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
];

export default function BlockToolbar({ onAddBlock }: BlockToolbarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all duration-200"
        style={{
          border: '2px dashed #374151',
          color: '#94A3B8',
        }}
      >
        <Plus className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-45' : ''}`} />
        <span className="text-sm font-semibold">Add Block</span>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-2 grid grid-cols-3 sm:grid-cols-6 gap-2"
          >
            {BLOCK_OPTIONS.map((opt, i) => {
              const Icon = opt.icon;
              return (
                <motion.button
                  key={opt.type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { onAddBlock(opt.type); setExpanded(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 group"
                  style={{ background: '#111827', border: '1px solid #1f2937' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                    style={{ background: opt.bg }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: '#94A3B8' }}>{opt.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
