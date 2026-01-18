import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Volume2, VolumeX, MoreVertical, Play, ChevronUp, ChevronDown, Bookmark, BookmarkCheck } from 'lucide-react';
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
  isSaved?: boolean;
}

interface ShortsViewerProps {
  videos: ShortVideo[];
  initialIndex?: number;
  onClose: () => void;
  onLike: (videoId: string) => void;
  onSave?: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onProfileClick: (userId: string) => void;
}

export function ShortsViewer({
  videos,
  initialIndex = 0,
  onClose,
  onLike,
  onSave,
  onComment,
  onShare,
  onProfileClick,
}: ShortsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set(videos.filter(v => v.isLiked).map(v => v.id)));
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set(videos.filter(v => v.isSaved).map(v => v.id)));
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    videos.forEach(v => { counts[v.id] = v.likesCount; });
    return counts;
  });
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTapTime = useRef(0);
  const lastTapPosition = useRef({ x: 0, y: 0 });

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

  // Double tap to like with animation
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const position = 'touches' in e 
      ? { x: e.touches[0]?.clientX || lastTapPosition.current.x, y: e.touches[0]?.clientY || lastTapPosition.current.y }
      : { x: e.clientX, y: e.clientY };
    
    if (now - lastTapTime.current < 300) {
      // Double tap detected
      const videoId = currentVideo?.id;
      if (videoId && !likedVideos.has(videoId)) {
        setLikedVideos(prev => new Set(prev).add(videoId));
        setLikeCounts(prev => ({ ...prev, [videoId]: (prev[videoId] || 0) + 1 }));
        onLike(videoId);
      }
      
      // Show heart animation
      setHeartPosition(position);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
    
    lastTapTime.current = now;
    lastTapPosition.current = position;
  }, [currentVideo?.id, likedVideos, onLike]);

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

  const handleSave = (videoId: string) => {
    const isSaved = savedVideos.has(videoId);
    if (isSaved) {
      setSavedVideos(prev => { const next = new Set(prev); next.delete(videoId); return next; });
    } else {
      setSavedVideos(prev => new Set(prev).add(videoId));
    }
    onSave?.(videoId);
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
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-[60]">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header - Ultra Compact */}
      <div className="absolute top-0.5 left-0 right-0 z-50 flex items-center justify-between px-1.5 py-0.5 safe-area-inset-top">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 rounded-full h-7 w-7 p-0"
          onClick={onClose}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-white text-xs font-semibold">Shorts</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 rounded-full h-7 w-7 p-0"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Video Container - Optimized Full Screen */}
      <div className="flex-1 relative overflow-hidden">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out",
              index === currentIndex ? "translate-y-0 opacity-100 z-10" :
              index < currentIndex ? "-translate-y-full opacity-0 z-0" : "translate-y-full opacity-0 z-0"
            )}
            onClick={handleDoubleTap}
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
              poster=""
            />
            
            {/* Play/Pause overlay */}
            {!isPlaying && index === currentIndex && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              >
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Double Tap Heart Animation */}
        {showHeartAnimation && (
          <div 
            className="fixed z-[200] pointer-events-none animate-heart-pop"
            style={{ 
              left: heartPosition.x - 40, 
              top: heartPosition.y - 40 
            }}
          >
            <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-lg" />
          </div>
        )}

        {/* Navigation Arrows - Desktop/Tablet */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-12 z-50">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-white hover:bg-white/20 rounded-full h-7 w-7 p-0",
              currentIndex === 0 && "opacity-30 pointer-events-none"
            )}
            onClick={goToPrev}
            disabled={currentIndex === 0}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 bottom-16 z-50">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-white hover:bg-white/20 rounded-full h-7 w-7 p-0",
              currentIndex === videos.length - 1 && "opacity-30 pointer-events-none"
            )}
            onClick={goToNext}
            disabled={currentIndex === videos.length - 1}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Right Side Actions - Icons Only, Ultra Compact */}
        <div className="absolute right-1.5 bottom-20 flex flex-col items-center gap-3 z-50">
          {/* Like */}
          <button 
            onClick={() => handleLike(currentVideo.id)}
            className="flex flex-col items-center active:scale-90 transition-transform"
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg",
              likedVideos.has(currentVideo.id) ? "bg-red-500 scale-110" : "bg-black/50 backdrop-blur-sm"
            )}>
              <Heart className={cn(
                "w-5 h-5 text-white transition-transform",
                likedVideos.has(currentVideo.id) && "fill-current"
              )} />
            </div>
            <span className="text-white text-[10px] font-semibold mt-0.5 drop-shadow">{likeCounts[currentVideo.id] || 0}</span>
          </button>

          {/* Comment - Icon Only */}
          <button 
            onClick={() => onComment(currentVideo.id)}
            className="active:scale-90 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Save/Bookmark - Icon Only */}
          <button 
            onClick={() => handleSave(currentVideo.id)}
            className="active:scale-90 transition-transform"
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg",
              savedVideos.has(currentVideo.id) ? "bg-yellow-500" : "bg-black/50 backdrop-blur-sm"
            )}>
              {savedVideos.has(currentVideo.id) 
                ? <BookmarkCheck className="w-5 h-5 text-white" />
                : <Bookmark className="w-5 h-5 text-white" />
              }
            </div>
          </button>

          {/* Share - Icon Only */}
          <button 
            onClick={() => onShare(currentVideo.id)}
            className="active:scale-90 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Share2 className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Sound - Icon Only */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="active:scale-90 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center shadow-lg">
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </div>
          </button>
        </div>

        {/* Bottom User Info - Profile Picture + Name Side by Side */}
        <div className="absolute left-2 right-14 bottom-4 z-50">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onProfileClick(currentVideo.userId)}
          >
            <Avatar className="w-9 h-9 ring-2 ring-white/80 shadow-lg">
              <AvatarImage src={currentVideo.userAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white text-xs font-bold">
                {currentVideo.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold drop-shadow">@{currentVideo.username}</span>
              <p className="text-white/80 text-xs line-clamp-1 leading-tight drop-shadow">{currentVideo.title}</p>
            </div>
          </div>
        </div>

        {/* Video Counter - Top Right */}
        <div className="absolute top-9 right-1.5 z-50 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 shadow">
          <span className="text-white text-[10px] font-semibold">{currentIndex + 1}/{videos.length}</span>
        </div>

        {/* Swipe Hint - Only show on first video */}
        {currentIndex === 0 && videos.length > 1 && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="flex flex-col items-center gap-0.5 text-white/70">
              <ChevronUp className="w-5 h-5" />
              <span className="text-[10px]">Swipe</span>
            </div>
          </div>
        )}
      </div>

      {/* Heart Animation Styles */}
      <style>{`
        @keyframes heart-pop {
          0% { transform: scale(0); opacity: 0; }
          15% { transform: scale(1.2); opacity: 1; }
          30% { transform: scale(0.95); opacity: 1; }
          45% { transform: scale(1.1); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-heart-pop {
          animation: heart-pop 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}