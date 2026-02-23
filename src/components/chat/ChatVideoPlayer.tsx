import { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ChatVideoPlayerProps {
  src: string;
  className?: string;
}

export function ChatVideoPlayer({ src, className }: ChatVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const hideTimer = useRef<NodeJS.Timeout>();

  // Intersection observer for autoplay when visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.7 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setIsPlaying(true));
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v && v.duration) {
      setProgress((v.currentTime / v.duration) * 100);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    videoRef.current?.requestFullscreen?.();
  };

  const handleTap = () => {
    togglePlay();
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative rounded-2xl overflow-hidden bg-black cursor-pointer group', className)}
      onClick={handleTap}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-72 object-contain"
        muted={isMuted}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={() => setThumbnailReady(true)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Play overlay when paused */}
      {!isPlaying && thumbnailReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300',
        showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
      )}>
        <Progress value={progress} className="h-1 mb-2 bg-white/20 [&>div]:bg-primary" />
        <div className="flex items-center justify-between">
          <button onClick={toggleMute} className="text-white/80 hover:text-white p-1">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button onClick={handleFullscreen} className="text-white/80 hover:text-white p-1">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Buffering shimmer */}
      {!thumbnailReady && (
        <div className="aspect-video bg-muted animate-pulse flex items-center justify-center">
          <Play className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
