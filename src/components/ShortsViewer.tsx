import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Volume2, VolumeX, MoreVertical, Play, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set(videos.filter(v => v.isLiked).map(v => v.id)));
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    videos.forEach(v => { counts[v.id] = v.likesCount; });
    return counts;
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  const currentVideo = videos[currentIndex];

  // Handle video autoplay and progress
  useEffect(() => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      video.currentTime = 0;
      video.muted = isMuted;
      
      if (isPlaying) {
        video.play().catch(() => {});
      }

      const updateProgress = () => {
        if (video.duration) {
          setProgress((video.currentTime / video.duration) * 100);
        }
      };

      video.addEventListener('timeupdate', updateProgress);
      return () => video.removeEventListener('timeupdate', updateProgress);
    }
  }, [currentIndex, isPlaying, isMuted]);

  // Pause other videos when switching
  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (idx !== currentIndex) {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setProgress(0);
      } else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setProgress(0);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        setIsMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length, onClose]);

  // Touch/Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const timeDiff = Date.now() - touchStartTime.current;
    
    // Quick swipe detection
    const velocity = Math.abs(diff) / timeDiff;
    const threshold = velocity > 0.5 ? 30 : 80;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < videos.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setProgress(0);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setProgress(0);
      }
    }
  };

  const togglePlay = useCallback(() => {
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
  }, [currentIndex]);

  const handleLike = (videoId: string) => {
    const isLiked = likedVideos.has(videoId);
    if (isLiked) {
      setLikedVideos(prev => { const next = new Set(prev); next.delete(videoId); return next; });
      setLikeCounts(prev => ({ ...prev, [videoId]: Math.max(0, (prev[videoId] || 1) - 1) }));
    } else {
      setLikedVideos(prev => new Set(prev).add(videoId));
      setLikeCounts(prev => ({ ...prev, [videoId]: (prev[videoId] || 0) + 1 }));
    }
    onLike(videoId);
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    }
  };

  if (!currentVideo) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-[60]">
        <div 
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header - Compact */}
      <div className="absolute top-1 left-0 right-0 z-50 flex items-center justify-between px-2 py-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
          onClick={onClose}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-white text-sm font-medium">Shorts</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative overflow-hidden">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out",
              index === currentIndex ? "translate-y-0 opacity-100 z-10" :
              index < currentIndex ? "-translate-y-full opacity-0 z-0" : "translate-y-full opacity-0 z-0"
            )}
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(index, el);
              }}
              src={video.url}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={isMuted}
              onClick={togglePlay}
              poster=""
            />
            
            {/* Play/Pause overlay */}
            {!isPlaying && index === currentIndex && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20"
                onClick={togglePlay}
              >
                <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Navigation Arrows - Desktop/Tablet */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-16 z-50">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-white hover:bg-white/20 rounded-full h-8 w-8 p-0",
              currentIndex === 0 && "opacity-30 pointer-events-none"
            )}
            onClick={goToPrev}
            disabled={currentIndex === 0}
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        </div>
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 bottom-20 z-50">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-white hover:bg-white/20 rounded-full h-8 w-8 p-0",
              currentIndex === videos.length - 1 && "opacity-30 pointer-events-none"
            )}
            onClick={goToNext}
            disabled={currentIndex === videos.length - 1}
          >
            <ChevronDown className="w-5 h-5" />
          </Button>
        </div>

        {/* Right Side Actions - Compact */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-3 z-50">
          {/* Avatar - Small */}
          <div className="relative mb-1">
            <Avatar 
              className="w-9 h-9 ring-2 ring-white cursor-pointer"
              onClick={() => onProfileClick(currentVideo.userId)}
            >
              <AvatarImage src={currentVideo.userAvatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {currentVideo.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">
              +
            </div>
          </div>

          {/* Like - Compact */}
          <button 
            onClick={() => handleLike(currentVideo.id)}
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              likedVideos.has(currentVideo.id) ? "bg-red-500" : "bg-black/40 backdrop-blur-sm"
            )}>
              <Heart className={cn(
                "w-5 h-5 text-white transition-transform",
                likedVideos.has(currentVideo.id) && "fill-current scale-110"
              )} />
            </div>
            <span className="text-white text-[10px] font-medium">{likeCounts[currentVideo.id] || 0}</span>
          </button>

          {/* Comment - Compact */}
          <button 
            onClick={() => onComment(currentVideo.id)}
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
          >
            <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[10px] font-medium">Chat</span>
          </button>

          {/* Share - Compact */}
          <button 
            onClick={() => onShare(currentVideo.id)}
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
          >
            <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-[10px] font-medium">Share</span>
          </button>

          {/* Sound - Compact */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
          >
            <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </div>
          </button>
        </div>

        {/* Bottom User Info - Compact */}
        <div className="absolute left-2 right-14 bottom-4 z-50">
          <div 
            className="flex items-center gap-1.5 mb-1 cursor-pointer"
            onClick={() => onProfileClick(currentVideo.userId)}
          >
            <span className="text-white text-sm font-semibold">@{currentVideo.username}</span>
          </div>
          <p className="text-white/90 text-xs line-clamp-2 leading-relaxed">{currentVideo.title}</p>
        </div>

        {/* Video Counter */}
        <div className="absolute top-12 right-2 z-50 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="text-white text-[10px] font-medium">{currentIndex + 1}/{videos.length}</span>
        </div>

        {/* Swipe Hint - Only show on first video */}
        {currentIndex === 0 && videos.length > 1 && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="flex flex-col items-center gap-1 text-white/70">
              <ChevronUp className="w-5 h-5" />
              <span className="text-[10px]">Swipe up</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
