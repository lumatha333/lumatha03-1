import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useDragControls, AnimatePresence } from 'framer-motion';
import { NoteBlock } from '../types';
import { cn } from '@/lib/utils';
import { Trash2, Maximize2, Move } from 'lucide-react';

interface CanvasBlockWrapperProps {
  children: React.ReactNode;
  block: NoteBlock;
  isFocused: boolean;
  onFocus: () => void;
  onChange: (updates: Partial<NoteBlock>) => void;
  onDelete: () => void;
}

export const CanvasBlockWrapper: React.FC<CanvasBlockWrapperProps> = ({
  children, block, isFocused, onFocus, onChange, onDelete
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const dragControls = useDragControls();
  
  const scale = useMotionValue(block.scale || 1);
  const springScale = useSpring(scale, { stiffness: 1000, damping: 50 });

  const handleDragEnd = (event: any, info: any) => {
    const container = document.querySelector('.canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Calculate new position as percentage relative to container
    // Using current mouse/touch point relative to container bounds
    const finalX = ((info.point.x - rect.left) / rect.width) * 100;
    const finalY = ((info.point.y - rect.top) / rect.height) * 100;
    
    // Clamp values between 0 and 100 to stay within container
    const clampedX = Math.max(0, Math.min(100, finalX));
    const clampedY = Math.max(0, Math.min(100, finalY));
    
    onChange({ position: { x: clampedX, y: clampedY } });
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startScale = scale.get();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newScale = Math.max(0.4, Math.min(4, startScale + (deltaX / 150)));
      scale.set(newScale);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      onChange({ scale: scale.get() });
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <motion.div
      drag={!isResizing}
      dragMomentum={false}
      dragElastic={0}
      dragControls={dragControls}
      onDragEnd={handleDragEnd}
      onPointerDown={(e) => {
        onFocus();
        // Allow text interaction, but drag otherwise
        if ((e.target as HTMLElement).tagName !== 'TEXTAREA') {
          // No preventDefault here so drag controls can work if needed
        }
      }}
      style={{ 
        left: block.position?.x + '%', 
        top: block.position?.y + '%', 
        scale: springScale,
        position: 'absolute',
        translateX: '-50%',
        translateY: '-50%',
        touchAction: 'none',
        zIndex: isFocused ? 50 : 10,
      }}
      className="group p-4 cursor-grab active:cursor-grabbing transition-shadow"
    >
      {/* Floating Action Menu (Ultra-Minimal) */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0D1425F2] backdrop-blur-[40px] p-1.5 rounded-full border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-[60]"
          >
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-white/40 cursor-move"
            >
              <Move className="w-4 h-4" />
            </div>
            <div 
              onPointerDown={handleResizeStart}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-white/40 cursor-nwse-resize"
            >
              <Maximize2 className="w-4 h-4" />
            </div>
            <div className="w-px h-4 bg-white/5 mx-1" />
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-9 h-9 flex items-center justify-center hover:bg-red-500/10 rounded-full text-red-400/60 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "relative transition-all duration-300",
        isFocused ? "drop-shadow-[0_0_20px_rgba(0,0,0,0.3)]" : ""
      )}>
        {children}
      </div>
    </motion.div>
  );
};
