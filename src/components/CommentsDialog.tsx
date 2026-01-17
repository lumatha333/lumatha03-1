import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, Reply, MoreVertical, Edit, Trash2, Heart } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: {
    name: string;
    avatar_url: string | null;
  };
  likeCount: number;
  userLiked: boolean;
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
        
        // Fetch like count for this comment (using heart reaction only)
        const { data: reactions } = await supabase
          .from('comment_reactions')
          .select('user_id, reaction')
          .eq('comment_id', comment.id)
          .eq('reaction', 'like');
        
        const likeCount = reactions?.length || 0;
        const userLiked = user ? reactions?.some(r => r.user_id === user.id) : false;
        
        commentsWithProfiles.push({
          ...comment,
          profiles: profile || undefined,
          likeCount,
          userLiked
        });
      }
      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim()
      });

      if (error) {
        console.error('Comment insert error:', error);
        throw error;
      }
      setNewComment('');
      fetchComments();
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
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

  const toggleLike = async (commentId: string) => {
    if (!user) return;
    
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    try {
      if (comment.userLiked) {
        // Remove like
        await supabase.from('comment_reactions').delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
          .eq('reaction', 'like');
        
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, userLiked: false, likeCount: Math.max(0, c.likeCount - 1) }
            : c
        ));
      } else {
        // Add like
        await supabase.from('comment_reactions').insert({
          comment_id: commentId,
          user_id: user.id,
          reaction: 'like'
        });
        
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, userLiked: true, likeCount: c.likeCount + 1 }
            : c
        ));
      }
    } catch (error) {
      console.error('Like error:', error);
    }
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

  // Get current user's profile
  const [currentProfile, setCurrentProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
  
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single()
        .then(({ data }) => setCurrentProfile(data));
    }
  }, [user]);

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
                  <Avatar className="w-8 h-8 shrink-0">
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
                        <div className="bg-muted/30 rounded-xl px-3 py-2">
                          <p className="font-semibold text-xs">{comment.profiles?.name || 'Anonymous'}</p>
                          <p className="text-sm mt-0.5">{comment.content}</p>
                        </div>
                        
                        {/* Actions - Heart reaction only */}
                        <div className="flex items-center gap-3 mt-1 ml-2 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">{formatTime(comment.created_at)}</span>
                          
                          {/* Heart reaction button */}
                          <button 
                            onClick={() => toggleLike(comment.id)}
                            className={`text-[11px] font-medium hover:underline flex items-center gap-1 ${comment.userLiked ? 'text-red-500' : ''}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${comment.userLiked ? 'fill-current' : ''}`} />
                            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                          </button>
                          
                          <button 
                            onClick={() => { setReplyingTo(comment.id); setReplyContent(''); }}
                            className="text-[11px] font-medium hover:underline flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                          
                          {user?.id === comment.user_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                                  <MoreVertical className="w-3.5 h-3.5" />
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
                          className="h-8 text-xs flex-1"
                          autoFocus
                        />
                        <Button size="sm" className="h-8 w-8 p-0" onClick={() => addReply(comment.id)}>
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setReplyingTo(null)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Input - Fixed at bottom with user avatar like Instagram */}
        <div className="p-3 border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {/* User's avatar */}
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={currentProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {currentProfile?.name?.[0] || user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              onKeyPress={(e) => e.key === 'Enter' && addComment()}
              className="flex-1 h-10 text-sm rounded-full bg-muted/50 border-0"
            />
            <Button 
              onClick={addComment} 
              disabled={!newComment.trim()} 
              size="sm"
              className="h-10 px-4 rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}