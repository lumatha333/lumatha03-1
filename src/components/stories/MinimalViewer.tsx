import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Heart, MessageCircle, X, ChevronLeft, ChevronRight,
  Send, Smile, Zap, Flame, Star, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

// ============ TYPES ============
export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  mood?: 'calm' | 'energetic' | 'creative' | 'happy' | 'reflective';
  createdAt: string;
  duration?: number;
}

export interface StoryGroup {
  userId: string;
  userName: string;
  userAvatar: string;
  stories: Story[];
  hasUnseen: boolean;
}

export interface MinimalViewerProps {
  groups: StoryGroup[];
  startGroupIndex: number;
  startStoryIndex?: number;
  onClose: () => void;
  onStoryComplete?: (storyId: string) => void;
  onReact?: (storyId: string, reaction: string) => void;
  onReply?: (storyId: string, message: string) => void;
}

// ============ REACTIONS ============
const QUICK_REACTIONS = [
  { emoji: '❤️', icon: Heart, color: 'text-red-500' },
  { emoji: '🔥', icon: Flame, color: 'text-orange-500' },
  { emoji: '⚡', icon: Zap, color: 'text-yellow-500' },
  { emoji: '😍', icon: Smile, color: 'text-pink-500' },
  { emoji: '🎵', icon: Music, color: 'text-purple-500' },
];

