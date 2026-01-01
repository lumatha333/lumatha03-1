import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, ThumbsUp, ThumbsDown, Reply, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
  replies?: Comment[];
  likes?: number;
  dislikes?: number;
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
        
        commentsWithProfiles.push({
          ...comment,
          profiles: profile || undefined
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
      <DialogContent className="max-w-lg h-[90vh] max-h-[600px] p-0 flex flex-col glass-card border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold">Comments</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[250px]">{postTitle}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-lg">No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {comment.profiles?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateComment(comment.id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-muted/30 rounded-xl px-3 py-2">
                          <p className="font-medium text-sm">{comment.profiles?.name || 'Anonymous'}</p>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-1 ml-2">
                          <span className="text-[10px] text-muted-foreground">{formatTime(comment.created_at)}</span>
                          <button className="text-[11px] font-medium hover:underline flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> Like
                          </button>
                          <button className="text-[11px] font-medium hover:underline flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" /> Dislike
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
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-card">
                                <DropdownMenuItem onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}>
                                  <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteComment(comment.id)} className="text-destructive">
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="flex gap-2 mt-2 ml-4">
                        <Input
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="h-8 text-sm flex-1"
                        />
                        <Button size="sm" onClick={() => setReplyingTo(null)}>
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              onKeyPress={(e) => e.key === 'Enter' && addComment()}
              className="flex-1"
            />
            <Button onClick={addComment} disabled={!newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {user && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {comments.filter(c => c.user_id === user.id).length}/2 comments used
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
