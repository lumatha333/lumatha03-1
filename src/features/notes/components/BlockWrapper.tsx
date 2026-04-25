import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, MoreHorizontal, Palette, Trash2, Copy, ArrowUp, ArrowDown, Settings2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockType, BlockStyle } from '../types';
import { FloatingStyleMenu } from './FloatingStyleMenu';

interface BlockWrapperProps {
  children: React.ReactNode;
  isFocused: boolean;
  onFocus: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onConvertType: (type: BlockType) => void;
  onUpdateStyle: (style: Partial<BlockStyle>) => void;
  blockStyle: BlockStyle;
  type: string;
  isFirst?: boolean;
  isLast?: boolean;
}

export const BlockWrapper: React.FC<BlockWrapperProps> = ({
  children, isFocused, onFocus, onDelete, onDuplicate, onMoveUp, onMoveDown, onConvertType, onUpdateStyle, blockStyle, type, isFirst, isLast,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleOpenStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right - 280, y: rect.bottom + 8 });
    setShowStyleMenu(true);
  };

  return (
    <motion.div
      layout="position"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onFocus}
      className={cn(
        "group relative py-1 px-4 sm:px-12 transition-all duration-500",
        isFocused ? "bg-white/[0.02]" : "hover:bg-white/[0.01]"
      )}
    >
      {/* Premium Side Indicator (Gradient) */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '70%', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-1 rounded-full bg-gradient-to-b from-[#8B5CF6] to-[#D946EF] shadow-[0_0_15px_rgba(139,92,246,0.4)]"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn("transition-all duration-500", isFocused ? "translate-x-2" : "")}>
        {children}
      </div>

      {/* Sliding Action Bar (Needy Features Only) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: (isHovered || isFocused) ? 0 : 40, opacity: (isHovered || isFocused) ? 1 : 0 }}
          className="flex items-center gap-1.5 bg-[#0D1425F2] backdrop-blur-2xl p-1 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto"
        >
          <button
            onClick={handleOpenStyle}
            className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-[#A78BFA]"
            title="Appearance"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 hover:bg-red-500/10 rounded-xl transition-all text-white/20 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/20 hover:text-white"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Floating Style Menu */}
      <AnimatePresence>
        {showStyleMenu && (
          <FloatingStyleMenu
            style={blockStyle}
            onChange={onUpdateStyle}
            position={menuPosition}
            onClose={() => setShowStyleMenu(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