// ============ MAIN COMPONENT ============
export function MinimalViewer({
  groups,
  startGroupIndex,
  startStoryIndex = 0,
  onClose,
  onStoryComplete,
  onReact,
  onReply,
}: MinimalViewerProps) {
  // Navigation state
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(startStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // UI state
  const [showReactions, setShowReactions] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [heartAnimation, setHeartAnimation] = useState<{ x: number; y: number } | null>(null);
  
  // YouTube-style heart animation state
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const heartIdRef = useRef(0);
  
  // Refs
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartY = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const totalStories = currentGroup?.stories.length || 0;

  // ============ PROGRESS TIMER ============
  useEffect(() => {
    if (isPaused || showReply) return;

    const storyDuration = currentStory?.duration || 5; // seconds
    const interval = 50; // ms
    const increment = (100 / (storyDuration * 1000)) * interval;

    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          nextStory();
          return 0;
        }
        return p + increment;
      });
    }, interval);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPaused, showReply, currentStory, groupIndex, storyIndex]);

  // ============ NAVIGATION ============
  const nextStory = useCallback(() => {
    if (storyIndex < totalStories - 1) {
      setStoryIndex(s => s + 1);
      setProgress(0);
      onStoryComplete?.(currentStory?.id || '');
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(g => g + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIndex, totalStories, groupIndex, groups.length, currentStory, onStoryComplete, onClose]);

  const prevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(s => s - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex(g => g - 1);
      setStoryIndex(groups[groupIndex - 1]?.stories.length - 1 || 0);
      setProgress(0);
    }
  }, [storyIndex, groupIndex, groups]);

  const goToStory = (index: number) => {
    setStoryIndex(index);
    setProgress(0);
  };

  // ============ GESTURE HANDLERS ============
  const handleTap = (e: React.MouseEvent | React.TouchEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    if (side === 'left') {
      prevStory();
    } else {
      nextStory();
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setHeartAnimation({ x, y });
    onReact?.(currentStory?.id || '', '❤️');
    
    setTimeout(() => setHeartAnimation(null), 1000);
  };

  const handlePan = (event: any, info: PanInfo) => {
    // Swipe up = react, Swipe down = exit
    if (info.offset.y < -50) {
      setShowReactions(true);
    } else if (info.offset.y > 100) {
      onClose();
    }
  };

  // ============ REPLY ============
  const handleReply = () => {
    if (!replyText.trim() || !currentStory) return;
    onReply?.(currentStory.id, replyText);
    setReplyText('');
    setShowReply(false);
  };

  // YouTube-style floating heart animation
  const handleHeartClick = () => {
    const id = heartIdRef.current++;
    const x = 20 + Math.random() * 60; // Random x position between 20% and 80%
    setFloatingHearts(prev => [...prev, { id, x }]);
    setIsLiked(true);
    setLikeCount(prev => prev + 1);
    
    // Remove heart after animation
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 2000);
  };

  const removeHeart = (id: number) => {
    setFloatingHearts(prev => prev.filter(h => h.id !== id));
  };

  if (!currentStory) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-black"
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handlePan}
    >
      {/* PROGRESS BARS - Subtle Top */}
      <div className="absolute top-0 left-0 right-0 z-50 p-2 pt-12 sm:pt-4">
        <div className="flex gap-1">
          {currentGroup.stories.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
              onClick={() => goToStory(idx)}
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{
                  width: idx < storyIndex ? '100%' : 
                         idx === storyIndex ? `${progress}%` : '0%'
                }}
                transition={{ duration: 0 }}
              />
            </div>
          ))}
        </div>

        {/* User Info - Minimal (time only, no profile pic) */}
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-white/50 text-xs">
            {new Date(currentStory.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Touch Zones */}
        <div className="absolute inset-0 flex z-10">
          <div 
            className="flex-1" 
            onClick={(e) => handleTap(e, 'left')}
          />
          <div 
            className="flex-1" 
            onClick={(e) => handleTap(e, 'right')}
            onDoubleClick={handleDoubleTap}
          />
        </div>

        {/* Media */}
        <motion.div
          key={currentStory.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              playsInline
              loop={false}
              onEnded={nextStory}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
        </motion.div>

        {/* Heart Animation */}
        <AnimatePresence>
          {heartAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0, y: -50 }}
              className="absolute pointer-events-none z-20"
              style={{ left: heartAnimation.x - 40, top: heartAnimation.y - 40 }}
            >
              <Heart className="w-20 h-20 text-red-500 fill-red-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caption Overlay */}
        {currentStory.caption && (
          <div className="absolute bottom-44 left-4 right-4 z-20">
            <p className="text-white text-lg font-medium drop-shadow-lg">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Profile Info - Below caption */}
        {currentGroup && (
          <div className="absolute bottom-36 left-4 z-20 flex items-center gap-2.5">
            <img
              src={currentGroup.userAvatar}
              alt={currentGroup.userName}
              className="w-9 h-9 rounded-full object-cover border border-white/20"
            />
            <span className="text-white text-sm font-medium drop-shadow-lg">
              {currentGroup.userName}
            </span>
          </div>
        )}
      </div>

      {/* FLOATING HEARTS ANIMATION - YouTube Live Style */}
      <FloatingHearts hearts={floatingHearts} onRemove={removeHeart} />

      {/* BOTTOM CONTROLS - YouTube Live Style */}
      <div className="absolute bottom-0 left-0 right-0 z-40 p-4 pb-8">
        {/* Quick Reactions */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="flex items-center justify-center gap-4 mb-4"
            >
              {QUICK_REACTIONS.map((reaction) => (
                <motion.button
                  key={reaction.emoji}
                  whileHover={{ scale: 1.2, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    onReact?.(currentStory.id, reaction.emoji);
                    setShowReactions(false);
                  }}
                  className={cn(
                    "w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center",
                    "text-2xl shadow-lg hover:bg-white/30 transition-colors"
                  )}
                >
                  {reaction.emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply Input */}
        <AnimatePresence>
          {showReply ? (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-[#1a1a2e] rounded-2xl p-4 mb-4"
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Send a message..."
                  className="flex-1 bg-white/10 rounded-full px-4 py-3 text-white placeholder:text-white/40 outline-none"
                  autoFocus
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="p-3 rounded-full bg-white text-black disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Message Input Trigger */}
              <button
                onClick={() => setShowReply(true)}
                className="flex-1 bg-white/10 backdrop-blur-md rounded-full px-5 py-3.5 text-left text-white/60 text-sm hover:bg-white/20 transition-colors"
              >
                Send message...
              </button>

              {/* YouTube-style Heart Button with Counter */}
              <motion.button
                onClick={handleHeartClick}
                whileTap={{ scale: 0.9 }}
                className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-red-500/20 transition-colors group"
              >
                <Heart className={cn(
                  "w-6 h-6 transition-colors",
                  isLiked ? "fill-red-500 text-red-500" : "text-white group-hover:text-red-400"
                )} />
                {likeCount > 0 && (
                  <span className="text-white text-sm font-medium">{likeCount}</span>
                )}
              </motion.button>

              {/* Reaction Button */}
              <button
                onClick={() => setShowReactions(!showReactions)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  showReactions ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          )}
        </AnimatePresence>

        {/* Hint Text */}
        <p className="text-center text-white/30 text-xs mt-4">
          Tap sides to navigate • Double tap to like • Swipe up to react • Swipe down to exit
        </p>
      </div>

      {/* PAUSE OVERLAY */}
      {isPaused && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-white text-center">
            <p className="text-lg font-medium">Paused</p>
            <p className="text-sm text-white/60">Hold to resume</p>
          </div>
        </div>
      )}
    </motion.div>,
    document.body
  );
}

// ============ FLOATING HEARTS COMPONENT (YouTube Live Style) ============
function FloatingHearts({
  hearts,
  onRemove,
}: {
  hearts: { id: number; x: number }[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ y: '100%', opacity: 1, scale: 0.5 }}
            animate={{ y: '-20%', opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            onAnimationComplete={() => onRemove(heart.id)}
            className="absolute bottom-20"
            style={{ left: `${heart.x}%` }}
          >
            <Heart className="w-8 h-8 fill-red-500 text-red-500" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============ PREVIEW COMPONENT ============
type ContentType = 'gallery' | 'dang' | 'text' | 'default';

const RING_STYLES: Record<ContentType, string> = {
  // Lumatha theme blue for gallery
  gallery: 'bg-gradient-to-tr from-blue-500 via-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
  // White and green for dang
  dang: 'bg-gradient-to-tr from-emerald-400 via-white to-green-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
  // Instagram-like orange for text
  text: 'bg-gradient-to-tr from-orange-500 via-amber-400 to-yellow-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]',
  // Default: no special ring, just white/gray
  default: 'bg-white/20',
};

export function StoryPreview({
  group,
  onClick,
  size = 'md',
  contentType = 'default',
  hasUnseen = false,
}: {
  group: StoryGroup;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  contentType?: ContentType;
  hasUnseen?: boolean;
}) {
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const ringClass = hasUnseen && contentType !== 'default' 
    ? RING_STYLES[contentType]
    : hasUnseen 
      ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500'
      : 'bg-white/20';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2"
    >
      <div className={cn(
        "rounded-full p-[3px] transition-all duration-300",
        ringClass
      )}>
        <img
          src={group.userAvatar}
          alt={group.userName}
          className={cn(
            "rounded-full object-cover",
            sizeClasses[size]
          )}
        />
      </div>
      <span className="text-xs text-white/80 truncate max-w-[4rem]">
        {group.userName}
      </span>
    </motion.button>
  );
}

export default MinimalViewer;
