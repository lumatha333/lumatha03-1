import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SymbolicHeart } from './SymbolicHeart';
import LazyBlurImage from '@/components/LazyBlurImage';
import { 
  ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  MessageCircle, Share2, Play, Volume2, VolumeX, Maximize
} from 'lucide-react';
import { FullScreenMediaViewer } from '@/components/FullScreenMediaViewer';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface LearnMediaCardProps {
  id: string;
  title: string;
  description?: string;
  mediaUrls: string[];
  mediaTypes: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  visibility: 'public' | 'private';
  isSaved: boolean;
  isLiked: boolean;
  likesCount: number;
  onToggleSave: () => void;
  onToggleLike: () => void;
  onComment?: () => void;
  onShare?: () => void;
  createdAt: string;
}

export function LearnMediaCard({
  id,
  title,
  description,
  mediaUrls,
  mediaTypes,
  authorId,
  authorName,
  authorAvatar,
  visibility,
  isSaved,
  isLiked,
  likesCount,
  onToggleSave,
  onToggleLike,
  onComment,
  onShare,
  createdAt
}: LearnMediaCardProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const hasMultiple = mediaUrls.length > 1;
  
  const currentMedia = mediaUrls[currentIndex];
  const currentType = mediaTypes[currentIndex] || 'image';
  const isVideo = currentType.startsWith('video');

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % mediaUrls.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  return (
    <>
      <Card className="glass-card overflow-hidden group">
        {/* Media Section - Edge to edge */}
        <div className="relative aspect-square bg-black">
          {isVideo ? (
            <video
              src={currentMedia}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop
              playsInline
              autoPlay
              onClick={() => setFullscreenOpen(true)}
            />
          ) : (
            <LazyBlurImage
              src={currentMedia}
              alt={title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setFullscreenOpen(true)}
            />
          )}
          
          {/* Navigation arrows for multi-media */}
          {hasMultiple && (
            <>
              <button 
                onClick={prevMedia}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={nextMedia}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
              {/* Dots indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {mediaUrls.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === currentIndex ? "bg-white w-3" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Video controls */}
          {isVideo && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
              </button>
              <button
                onClick={() => setFullscreenOpen(true)}
                className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
              >
                <Maximize className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}
        </div>
        
        <CardContent className="p-3 space-y-2">
          {/* Author row */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate(`/profile/${authorId}`)}
          >
            <Avatar className="w-7 h-7">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback className="text-[10px]">{authorName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium truncate">{authorName}</span>
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-sm line-clamp-2">{title}</h3>
          
          {/* Actions - Zenpeace style (no numbers) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <SymbolicHeart 
                likesCount={likesCount} 
                isLiked={isLiked} 
                onToggle={onToggleLike}
                size="sm"
              />
              {onComment && (
                <button onClick={onComment}>
                  <MessageCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              )}
              {onShare && (
                <button onClick={onShare}>
                  <Share2 className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              )}
            </div>
            <button onClick={onToggleSave}>
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-primary fill-primary" />
              ) : (
                <Bookmark className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>
      
      {/* Fullscreen viewer */}
      <FullScreenMediaViewer
        open={fullscreenOpen}
        onOpenChange={setFullscreenOpen}
        mediaUrls={mediaUrls}
        mediaTypes={mediaTypes}
        initialIndex={currentIndex}
        title={title}
        isLiked={isLiked}
        onLike={onToggleLike}
        onComment={onComment}
        onShare={onShare}
      />
    </>
  );
}
