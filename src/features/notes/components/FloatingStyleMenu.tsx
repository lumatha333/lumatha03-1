import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, Palette, Highlighter, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Strikethrough, ChevronDown, Check } from 'lucide-react';
import { TEXT_COLORS, HIGHLIGHT_COLORS, BG_COLORS } from '../constants';
import { BlockStyle } from '../types';
import { cn } from '@/lib/utils';

interface FloatingStyleMenuProps {
  style: BlockStyle;
  onChange: (style: Partial<BlockStyle>) => void;
  position: { x: number; y: number };
  onClose: () => void;
}

export const FloatingStyleMenu: React.FC<FloatingStyleMenuProps> = ({ style, onChange, position, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<'text' | 'highlight' | 'bg' | null>(null);

  const toggleStyle = (key: keyof BlockStyle) => {
    onChange({ [key]: !style[key] });
  };

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        style={{ left: position.x, top: position.y }}
        className="fixed z-[101] flex flex-col bg-[#0D1425F2] backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Main Toolbar */}
        <div className="flex items-center gap-1 p-1.5 border-b border-white/5">
          <div className="flex items-center bg-white/5 rounded-xl p-0.5">
            <button 
              onClick={() => toggleStyle('isBold')} 
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", style.isBold ? 'bg-[#8B5CF6] text-white' : 'text-white/40 hover:text-white')}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => toggleStyle('isItalic')} 
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", style.isItalic ? 'bg-[#8B5CF6] text-white' : 'text-white/40 hover:text-white')}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => toggleStyle('isUnderline')} 
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", style.isUnderline ? 'bg-[#8B5CF6] text-white' : 'text-white/40 hover:text-white')}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          <div className="flex items-center bg-white/5 rounded-xl p-0.5">
            <button 
              onClick={() => setActiveTab(activeTab === 'text' ? null : 'text')} 
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", activeTab === 'text' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white')}
              style={{ color: style.textColor }}
            >
              <Type className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveTab(activeTab === 'highlight' ? null : 'highlight')} 
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", activeTab === 'highlight' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white')}
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveTab(activeTab === 'bg' ? null : 'bg')} 
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", activeTab === 'bg' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white')}
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          <div className="flex items-center bg-white/5 rounded-xl p-0.5">
            <button onClick={() => onChange({ alignment: 'left' })} className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", style.alignment === 'left' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white')}><AlignLeft className="w-3.5 h-3.5" /></button>
            <button onClick={() => onChange({ alignment: 'center' })} className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", style.alignment === 'center' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white')}><AlignCenter className="w-3.5 h-3.5" /></button>
            <button onClick={() => onChange({ alignment: 'right' })} className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", style.alignment === 'right' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white')}><AlignRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Color Picker Submenus */}
        <AnimatePresence>
          {activeTab && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black/20"
            >
              <div className="p-3 grid grid-cols-5 gap-2">
                {(activeTab === 'text' ? TEXT_COLORS : activeTab === 'highlight' ? HIGHLIGHT_COLORS : BG_COLORS).map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      if (activeTab === 'text') onChange({ textColor: color.value });
                      else if (activeTab === 'highlight') onChange({ highlightColor: color.value });
                      else if (activeTab === 'bg') onChange({ backgroundColor: color.value });
                      // Keep menu open for multiple changes or close? Let's close for better flow
                      setActiveTab(null);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center",
                      (activeTab === 'text' ? style.textColor === color.value : 
                       activeTab === 'highlight' ? style.highlightColor === color.value : 
                       style.backgroundColor === color.value) 
                        ? 'border-[#8B5CF6] scale-110' : 'border-white/10'
                    )}
                    style={{ 
                      backgroundColor: activeTab === 'text' ? 'transparent' : color.value,
                      color: activeTab === 'text' ? color.value : 'inherit'
                    }}
                  >
                    {activeTab === 'text' && <span className="text-xs font-bold">A</span>}
                    {(activeTab === 'text' ? style.textColor === color.value : 
                      activeTab === 'highlight' ? style.highlightColor === color.value : 
                      style.backgroundColor === color.value) && (
                      <Check className={cn("w-3 h-3", activeTab === 'text' ? "text-[#8B5CF6]" : "text-white shadow-sm")} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
