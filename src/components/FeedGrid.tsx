import { useState } from 'react';
import { Database } from '@/integrations/supabase/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/LazyImage';
import { Heart, MessageCircle, Share2, Star, Play, MoreVertical, X, ChevronLeft, ChevronRight, Copy, Trash2, Send } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'];
type PostWithProfile = Post & { profiles?: Profile };
type CommentWithProfile = Comment & { profiles?: Profile };

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
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [userCommentCounts, setUserCommentCounts] = useState<Record<string, number>>({});

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

  // Fetch comments for a post
  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id)
        }));
        
        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
      
      const userCount = (commentsData || []).filter(c => c.user_id === currentUserId).length;
      setUserCommentCounts(prev => ({ ...prev, [postId]: userCount }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Add comment (max 2 per user per post)
  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;
    
    const { data: existingComments } = await supabase
      .from('comments')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUserId);
    
    if (existingComments && existingComments.length >= 2) {
      toast.error('Maximum 2 comments per post allowed');
      return;
    }
    
    try {
      await supabase.from('comments').insert({
        post_id: postId,
        user_id: currentUserId,
        content: newComment.trim()
      });
      
      setNewComment('');
      fetchComments(postId);
      setCommentCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const openComments = (postId: string) => {
    setShowComments(postId);
    fetchComments(postId);
  };

  return (
    <>
      {/* Single column on mobile, multi-column on larger screens */}
      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-3">
        {filteredPosts.map((post, index) => {
          const { urls, types, hasMedia, hasMultiple } = getMediaInfo(post);
          const currentUrl = urls[0] || '/placeholder.svg';
          const isVideo = types[0]?.includes('video');
          const isLiked = likedPosts.has(post.id);
          const isSaved = savedPosts.has(post.id);
          const isOwner = currentUserId === post.user_id;

          return (
            <Card 
              key={post.id} 
              className="overflow-hidden glass-card border-border group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
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
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all duration-300 group-hover:bg-black/40">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
                          <Play className="w-6 h-6 text-primary ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <LazyImage
                      src={currentUrl}
                      alt={post.title}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      aspectRatio="auto"
                    />
                  )}
                  
                  {/* Overlay badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {hasMultiple && (
                      <Badge variant="secondary" className="bg-black/60 text-white text-[10px] px-1.5 animate-pulse">
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
                    className="w-8 h-8 cursor-pointer ring-2 ring-transparent transition-all duration-300 hover:ring-primary"
                    onClick={() => navigate(`/profile/${post.user_id}`)}
                  >
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-xs">
                      {post.profiles?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.profiles?.name || 'Anonymous'}</p>
                  </div>
                  
                  {isOwner && onDelete && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card animate-scale-in">
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
                  <p className="text-xs text-muted-foreground line-clamp-3">{post.content}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onToggleLike(post.id); }}
                    className={cn(
                      "h-8 px-3 gap-1.5 transition-all duration-300",
                      isLiked && "text-red-500 scale-110"
                    )}
                  >
                    <Heart className={cn("w-4 h-4 transition-transform", isLiked && "fill-current animate-bounce")} />
                    <span className="text-xs">{likeCounts[post.id] || ''}</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 gap-1.5 transition-all duration-300 hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); openComments(post.id); }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">{commentCounts[post.id] || ''}</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-3 transition-all duration-300 hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); handleShare(post); }}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onToggleSave(post.id); }}
                    className={cn(
                      "h-8 px-3 ml-auto transition-all duration-300",
                      isSaved && "text-primary scale-110"
                    )}
                  >
                    <Star className={cn("w-4 h-4 transition-transform", isSaved && "fill-current animate-pulse")} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Comments Dialog */}
      <Dialog open={!!showComments} onOpenChange={() => setShowComments(null)}>
        <DialogContent className="max-w-md glass-card animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Comments</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowComments(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="max-h-64">
            {loadingComments ? (
              <p className="text-center text-muted-foreground py-4 animate-pulse">Loading...</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment, index) => (
                  <div 
                    key={comment.id} 
                    className="flex gap-2 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-[10px]">
                        {comment.profiles?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/50 rounded-lg p-2">
                      <p className="text-xs font-medium">{comment.profiles?.name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {showComments && (userCommentCounts[showComments] || 0) < 2 && (
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && showComments && handleAddComment(showComments)}
              />
              <Button size="icon" onClick={() => showComments && handleAddComment(showComments)} className="transition-transform hover:scale-110">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {showComments && (userCommentCounts[showComments] || 0) >= 2 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              You've reached the maximum of 2 comments on this post
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen Media Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none animate-scale-in">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/70 rounded-full transition-transform hover:scale-110"
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
                  <img src={currentUrl} alt="" className="max-w-full max-h-[90vh] object-contain animate-fade-in" />
                )}
                
                {urls.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 bg-white/20 hover:bg-white/40 text-white rounded-full transition-transform hover:scale-110"
                      onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + urls.length) % urls.length)}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 bg-white/20 hover:bg-white/40 text-white rounded-full transition-transform hover:scale-110"
                      onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % urls.length)}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
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