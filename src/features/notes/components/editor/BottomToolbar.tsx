import React from 'react';
import { ChevronLeft, ChevronRight, EllipsisVertical, Palette, Plus, Type } from 'lucide-react';
import { EditorPanel } from './types';
import { useIsMobile } from '@/hooks/use-mobile';

interface BottomToolbarProps {
  activePanel: EditorPanel;
  onTogglePanel: (panel: Exclude<EditorPanel, null>) => void;
  onPrev: () => void;
  onNext: () => void;
  canNavigate: boolean;
  onNavHoldStart: (direction: 'prev' | 'next') => void;
  onNavHoldEnd: () => void;
  onMenuOpen: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  activePanel,
  onTogglePanel,
  onPrev,
  onNext,
  canNavigate,
  onNavHoldStart,
  onNavHoldEnd,
  onMenuOpen,
}) => {
  const isMobile = useIsMobile();

  const itemClass = (panel?: Exclude<EditorPanel, null>) =>
    `w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
      panel === 'add'
        ? activePanel === panel
          ? 'bg-gradient-to-br from-amber-400/30 to-orange-500/20 text-amber-200 shadow-[0_0_0_4px_rgba(251,191,36,0.08)]'
          : 'text-amber-300 hover:bg-amber-400/10'
        : panel === 'color'
          ? activePanel === panel
            ? 'bg-gradient-to-br from-cyan-400/25 to-blue-500/20 text-cyan-200 shadow-[0_0_0_4px_rgba(34,211,238,0.08)]'
            : 'text-cyan-300 hover:bg-cyan-400/10'
          : panel === 'typography'
            ? activePanel === panel
              ? 'bg-gradient-to-br from-violet-500/25 to-fuchsia-500/20 text-violet-200 shadow-[0_0_0_4px_rgba(139,92,246,0.08)]'
              : 'text-violet-300 hover:bg-violet-400/10'
            : activePanel === panel
              ? 'bg-[#7B61FF] text-white'
              : 'text-[#E6E9F2] hover:bg-white/10'
    }`;

  return (
    <div
      className={`fixed z-[70] h-16 rounded-[22px] border border-white/15 bg-[#0F1629]/82 backdrop-blur-2xl px-2.5 flex items-center justify-between shadow-[0_16px_50px_rgba(0,0,0,0.45)] ${
        isMobile ? 'left-3 right-3 bottom-3' : 'left-4 right-4 bottom-4'
      }`}
    >
      <div className="flex items-center gap-1">
        <button onClick={() => onTogglePanel('add')} className={itemClass('add')} aria-label="Add panel">
          <Plus className="w-4.5 h-4.5" />
        </button>
        <button onClick={() => onTogglePanel('color')} className={itemClass('color')} aria-label="Color panel">
          <Palette className="w-4.5 h-4.5" />
        </button>
        <button onClick={() => onTogglePanel('typography')} className={itemClass('typography')} aria-label="Typography panel">
          <Type className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 px-2 h-11 rounded-2xl border border-white/10 bg-white/5 shadow-inner shadow-white/5">
        <button
          onClick={onPrev}
          onMouseDown={() => onNavHoldStart('prev')}
          onTouchStart={() => onNavHoldStart('prev')}
          onMouseUp={onNavHoldEnd}
          onTouchEnd={onNavHoldEnd}
          onMouseLeave={onNavHoldEnd}
          disabled={!canNavigate}
          className="w-8 h-8 rounded-full text-[#E6E9F2] hover:bg-white/10 disabled:opacity-40"
          aria-label="Previous note"
        >
          <ChevronLeft className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={onNext}
          onMouseDown={() => onNavHoldStart('next')}
          onTouchStart={() => onNavHoldStart('next')}
          onMouseUp={onNavHoldEnd}
          onTouchEnd={onNavHoldEnd}
          onMouseLeave={onNavHoldEnd}
          disabled={!canNavigate}
          className="w-8 h-8 rounded-full text-[#E6E9F2] hover:bg-white/10 disabled:opacity-40"
          aria-label="Next note"
        >
          <ChevronRight className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={onMenuOpen}
          className="w-8 h-8 rounded-full text-[#E6E9F2] hover:bg-white/10"
          aria-label="Open options"
        >
          <EllipsisVertical className="w-4 h-4 mx-auto" />
        </button>
      </div>
    </div>
  );
};
