import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Heart, MessageCircle, Send, Play, Bookmark, BookmarkCheck, MoreVertical, Download, Calendar, Eye, ThumbsDown, Ban, X, Volume2, VolumeX, Music } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useVideoSound } from '@/contexts/VideoSoundContext';
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

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
};

export function ShortsViewer({
  videos, initialIndex = 0, onClose, onLike, onSave, onComment, onShare, onDelete, onProfileClick, onBlock, onNotInterested,
}: ShortsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { globalMuted, setGlobalMuted } = useVideoSound();
  const [isMuted, setIsMuted] = useState(globalMuted);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set(videos.filter(v => v.isLiked).map(v => v.id)));
  const [savedVideos, setSavedVideos] = useState<Set<string>>(new Set(videos.filter(v => v.isSaved).map(v => v.id)));
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() => {
    const c: Record<string, number> = {};
    videos.forEach(v => { c[v.id] = v.likesCount; });
    return c;
  });
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });

  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const lastTapTime = useRef(0);
  const isSwiping = useRef(false);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    setIsMuted(globalMuted);
  }, [globalMuted]);

  useEffect(() => {
    const activeVideo = videoRefs.current.get(currentIndex);
    if (activeVideo) {
      activeVideo.muted = isMuted;
    }
  }, [currentIndex, isMuted]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Play current video
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

  // Pause non-current videos
  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
      if (idx !== currentIndex) { v.pause(); v.currentTime = 0; }
    });
  }, [currentIndex]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) { setCurrentIndex(p => p - 1); setProgress(0); }
      else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) { setCurrentIndex(p => p + 1); setProgress(0); }
      else if (e.key === 'Escape') onClose();
      else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'm') {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        setGlobalMuted(nextMuted);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length, onClose, togglePlay, isMuted, setGlobalMuted]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (Math.abs(touchStartY.current - e.touches[0].clientY) > 10) isSwiping.current = true;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    const velocity = Math.abs(diff) / (Date.now() - touchStartTime.current);
    const threshold = velocity > 0.5 ? 30 : 80;
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < videos.length - 1) { setCurrentIndex(p => p + 1); setProgress(0); }
      else if (diff < 0 && currentIndex > 0) { setCurrentIndex(p => p - 1); setProgress(0); }
    }
  };

  const togglePlay = useCallback(() => {
    const video = videoRefs.current.get(currentIndex);
    if (video) {
      if (video.paused) { video.play(); setIsPlaying(true); }
      else { video.pause(); setIsPlaying(false); }
    }
  }, [currentIndex]);

  const handleVideoAreaTap = useCallback((e: React.MouseEvent) => {
    if (isSwiping.current) return;
    const now = Date.now();
    const position = { x: e.clientX, y: e.clientY };
    if (now - lastTapTime.current < 300) {
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
      togglePlay();
    }
    lastTapTime.current = now;
  }, [currentVideo?.id, likedVideos, onLike, togglePlay]);

  const handleLike = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    const isLiked = likedVideos.has(videoId);
    if (isLiked) {
      setLikedVideos(prev => { const n = new Set(prev); n.delete(videoId); return n; });
      setLikeCounts(prev => ({ ...prev, [videoId]: Math.max(0, (prev[videoId] || 1) - 1) }));
    } else {
      setLikedVideos(prev => new Set(prev).add(videoId));
      setLikeCounts(prev => ({ ...prev, [videoId]: (prev[videoId] || 0) + 1 }));
    }
    onLike(videoId);
  };

  const handleSave = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (savedVideos.has(videoId)) setSavedVideos(prev => { const n = new Set(prev); n.delete(videoId); return n; });
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
      a.href = url; a.download = `${currentVideo.title || 'video'}.mp4`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Download failed', err); }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!currentVideo) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black select-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
      
      {/* Video Swipe Container — full screen */}
      <div
        className="absolute inset-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-out will-change-transform",
              index === currentIndex ? "translate-y-0 z-10" :
              index < currentIndex ? "-translate-y-full z-0" : "translate-y-full z-0"
            )}
            onClick={handleVideoAreaTap}
          >
            <video
              ref={(el) => { if (el) videoRefs.current.set(index, el); }}
              src={video.url}
              className="absolute inset-0 w-full h-full object-cover"
              loop playsInline muted={isMuted}
            />
            {/* Pause overlay */}
            {!isPlaying && index === currentIndex && (
              <div className="absolute inset-0 flex items-center justify-center z-20"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                <div className="w-20 h-20 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" fill="white" fillOpacity={0.9} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Double Tap Heart Animation */}
      {showHeartAnimation && (
        <div className="fixed z-[200] pointer-events-none animate-heart-pop"
          style={{ left: heartPosition.x - 40, top: heartPosition.y - 40 }}>
          <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-2xl" />
        </div>
      )}

      {/* ═══ TOP BAR ═══ */}
      <div className="absolute top-0 left-0 right-0 z-[130] pointer-events-none safe-area-top">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 pointer-events-auto">
          {/* Back button */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>

          <span className="text-white font-bold text-base tracking-wide">Reels</span>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                setGlobalMuted(nextMuted);
              }}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white min-w-[200px] rounded-2xl p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem onClick={() => handleDownload()} className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10 cursor-pointer">
                  <Download className="w-4 h-4 text-blue-400" /><span>Save video</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10" disabled>
                  <Calendar className="w-4 h-4 text-purple-400" /><span>{formatDate(currentVideo.createdAt)}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10" disabled>
                  <Eye className="w-4 h-4 text-cyan-400" /><span>{formatCount(currentVideo.viewsCount ?? 0)} views</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onNotInterested?.(currentVideo.id); }}
                  className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10 cursor-pointer"
                >
                  <ThumbsDown className="w-4 h-4 text-yellow-400" /><span>Not interested</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onBlock?.(currentVideo.userId); }}
                  className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10 text-red-400 cursor-pointer"
                >
                  <Ban className="w-4 h-4" /><span>Block</span>
                </DropdownMenuItem>
                {currentVideo.isOwner && (
                  <>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete?.(currentVideo.id); }}
                      className="gap-3 rounded-xl px-3 py-2.5 focus:bg-red-500/20 text-red-400 cursor-pointer"
                    >
                      <X className="w-4 h-4" /><span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT ACTION BAR — Instagram Reels style ═══ */}
      <div className="absolute right-3 z-[130] flex flex-col items-center gap-6 pointer-events-auto" style={{ bottom: '160px' }}>
        {/* Like */}
        <button
          onClick={(e) => handleLike(e, currentVideo.id)}
          className="flex flex-col items-center gap-1 active:scale-75 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <Heart className={cn(
              "w-7 h-7 transition-all duration-200",
              likedVideos.has(currentVideo.id) ? "text-red-500 fill-red-500 scale-110" : "text-white"
            )} />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow-lg">{formatCount(likeCounts[currentVideo.id] || 0)}</span>
        </button>

        {/* Comment */}
        <button
          onClick={(e) => { e.stopPropagation(); onComment(currentVideo.id); }}
          className="flex flex-col items-center gap-1 active:scale-75 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow-lg">{formatCount(currentVideo.commentsCount ?? 0)}</span>
        </button>

        {/* Share / Send */}
        <button
          onClick={(e) => { e.stopPropagation(); onShare(currentVideo.id); }}
          className="flex flex-col items-center gap-1 active:scale-75 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <Send className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* Bookmark / Save */}
        <button
          onClick={(e) => handleSave(e, currentVideo.id)}
          className="flex flex-col items-center gap-1 active:scale-75 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
            {savedVideos.has(currentVideo.id)
              ? <BookmarkCheck className="w-7 h-7 text-yellow-400 fill-yellow-400" />
              : <Bookmark className="w-7 h-7 text-white" />
            }
          </div>
        </button>

        {/* Music disc (spinning) */}
        <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden animate-spin-slow">
          <Avatar className="w-full h-full">
            <AvatarImage src={currentVideo.userAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-pink-600 to-purple-700 text-white text-[10px]">
              <Music className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* ═══ BOTTOM SECTION — User info + description ═══ */}
      <div className="absolute bottom-0 left-0 right-16 z-[130] pointer-events-none">
        {/* Gradient fade */}
        <div className="h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="bg-black/80 px-4 pb-6 pt-0 pointer-events-auto -mt-1">
          {/* User row */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); onProfileClick(currentVideo.userId); }}
              className="flex-shrink-0"
            >
              <Avatar className="w-9 h-9 ring-2 ring-white/60">
                <AvatarImage src={currentVideo.userAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs font-bold">
                  {currentVideo.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onProfileClick(currentVideo.userId); }}
            >
              <span className="text-white text-[13px] font-bold">{currentVideo.username}</span>
            </button>
            <button className="ml-1 border border-white/60 rounded-md px-3 py-0.5 text-white text-[11px] font-semibold active:scale-95 transition-transform">
              Follow
            </button>
          </div>

          {/* Description */}
          <p className="text-white/90 text-[13px] leading-[18px] line-clamp-2">
            {currentVideo.title}
          </p>

          {/* Audio track bar */}
          <div className="flex items-center gap-2 mt-2">
            <Music className="w-3 h-3 text-white/60" />
            <div className="overflow-hidden flex-1">
              <p className="text-white/50 text-[11px] whitespace-nowrap animate-marquee">
                Original Audio — {currentVideo.username}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-[2px] bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-100 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Reel counter indicator */}
      {videos.length > 1 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[130]">
          <span className="text-white/40 text-[10px] font-medium">{currentIndex + 1}/{videos.length}</span>
        </div>
      )}

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
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 8s linear infinite; }
      `}</style>
    </div>,
    document.body
  );
}
