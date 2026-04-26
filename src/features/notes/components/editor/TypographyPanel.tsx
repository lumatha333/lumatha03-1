import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { EditorTypography } from './types';
import { useIsMobile } from '@/hooks/use-mobile';

interface TypographyPanelProps {
  typography: EditorTypography;
  onChange: (next: EditorTypography) => void;
  onClose: () => void;
}

export const TypographyPanel: React.FC<TypographyPanelProps> = ({ typography, onChange, onClose }) => {
  const isMobile = useIsMobile();
  const itemClass = 'h-10 min-w-10 px-3 rounded-xl bg-white/5 text-[#E6E9F2] text-sm font-semibold hover:bg-white/10 transition-all duration-200 hover:scale-[1.02]';

  return (
    <motion.div
      initial={isMobile ? { y: 36, opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isMobile ? { y: 36, opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className={`fixed z-[75] rounded-[24px] border border-white/15 bg-[#0F1629]/95 backdrop-blur-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${isMobile ? 'left-3 right-3 bottom-[84px]' : 'left-4 bottom-[92px] w-[400px]'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black tracking-[0.2em] text-[#8A90A2] uppercase">Type Controls</p>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 text-[#E6E9F2]">
          <X className="w-4 h-4 mx-auto" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button className={`${itemClass} border border-emerald-400/25 text-emerald-200`} onClick={() => onChange({ ...typography, size: 'sm' })}>A-</button>
        <button className={`${itemClass} border border-violet-400/25 text-violet-200`} onClick={() => onChange({ ...typography, size: 'h1' })}>H1</button>
        <button className={`${itemClass} border border-fuchsia-400/25 text-fuchsia-200`} onClick={() => onChange({ ...typography, size: 'h2' })}>H2</button>
        <button className={`${itemClass} border border-sky-400/25 text-sky-200`} onClick={() => onChange({ ...typography, size: 'base' })}>Aa</button>
        <button className={`${itemClass} border border-amber-400/25 text-amber-200`} onClick={() => onChange({ ...typography, bold: !typography.bold })}>B</button>
        <button className={`${itemClass} border border-cyan-400/25 text-cyan-200`} onClick={() => onChange({ ...typography, italic: !typography.italic })}>I</button>
        <button className={`${itemClass} border border-rose-400/25 text-rose-200`} onClick={() => onChange({ ...typography, underline: !typography.underline })}>U</button>
      </div>
    </motion.div>
  );
};
