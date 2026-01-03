import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, Reply, MoreVertical, Edit, Trash2, Heart, ThumbsDown, Laugh, Frown, HeartHandshake } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Facebook-style reactions
const REACTIONS = [
  { type: 'like', icon: Heart, color: 'text-red-500', label: '❤️' },
  { type: 'dislike', icon: ThumbsDown, color: 'text-blue-500', label: '👎' },
  { type: 'haha', icon: Laugh, color: 'text-yellow-500', label: '😂' },
  { type: 'sad', icon: Frown, color: 'text-purple-500', label: '😢' },
  { type: 'love', icon: HeartHandshake, color: 'text-pink-500', label: '💖' },
];

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
  reactions?: Record<string, number>;
  userReaction?: string | null;
}

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
}

export function CommentsDialog({ open, onOpenChange, postId, postTitle }: CommentsDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentReactions, setCommentReactions] = useState<Record<string, { reactions: Record<string, number>; userReaction: string | null }>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (open && postId) {
      fetchComments();
    }
  }, [open, postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch profiles separately for each comment
      const commentsWithProfiles: Comment[] = [];
      for (const comment of data || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', comment.user_id)
          .single();
        
        commentsWithProfiles.push({
          ...comment,
          profiles: profile || undefined,
          reactions: { like: 0, dislike: 0, haha: 0, sad: 0, love: 0 },
          userReaction: null
        });
      }
      setComments(commentsWithProfiles);
      
      // Fetch reactions from database
      const reactionsMap: Record<string, { reactions: Record<string, number>; userReaction: string | null }> = {};
      
      for (const comment of commentsWithProfiles) {
        const { data: reactions } = await supabase
          .from('comment_reactions')
          .select('reaction, user_id')
          .eq('comment_id', comment.id);
        
        const counts: Record<string, number> = { like: 0, dislike: 0, haha: 0, sad: 0, love: 0 };
        let userReaction: string | null = null;
        
        reactions?.forEach(r => {
          counts[r.reaction] = (counts[r.reaction] || 0) + 1;
          if (user && r.user_id === user.id) {
            userReaction = r.reaction;
          }
        });
        
        reactionsMap[comment.id] = { reactions: counts, userReaction };
      }
      setCommentReactions(reactionsMap);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !user) return;

    // Check user's comment count for this post
    const existingCount = comments.filter(c => c.user_id === user.id).length;
    if (existingCount >= 2) {
      toast.error('You can only add 2 comments per post');
      return;
    }

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim()
      });

      if (error) throw error;
      setNewComment('');
      fetchComments();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const addReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return;
    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: `@reply: ${replyContent.trim()}`
      });

      if (error) throw error;
      setReplyingTo(null);
      setReplyContent('');
      fetchComments();
      toast.success('Reply added');
    } catch (error) {
      toast.error('Failed to add reply');
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
      setComments(comments.filter(c => c.id !== id));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const updateComment = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editContent.trim() })
        .eq('id', id);

      if (error) throw error;
      setComments(comments.map(c => c.id === id ? { ...c, content: editContent.trim() } : c));
      setEditingId(null);
      setEditContent('');
      toast.success('Comment updated');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleReaction = async (commentId: string, reactionType: string) => {
    if (!user) return;
    
    const current = commentReactions[commentId] || { reactions: { like: 0, dislike: 0, haha: 0, sad: 0, love: 0 }, userReaction: null };
    
    try {
      if (current.userReaction === reactionType) {
        // Remove reaction
        await supabase.from('comment_reactions').delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else if (current.userReaction) {
        // Update reaction
        await supabase.from('comment_reactions')
          .update({ reaction: reactionType })
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Add new reaction
        await supabase.from('comment_reactions').insert({
          comment_id: commentId,
          user_id: user.id,
          reaction: reactionType
        });
      }
      
      // Update local state
      setCommentReactions(prev => {
        const newReactions = { ...current.reactions };
        
        if (current.userReaction) {
          newReactions[current.userReaction] = Math.max(0, (newReactions[current.userReaction] || 0) - 1);
        }
        
        if (current.userReaction === reactionType) {
          return { ...prev, [commentId]: { reactions: newReactions, userReaction: null } };
        }
        
        newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
        return { ...prev, [commentId]: { reactions: newReactions, userReaction: reactionType } };
      });
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  const getTotalReactions = (commentId: string) => {
    const data = commentReactions[commentId];
    if (!data) return 0;
    return Object.values(data.reactions).reduce((sum, count) => sum + count, 0);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full sm:max-w-lg sm:max-h-[90vh] sm:h-auto m-0 sm:m-auto p-0 flex flex-col glass-card border-0 sm:border sm:border-border rounded-none sm:rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Comments</h3>
            <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">{postTitle}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-base">No comments yet</p>
              <p className="text-xs">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex gap-2">
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                      {comment.profiles?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" className="h-7 text-xs" onClick={() => updateComment(comment.id)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-muted/30 rounded-xl px-2.5 py-1.5">
                          <p className="font-medium text-xs">{comment.profiles?.name || 'Anonymous'}</p>
                          <p className="text-xs">{comment.content}</p>
                        </div>
                        
                        {/* Actions with Reactions */}
                        <div className="flex items-center gap-2 mt-1 ml-1 flex-wrap">
                          <span className="text-[9px] text-muted-foreground">{formatTime(comment.created_at)}</span>
                          
                          {/* Reaction Popover */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-[10px] font-medium hover:underline flex items-center gap-0.5">
                                {commentReactions[comment.id]?.userReaction ? (
                                  <span>{REACTIONS.find(r => r.type === commentReactions[comment.id]?.userReaction)?.label}</span>
                                ) : (
                                  <Heart className="w-3 h-3" />
                                )}
                                {getTotalReactions(comment.id) > 0 && <span className="ml-0.5">{getTotalReactions(comment.id)}</span>}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-1 glass-card" side="top">
                              <div className="flex gap-0.5">
                                {REACTIONS.map((reaction) => (
                                  <button
                                    key={reaction.type}
                                    onClick={() => handleReaction(comment.id, reaction.type)}
                                    className={`p-1.5 rounded-full hover:bg-muted transition-all hover:scale-125 ${
                                      commentReactions[comment.id]?.userReaction === reaction.type ? 'bg-muted scale-110' : ''
                                    }`}
                                    title={reaction.type}
                                  >
                                    <span className="text-lg">{reaction.label}</span>
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          
                          <button 
                            onClick={() => { setReplyingTo(comment.id); setReplyContent(''); }}
                            className="text-[10px] font-medium hover:underline flex items-center gap-0.5"
                          >
                            <Reply className="w-2.5 h-2.5" /> Reply
                          </button>
                          
                          {user?.id === comment.user_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                                  <MoreVertical className="w-3 h-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-card min-w-[100px]">
                                <DropdownMenuItem className="text-xs py-1.5" onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}>
                                  <Edit className="w-3 h-3 mr-1.5" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs py-1.5 text-destructive" onClick={() => deleteComment(comment.id)}>
                                  <Trash2 className="w-3 h-3 mr-1.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="flex gap-1.5 mt-2 ml-2">
                        <Input
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="h-7 text-xs flex-1"
                          autoFocus
                        />
                        <Button size="sm" className="h-7 w-7 p-0" onClick={() => addReply(comment.id)}>
                          <Send className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setReplyingTo(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Input - Fixed at bottom */}
        <div className="p-3 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              onKeyPress={(e) => e.key === 'Enter' && addComment()}
              className="flex-1 h-9 text-sm"
            />
            <Button onClick={addComment} disabled={!newComment.trim()} className="h-9 w-9 p-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {user && (
            <p className="text-[9px] text-muted-foreground mt-1">
              {comments.filter(c => c.user_id === user.id).length}/2 comments used
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
