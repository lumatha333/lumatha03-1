import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Type, Mic, Smile, Sparkles, Image as ImageIcon, ArrowRight, History, Zap, Settings } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { StorySettingsSheet } from './StorySettingsSheet';

interface AddStorySheetProps {
  open: boolean;
  onClose: () => void;
  onSelectAction: (mode: 'media' | 'text' | 'voice' | 'mood') => void;
}

const actions = [
  { id: 'media', title: "Photo / Video", desc: "Share a moment", icon: Camera, grad: "from-purple-500/20 to-indigo-600/20", iconColor: "text-indigo-400" },
  { id: 'text', title: "Text Story", desc: "Write what you feel", icon: Type, grad: "from-blue-500/20 to-cyan-600/20", iconColor: "text-cyan-400" },
  { id: 'voice', title: "Voice Story", desc: "Let your voice speak", icon: Mic, grad: "from-emerald-500/20 to-teal-600/20", iconColor: "text-emerald-400" },
  { id: 'mood', title: "Mood Story", desc: "Show your vibe", icon: Smile, grad: "from-orange-500/20 to-pink-600/20", iconColor: "text-orange-400" }
];

const suggestions = [
  { title: "Share your mood", desc: "Let others know how you feel", icon: Zap },
  { title: "What's on your mind?", desc: "Start a text story", icon: Type },
  { title: "Continue last draft", desc: "Saved 2 hours ago", icon: History }
];

export function AddStorySheet({ open, onClose, onSelectAction }: AddStorySheetProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10000] flex items-end justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-xl bg-[#050814]/95 rounded-t-[32px] sm:rounded-[32px] overflow-hidden border-t border-x border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
        >
          {/* Handle */}
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0" />

          <div className="px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Create Story</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSettingsOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                title="Story Settings"
              >
                <Settings size={18} className="text-gray-400" />
              </button>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-12 space-y-10">
            
            {/* ZONE 1: QUICK ACTIONS */}
            <div className="grid grid-cols-2 gap-4">
              {actions.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelectAction(item.id as any)}
                  className={cn(
                    "relative group p-5 rounded-[24px] bg-white/[0.03] border border-white/5 text-left overflow-hidden",
                    "hover:border-white/20 transition-all duration-300"
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", item.grad)} />
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 relative z-10 transition-transform duration-500 group-hover:scale-110",
                    item.iconColor
                  )}>
                    <item.icon size={24} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">{item.title}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* ZONE 2: RECENT MEDIA */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} /> Recent Media
                </h4>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Best moments for you</span>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
                {[1,2,3,4,5].map((i) => (
                  <motion.div
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-32 h-44 rounded-2xl bg-white/[0.03] border border-white/5 shrink-0 overflow-hidden cursor-pointer group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Select</span>
                    </div>
                    <div className="w-full h-full flex items-center justify-center opacity-20 text-white/50">
                      <ImageIcon size={32} strokeWidth={1} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ZONE 3: SMART SUGGESTIONS */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Suggestions</h4>
              <div className="space-y-2">
                {suggestions.map((item, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => i === 0 ? onSelectAction('mood') : i === 1 ? onSelectAction('text') : null}
                    className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-white uppercase tracking-widest mb-1">{item.title}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-700 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <StorySettingsSheet 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </>
  , document.body);
}
