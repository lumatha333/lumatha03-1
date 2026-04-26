import React from 'react';
import { motion } from 'framer-motion';
import { Image, Pencil, Video } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AddPanelProps {
  onAddImage: () => void;
  onAddDrawing: () => void;
  onAddVideo: () => void;
}

export const AddPanel: React.FC<AddPanelProps> = ({ onAddImage, onAddDrawing, onAddVideo }) => {
  const isMobile = useIsMobile();
  const itemClass = 'w-full rounded-2xl border px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 hover:scale-[1.01]';

  return (
    <motion.div
      initial={isMobile ? { y: 36, opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isMobile ? { y: 36, opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className={`fixed z-[75] rounded-[24px] border border-white/15 bg-[#0F1629]/95 backdrop-blur-2xl p-4 space-y-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${isMobile ? 'left-3 right-3 bottom-[84px]' : 'left-4 bottom-[92px] w-[360px]'}`}
    >
      <div className="mb-1 px-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8A90A2]">Quick Add</p>
      </div>
      <button className={`${itemClass} border-amber-300/30 bg-gradient-to-r from-amber-300/18 via-orange-400/12 to-rose-400/12 text-amber-100 hover:from-amber-300/24 hover:via-orange-400/18 hover:to-rose-400/18`} onClick={onAddImage}><Image className="w-4 h-4" /> Image</button>
      <button className={`${itemClass} border-violet-400/30 bg-gradient-to-r from-violet-500/18 via-fuchsia-500/12 to-sky-400/12 text-violet-100 hover:from-violet-500/24 hover:via-fuchsia-500/18 hover:to-sky-400/18`} onClick={onAddDrawing}><Pencil className="w-4 h-4" /> Drawing</button>
      <button className={`${itemClass} border-cyan-300/30 bg-gradient-to-r from-cyan-400/18 via-blue-500/12 to-indigo-500/12 text-cyan-100 hover:from-cyan-400/24 hover:via-blue-500/18 hover:to-indigo-500/18`} onClick={onAddVideo}><Video className="w-4 h-4" /> Video</button>
    </motion.div>
  );
};
