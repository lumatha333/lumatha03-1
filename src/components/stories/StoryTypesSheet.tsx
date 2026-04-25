import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Pencil, Type, StickyNote, Music, X, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

// ============ TYPES ============
export type StoryContentType = 'camera' | 'draw' | 'text' | 'note' | 'voice';

export interface StoryTypeOption {
  id: StoryContentType;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  accent: string;
  features: string[];
}

export interface StoryTypesSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectType: (type: StoryContentType) => void;
  onCreateStory?: (type: StoryContentType, mood?: string) => void;
}

// ============ STORY TYPE CONFIGURATION ============
const STORY_TYPES: StoryTypeOption[] = [
  {
    id: 'camera',
    label: 'Camera',
    description: 'Photo or video story',
    icon: Camera,
    gradient: 'from-purple-500/20 to-indigo-600/20',
    accent: '#8b5cf6',
    features: ['Photos', 'Videos', 'Live'],
  },
  {
    id: 'draw',
    label: 'Draw Story',
    description: 'Express with sketches',
    icon: Pencil,
    gradient: 'from-pink-500/20 to-rose-600/20',
    accent: '#ec4899',
    features: ['Smart brush', 'AI assist', 'Stickers'],
  },
  {
    id: 'text',
    label: 'Text Mood',
    description: 'Write what you feel',
    icon: Type,
    gradient: 'from-blue-500/20 to-cyan-600/20',
    accent: '#3b82f6',
    features: ['Animations', 'Fonts', 'Colors'],
  },
  {
    id: 'note',
    label: 'Mini Note',
    description: 'Quick thoughts',
    icon: StickyNote,
    gradient: 'from-amber-500/20 to-yellow-600/20',
    accent: '#f59e0b',
    features: ['Simple', 'Fast', 'Pinned'],
  },
  {
    id: 'voice',
    label: 'Voice',
    description: 'Speak your mind',
    icon: Music,
    gradient: 'from-emerald-500/20 to-teal-600/20',
    accent: '#10b981',
    features: ['Recording', 'Effects', 'Transcript'],
  },
];

// ============ MOOD QUICK SELECT ============
const MOODS = [
  { id: 'calm', emoji: '😌', color: '#3b82f6' },
  { id: 'energetic', emoji: '⚡', color: '#f97316' },
  { id: 'happy', emoji: '🌞', color: '#eab308' },
  { id: 'creative', emoji: '🎨', color: '#a855f7' },
  { id: 'romantic', emoji: '💕', color: '#f43f5e' },
];

// ============ MAIN COMPONENT ============
export function StoryTypesSheet({
  open,
  onClose,
  onSelectType,
  onCreateStory,
}: StoryTypesSheetProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<StoryContentType | null>(null);

  const handleSelect = (type: StoryContentType) => {
    onSelectType(type);
    if (onCreateStory) {
      onCreateStory(type, selectedMood || undefined);
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-[#0a0f1e] rounded-t-[32px] border-t border-white/10 overflow-hidden"
        >
          {/* Handle */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-6" />

          {/* Header */}
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">Create Story</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <p className="text-white/50 text-sm">
              Choose how you want to share your moment
            </p>
          </div>

          {/* Mood Quick Selector */}
          <div className="px-6 mb-6">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
              How are you feeling?
            </p>
            <div className="flex gap-2">
              {MOODS.map((mood) => (
                <motion.button
                  key={mood.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all",
                    selectedMood === mood.id
                      ? "ring-2 ring-white scale-110"
                      : "bg-white/5 hover:bg-white/10"
                  )}
                  style={{
                    boxShadow: selectedMood === mood.id ? `0 0 20px ${mood.color}40` : 'none'
                  }}
                >
                  {mood.emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Story Types Grid */}
          <div className="px-6 pb-8">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
              Choose type
            </p>
            <div className="grid grid-cols-2 gap-3">
              {STORY_TYPES.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setHoveredType(type.id)}
                  onHoverEnd={() => setHoveredType(null)}
                  onClick={() => handleSelect(type.id)}
                  className={cn(
                    "relative p-5 rounded-2xl text-left transition-all overflow-hidden",
                    "border border-white/10 hover:border-white/20 bg-white/[0.03]"
                  )}
                >
                  {/* Gradient Background */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 transition-opacity duration-300",
                    "bg-gradient-to-br",
                    type.gradient,
                    hoveredType === type.id && "opacity-30"
                  )} />

                  {/* Content */}
                  <div className="relative">
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${type.accent}20` }}
                    >
                      <type.icon 
                        className="w-6 h-6" 
                        style={{ color: type.accent }}
                      />
                    </div>

                    {/* Label */}
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {type.label}
                    </h3>
                    <p className="text-white/40 text-xs">
                      {type.description}
                    </p>

                    {/* Features Preview */}
                    <AnimatePresence>
                      {hoveredType === type.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex flex-wrap gap-1 mt-3"
                        >
                          {type.features.map((feature) => (
                            <span
                              key={feature}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/60"
                            >
                              {feature}
                            </span>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Arrow indicator */}
                  <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-white/20" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Bottom hint */}
          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-white/30">
              Your stories disappear after 24 hours
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default StoryTypesSheet;
