import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Play, ChevronUp, ChevronDown, Bookmark, BookmarkCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

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
  isOwner?: boolean;
}

interface ShortsViewerProps {
  videos: ShortVideo[];
  initialIndex?: number;
  onClose: () => void;
  onLike: (videoId: string) => void;
  onSave?: (videoId: string) => void;
  onComment: (videoId: string) => void;
  onShare: (videoId: string) => void;
  onDelete?: (videoId: string) => void;
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
  onDelete,
  onProfileClick,
}: ShortsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState('0:00');
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

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          const remaining = video.duration - video.currentTime;
          setRemainingTime(formatTime(remaining));
        }
      };

      video.addEventListener('timeupdate', updateProgress);
      video.addEventListener('loadedmetadata', () => {
        setRemainingTime(formatTime(video.duration));
      });
      return () => {
        video.removeEventListener('timeupdate', updateProgress);
      };
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

  // Toggle mute on tap
  const handleVideoTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const position = 'touches' in e 
      ? { x: e.touches[0]?.clientX || lastTapPosition.current.x, y: e.touches[0]?.clientY || lastTapPosition.current.y }
      : { x: e.clientX, y: e.clientY };
    
    if (now - lastTapTime.current < 300) {
      // Double tap - like
      const videoId = currentVideo?.id;
      if (videoId && !likedVideos.has(videoId)) {
        setLikedVideos(prev => new Set(prev).add(videoId));
        setLikeCounts(prev => ({ ...prev, [videoId]: (prev[videoId] || 0) + 1 }));
        onLike(videoId);
      }
      
      setHeartPosition(position);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    } else {
      // Single tap - toggle mute
      setIsMuted(prev => !prev);
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
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-[60]">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-1 left-0 right-0 z-50 flex items-center justify-between px-2 py-1 safe-area-inset-top">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0"
          onClick={onClose}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* Duration Timer */}
        <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white text-sm font-medium">{remainingTime}</span>
        </div>
        
        {/* Menu with Delete */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-full h-9 w-9 p-0"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black/90 border-white/20 text-white">
            {currentVideo.isOwner && (
              <DropdownMenuItem 
                onClick={() => onDelete?.(currentVideo.id)}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Video Container - Full Screen */}
      <div className="absolute inset-0 overflow-hidden">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-out",
              index === currentIndex ? "translate-y-0 opacity-100 z-10" :
              index < currentIndex ? "-translate-y-full opacity-0 z-0" : "translate-y-full opacity-0 z-0"
            )}
            onClick={handleVideoTap}
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(index, el);
              }}
              src={video.url}
              className="w-full h-full object-contain bg-black"
              loop
              playsInline
              muted={isMuted}
              poster=""
              style={{ maxHeight: '100vh', maxWidth: '100vw' }}
            />
            
            {/* Play/Pause overlay */}
            {!isPlaying && index === currentIndex && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/30"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              >
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
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
              left: heartPosition.x - 50, 
              top: heartPosition.y - 50 
            }}
          >
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
          </div>
        )}

        {/* Navigation Arrows - Desktop/Tablet */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-16 z-50">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-white hover:bg-white/20 rounded-full h-10 w-10 p-0",
              currentIndex === 0 && "opacity-30 pointer-events-none"
            )}
            onClick={goToPrev}
            disabled={currentIndex === 0}
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
        </div>
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 bottom-20 z-50">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "text-white hover:bg-white/20 rounded-full h-10 w-10 p-0",
              currentIndex === videos.length - 1 && "opacity-30 pointer-events-none"
            )}
            onClick={goToNext}
            disabled={currentIndex === videos.length - 1}
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        </div>

        {/* Right Side Actions - Bigger Icons */}
        <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-50">
          {/* Like */}
          <button 
            onClick={(e) => { e.stopPropagation(); handleLike(currentVideo.id); }}
            className="flex flex-col items-center active:scale-90 transition-transform"
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl",
              likedVideos.has(currentVideo.id) ? "bg-red-500 scale-110" : "bg-black/60 backdrop-blur-sm"
            )}>
              <Heart className={cn(
                "w-6 h-6 text-white transition-transform",
                likedVideos.has(currentVideo.id) && "fill-current"
              )} />
            </div>
            <span className="text-white text-xs font-bold mt-1 drop-shadow-lg">{likeCounts[currentVideo.id] || 0}</span>
          </button>

          {/* Comment */}
          <button 
            onClick={(e) => { e.stopPropagation(); onComment(currentVideo.id); }}
            className="active:scale-90 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </button>

          {/* Save/Bookmark */}
          <button 
            onClick={(e) => { e.stopPropagation(); handleSave(currentVideo.id); }}
            className="active:scale-90 transition-transform"
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl",
              savedVideos.has(currentVideo.id) ? "bg-yellow-500" : "bg-black/60 backdrop-blur-sm"
            )}>
              {savedVideos.has(currentVideo.id) 
                ? <BookmarkCheck className="w-6 h-6 text-white" />
                : <Bookmark className="w-6 h-6 text-white" />
              }
            </div>
          </button>

          {/* Share */}
          <button 
            onClick={(e) => { e.stopPropagation(); onShare(currentVideo.id); }}
            className="active:scale-90 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Share2 className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>

        {/* Bottom User Info */}
        <div className="absolute left-3 right-16 bottom-6 z-50">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onProfileClick(currentVideo.userId); }}
          >
            <Avatar className="w-11 h-11 ring-2 ring-white shadow-xl">
              <AvatarImage src={currentVideo.userAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white text-sm font-bold">
                {currentVideo.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-white text-base font-bold drop-shadow-lg">@{currentVideo.username}</span>
              <p className="text-white/90 text-sm line-clamp-2 leading-snug drop-shadow">{currentVideo.title}</p>
            </div>
          </div>
        </div>

        {/* Swipe Hint - Only show on first video */}
        {currentIndex === 0 && videos.length > 1 && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="flex flex-col items-center gap-1 text-white/80">
              <ChevronUp className="w-6 h-6" />
              <span className="text-xs font-medium">Swipe up</span>
            </div>
          </div>
        )}

        {/* Mute indicator - shows briefly when mute state changes */}
        {isMuted && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm opacity-0 animate-fade-out">
              <span className="text-white text-lg">🔇</span>
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes heart-pop {
          0% { transform: scale(0); opacity: 0; }
          15% { transform: scale(1.3); opacity: 1; }
          30% { transform: scale(0.9); opacity: 1; }
          45% { transform: scale(1.15); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-heart-pop {
          animation: heart-pop 0.8s ease-out forwards;
        }
        @keyframes fade-out {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        .animate-fade-out {
          animation: fade-out 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}