import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';

interface TopBarProps {
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onBack, onSave, isSaving }) => {
  return (
    <header className="h-14 px-4 shrink-0 border-b border-white/10 bg-[#070B14]/82 backdrop-blur-xl flex items-center justify-between gap-3">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-xl hover:bg-white/10 transition-colors text-[#E6E9F2] flex items-center justify-center"
        aria-label="Back"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className={`h-9 w-9 rounded-xl border transition-all flex items-center justify-center ${isSaving ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300 shadow-[0_0_0_4px_rgba(34,197,94,0.08)]' : 'border-emerald-400/20 bg-emerald-400/12 text-emerald-300 hover:bg-emerald-400/18'}`}
          aria-label="Save note"
        >
          <motion.span whileTap={{ scale: 0.94 }} className="inline-flex items-center justify-center">
            <Check className="w-4 h-4" />
          </motion.span>
        </button>
      </div>
    </header>
  );
};
