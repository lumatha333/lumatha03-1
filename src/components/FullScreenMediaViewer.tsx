import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface FullScreenMediaViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaUrls: string[];
  mediaTypes: string[];
  initialIndex?: number;
  title?: string;
  likesCount?: number;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

export function FullScreenMediaViewer({
  open,
  onOpenChange,
  mediaUrls,
  mediaTypes,
  initialIndex = 0,
  title,
  likesCount = 0,
  isLiked = false,
  onLike,
  onComment,
  onShare
}: FullScreenMediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  const hasMultiple = mediaUrls.length > 1;
  const currentMedia = mediaUrls[currentIndex] || '';
  const currentType = mediaTypes[currentIndex] || 'image';
  const isVideo = currentType?.includes('video');

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % mediaUrls.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  if (!currentMedia) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 bg-black border-none rounded-none [&>button]:hidden">
        {/* Dark fullscreen container */}
        <div className="relative w-full h-full flex flex-col">
          {/* Top bar with close and options */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-10 h-10"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-10 h-10"
            >
              <MoreHorizontal className="w-6 h-6" />
            </Button>
          </div>

          {/* Media content - centered */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {isVideo ? (
              <video 
                src={currentMedia} 
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img 
                src={currentMedia} 
                alt={title || 'Media'} 
                className="max-w-full max-h-full object-contain"
                loading="eager"
              />
            )}
            
            {/* Navigation arrows for multiple media */}
            {hasMultiple && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full w-12 h-12"
                  onClick={prevMedia}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full w-12 h-12"
                  onClick={nextMedia}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}
          </div>

          {/* Bottom action bar - like the reference image */}
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-8">
            <div className="flex items-center justify-center gap-8 px-6">
              {/* Like button */}
              <button 
                onClick={onLike}
                className={`flex flex-col items-center gap-1 transition-colors ${isLiked ? 'text-red-500' : 'text-white/80 hover:text-white'}`}
              >
                <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
                {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
              </button>
              
              {/* Comment button */}
              <button 
                onClick={onComment}
                className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              >
                <MessageCircle className="w-7 h-7" />
              </button>
              
              {/* Repost/Refresh button */}
              <button 
                className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>
              
              {/* Share button */}
              <button 
                onClick={onShare}
                className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              >
                <Share2 className="w-7 h-7" />
              </button>
            </div>
            
            {/* Media counter for multiple */}
            {hasMultiple && (
              <div className="text-center mt-4 text-white/60 text-sm">
                {currentIndex + 1} / {mediaUrls.length}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
