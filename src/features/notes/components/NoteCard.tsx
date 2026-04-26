import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Pin, Trash2, Archive, Copy, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LumaNote } from '../types';

interface NoteCardProps {
  note: LumaNote;
  onClick: () => void;
  onDelete: () => void;
  onPin: () => void;
  onArchive: () => void;
  onCopy?: () => void;
  onShare?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onDelete, onPin, onArchive, onCopy, onShare }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="relative rounded-[18px] bg-[#0F1629] border border-white/10 p-4 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold text-[#E6E9F2] truncate">{note.title || 'Untitled'}</h3>
        </div>

        <div className="relative" ref={ref}>
          <button
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-[#8A90A2]"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-label="Note actions"
          >
            <MoreVertical className="w-4 h-4 mx-auto" />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-white/10 bg-[#0F1629] p-1.5 shadow-xl"
              >
                <button onClick={(e) => { e.stopPropagation(); onPin(); setOpen(false); }} className="w-full h-9 rounded-lg hover:bg-white/10 text-[#E6E9F2] text-sm flex items-center gap-2 px-2.5"><Pin className="w-3.5 h-3.5" />{note.isPinned ? 'Unpin' : 'Pin'}</button>
                <button onClick={(e) => { e.stopPropagation(); onArchive(); setOpen(false); }} className="w-full h-9 rounded-lg hover:bg-white/10 text-[#E6E9F2] text-sm flex items-center gap-2 px-2.5"><Archive className="w-3.5 h-3.5" />{note.isArchived ? 'Unarchive' : 'Archive'}</button>
                {onCopy && <button onClick={(e) => { e.stopPropagation(); onCopy(); setOpen(false); }} className="w-full h-9 rounded-lg hover:bg-white/10 text-[#E6E9F2] text-sm flex items-center gap-2 px-2.5"><Copy className="w-3.5 h-3.5" />Copy</button>}
                {onShare && <button onClick={(e) => { e.stopPropagation(); onShare(); setOpen(false); }} className="w-full h-9 rounded-lg hover:bg-white/10 text-[#E6E9F2] text-sm flex items-center gap-2 px-2.5"><Share2 className="w-3.5 h-3.5" />Share</button>}
                <button onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }} className="w-full h-9 rounded-lg hover:bg-red-500/20 text-red-300 text-sm flex items-center gap-2 px-2.5"><Trash2 className="w-3.5 h-3.5" />Delete</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-[14px] leading-6 text-[#8A90A2] line-clamp-2 min-h-11">{note.previewText || 'No content yet...'}</p>

      <div className="flex items-center justify-between mt-3 text-[12px] text-[#8A90A2]">
        <span aria-label={`Last updated ${new Date(note.updatedAt).toLocaleString()}`}>
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </span>
        {note.isPinned && <span className="text-[#7B61FF]">Pinned</span>}
      </div>
    </motion.article>
  );
};
