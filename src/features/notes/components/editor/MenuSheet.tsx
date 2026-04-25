import React from 'react';
import { motion } from 'framer-motion';
import { Archive, Copy, Pin, Share2, Trash2, Bell } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MenuSheetProps {
  timestamp: string;
  onDelete: () => void;
  onCopy: () => void;
  onShare: () => void;
  onPin: () => void;
  onArchive: () => void;
  onReminder: () => void;
}

export const MenuSheet: React.FC<MenuSheetProps> = ({ timestamp, onDelete, onCopy, onShare, onPin, onArchive, onReminder }) => {
  const isMobile = useIsMobile();
  const itemClass = 'w-full h-11 rounded-xl border border-white/10 bg-white/5 text-[#E6E9F2] text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors';

  return (
    <motion.div
      initial={isMobile ? { y: 36, opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isMobile ? { y: 36, opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className={`fixed z-[75] rounded-[22px] border border-white/15 bg-[#0F1629]/95 backdrop-blur-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${isMobile ? 'left-1/2 -translate-x-1/2 bottom-[92px] w-[calc(100%-40px)] max-w-[620px]' : 'right-4 bottom-[92px] w-[320px]'}`}
    >
      <button className={itemClass} onClick={onPin}>
        <Pin className="w-4 h-4" /> Pin
      </button>
      <button className={itemClass} onClick={onArchive}>
        <Archive className="w-4 h-4" /> Archive
      </button>
      <button className={itemClass} onClick={onReminder}>
        <Bell className="w-4 h-4" /> Reminder
      </button>
      <div className="h-px bg-white/10 my-1" />
      <button className={itemClass} onClick={onDelete}><Trash2 className="w-4 h-4" />Delete</button>
      <button className={itemClass} onClick={onCopy}><Copy className="w-4 h-4" />Make a copy</button>
      <button className={itemClass} onClick={onShare}><Share2 className="w-4 h-4" />Share</button>
      <div className="h-px bg-white/10 my-1" />
      <p className="text-center text-xs text-[#8A90A2] pt-1">Edited {timestamp}</p>
    </motion.div>
  );
};
