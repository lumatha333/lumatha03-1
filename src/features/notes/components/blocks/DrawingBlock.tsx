import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Pencil, Eraser, Trash2 } from 'lucide-react';
import { DrawingBlockData } from '../../types';
import { cn } from '@/lib/utils';

interface DrawingBlockProps {
  content: DrawingBlockData;
  onChange: (data: DrawingBlockData) => void;
  isFocused?: boolean;
  color?: string;
  brushSize?: number;
}

export const DrawingBlock: React.FC<DrawingBlockProps> = ({ 
  content, onChange, isFocused, color = '#FFFFFF', brushSize = 4 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState(content?.paths || []);

  const redraw = (ctx: CanvasRenderingContext2D, pathsToDraw: any[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    pathsToDraw.forEach(path => {
      if (path.points.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.moveTo(path.points[0].x, path.points[0].y);
      
      // Quadratic Bezier Smoothing for "Proper" Hand Feel
      for (let i = 1; i < path.points.length - 2; i++) {
        const xc = (path.points[i].x + path.points[i + 1].x) / 2;
        const yc = (path.points[i].y + path.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(path.points[i].x, path.points[i].y, xc, yc);
      }
      
      // Connect last two points
      if (path.points.length > 2) {
        ctx.quadraticCurveTo(
          path.points[path.points.length - 2].x,
          path.points[path.points.length - 2].y,
          path.points[path.points.length - 1].x,
          path.points[path.points.length - 1].y
        );
      }
      
      ctx.stroke();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    redraw(ctx, paths);
  }, [paths]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isFocused) return;
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    setPaths([...paths, { points: [{ x, y }], color, width: brushSize, opacity: 1 }]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isFocused) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    const newPaths = [...paths];
    const currentPath = newPaths[newPaths.length - 1];
    currentPath.points.push({ x, y });
    setPaths(newPaths);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    onChange({ paths });
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[500px]">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        className={cn(
          "w-full h-full cursor-crosshair touch-none rounded-[40px] transition-all",
          isFocused ? "bg-white/[0.04]" : "bg-transparent"
        )}
      />
      
      {isFocused && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#0D1425F2] backdrop-blur-3xl p-2 rounded-[24px] border border-white/10 shadow-2xl z-50"
        >
          <button onClick={() => { const p = paths.slice(0, -1); setPaths(p); onChange({ paths: p }); }} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
            <Undo2 className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-3 px-3">
            <div className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-black text-white/60 tracking-widest">{brushSize}PX</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
