import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Volume2, VolumeX, MoreVertical, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ShortVideo {
  id: string;
  url: string;
  title: string;
  username: string;
  userAvatar?: string;
  userId: string;
  likesCount: number;
  isLiked: boolean;
}

interface ShortsViewerProps {
  videos: ShortVideo[];
  initialIndex?: number;
  onClose: () => void;
  onLike: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onProfileClick: (userId: string) => void;
}

export function ShortsViewer({
  videos,
  initialIndex = 0,
  onClose,
  onLike,
  onComment,
  onShare,
  onProfileClick,
}: ShortsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const touchStartY = useRef(0);

  const currentVideo = videos[currentIndex];

  // Handle video autoplay
  useEffect(() => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      video.currentTime = 0;
      if (isPlaying) {
        video.play().catch(() => {});
      }
      video.muted = isMuted;
    }
    
    // Pause other videos
    videoRefs.current.forEach((v, idx) => {
      if (idx !== currentIndex) {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [currentIndex, isPlaying, isMuted]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length, onClose]);

  // Touch/Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < videos.length - 1) {
        // Swipe up - next video
        setCurrentIndex(prev => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe down - previous video
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  const togglePlay = () => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  if (!currentVideo) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full"
          onClick={onClose}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <span className="text-white font-semibold">Shorts</span>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full"
        >
          <MoreVertical className="w-6 h-6" />
        </Button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative overflow-hidden">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-transform duration-300",
              index === currentIndex ? "translate-y-0 opacity-100" :
              index < currentIndex ? "-translate-y-full opacity-0" : "translate-y-full opacity-0"
            )}
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(index, el);
              }}
              src={video.url}
              className="w-full h-full object-contain"
              loop
              playsInline
              muted={isMuted}
              onClick={togglePlay}
            />
            
            {/* Play/Pause overlay */}
            {!isPlaying && index === currentIndex && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/30"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Right Side Actions */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-50">
          {/* Avatar */}
          <div className="relative">
            <Avatar 
              className="w-12 h-12 ring-2 ring-white cursor-pointer"
              onClick={() => onProfileClick(currentVideo.userId)}
            >
              <AvatarImage src={currentVideo.userAvatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {currentVideo.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
              +
            </div>
          </div>

          {/* Like */}
          <button 
            onClick={() => onLike(currentVideo.id)}
            className="flex flex-col items-center gap-1"
          >
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center",
              currentVideo.isLiked ? "bg-red-500" : "bg-white/20"
            )}>
              <Heart className={cn("w-6 h-6 text-white", currentVideo.isLiked && "fill-current")} />
            </div>
            <span className="text-white text-xs font-medium">{currentVideo.likesCount}</span>
          </button>

          {/* Comment */}
          <button 
            onClick={() => onComment(currentVideo.id)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Comment</span>
          </button>

          {/* Share */}
          <button 
            onClick={() => onShare(currentVideo.id)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Share</span>
          </button>

          {/* Sound */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
            </div>
          </button>
        </div>

        {/* Bottom User Info */}
        <div className="absolute left-3 right-20 bottom-6 z-50">
          <div 
            className="flex items-center gap-2 mb-2 cursor-pointer"
            onClick={() => onProfileClick(currentVideo.userId)}
          >
            <span className="text-white font-semibold">@{currentVideo.username}</span>
          </div>
          <p className="text-white/90 text-sm line-clamp-2">{currentVideo.title}</p>
        </div>

        {/* Progress Dots */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-50">
          {videos.slice(Math.max(0, currentIndex - 2), Math.min(videos.length, currentIndex + 3)).map((_, idx) => {
            const actualIdx = Math.max(0, currentIndex - 2) + idx;
            return (
              <div
                key={actualIdx}
                className={cn(
                  "w-1 rounded-full transition-all",
                  actualIdx === currentIndex ? "h-6 bg-white" : "h-2 bg-white/40"
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
