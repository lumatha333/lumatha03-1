import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, MessageCircle, Share2, Star, MoreVertical, Copy, Maximize, Heart, Plane } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface VideoCardProps {
  post: Post & { profiles?: Profile };
  isSaved: boolean;
  isLiked: boolean;
  likesCount: number;
  currentUserId: string;
  onToggleSave: () => void;
  onToggleLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onPlay: () => void;
}

const FEED_MENU_OPEN_EVENT = 'feed-post-menu-opened';

export function VideoCard({
  post, isSaved, isLiked,
  onToggleSave, onToggleLike, onComment, onShare, onPlay,
}: VideoCardProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuItemClass = 'min-h-[42px] text-[13px] text-white rounded-lg hover:bg-[#1f2937] focus:bg-[#1f2937]';

  const videoUrl = post.file_url || post.media_urls?.[0] || '';
  const profileData = post.profiles;
  
  const displayName = (profileData as any)?.username || (profileData as any)?.name || (profileData as any)?.username || profileData?.name || 'Lumatha Member';
  const handle = profileData?.username ? `@${profileData.username}` : '';
  
  const timestamp = post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(`${post.title}\n\n${videoUrl}\n\n- ${displayName}`);
    toast.success("Copied to clipboard!");
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleMenuOpened = (event: Event) => {
      const openedPostId = (event as CustomEvent<string>).detail;
      if (openedPostId !== post.id) {
        setMenuOpen(false);
      }
    };

    window.addEventListener(FEED_MENU_OPEN_EVENT, handleMenuOpened as EventListener);
    return () => {
      window.removeEventListener(FEED_MENU_OPEN_EVENT, handleMenuOpened as EventListener);
    };
  }, [post.id]);

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open);
    if (open) {
      window.dispatchEvent(new CustomEvent(FEED_MENU_OPEN_EVENT, { detail: post.id }));
    }
  };

  const openFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else videoRef.current.requestFullscreen();
  };

  return (
    <Card className="group hover-lift bg-card overflow-hidden border-b border-border pb-4 flex flex-col rounded-none md:rounded-2xl w-full md:max-w-[680px] md:mx-auto">
      <CardContent className="flex-1 flex flex-col p-4 space-y-3">
        {/* TOP: User Info and Menu */}
        <div className="flex items-start justify-between gap-2">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-1"
            onClick={() => profileData?.id && navigate(`/profile/${profileData.id}`)}
          >
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage src={profileData?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                {profileData?.name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[14px]">{displayName}</span>
                {post.category === 'travel_story' && (
                  <span 
                    className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}
                  >
                    <Plane className="w-3 h-3" />
                    Travel
                  </span>
                )}
                {handle && <span className="text-xs text-muted-foreground">{handle}</span>}
              </div>
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            </div>
          </div>
          
          <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full border border-white/15 bg-[#111827] hover:bg-[#1f2937]" aria-label="Open post actions">
                <MoreVertical className="w-4 h-4 text-white" />
              </Button>
            </DropdownMenuTrigger>

            {menuOpen && (
              <DropdownMenuPortal>
                <button
                  type="button"
                  aria-label="Close post actions"
                  className="fixed inset-0 z-[250] bg-black/20"
                  onClick={() => setMenuOpen(false)}
                />
              </DropdownMenuPortal>
            )}

            <DropdownMenuContent align="end" side="bottom" sideOffset={8} collisionPadding={12} className="z-[260] min-w-[180px] bg-[#0b1220] border border-slate-400/40 text-white max-h-[70vh] overflow-y-auto shadow-[0_20px_56px_rgba(0,0,0,0.62)]">
              <DropdownMenuItem onClick={handleCopy} className={menuItemClass}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Title */}
        <h3 className="font-bold text-lg line-clamp-2">{post.title}</h3>
      </CardContent>

      {/* MIDDLE: Video Player */}
      <div 
        className="relative w-full cursor-pointer bg-black overflow-hidden"
        style={{ maxHeight: '450px' }}
        onClick={onPlay}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full object-cover max-h-[450px]"
            preload="metadata"
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-[225px] flex items-center justify-center bg-muted/20">
            <Play className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          </div>
        </div>

        {/* Fullscreen Button - Bottom Right */}
        <button
          className="absolute right-3 bottom-3 w-7 h-7 rounded-full flex items-center justify-center bg-black/45 hover:bg-black/65 transition-all active:scale-95"
          onClick={openFullScreen}
          aria-label="Open full screen"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Maximize className="w-[14px] h-[14px] text-white" />
        </button>
      </div>

      {/* BOTTOM: Action buttons - Save, Share, Comment (responsive) */}
      <CardContent className="p-4 pt-3 space-y-3">
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-6">
            {/* Save/Bookmark */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSave}
              className={`transition-transform hover:scale-110 ${isSaved ? 'text-primary' : 'text-muted-foreground'}`}
              aria-label="Save post"
            >
              <Star className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="text-muted-foreground transition-transform hover:scale-110"
              aria-label="Share post"
            >
              <Share2 className="w-5 h-5" />
            </Button>

            {/* Comment */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onComment}
              className="text-muted-foreground transition-transform hover:scale-110"
              aria-label="Comment on post"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLike}
            className={isLiked ? 'text-red-500 transition-transform hover:scale-110' : 'text-muted-foreground transition-transform hover:scale-110'}
            aria-label="Like post"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
