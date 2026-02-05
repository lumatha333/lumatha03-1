import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Heart, MessageCircle, Share2, Play, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { CommentsDialog } from '@/components/CommentsDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { SymbolicHeart } from './SymbolicHeart';

interface LearnMediaCardProps {
  id: string;
  title: string;
  content?: string;
  description?: string;
  mediaUrls: string[];
  mediaTypes: string[];
  authorName: string;
  authorAvatar?: string;
  authorId: string;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  onToggleLike: () => void;
  onToggleSave: () => void;
  className?: string;
  visibility?: 'public' | 'private';
  createdAt?: string;
}

export function LearnMediaCard({
  id,
  title,
  content,
  description,
  mediaUrls,
  mediaTypes,
  authorName,
  authorAvatar,
  authorId,
  isLiked,
  isSaved,
  likesCount,
  onToggleLike,
  onToggleSave,
  className,
  visibility,
  createdAt
}: LearnMediaCardProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const hasMultiple = mediaUrls.length > 1;
  const currentUrl = mediaUrls[currentIndex];
  const currentType = mediaTypes[currentIndex];
  const isVideo = currentType?.includes('video');

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % mediaUrls.length);
  };

  return (
    <>
      <Card className={cn("glass-card overflow-hidden group", className)}>
        {/* Media Container - Edge to edge */}
        <div 
          className="relative aspect-square cursor-pointer overflow-hidden bg-black/5"
          onClick={() => setFullScreenOpen(true)}
        >
          {isVideo ? (
            <div className="relative w-full h-full">
              <video 
                src={currentUrl} 
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </div>
          ) : (
            <img 
              src={currentUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}

          {/* Navigation Arrows */}
          {hasMultiple && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleNext}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              {/* Dots Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {mediaUrls.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === currentIndex ? "bg-white" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Media Type Badge */}
          <div className="absolute top-2 right-2 flex gap-1">
            {mediaTypes.some(t => t?.includes('video')) && (
              <span className="bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded">
                📹
              </span>
            )}
            {mediaUrls.length > 1 && (
              <span className="bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded">
                1/{mediaUrls.length}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-3 space-y-2">
          {/* Author */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate(`/profile/${authorId}`)}
          >
            <Avatar className="w-7 h-7">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback className="text-[10px]">{authorName?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium truncate">{authorName}</span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2">{title}</h3>
          
          {/* Actions - Lumatha style (no numbers) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <SymbolicHeart 
                likesCount={likesCount}
                isLiked={isLiked}
                onToggle={onToggleLike}
                size="sm"
              />
              <button 
                onClick={() => setCommentsOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShareOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <button onClick={onToggleSave}>
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-primary" />
              ) : (
                <Bookmark className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Full Screen Viewer */}
      <Dialog open={fullScreenOpen} onOpenChange={setFullScreenOpen}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 h-10 w-10 bg-white/10 text-white z-50"
              onClick={() => setFullScreenOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            {isVideo ? (
              <video 
                src={currentUrl} 
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
              />
            ) : (
              <img 
                src={currentUrl} 
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {hasMultiple && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/10 text-white"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/10 text-white"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Bottom Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 rounded-full px-4 py-2">
              <SymbolicHeart 
                likesCount={likesCount}
                isLiked={isLiked}
                onToggle={onToggleLike}
                size="md"
              />
              <button 
                onClick={() => { setFullScreenOpen(false); setCommentsOpen(true); }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <CommentsDialog 
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={id}
        postTitle={title}
      />

      {/* Share Dialog */}
      <ShareDialog 
        open={shareOpen}
        onOpenChange={setShareOpen}
        postId={id}
        postTitle={title}
        postContent={content || ''}
      />
    </>
  );
}
