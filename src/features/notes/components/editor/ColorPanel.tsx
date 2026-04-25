import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NoteTheme } from '../../types';
import { useIsMobile } from '@/hooks/use-mobile';

interface ColorPanelProps {
  textColor: string;
  backgroundColor: string;
  onTextColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
  onThemeChange: (theme: NoteTheme) => void;
}

const TEXT_COLORS = ['#E6E9F2', '#8A90A2', '#7B61FF', '#10B981', '#F59E0B', '#EF4444', '#38BDF8', '#F472B6', '#A3E635'];
const BACKGROUNDS = ['#070B14', '#000000', '#F5F3EB', '#0B1B12', '#150C2A', '#221707', '#0A132A', '#1E1033', '#07241B'];
const THEMES: { key: NoteTheme; label: string; color: string }[] = [
  { key: 'deepNavy', label: 'Default Dark', color: '#070B14' },
  { key: 'pureBlack', label: 'Pure Black', color: '#000000' },
  { key: 'slate', label: 'Paper', color: '#F5F3EB' },
  { key: 'forest', label: 'Forest', color: '#0B1B12' },
  { key: 'purpleMist', label: 'Violet', color: '#150C2A' },
  { key: 'ember', label: 'Amber', color: '#221707' },
];

export const ColorPanel: React.FC<ColorPanelProps> = ({
  textColor,
  backgroundColor,
  onTextColorChange,
  onBackgroundColorChange,
  onThemeChange,
}) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<'text' | 'background' | 'themes'>('text');

  return (
    <motion.div
      initial={isMobile ? { y: 36, opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isMobile ? { y: 36, opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className={`fixed z-[75] rounded-[24px] border border-white/15 bg-[#0F1629]/95 backdrop-blur-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${isMobile ? 'left-3 right-3 bottom-[84px]' : 'left-4 bottom-[92px] w-[400px]'}`}
    >
      <div className="mb-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8A90A2]">Color Studio</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(['text', 'background', 'themes'] as const).map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`h-9 rounded-xl text-xs font-semibold capitalize transition-all ${tab === id ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_10px_24px_rgba(123,97,255,0.24)]' : 'text-[#8A90A2] bg-white/5 hover:text-[#E6E9F2]'}`}
          >
            {id}
          </button>
        ))}
      </div>

      {tab === 'text' && (
        <div className="flex gap-2 flex-wrap">
          {TEXT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onTextColorChange(color)}
              aria-label={`Set text color ${color}`}
              className={`w-9 h-9 rounded-full border-2 transition-transform ${textColor === color ? 'border-white scale-110' : 'border-white/15 hover:scale-105'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {tab === 'background' && (
        <div className="flex gap-2 flex-wrap">
          {BACKGROUNDS.map((color) => (
            <button
              key={color}
              onClick={() => onBackgroundColorChange(color)}
              aria-label={`Set background color ${color}`}
              className={`w-9 h-9 rounded-full border-2 transition-transform ${backgroundColor === color ? 'border-white scale-110' : 'border-white/15 hover:scale-105'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {tab === 'themes' && (
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.key}
              onClick={() => onThemeChange(theme.key)}
              aria-label={`Apply ${theme.label} theme`}
              className="h-16 rounded-2xl border border-white/10 text-[11px] font-semibold text-[#E6E9F2] p-2 flex flex-col items-start justify-between hover:border-white/25 transition-colors"
              style={{ background: `linear-gradient(135deg, ${theme.color}, #0F1629)` }}
            >
              <span className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: theme.color }} />
              {theme.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
