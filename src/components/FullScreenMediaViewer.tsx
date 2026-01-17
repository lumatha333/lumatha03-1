import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, MoreHorizontal, Download } from 'lucide-react';

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
  isGhostPost?: boolean;
  downloadDisabled?: boolean;
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
  onShare,
  isGhostPost = false,
  downloadDisabled = false
}: FullScreenMediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Reset index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);
  
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

  // Ghost posts cannot be downloaded
  const canDownload = !isGhostPost && !downloadDisabled;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDownload) return;
    
    try {
      const response = await fetch(currentMedia);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `media-${currentIndex}.${isVideo ? 'mp4' : 'jpg'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error('Download failed');
    }
  };

  if (!currentMedia) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 bg-black border-none rounded-none inset-0 [&>button]:hidden data-[state=open]:!inset-0">
        {/* Dark fullscreen container - completely edge to edge */}
        <div className="fixed inset-0 w-screen h-screen flex flex-col bg-black">
          {/* Top bar with close and options */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/90 hover:text-white hover:bg-white/10 rounded-full w-10 h-10"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              {canDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/90 hover:text-white hover:bg-white/10 rounded-full w-10 h-10"
                  onClick={handleDownload}
                >
                  <Download className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-white/90 hover:text-white hover:bg-white/10 rounded-full w-10 h-10"
              >
                <MoreHorizontal className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Media content - completely fills the screen */}
          <div className="flex-1 flex items-center justify-center w-full h-full">
            {isVideo ? (
              <video 
                src={currentMedia} 
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img 
                src={currentMedia} 
                alt={title || 'Media'} 
                className="w-full h-full object-contain"
                loading="eager"
              />
            )}
            
            {/* Navigation arrows for multiple media */}
            {hasMultiple && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full w-12 h-12"
                  onClick={prevMedia}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full w-12 h-12"
                  onClick={nextMedia}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}
          </div>

          {/* Bottom action bar - like Facebook */}
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-6">
            <div className="flex items-center justify-center gap-10 px-6">
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
