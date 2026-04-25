import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, MessageCircle, Send, MoreVertical, ChevronLeft, ChevronRight,
  Volume2, VolumeX, Flag, Settings, Trash2, Download, Share2, Lock, Globe, Users,
  Play, Pause, Eye, Bookmark, Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StoryGroup } from './StoriesBar';

interface StoryViewerPremiumProps {
  groups: StoryGroup[];
  startGroupIndex: number;
  onClose: () => void;
  onDeleteStory?: (storyId: string) => void;
}

interface Comment {
  id: string;
  user_id: string;
  profile: any;
  content: string;
  created_at: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  delay: number;
  size: number;
}

export function StoryViewerPremium({ groups, startGroupIndex, onClose, onDeleteStory }: StoryViewerPremiumProps) {
  const { user, profile } = useAuth();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(startGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  const [viewers, setViewers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const currentGroup = groups[currentGroupIndex];
  const currentStory = currentGroup?.stories?.[currentStoryIndex];
  const isOwnStory = currentGroup?.isOwn;
  const totalStories = currentGroup?.stories?.length || 0;

  const activeStoryDurationMs = Math.max(15000, Number(currentStory?.duration || 15) * 1000);
  const progressStep = 100 / (activeStoryDurationMs / 50);

  const spawnFloatingHearts = useCallback(() => {
    const now = Date.now();
    const burst: FloatingHeart[] = Array.from({ length: 10 }).map((_, idx) => ({
      id: now + idx,
      x: Math.floor(Math.random() * 26) - 13,
      delay: Math.random() * 0.3,
      size: 16 + Math.floor(Math.random() * 12),
    }));

    setFloatingHearts((prev) => [...prev, ...burst]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((heart) => !burst.some((newHeart) => newHeart.id === heart.id)));
    }, 1800);
  }, []);

  // Progress timer
  useEffect(() => {
    if (isPaused || showComments || showOptions || showSettings || isLoading) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          handleNext();
          return 0;
        }
        return p + progressStep;
      });
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPaused, showComments, showOptions, showSettings, isLoading, currentStoryIndex, currentGroupIndex, progressStep]);

  // Load story data
  useEffect(() => {
    if (!currentStory?.id) return;
    setIsLoading(true);
    
    const loadData = async () => {
      // Load comments
      const { data: commentsData } = await supabase
        .from('story_comments')
        .select('*, profiles:user_id(name, avatar_url)')
        .eq('story_id', currentStory.id)
        .order('created_at', { ascending: true });
      
      setComments(commentsData || []);

      // Load viewers for own stories
      if (isOwnStory) {
        const { data: viewersData } = await supabase
          .from('story_views')
          .select('*, profiles:viewer_id(name, avatar_url)')
          .eq('story_id', currentStory.id);
        setViewers(viewersData || []);
      }

      // Check if liked
      const { data: likeData } = await supabase
        .from('story_reactions')
        .select('*')
        .eq('story_id', currentStory.id)
        .eq('user_id', user?.id)
        .single();
      
      if (likeData) {
        setLikedStories(prev => new Set([...prev, currentStory.id]));
      }

      // Record view
      if (!isOwnStory && user) {
        await supabase.from('story_views').upsert({
          story_id: currentStory.id,
          viewer_id: user.id,
          viewed_at: new Date().toISOString()
        }, { onConflict: 'story_id,viewer_id' });
      }

      setIsLoading(false);
    };

    loadData();
    setProgress(0);
  }, [currentStory?.id, isOwnStory, user]);

  const handleNext = useCallback(() => {
    if (currentStoryIndex < totalStories - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, totalStories, currentGroupIndex, groups.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIndex > 0) {
      const prevGroup = groups[currentGroupIndex - 1];
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentStoryIndex(prevGroup?.stories?.length - 1 || 0);
      setProgress(0);
    }
  }, [currentStoryIndex, currentGroupIndex, groups]);

  // Handle tap areas for navigation
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const screenWidth = window.innerWidth;
    
    const now = Date.now();
    
    // Double tap detection for like
    if (lastTapRef.current && now - lastTapRef.current.time < 300) {
      const dx = Math.abs(clientX - lastTapRef.current.x);
      const dy = Math.abs(clientY - lastTapRef.current.y);
      
      if (dx < 50 && dy < 50) {
        handleLike();
        return;
      }
    }
    
    lastTapRef.current = { time: now, x: clientX, y: clientY };

    // Single tap for navigation
    // Left 30% = prev, Right 30% = next, Middle = pause/play
    if (clientX < screenWidth * 0.3) {
      handlePrev();
    } else if (clientX > screenWidth * 0.7) {
      handleNext();
    } else {
      setIsPaused(prev => !prev);
    }
  };

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const diff = touchStartX - e.changedTouches[0].clientX;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  const handleLike = useCallback(async () => {
    if (!currentStory?.id || !user) return;

    const isLiked = likedStories.has(currentStory.id);
    
    // Show animation
    setShowHeartAnimation(true);
    spawnFloatingHearts();
    setTimeout(() => setShowHeartAnimation(false), 800);

    if (isLiked) {
      await supabase
        .from('story_reactions')
        .delete()
        .eq('story_id', currentStory.id)
        .eq('user_id', user.id);
      
      setLikedStories(prev => {
        const next = new Set(prev);
        next.delete(currentStory.id);
        return next;
      });
    } else {
      await supabase
        .from('story_reactions')
        .insert({
          story_id: currentStory.id,
          user_id: user.id,
          emoji: '❤️'
        });
      
      setLikedStories(prev => new Set([...prev, currentStory.id]));
    }
  }, [currentStory?.id, likedStories, spawnFloatingHearts, user]);

  const handleComment = async () => {
    if (!newComment.trim() || !currentStory?.id || !user) return;

    const { data } = await supabase
      .from('story_comments')
      .insert({
        story_id: currentStory.id,
        user_id: user.id,
        content: newComment.trim(),
        is_private: true
      })
      .select('*, profiles:user_id(name, avatar_url)')
      .single();

    if (data) {
      setComments(prev => [...prev, data]);
      setNewComment('');
    }
  };

  const handleDelete = async () => {
    if (!currentStory?.id || !isOwnStory) return;
    
    if (!confirm('Delete this story?')) return;

    await supabase.from('stories').delete().eq('id', currentStory.id);
    onDeleteStory?.(currentStory.id);
    toast.success('Story deleted');
    setShowOptions(false);
    handleNext();
  };

  const handleShare = async () => {
    if (!currentStory?.media_url) return;
    
    try {
      await navigator.clipboard.writeText(currentStory.media_url);
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const getStoryContent = () => {
    if (!currentStory) return null;

    // Text story
    if (currentStory.media_type === 'text') {
      try {
        const encoded = currentStory.media_url.split(',')[1] || '';
        let decoded = '';
        try {
          decoded = atob(encoded);
          decoded = decodeURIComponent(escape(decoded));
        } catch {
          decoded = atob(encoded);
        }
        const data = JSON.parse(decoded);
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex items-center justify-center p-6 sm:p-8 overflow-y-auto"
            style={{ background: data.bg || '#0a0f1e' }}
          >
            <p
              className="max-w-[42rem] text-white text-center font-black leading-[1.08] whitespace-pre-wrap break-words"
              style={{ fontSize: 'clamp(2rem, 8vw, 4.5rem)', overflowWrap: 'anywhere' }}
            >
              {data.text}
            </p>
          </motion.div>
        );
      } catch {
        return (
          <div className="w-full h-full flex items-center justify-center bg-[#0a0f1e]">
            <p className="text-white/50">Story unavailable</p>
          </div>
        );
      }
    }

    // Video
    if (currentStory.media_type === 'video') {
      return (
        <video
          ref={videoRef}
          src={currentStory.media_url}
          className="w-full h-full object-contain bg-black"
          autoPlay
          muted={isMuted}
          playsInline
          loop
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
        />
      );
    }

    // Image
    return (
      <motion.img
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        src={currentStory.media_url}
        alt="Story"
        className="w-full h-full object-contain bg-black"
        onLoad={() => setIsLoading(false)}
      />
    );
  };

  if (!currentGroup || !currentStory) return null;

  const isLiked = likedStories.has(currentStory.id);
  const likeCount = isLiked ? 1 : 0;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-black"
      ref={containerRef}
    >
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bars - Top */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2 pt-safe">
        {currentGroup.stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{
                width: idx < currentStoryIndex 
                  ? '100%' 
                  : idx === currentStoryIndex 
                    ? `${progress}%` 
                    : '0%'
              }}
              transition={{ duration: 0.05, ease: 'linear' }}
            />
          </div>
        ))}
      </div>

      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-safe">
        <div className="flex items-center justify-between">
          {/* Left - Back & Profile */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
            >
              <ChevronLeft size={20} />
            </motion.button>

            <Avatar className="w-10 h-10 border-2 border-white/30 ring-2 ring-black/20">
              <AvatarImage src={currentGroup.profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">
                {currentGroup.profile?.name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="text-white font-bold text-sm">
                {currentGroup.profile?.name || 'User'}
              </p>
              <p className="text-white/50 text-xs">
                {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Right - Controls */}
          <div className="flex items-center gap-2">
            {currentStory.media_type === 'video' && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMuted(m => !m)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowOptions(true)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
            >
              <MoreVertical size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Screen */}
      <div 
        className="absolute inset-0 w-full h-full"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {getStoryContent()}
      </div>

      {/* Double Tap Heart Animation - Instagram Style */}
      <AnimatePresence>
        {showHeartAnimation && (
          <motion.div
            initial={{ scale: 0, opacity: 1, y: 0 }}
            animate={{ 
              scale: 1.8, 
              opacity: 0, 
              y: -100,
            }}
            transition={{ 
              duration: 1, 
              ease: 'easeOut',
              scale: { duration: 0.4, ease: 'easeOut' },
              opacity: { duration: 0.6, delay: 0.4 },
              y: { duration: 1, ease: 'easeOut' }
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <Heart className="w-40 h-40 text-pink-500 fill-pink-500 drop-shadow-2xl filter blur-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Indicator */}
      <AnimatePresence>
        {isPaused && !showComments && !showOptions && !showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
              <Pause className="w-8 h-8 text-white" fill="white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* Caption/Description Section */}
        {currentStory.caption && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pt-8 pb-3"
          >
            <div className="mb-1">
              <p className="text-white/90 font-semibold text-sm mb-1">
                {currentGroup.profile?.name}
              </p>
              <p className="text-white text-sm leading-relaxed">
                {currentStory.caption}
              </p>
            </div>
          </motion.div>
        )}

        {/* Say Something Input - Only for non-Text/Dang stories */}
        {!isOwnStory && currentStory.media_type !== 'text' && !showComments && (
          <div className="px-4 py-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
            <div 
              className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2.5"
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Say something..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/50 outline-none"
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              {newComment.trim() && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={handleComment}
                  className="text-primary font-bold text-sm"
                >
                  Send
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* Viewers (own story) */}
        {isOwnStory && viewers.length > 0 && !showComments && (
          <div className="px-4 py-3 border-t border-white/10 mb-2">
            <div className="flex items-center gap-2 bg-black/40 rounded-2xl px-3 py-2">
              <Eye size={14} className="text-white/60" />
              <span className="text-white/80 text-xs font-medium">
                {viewers.length} view{viewers.length !== 1 ? 's' : ''}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                className="ml-auto text-white/60 text-xs font-medium"
              >
                See all
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Right Story Actions - Instagram style */}
      {!showComments && (
        <div className="absolute right-4 bottom-24 z-40 flex flex-col items-center gap-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={handleLike}
              className="text-white"
            >
              <Heart
                size={30}
                className={cn(
                  'transition-all duration-300',
                  isLiked ? 'fill-red-500 text-red-500' : 'fill-transparent text-white'
                )}
              />
            </motion.button>
            <span className="text-white text-xs font-bold">{likeCount}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={() => setShowComments(true)}
              className="text-white"
            >
              <MessageCircle size={30} />
            </motion.button>
            <span className="text-white text-xs font-bold">{comments.length}</span>
          </div>
        </div>
      )}

      {/* Floating hearts burst - YouTube livestream inspired */}
      <div className="absolute right-10 bottom-32 z-40 pointer-events-none">
        <AnimatePresence>
          {floatingHearts.map((heart) => (
            <motion.div
              key={heart.id}
              initial={{ opacity: 0, y: 0, x: 0, scale: 0.7 }}
              animate={{
                opacity: [0, 1, 0],
                y: -170,
                x: heart.x,
                scale: [0.7, 1, 1.1],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: 'easeOut', delay: heart.delay }}
              className="absolute"
            >
              <Heart
                style={{ width: heart.size, height: heart.size }}
                className="text-pink-500 fill-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.7)]"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation Hints */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-30 transition-opacity">
          <ChevronLeft size={40} className="text-white" />
        </div>
        <div className="absolute right-20 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-30 transition-opacity">
          <ChevronRight size={40} className="text-white" />
        </div>
      </div>

      {/* Options Menu */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowOptions(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0a0f1e] rounded-t-3xl sm:rounded-3xl p-2 border border-white/10"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-2" />
              
              {isOwnStory && (
                <>
                  <button
                    onClick={() => { setShowSettings(true); setShowOptions(false); }}
                    className="w-full flex items-center gap-4 p-4 text-white hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <Settings size={22} />
                    <span className="font-medium">Story Settings</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <Trash2 size={22} />
                    <span className="font-medium">Delete Story</span>
                  </button>
                </>
              )}
              
              {!isOwnStory && (
                <>
                  <button
                    onClick={() => { handleShare(); setShowOptions(false); }}
                    className="w-full flex items-center gap-4 p-4 text-white hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <Link2 size={22} />
                    <span className="font-medium">Copy Link</span>
                  </button>
                  <button
                    onClick={() => { toast.info('Reported'); setShowOptions(false); }}
                    className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <Flag size={22} />
                    <span className="font-medium">Report</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => setShowOptions(false)}
                className="w-full p-4 text-white/50 hover:bg-white/5 rounded-2xl mt-2 border-t border-white/10"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[100001] bg-[#0a0f1e] rounded-t-3xl max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3" />
            
            {/* Header */}
            <div className="px-4 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">
                  {isOwnStory ? 'Viewers & Comments' : 'Comments'}
                </h3>
                <button 
                  onClick={() => setShowComments(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[50vh] p-4 space-y-4">
              {/* Viewers for own story */}
              {isOwnStory && viewers.length > 0 && (
                <div className="mb-6">
                  <p className="text-white/50 text-xs font-bold uppercase mb-3">Viewers</p>
                  <div className="flex flex-wrap gap-2">
                    {viewers.map((v) => (
                      <div key={v.viewer_id} className="flex items-center gap-2 bg-white/5 rounded-full pl-1 pr-3 py-1">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={v.profiles?.avatar_url} />
                          <AvatarFallback className="text-[10px]">
                            {v.profiles?.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white text-xs">{v.profiles?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <p className="text-white/50 text-xs font-bold uppercase mb-3">Comments</p>
                {comments.length === 0 ? (
                  <p className="text-white/30 text-center py-8">No comments yet</p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={c.profile?.avatar_url} />
                          <AvatarFallback className="text-[10px] bg-primary">
                            {c.profile?.name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{c.profile?.name}</p>
                          <p className="text-white/70 text-sm">{c.content}</p>
                          <p className="text-white/30 text-xs mt-1">
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            {!isOwnStory && (
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/50 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                    className="text-primary disabled:text-white/30 font-medium"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && isOwnStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100002] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0a0f1e] rounded-t-3xl sm:rounded-3xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-white font-bold text-xl mb-6">Story Settings</h3>

              {/* Visibility */}
              <div className="mb-6">
                <label className="text-white/50 text-sm mb-3 block">Who can see this?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'public', label: 'Everyone', icon: Globe },
                    { id: 'friends', label: 'Friends', icon: Users },
                    { id: 'following', label: 'Following', icon: Eye },
                    { id: 'private', label: 'Only Me', icon: Lock }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/30 transition-all"
                    >
                      <Icon size={18} className="text-white/70" />
                      <span className="text-white text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-4 bg-primary rounded-xl text-white font-bold"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}

export default StoryViewerPremium;
