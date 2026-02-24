import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LazyImage } from '@/components/LazyImage';
import { CommentsDialog } from '@/components/CommentsDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { SymbolicHeart } from '@/components/lumatha/SymbolicHeart';
import { FullScreenMediaViewer } from '@/components/FullScreenMediaViewer';
import { 
  Star, MoreVertical, Copy, Edit, Trash2, Heart, X, ChevronLeft, ChevronRight, 
  Play, MessageCircle, Share2, Download, UserPlus, UserMinus, VolumeX, Volume2,
  Maximize, MessageSquareOff
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

// Global state for video sound synchronization
let globalVideoMuted = true;
let globalVideoListeners: Set<(muted: boolean) => void> = new Set();

// Global state for single video playback - only one video plays at a time
let currentPlayingVideo: HTMLVideoElement | null = null;

const setGlobalVideoMuted = (muted: boolean) => {
  globalVideoMuted = muted;
  globalVideoListeners.forEach(listener => listener(muted));
};

const subscribeToGlobalMute = (listener: (muted: boolean) => void) => {
  globalVideoListeners.add(listener);
  return () => globalVideoListeners.delete(listener);
};

const setCurrentPlayingVideo = (video: HTMLVideoElement | null) => {
  // Pause the previously playing video
  if (currentPlayingVideo && currentPlayingVideo !== video) {
    currentPlayingVideo.pause();
  }
  currentPlayingVideo = video;
};

interface PostSettings {
  commentsOff?: boolean;
  shareOff?: boolean;
}

interface EnhancedPostCardProps {
  post: Post & { profiles?: Profile };
  isSaved: boolean;
  isLiked: boolean;
  likesCount: number;
  currentUserId: string;
  onToggleSave: (id: string) => void;
  onToggleLike: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdate?: ((id: string, updates: Partial<Post>) => void) | (() => void) | (() => Promise<void>);
}

export function EnhancedPostCard({ 
  post, isSaved, isLiked, likesCount, currentUserId, 
  onToggleSave, onToggleLike, onDelete, onUpdate 
}: EnhancedPostCardProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [imageOpen, setImageOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullText, setShowFullText] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(globalVideoMuted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  
  // Owner privacy controls - stored in localStorage per post
  const [postSettings, setPostSettings] = useState<PostSettings>(() => {
    const saved = localStorage.getItem(`post_settings_${post.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  
  const updatePostSetting = (key: keyof PostSettings, value: boolean) => {
    const newSettings = { ...postSettings, [key]: value };
    setPostSettings(newSettings);
    localStorage.setItem(`post_settings_${post.id}`, JSON.stringify(newSettings));
  };
  
  // Get all media URLs
  const mediaUrls = post.media_urls?.length ? post.media_urls : (post.file_url ? [post.file_url] : []);
  const mediaTypes = post.media_types?.length ? post.media_types : (post.file_type ? [post.file_type] : []);
  const hasMedia = mediaUrls.length > 0;
  const hasMultipleMedia = mediaUrls.length > 1;
  const currentMedia = mediaUrls[currentMediaIndex] || '/placeholder.svg';
  const currentMediaType = mediaTypes[currentMediaIndex] || 'image';
  
  const isOwner = currentUserId === post.user_id;
  const isLongText = (post.content?.length || 0) > 200;
  const isVideo = currentMediaType?.includes('video');

  // Subscribe to global mute state
  useEffect(() => {
    const unsubscribe = subscribeToGlobalMute((muted) => {
      setIsMuted(muted);
      if (videoRef.current) {
        videoRef.current.muted = muted;
      }
    });
    return () => { unsubscribe(); };
  }, []);

  // Video autoplay on scroll - only one video plays at a time
  useEffect(() => {
    if (!isVideo || !videoRef.current || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Set this as the current playing video (pauses others)
            setCurrentPlayingVideo(videoRef.current);
            videoRef.current?.play();
            setIsPlaying(true);
          } else {
            // Only pause if this video is the current one
            if (currentPlayingVideo === videoRef.current) {
              videoRef.current?.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isVideo, currentMediaIndex]);

  useEffect(() => {
    // Check if following this user
    const checkFollow = async () => {
      if (isOwner || !currentUserId) return;
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', post.user_id)
        .single();
      setIsFollowing(!!data);
    };
    checkFollow();
  }, [post.user_id, currentUserId, isOwner]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${post.content}\n\n- ${post.profiles?.name || 'Anonymous'}`);
    toast.success("Copied to clipboard!");
  };

  const handleDownload = async () => {
    if (!hasMedia) return;
    
    // Ghost posts cannot be downloaded by anyone
    const isGhostPost = post.category === 'ghost';
    if (isGhostPost) {
      toast.error('Ghost posts cannot be downloaded');
      return;
    }
    try {
      const response = await fetch(currentMedia);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `post-${post.id}-${currentMediaIndex}.${isVideo ? 'mp4' : 'jpg'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleSaveEdit = async () => {
    if (!isOwner) return;
    try {
      const { error } = await supabase.from('posts').update({ content: editContent }).eq('id', post.id);
      if (error) throw error;
      setIsEditing(false);
      toast.success("Post updated!");
      if (onUpdate) onUpdate(post.id, { content: editContent });
    } catch {
      toast.error("Failed to update post");
    }
  };

  const toggleFollow = async () => {
    if (isOwner) return;
    try {
      if (isFollowing) {
        await supabase.from('follows').delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', post.user_id);
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: post.user_id
        });
        setIsFollowing(true);
        toast.success('Following! Content will appear in Friends feed');
      }
    } catch {
      toast.error('Failed to update follow');
    }
  };

  const nextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev + 1) % mediaUrls.length);
  };

  const prevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  const handleShare = () => {
    setShareOpen(true);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    // Update global state - all videos sync
    setGlobalVideoMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
    setIsMuted(newMuted);
  };

  const toggleVideoFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        // Set this as the current playing video (pauses others)
        setCurrentPlayingVideo(videoRef.current);
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        if (currentPlayingVideo === videoRef.current) {
          setCurrentPlayingVideo(null);
        }
      }
    }
  };

  return (
    <>
      <Card ref={cardRef} className="group hover-lift glass-card overflow-hidden border-border h-full flex flex-col">
        {/* User Info Header - FB Style */}
        <div className="flex items-center justify-between p-2.5 border-b border-border/30">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/profile/${post.user_id}`)}
          >
            <Avatar className="w-9 h-9 ring-2 ring-primary/20">
              <AvatarImage src={post.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-sm">
                {post.profiles?.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.profiles?.name || 'Anonymous'}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(post.created_at || '').toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          {/* Three dots menu */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-border w-48 z-[100] bg-popover shadow-xl rounded-xl">
              <DropdownMenuItem onClick={handleCopy} className="text-xs">
                <Copy className="w-3.5 h-3.5 mr-2" /> Copy text
              </DropdownMenuItem>
              {hasMedia && post.category !== 'ghost' && (
                <DropdownMenuItem onClick={handleDownload} className="text-xs">
                  <Download className="w-3.5 h-3.5 mr-2" /> Download media
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {isOwner ? (
                <>
                  {onUpdate && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-xs">
                      <Edit className="w-3.5 h-3.5 mr-2" /> Edit post
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => updatePostSetting('commentsOff', !postSettings.commentsOff)} className="text-xs">
                    <MessageSquareOff className="w-3.5 h-3.5 mr-2" /> 
                    {postSettings.commentsOff ? '✓ Comments OFF' : 'Turn off comments'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updatePostSetting('shareOff', !postSettings.shareOff)} className="text-xs">
                    <Share2 className="w-3.5 h-3.5 mr-2" /> 
                    {postSettings.shareOff ? '✓ Sharing OFF' : 'Turn off sharing'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive text-xs">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete post
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <DropdownMenuItem onClick={toggleFollow} className="text-xs">
                  {isFollowing ? (
                    <><UserMinus className="w-3.5 h-3.5 mr-2" /> Not interested</>
                  ) : (
                    <><UserPlus className="w-3.5 h-3.5 mr-2" /> Interested (Follow)</>
                  )}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content - No title, just content text */}
        <div className="px-2.5 py-2">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 rounded glass-card border-border min-h-[60px] text-sm bg-background text-foreground"
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs" onClick={handleSaveEdit}>Save</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setIsEditing(false); setEditContent(post.content || ''); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <p className={`text-foreground/90 whitespace-pre-wrap ${!showFullText && isLongText ? 'line-clamp-3' : ''}`}>
                {post.content}
              </p>
              {isLongText && (
                <button onClick={() => setShowFullText(!showFullText)} className="text-primary text-xs mt-1 hover:underline font-medium">
                  {showFullText ? 'See less' : 'See more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Media Section - Full size, not square */}
        {hasMedia && (
          <div className="relative cursor-pointer overflow-hidden" onClick={() => !isVideo && setImageOpen(true)}>
            {isVideo ? (
              <div className="relative bg-black">
                <video 
                  ref={videoRef}
                  src={currentMedia} 
                  className="w-full max-h-[500px] object-contain"
                  controls={false}
                  muted={isMuted}
                  loop
                  playsInline
                  onClick={handleVideoClick}
                />
                {/* Video Controls Overlay */}
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button size="icon" variant="secondary" className="h-7 w-7 bg-black/60 hover:bg-black/80" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
                  </Button>
                  <Button size="icon" variant="secondary" className="h-7 w-7 bg-black/60 hover:bg-black/80" onClick={toggleVideoFullscreen}>
                    <Maximize className="w-3.5 h-3.5 text-white" />
                  </Button>
                </div>
                {/* Play/Pause indicator */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20" onClick={handleVideoClick}>
                    <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                )}
                {/* No video badge text — cleaner experience */}
              </div>
            ) : (
              <div className="relative bg-black/5">
                <LazyImage
                  src={currentMedia}
                  alt="Post media"
                  className="w-full h-auto max-h-[500px] object-contain"
                  aspectRatio="auto"
                />
              </div>
            )}
            
            {/* Multi-media navigation */}
            {hasMultipleMedia && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full h-7 w-7" onClick={prevMedia}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full h-7 w-7" onClick={nextMedia}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {mediaUrls.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentMediaIndex ? 'bg-primary w-3' : 'bg-white/60'}`}
                      onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(idx); }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Full Screen Image Viewer — centered, with like/comment/save below */}
        <FullScreenMediaViewer
          open={imageOpen}
          onOpenChange={setImageOpen}
          mediaUrls={mediaUrls}
          mediaTypes={mediaTypes}
          initialIndex={currentMediaIndex}
          title={post.title}
          likesCount={likesCount}
          isLiked={isLiked}
          onLike={() => onToggleLike(post.id)}
          onComment={() => { setImageOpen(false); setCommentsOpen(true); }}
          onShare={() => { setImageOpen(false); setShareOpen(true); }}
          isGhostPost={post.category === 'ghost'}
        />

        {/* Action buttons - Strict owner controls applied */}
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/50 mt-auto relative">
          {/* Symbolic Heart — NO number counts shown, ever */}
          <button
            onClick={() => onToggleLike(post.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 h-8 rounded-lg hover:bg-muted/40 transition-colors`}
          >
            <SymbolicHeart likesCount={likesCount} isLiked={isLiked} />
          </button>
          
          {/* Comments - hidden if owner turned off */}
          {!postSettings.commentsOff && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCommentsOpen(true)}
              className="flex-1 gap-1 h-8 text-muted-foreground"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">Comment</span>
            </Button>
          )}
          
          {/* Share - hidden if owner turned off */}
          {!postSettings.shareOff && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex-1 gap-1 h-8 text-muted-foreground"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Share</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleSave(post.id)}
            className={`h-8 w-8 p-0 ${isSaved ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Star className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </Card>

      {/* Comments Dialog */}
      <CommentsDialog
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        postId={post.id}
        postTitle={post.title}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        postId={post.id}
        postTitle={post.title}
        postContent={post.content || undefined}
      />
    </>
  );
}
