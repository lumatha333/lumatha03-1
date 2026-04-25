import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brush, Check, Palette, Trash2, Undo2, X } from 'lucide-react';

interface DrawingSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void> | void;
}

type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; width: number };

const COLORS = ['#FFFFFF', '#7C6CFF', '#22C55E', '#38BDF8', '#F59E0B', '#FB7185'];
const BRUSHES = [4, 8, 12];

export const DrawingSheet: React.FC<DrawingSheetProps> = ({ open, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(8);

  useEffect(() => {
    if (!open) return;
    setStrokes([]);
    setColor('#FFFFFF');
    setBrushSize(8);
  }, [open]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !open) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      strokes.forEach((stroke) => {
        if (stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length - 2; i++) {
          const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }

        if (stroke.points.length > 2) {
          ctx.quadraticCurveTo(
            stroke.points[stroke.points.length - 2].x,
            stroke.points[stroke.points.length - 2].y,
            stroke.points[stroke.points.length - 1].x,
            stroke.points[stroke.points.length - 1].y,
          );
        }
        ctx.stroke();
      });
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [open, strokes]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const redraw = (nextStrokes: Stroke[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    nextStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length - 2; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }

      if (stroke.points.length > 2) {
        ctx.quadraticCurveTo(
          stroke.points[stroke.points.length - 2].x,
          stroke.points[stroke.points.length - 2].y,
          stroke.points[stroke.points.length - 1].x,
          stroke.points[stroke.points.length - 1].y,
        );
      }

      ctx.stroke();
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    if (!point) return;
    drawingRef.current = true;
    const nextStroke: Stroke = { points: [point], color, width: brushSize };
    activeStrokeRef.current = nextStroke;
    setStrokes((current) => [...current, nextStroke]);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const point = pointFromEvent(event);
    if (!point || !activeStrokeRef.current) return;

    const nextStroke = {
      ...activeStrokeRef.current,
      points: [...activeStrokeRef.current.points, point],
    };
    activeStrokeRef.current = nextStroke;
    setStrokes((current) => {
      const next = [...current];
      next[next.length - 1] = nextStroke;
      redraw(next);
      return next;
    });
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    activeStrokeRef.current = null;
  };

  const handleUndo = () => {
    setStrokes((current) => {
      const next = current.slice(0, -1);
      redraw(next);
      return next;
    });
  };

  const handleClear = () => {
    setStrokes([]);
    redraw([]);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `drawing-${Date.now()}.png`, { type: 'image/png' });
      await onSave(file);
    }, 'image/png');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full h-[92vh] sm:h-[86vh] sm:max-w-4xl rounded-t-[28px] sm:rounded-[28px] border border-white/10 bg-[#0F1629] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.55)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8A90A2]">Drawing</p>
                <h3 className="text-lg font-semibold text-[#E6E9F2]">Sketch and save</h3>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-white/10 text-[#E6E9F2] flex items-center justify-center" aria-label="Close drawing sheet">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button onClick={handleUndo} className="h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-[#E6E9F2] flex items-center gap-2 hover:bg-white/10">
                  <Undo2 className="w-4 h-4" /> Undo
                </button>
                <button onClick={handleClear} className="h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-[#E6E9F2] flex items-center gap-2 hover:bg-white/10">
                  <Trash2 className="w-4 h-4" /> Clear
                </button>
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-white/10 bg-white/5">
                  <Palette className="w-4 h-4 text-[#8A90A2]" />
                  {COLORS.map((itemColor) => (
                    <button
                      key={itemColor}
                      onClick={() => setColor(itemColor)}
                      className={`w-7 h-7 rounded-full border transition-transform ${color === itemColor ? 'border-white scale-110' : 'border-white/10'}`}
                      style={{ backgroundColor: itemColor }}
                      aria-label={`Set brush color ${itemColor}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-white/10 bg-white/5">
                  <Brush className="w-4 h-4 text-[#8A90A2]" />
                  {BRUSHES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`h-8 px-3 rounded-lg text-xs font-black transition-colors ${brushSize === size ? 'bg-[#7B61FF] text-white' : 'bg-white/5 text-[#8A90A2] hover:text-[#E6E9F2]'}`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-h-0 rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] overflow-hidden relative">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full touch-none"
                  style={{ touchAction: 'none' }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
                {strokes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-sm text-[#8A90A2]">Draw with your finger or mouse</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={onClose} className="flex-1 h-12 rounded-2xl border border-white/10 bg-white/5 text-[#E6E9F2] font-medium hover:bg-white/10">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 h-12 rounded-2xl bg-[#7B61FF] text-white font-semibold flex items-center justify-center gap-2 shadow-[0_12px_32px_rgba(123,97,255,0.25)]">
                  <Check className="w-4 h-4" /> Save Drawing
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};