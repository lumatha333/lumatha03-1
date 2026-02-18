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
  const [isMuted, setIsMuted] = useState(true);
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
    if (isSaved) setSavedVideos(prev => { const next = new Set(prev); next.delete(videoId); return next; });
    else setSavedVideos(prev => new Set(prev).add(videoId));
    onSave?.(videoId);
  };

  const handleDownload = async () => {
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
    } catch (e) { console.error('Download failed', e); }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!currentVideo) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-[60]">
        <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      {/* Video Container */}
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
              ref={(el) => { if (el) videoRefs.current.set(index, el); }}
              src={video.url}
              className="w-full h-full object-contain bg-black"
              loop playsInline muted={isMuted}
              style={{ maxHeight: '100vh', maxWidth: '100vw' }}
            />
            {!isPlaying && index === currentIndex && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-md">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Double Tap Heart */}
        {showHeartAnimation && (
          <div className="fixed z-[200] pointer-events-none animate-heart-pop" style={{ left: heartPosition.x - 40, top: heartPosition.y - 40 }}>
            <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-2xl" />
          </div>
        )}

        {/* Top Bar: Profile left, triple-dot right */}
        <div className="absolute top-0 left-0 right-0 z-50 safe-area-inset-top">
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            {/* Back + Profile */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 h-9 w-9 rounded-full" onClick={onClose}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div 
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
              </div>
            </div>

            {/* Triple-dot menu with counts */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 h-9 w-9 rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-white/15 text-white min-w-[200px] rounded-2xl p-1">
                <DropdownMenuItem onClick={handleDownload} className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10">
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
                <DropdownMenuItem onClick={() => onNotInterested?.(currentVideo.id)} className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10">
                  <ThumbsDown className="w-4 h-4 text-yellow-400" />
                  <span>Not interested</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBlock?.(currentVideo.userId)} className="gap-3 rounded-xl px-3 py-2.5 focus:bg-white/10 text-red-400 focus:text-red-400">
                  <Ban className="w-4 h-4" />
                  <span>Block</span>
                </DropdownMenuItem>
                {currentVideo.isOwner && (
                  <>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => onDelete?.(currentVideo.id)} className="gap-3 rounded-xl px-3 py-2.5 focus:bg-red-500/20 text-red-400 focus:text-red-400">
                      <X className="w-4 h-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Bottom: Title/Description + Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
          {/* Description */}
          <div className="px-4 pb-2">
            <p className="text-white/90 text-sm line-clamp-2 leading-snug drop-shadow-lg max-w-[80%]">
              {currentVideo.title}
            </p>
          </div>

          {/* Action Bar - Instagram style bottom row */}
          <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-t from-black/60 to-transparent">
            {/* Like */}
            <button onClick={(e) => { e.stopPropagation(); handleLike(currentVideo.id); }} className="flex flex-col items-center active:scale-90 transition-transform">
              <Heart className={cn("w-7 h-7 transition-all", likedVideos.has(currentVideo.id) ? "text-red-500 fill-red-500" : "text-white")} />
            </button>
            {/* Comment */}
            <button onClick={(e) => { e.stopPropagation(); onComment(currentVideo.id); }} className="active:scale-90 transition-transform">
              <MessageCircle className="w-7 h-7 text-white" />
            </button>
            {/* Save */}
            <button onClick={(e) => { e.stopPropagation(); handleSave(currentVideo.id); }} className="active:scale-90 transition-transform">
              {savedVideos.has(currentVideo.id) 
                ? <BookmarkCheck className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                : <Bookmark className="w-7 h-7 text-white" />
              }
            </button>
            {/* Share */}
            <button onClick={(e) => { e.stopPropagation(); onShare(currentVideo.id); }} className="active:scale-90 transition-transform">
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
