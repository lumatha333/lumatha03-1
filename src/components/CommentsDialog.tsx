import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, Reply, MoreVertical, Edit, Trash2, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  reference_id?: string | null;
  profiles?: { name: string; avatar_url: string | null; };
  likeCount: number;
  userLiked: boolean;
  replies?: Comment[];
  showReplies?: boolean;
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
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();
  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && postId) fetchComments();
  }, [open, postId]);

  // Auto-focus reply input
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      setTimeout(() => replyInputRef.current?.focus(), 100);
    }
  }, [replyingTo]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .is('reference_id', null) // top-level only
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch replies for all top-level comments
      const allCommentIds = data?.map(c => c.id) || [];
      const { data: repliesData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .not('reference_id', 'is', null)
        .order('created_at', { ascending: true });

      // Build user id set
      const userIds = new Set([
        ...(data?.map(c => c.user_id) || []),
        ...(repliesData?.map(c => c.user_id) || [])
      ]);

      // Batch fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', Array.from(userIds));
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch reactions
      const { data: reactions } = await supabase
        .from('comment_reactions')
        .select('comment_id, user_id, reaction')
        .eq('reaction', 'like');
      const reactionsByComment = new Map<string, { count: number; userLiked: boolean }>();
      reactions?.forEach(r => {
        const existing = reactionsByComment.get(r.comment_id) || { count: 0, userLiked: false };
        reactionsByComment.set(r.comment_id, {
          count: existing.count + 1,
          userLiked: existing.userLiked || (user ? r.user_id === user.id : false)
        });
      });

      const buildComment = (c: any): Comment => ({
        ...c,
        profiles: profileMap.get(c.user_id) as any,
        likeCount: reactionsByComment.get(c.id)?.count || 0,
        userLiked: reactionsByComment.get(c.id)?.userLiked || false,
      });

      const builtComments = (data || []).map(buildComment);
      const builtReplies = (repliesData || []).map(buildComment);

      // Attach replies to parent comments
      builtComments.forEach(c => {
        c.replies = builtReplies.filter(r => r.reference_id === c.id);
      });

      setComments(builtComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !user) {
      if (!user) toast.error('Please login to comment');
      return;
    }
    try {
      await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        reference_id: null,
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const addReply = async () => {
    if (!replyContent.trim() || !user || !replyingTo) return;
    try {
      // Insert reply with @name prefix + reference_id = parent comment id
      await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: `@${replyingTo.name} ${replyContent.trim()}`,
        reference_id: replyingTo.id,
      });

      // Notify the replied-to person (if they're not replying to themselves)
      const parentComment = comments.find(c => c.id === replyingTo.id);
      if (parentComment && parentComment.user_id !== user.id) {
        const { data: myProfile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
        await supabase.rpc('create_notification', {
          p_user_id: parentComment.user_id,
          p_type: 'comment_reply',
          p_content: `${myProfile?.name || 'Someone'} replied to your comment: "${replyContent.trim().slice(0, 50)}"`,
          p_link: `/profile/${user.id}`,
        });
      }

      setReplyingTo(null);
      setReplyContent('');
      // Auto-expand the parent's replies
      setExpandedReplies(prev => new Set(prev).add(replyingTo.id));
      fetchComments();
    } catch (error) {
      toast.error('Failed to add reply');
    }
  };

  const deleteComment = async (id: string) => {
    try {
      await supabase.from('comments').delete().eq('id', id);
      fetchComments();
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const updateComment = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await supabase.from('comments').update({ content: editContent.trim() }).eq('id', id);
      setComments(comments.map(c => c.id === id ? { ...c, content: editContent.trim() } : c));
      setEditingId(null);
      setEditContent('');
    } catch { toast.error('Failed to update'); }
  };

  const toggleLike = async (commentId: string) => {
    if (!user) return;
    const comment = [...comments, ...comments.flatMap(c => c.replies || [])].find(c => c.id === commentId);
    if (!comment) return;
    try {
      if (comment.userLiked) {
        await supabase.from('comment_reactions').delete().eq('comment_id', commentId).eq('user_id', user.id).eq('reaction', 'like');
      } else {
        await supabase.from('comment_reactions').insert({ comment_id: commentId, user_id: user.id, reaction: 'like' });
      }
      // Optimistic update
      const updateInList = (list: Comment[]): Comment[] => list.map(c => {
        if (c.id === commentId) return { ...c, userLiked: !c.userLiked, likeCount: c.userLiked ? Math.max(0, c.likeCount - 1) : c.likeCount + 1 };
        if (c.replies) return { ...c, replies: updateInList(c.replies) };
        return c;
      });
      setComments(prev => updateInList(prev));
    } catch { console.error('Like error'); }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  // Render a single comment bubble
  const CommentBubble = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isOwn = user?.id === comment.user_id;
    // Parse @name mentions for styling
    const renderContent = (content: string) => {
      if (content.startsWith('@')) {
        const spaceIdx = content.indexOf(' ');
        if (spaceIdx > 0) {
          const mention = content.slice(0, spaceIdx);
          const rest = content.slice(spaceIdx);
          return <span><span className="text-primary font-semibold cursor-pointer hover:underline">{mention}</span>{rest}</span>;
        }
      }
      return content;
    };

    return (
      <div className={cn("flex gap-2", isReply && "ml-10 mt-2")}>
        <button
          onClick={() => { onOpenChange(false); navigate(`/profile/${comment.user_id}`); }}
          className="shrink-0"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
              {comment.profiles?.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          {editingId === comment.id ? (
            <div className="space-y-1.5">
              <Input value={editContent} onChange={(e) => setEditContent(e.target.value)} className="h-8 text-xs" />
              <div className="flex gap-1.5">
                <Button size="sm" className="h-7 text-xs" onClick={() => updateComment(comment.id)}>Save</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-muted/40 rounded-2xl px-3 py-2 inline-block max-w-full">
                <button
                  className="font-semibold text-xs hover:underline text-left"
                  onClick={() => { onOpenChange(false); navigate(`/profile/${comment.user_id}`); }}
                >
                  {comment.profiles?.name || 'Anonymous'}
                </button>
                <p className="text-sm mt-0.5 break-words">{renderContent(comment.content)}</p>
              </div>

              <div className="flex items-center gap-3 mt-1 ml-1">
                <span className="text-[10px] text-muted-foreground">{formatTime(comment.created_at)}</span>

                {/* Heart like */}
                <button
                  onClick={() => toggleLike(comment.id)}
                  className={cn("flex items-center gap-0.5 text-[11px] font-medium hover:text-red-500 transition-colors", comment.userLiked ? 'text-red-500' : 'text-muted-foreground')}
                >
                  <Heart className={cn("w-3 h-3", comment.userLiked && 'fill-current')} />
                  {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                </button>

                {/* Reply button (only on top-level comments) */}
                {!isReply && (
                  <button
                    onClick={() => setReplyingTo({ id: comment.id, name: comment.profiles?.name || 'User' })}
                    className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Reply className="w-3 h-3" /> Reply
                  </button>
                )}

                {isOwn && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground p-0.5">
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card min-w-[110px]">
                      <DropdownMenuItem className="text-xs" onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}>
                        <Edit className="w-3 h-3 mr-1.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteComment(comment.id)}>
                        <Trash2 className="w-3 h-3 mr-1.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Reply input for this comment */}
              {replyingTo?.id === comment.id && (
                <div className="flex items-center gap-1.5 mt-2 ml-1">
                  <span className="text-xs text-primary font-medium">@{replyingTo.name}</span>
                  <Input
                    ref={replyInputRef}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="h-8 text-xs flex-1 rounded-full bg-muted/50 border-0"
                    onKeyDown={(e) => { if (e.key === 'Enter') addReply(); if (e.key === 'Escape') setReplyingTo(null); }}
                  />
                  <Button size="sm" className="h-8 w-8 p-0 rounded-full" onClick={addReply}>
                    <Send className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={() => setReplyingTo(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Show/hide replies */}
              {!isReply && (comment.replies?.length || 0) > 0 && (
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center gap-1 mt-1.5 ml-1 text-[11px] text-primary font-medium hover:underline"
                >
                  {expandedReplies.has(comment.id)
                    ? <><ChevronUp className="w-3 h-3" /> Hide {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}</>
                    : <><ChevronDown className="w-3 h-3" /> View {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}</>
                  }
                </button>
              )}

              {/* Expanded replies */}
              {!isReply && expandedReplies.has(comment.id) && comment.replies?.map(reply => (
                <CommentBubble key={reply.id} comment={reply} isReply />
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  // Get current user's profile avatar
  const [currentProfile, setCurrentProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single()
        .then(({ data }) => setCurrentProfile(data));
    }
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full sm:max-w-lg sm:max-h-[90vh] sm:h-auto m-0 sm:m-auto p-0 flex flex-col glass-card border-0 sm:border sm:border-border rounded-none sm:rounded-2xl bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10 rounded-t-2xl">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Comments</h3>
            <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">{postTitle}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Loading...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No comments yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map(comment => <CommentBubble key={comment.id} comment={comment} />)
          )}
        </div>

        {/* Add Comment Input */}
        <div className="p-3 border-t border-border bg-background/95 backdrop-blur-sm">
          {replyingTo && (
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <span className="text-xs text-muted-foreground">Replying to</span>
              <span className="text-xs text-primary font-semibold">@{replyingTo.name}</span>
              <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground ml-auto">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
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
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
              className="flex-1 h-10 text-sm rounded-full bg-muted/50 border-0"
            />
            <Button onClick={addComment} disabled={!newComment.trim()} size="sm" className="h-10 px-4 rounded-full">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
