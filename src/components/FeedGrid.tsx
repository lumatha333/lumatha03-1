import { useState } from 'react';
import { Database } from '@/integrations/supabase/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/LazyImage';
import { Heart, MessageCircle, Share2, Star, Play, MoreVertical, X, ChevronLeft, ChevronRight, Copy, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type PostWithProfile = Post & { profiles?: Profile };

interface FeedGridProps {
  posts: PostWithProfile[];
  savedPosts: Set<string>;
  likedPosts: Set<string>;
  likeCounts: Record<string, number>;
  currentUserId: string;
  onToggleSave: (id: string) => void;
  onToggleLike: (id: string) => void;
  onDelete?: (id: string) => void;
  onShare?: (post: PostWithProfile) => void;
  viewMode?: 'mixed' | 'photos' | 'videos';
}

export function FeedGrid({ 
  posts, 
  savedPosts, 
  likedPosts, 
  likeCounts, 
  currentUserId, 
  onToggleSave, 
  onToggleLike, 
  onDelete,
  onShare,
  viewMode = 'mixed'
}: FeedGridProps) {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState<PostWithProfile | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Filter posts by view mode
  const filteredPosts = posts.filter(post => {
    const mediaTypes = post.media_types?.length ? post.media_types : (post.file_type ? [post.file_type] : []);
    const hasVideo = mediaTypes.some(t => t?.includes('video'));
    const hasImage = mediaTypes.some(t => t?.includes('image'));
    
    if (viewMode === 'photos') return hasImage && !hasVideo;
    if (viewMode === 'videos') return hasVideo;
    return true;
  });

  const handleShare = async (post: PostWithProfile) => {
    if (onShare) {
      onShare(post);
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.content || '', url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied!");
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const getMediaInfo = (post: PostWithProfile) => {
    const urls = post.media_urls?.length ? post.media_urls : (post.file_url ? [post.file_url] : []);
    const types = post.media_types?.length ? post.media_types : (post.file_type ? [post.file_type] : []);
    return { urls, types, hasMedia: urls.length > 0, hasMultiple: urls.length > 1 };
  };

  return (
    <>
      {/* Masonry Grid */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {filteredPosts.map((post) => {
          const { urls, types, hasMedia, hasMultiple } = getMediaInfo(post);
          const currentUrl = urls[0] || '/placeholder.svg';
          const isVideo = types[0]?.includes('video');
          const isLiked = likedPosts.has(post.id);
          const isSaved = savedPosts.has(post.id);
          const isOwner = currentUserId === post.user_id;

          return (
            <Card 
              key={post.id} 
              className="break-inside-avoid mb-3 overflow-hidden glass-card border-border group cursor-pointer hover:shadow-lg transition-all"
            >
              {/* Media */}
              {hasMedia && (
                <div 
                  className="relative overflow-hidden"
                  onClick={() => { setSelectedPost(post); setCurrentMediaIndex(0); }}
                >
                  {isVideo ? (
                    <div className="relative aspect-video bg-black">
                      <video src={currentUrl} className="w-full h-full object-cover" preload="metadata" muted />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-primary ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <LazyImage
                      src={currentUrl}
                      alt={post.title}
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      aspectRatio="auto"
                    />
                  )}
                  
                  {/* Overlay badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {hasMultiple && (
                      <Badge variant="secondary" className="bg-black/60 text-white text-[10px] px-1.5">
                        +{urls.length - 1}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-3 space-y-2">
                {/* User */}
                <div className="flex items-center gap-2">
                  <Avatar 
                    className="w-7 h-7 cursor-pointer"
                    onClick={() => navigate(`/profile/${post.user_id}`)}
                  >
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-[10px]">
                      {post.profiles?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{post.profiles?.name || 'Anonymous'}</p>
                  </div>
                  
                  {isOwner && onDelete && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card">
                        <DropdownMenuItem onClick={() => {
                          navigator.clipboard.writeText(`${post.title}\n${post.content}`);
                          toast.success("Copied!");
                        }}>
                          <Copy className="w-3 h-3 mr-2" /> Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                          <Trash2 className="w-3 h-3 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Title */}
                {!hasMedia && (
                  <h3 className="font-semibold text-sm line-clamp-2">{post.title}</h3>
                )}
                
                {post.content && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onToggleLike(post.id); }}
                    className={cn("h-7 px-2 gap-1", isLiked && "text-red-500")}
                  >
                    <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                    <span className="text-[10px]">{likeCounts[post.id] || ''}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={(e) => { e.stopPropagation(); handleShare(post); }}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onToggleSave(post.id); }}
                    className={cn("h-7 px-2 ml-auto", isSaved && "text-primary")}
                  >
                    <Star className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Fullscreen Media Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full"
            onClick={() => setSelectedPost(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          
          {selectedPost && (() => {
            const { urls, types } = getMediaInfo(selectedPost);
            const currentUrl = urls[currentMediaIndex] || '/placeholder.svg';
            const isVideo = types[currentMediaIndex]?.includes('video');
            
            return (
              <div className="relative flex items-center justify-center min-h-[60vh]">
                {isVideo ? (
                  <video src={currentUrl} className="max-w-full max-h-[90vh] object-contain" controls autoPlay />
                ) : (
                  <img src={currentUrl} alt="" className="max-w-full max-h-[90vh] object-contain" />
                )}
                
                {urls.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 bg-white/20 hover:bg-white/40 text-white rounded-full"
                      onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + urls.length) % urls.length)}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 bg-white/20 hover:bg-white/40 text-white rounded-full"
                      onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % urls.length)}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                      {currentMediaIndex + 1} / {urls.length}
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
