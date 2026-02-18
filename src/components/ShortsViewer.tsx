import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Play, Bookmark, BookmarkCheck, MoreVertical, Download, Calendar, Eye, ThumbsDown, Ban, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShortVideo {
  id: string;
  url: string;
  title: string;
  username: string;
  userAvatar?: string;
  userId: string;
  likesCount: number;
  commentsCount?: number;
  viewsCount?: number;
  isLiked: boolean;
  isSaved?: boolean;
  isOwner?: boolean;
  createdAt?: string;
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
  onBlock?: (userId: string) => void;
  onNotInterested?: (videoId: string) => void;
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
  onBlock,
  onNotInterested,
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

  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTapTime = useRef(0);
  const lastTapPosition = useRef({ x: 0, y: 0 });
  const isSwiping = useRef(false);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      video.currentTime = 0;
      video.muted = isMuted;
      if (isPlaying) video.play().catch(() => {});

      const updateProgress = () => {
        if (video.duration) setProgress((video.currentTime / video.duration) * 100);
      };
      video.addEventListener('timeupdate', updateProgress);
      return () => video.removeEventListener('timeupdate', updateProgress);
    }
  }, [currentIndex, isPlaying, isMuted]);

  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (idx !== currentIndex) { v.pause(); v.currentTime = 0; }
    });
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) { setCurrentIndex(prev => prev - 1); setProgress(0); }
      else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) { setCurrentIndex(prev => prev + 1); setProgress(0); }
      else if (e.key === 'Escape') onClose();
      else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'm') setIsMuted(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = Math.abs(touchStartY.current - e.touches[0].clientY);
    if (diff > 10) isSwiping.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const timeDiff = Date.now() - touchStartTime.current;
    const velocity = Math.abs(diff) / timeDiff;
    const threshold = velocity > 0.5 ? 30 : 80;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < videos.length - 1) { setCurrentIndex(prev => prev + 1); setProgress(0); }
      else if (diff < 0 && currentIndex > 0) { setCurrentIndex(prev => prev - 1); setProgress(0); }
    }
  };

  const togglePlay = useCallback(() => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      if (video.paused) { video.play(); setIsPlaying(true); }
      else { video.pause(); setIsPlaying(false); }
    }
  }, [currentIndex]);

  // Only toggle play/mute on the video area itself (not UI buttons)
  const handleVideoAreaTap = useCallback((e: React.MouseEvent) => {
    if (isSwiping.current) return;
    const now = Date.now();
    const position = { x: e.clientX, y: e.clientY };

    if (now - lastTapTime.current < 300) {
      // Double tap — like
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
      // Single tap — toggle mute
      setIsMuted(prev => !prev);
    }
    lastTapTime.current = now;
    lastTapPosition.current = position;
  }, [currentVideo?.id, likedVideos, onLike]);

  const handleLike = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
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

  const handleSave = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    const isSaved = savedVideos.has(videoId);
    if (isSaved) setSavedVideos(prev => { const next = new Set(prev); next.delete(videoId); return next; });
    else setSavedVideos(prev => new Set(prev).add(videoId));
    onSave?.(videoId);
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentVideo) return;
    try {
      const response = await fetch(currentVideo.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentVideo.title || 'video'}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Download failed', err); }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!currentVideo) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col select-none">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-[110]">
        <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      {/* Video Swipe Container — touch events only here */}
      <div
        className="absolute inset-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-out",
              index === currentIndex ? "translate-y-0 opacity-100 z-10" :
              index < currentIndex ? "-translate-y-full opacity-0 z-0" : "translate-y-full opacity-0 z-0"
            )}
            // Only the video itself gets the tap handler
            onClick={handleVideoAreaTap}
          >
            <video
              ref={(el) => { if (el) videoRefs.current.set(index, el); }}
              src={video.url}
              className="absolute inset-0 w-full h-full object-cover bg-black"
              loop playsInline muted={isMuted}
            />
            {!isPlaying && index === currentIndex && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-md">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Double Tap Heart — above video, below UI */}
      {showHeartAnimation && (
        <div
          className="fixed z-[120] pointer-events-none animate-heart-pop"
          style={{ left: heartPosition.x - 40, top: heartPosition.y - 40 }}
        >
          <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-2xl" />
        </div>
      )}

      {/* ═══ TOP BAR — z-[130] so it's always clickable ═══ */}
      <div className="absolute top-0 left-0 right-0 z-[130] pointer-events-none">
        <div className="flex items-center justify-between px-3 pt-3 pb-1 pointer-events-auto">
          {/* Back + Profile */}
          <div className="flex items-center gap-2">
            <button
              className="h-9 w-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              className="flex items-center gap-2 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onProfileClick(currentVideo.userId); }}
            >
              <Avatar className="w-9 h-9 ring-2 ring-white/50">
                <AvatarImage src={currentVideo.userAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold">
                  {currentVideo.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-semibold drop-shadow-lg">@{currentVideo.username}</span>
            </button>
          </div>

          {/* Triple-dot Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-black/90 backdrop-blur-xl border-white/15 text-white min-w-[200px] rounded-2xl p-1"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem onClick={() => handleDownload()} className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10 cursor-pointer">
                <Download className="w-4 h-4 text-blue-400" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10" disabled>
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Posted {formatDate(currentVideo.createdAt)}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10" disabled>
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>{currentVideo.viewsCount ?? 0} views</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10" disabled>
                <Heart className="w-4 h-4 text-red-400" />
                <span>{likeCounts[currentVideo.id] || 0} likes</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10" disabled>
                <MessageCircle className="w-4 h-4 text-green-400" />
                <span>{currentVideo.commentsCount ?? 0} comments</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onNotInterested?.(currentVideo.id); }}
                className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10 cursor-pointer"
              >
                <ThumbsDown className="w-4 h-4 text-yellow-400" />
                <span>Not interested</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onBlock?.(currentVideo.userId); }}
                className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10 text-red-400 focus:text-red-400 cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                <span>Block</span>
              </DropdownMenuItem>
              {currentVideo.isOwner && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete?.(currentVideo.id); }}
                    className="gap-3 rounded-xl px-3 py-2.5 focus:bg-red-500/20 text-red-400 focus:text-red-400 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ═══ BOTTOM BAR — z-[130] so always clickable ═══ */}
      <div className="absolute bottom-0 left-0 right-0 z-[130] pointer-events-none">
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        
        <div className="relative pointer-events-auto px-4 pb-8 pt-4">
          {/* Title/Description */}
          <p className="text-white/90 text-sm line-clamp-2 leading-snug drop-shadow-lg mb-4 max-w-[78%]">
            {currentVideo.title}
          </p>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            {/* Like */}
            <button
              onClick={(e) => handleLike(e, currentVideo.id)}
              className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            >
              <Heart className={cn(
                "w-7 h-7 transition-all duration-200",
                likedVideos.has(currentVideo.id) ? "text-red-500 fill-red-500 scale-110" : "text-white"
              )} />
            </button>

            {/* Comment */}
            <button
              onClick={(e) => { e.stopPropagation(); onComment(currentVideo.id); }}
              className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            >
              <MessageCircle className="w-7 h-7 text-white" />
            </button>

            {/* Save */}
            <button
              onClick={(e) => handleSave(e, currentVideo.id)}
              className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            >
              {savedVideos.has(currentVideo.id)
                ? <BookmarkCheck className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                : <Bookmark className="w-7 h-7 text-white" />
              }
            </button>

            {/* Share */}
            <button
              onClick={(e) => { e.stopPropagation(); onShare(currentVideo.id); }}
              className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            >
              <Share2 className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heart-pop {
          0% { transform: scale(0); opacity: 0; }
          15% { transform: scale(1.3); opacity: 1; }
          30% { transform: scale(0.9); opacity: 1; }
          45% { transform: scale(1.15); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-heart-pop { animation: heart-pop 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}
