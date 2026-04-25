import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GripVertical, Image as ImageIcon, Video } from 'lucide-react';
import { EditorMediaItem } from './types';
import { FullScreenMediaViewer } from '@/components/FullScreenMediaViewer';

interface EditorBodyProps {
  title: string;
  description: string;
  media: EditorMediaItem[];
  bodyStyle?: React.CSSProperties;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onMediaReorder: (fromId: string, toId: string) => void;
}

export const EditorBody: React.FC<EditorBodyProps> = ({
  title,
  description,
  media,
  bodyStyle,
  onTitleChange,
  onDescriptionChange,
  onMediaReorder,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragFromRef = useRef<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = '0px';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [description]);

  return (
    <section className="flex-1 overflow-y-auto px-5 pb-32 pt-5 space-y-4">
      <div className="flex items-center justify-between gap-3 text-[12px] font-medium text-[#8A90A2]">
        <span className="tracking-[0.18em] uppercase">Notes</span>
      </div>

      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        autoFocus
        placeholder="Title"
        className="w-full bg-transparent text-[28px] leading-[1.15] font-semibold text-[#E6E9F2] placeholder:text-[#8A90A2]/55 outline-none"
      />

      {media.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {media.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setViewerIndex(index);
              }}
              draggable
              onDragStart={() => {
                dragFromRef.current = item.id;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragFromRef.current || dragFromRef.current === item.id) return;
                onMediaReorder(dragFromRef.current, item.id);
                dragFromRef.current = null;
              }}
              className="group relative min-w-[156px] h-[102px] rounded-[20px] bg-[#0F1629] border border-white/10 overflow-hidden text-left"
            >
              {item.url ? (
                item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={item.url} alt="Note media" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8A90A2] bg-[#0F1629]">
                  {item.type === 'video' ? <Video className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2">
                <p className="text-[11px] font-medium text-white/90 capitalize">{item.type}</p>
              </div>
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm text-white/75 flex items-center justify-center opacity-70 group-hover:opacity-100">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Start writing your notes..."
        style={bodyStyle}
        className="w-full min-h-[220px] resize-none overflow-hidden bg-transparent text-base leading-[1.6] tracking-[0.01em] text-[#E6E9F2] placeholder:text-[#8A90A2]/65 outline-none"
      />

      <AnimatePresence>
        {viewerIndex !== null && media[viewerIndex] && (
          <FullScreenMediaViewer
            open={viewerIndex !== null}
            onOpenChange={(open) => {
              if (!open) setViewerIndex(null);
            }}
            mediaUrls={media.map((item) => item.url || '')}
            mediaTypes={media.map((item) => item.type)}
            initialIndex={viewerIndex}
            title={title || 'Note media'}
            minimal
          />
        )}
      </AnimatePresence>
    </section>
  );
};
