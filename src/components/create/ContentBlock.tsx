import { useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, GripVertical, Image, Film, MapPin, 
  Headphones, Link2, ChevronUp, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export type BlockType = 'text' | 'image' | 'video' | 'location' | 'poll' | 'audio' | 'link';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  mediaFiles?: File[];
  mediaPreviewUrls?: string[];
  pollOptions?: string[];
  locationName?: string;
}

interface ContentBlockProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (block: Block) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const BLOCK_LABELS: Record<BlockType, string> = {
  text: 'Text',
  image: 'Photos',
  video: 'Video',
  location: 'Location',
  poll: 'Poll',
  audio: 'Audio',
  link: 'Link',
};

export default function ContentBlock({ 
  block, isSelected, onSelect, onUpdate, onRemove,
  onMoveUp, onMoveDown, isFirst, isLast 
}: ContentBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (value: string) => {
    onUpdate({ ...block, content: value });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (f.size > MAX_FILE_SIZE) { toast.error(`${f.name} too large`); return false; }
      return true;
    });
    const newFiles = [...(block.mediaFiles || []), ...valid].slice(0, 10);
    const urls = newFiles.map(f => URL.createObjectURL(f));
    onUpdate({ ...block, mediaFiles: newFiles, mediaPreviewUrls: urls });
  };

  const removeMedia = (index: number) => {
    const files = [...(block.mediaFiles || [])];
    const urls = [...(block.mediaPreviewUrls || [])];
    URL.revokeObjectURL(urls[index]);
    files.splice(index, 1);
    urls.splice(index, 1);
    onUpdate({ ...block, mediaFiles: files, mediaPreviewUrls: urls });
  };

  const updatePollOption = (index: number, value: string) => {
    const opts = [...(block.pollOptions || ['', ''])];
    opts[index] = value;
    onUpdate({ ...block, pollOptions: opts });
  };

  const addPollOption = () => {
    const opts = [...(block.pollOptions || ['', ''])];
    if (opts.length < 6) {
      opts.push('');
      onUpdate({ ...block, pollOptions: opts });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={onSelect}
      className={`group relative rounded-2xl border transition-all duration-200 ${
        isSelected 
          ? 'border-primary/40 bg-primary/[0.03] shadow-md ring-1 ring-primary/10' 
          : 'border-border bg-card hover:border-primary/20 hover:shadow-sm'
      }`}
    >
      {/* Block Header */}
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
        <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />
        <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex-1">
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Block Content */}
      <div className="px-3 pb-3">
        {block.type === 'text' && (
          <Textarea
            value={block.content}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Write something amazing..."
            className="border-0 bg-transparent resize-none min-h-[80px] p-1 text-[15px] leading-relaxed placeholder:text-muted-foreground/40 focus-visible:ring-0"
          />
        )}

        {(block.type === 'image' || block.type === 'video') && (
          <div className="space-y-2">
            {(block.mediaPreviewUrls || []).length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {block.mediaPreviewUrls!.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group/media">
                    {block.type === 'video' && block.mediaFiles?.[i]?.type.startsWith('video') ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/30 transition-colors flex items-center justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeMedia(i); }}
                        className="opacity-0 group-hover/media:opacity-100 transition-opacity w-7 h-7 rounded-full bg-destructive/80 text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-all duration-200 text-muted-foreground hover:text-foreground"
            >
              {block.type === 'image' ? <Image className="w-5 h-5" /> : <Film className="w-5 h-5" />}
              <span className="text-sm font-medium">Add {block.type === 'image' ? 'photos' : 'videos'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={block.type === 'image' ? 'image/*' : 'video/*'}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Input
              value={block.content}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Add a caption..."
              className="border-0 bg-muted/30 text-sm rounded-xl"
            />
          </div>
        )}

        {block.type === 'poll' && (
          <div className="space-y-2">
            <Input
              value={block.content}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Ask a question..."
              className="border-0 bg-transparent text-[15px] font-medium p-1 focus-visible:ring-0"
            />
            {(block.pollOptions || ['', '']).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border-2 border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary/50 shrink-0">
                  {i + 1}
                </div>
                <Input
                  value={opt}
                  onChange={(e) => updatePollOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 border-0 bg-muted/30 text-sm rounded-xl"
                />
              </div>
            ))}
            {(block.pollOptions || []).length < 6 && (
              <button onClick={addPollOption} className="text-xs text-primary hover:underline ml-9 font-medium">
                + Add option
              </button>
            )}
          </div>
        )}

        {block.type === 'location' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <Input
              value={block.locationName || ''}
              onChange={(e) => onUpdate({ ...block, locationName: e.target.value })}
              placeholder="Search for a location..."
              className="border-0 bg-transparent text-sm flex-1 focus-visible:ring-0"
            />
          </div>
        )}

        {block.type === 'link' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30">
            <Link2 className="w-5 h-5 text-primary shrink-0" />
            <Input
              value={block.content}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste a URL..."
              className="border-0 bg-transparent text-sm flex-1 focus-visible:ring-0"
            />
          </div>
        )}

        {block.type === 'audio' && (
          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-all duration-200 text-muted-foreground"
            >
              <Headphones className="w-5 h-5" />
              <span className="text-sm font-medium">Upload audio</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
