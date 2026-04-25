import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Send, Reply, Trash2, X, Loader2, ArrowLeft, MoreVertical, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Database } from '@/integrations/supabase/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Comment = Database['public']['Tables']['comments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface CommentWithProfile extends Comment {
  profiles?: Profile;
  replies?: CommentWithProfile[];
}

interface EducationCommentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
  postId?: string;
  title: string;
}

export function EducationComments({ open, onOpenChange, documentId, postId, title }: EducationCommentsProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && (documentId || postId)) {
      loadComments();
    }
  }, [open, documentId, postId]);

  useEffect(() => {
    if (!open || (!documentId && !postId)) return;

    const channel = supabase
      .channel(`education-comments-${documentId || postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          ...(documentId ? { filter: `document_id=eq.${documentId}` } : {}),
          ...(postId ? { filter: `post_id=eq.${postId}` } : {}),
        },
        () => {
          void loadComments();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, documentId, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (documentId) {
        query = query.eq('document_id', documentId);
      } else if (postId) {
        query = query.eq('post_id', postId);
      }

      const { data: commentsData, error } = await query;
      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const withProfiles = commentsData.map(c => ({
          ...c,
          profiles: profilesMap.get(c.user_id)
        }));

        // Organize into threads (top-level and replies)
        const topLevel: CommentWithProfile[] = [];
        const repliesMap = new Map<string, CommentWithProfile[]>();

        withProfiles.forEach(comment => {
          if (comment.content.startsWith('@reply:')) {
            const parts = comment.content.split(' ');
            const parentId = parts[0].split(':')[1];
            if (parentId) {
              if (!repliesMap.has(parentId)) repliesMap.set(parentId, []);
              repliesMap.get(parentId)!.push({
                ...comment,
                content: comment.content.replace(`@reply:${parentId} `, '')
              });
            } else {
              topLevel.push(comment);
            }
          } else {
            topLevel.push(comment);
          }
        });

        const organized = topLevel.map(c => ({
          ...c,
          replies: repliesMap.get(c.id) || []
        }));

        setComments(organized);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (isReply = false) => {
    const text = isReply ? replyText : newComment;
    if (!text.trim()) return;
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    setSubmitting(true);
    try {
      let content = text.trim();
      if (isReply && replyingTo) {
        content = `@reply:${replyingTo} ${content}`;
      }

      const insertData: any = {
        user_id: user.id,
        content
      };

      if (documentId) {
        insertData.document_id = documentId;
      } else if (postId) {
        insertData.post_id = postId;
      }

      const { error } = await supabase.from('comments').insert(insertData);
      if (error) throw error;

      toast.success('Review posted!');
      setNewComment('');
      setReplyText('');
      setReplyingTo(null);
      loadComments();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to post review');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await supabase.from('comments').delete().eq('id', commentId);
      toast.success('Deleted');
      loadComments();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleUpdateComment = async () => {
    if (!editingId || !editContent.trim()) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editContent.trim() })
        .eq('id', editingId);
      if (error) throw error;
      toast.success('Updated');
      setEditingId(null);
      loadComments();
    } catch {
      toast.error('Update failed');
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: CommentWithProfile; isReply?: boolean }) => (
    <div className={cn("flex gap-3", isReply && "ml-10 mt-3")}>
      <Avatar className="w-9 h-9 shrink-0 border border-white/5">
        <AvatarImage src={comment.profiles?.avatar_url || ''} />
        <AvatarFallback className="text-xs font-bold bg-violet-600/20 text-violet-400">{comment.profiles?.name?.[0] || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-3 relative group">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-bold text-white">{comment.profiles?.name || 'Explorer'}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-slate-500">
                {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''}
              </span>
              {comment.user_id === user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-white/5 rounded-full transition-colors text-slate-500">
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-white/5">
                    <DropdownMenuItem 
                      onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                      className="text-xs text-white flex items-center gap-2"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => deleteComment(comment.id)}
                      className="text-xs text-red-500 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {editingId === comment.id ? (
            <div className="space-y-2 mt-2">
              <Textarea 
                value={editContent} 
                onChange={e => setEditContent(e.target.value)}
                className="min-h-[60px] text-sm bg-slate-800 border-white/10"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                <Button size="sm" onClick={handleUpdateComment}>Save</Button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-slate-300 leading-relaxed">{comment.content}</p>
          )}
        </div>
        
        {!editingId && (
          <div className="flex items-center gap-4 mt-1.5 px-1">
            {!isReply && (
              <button
                className="text-[11px] font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
                onClick={() => {
                  setReplyingTo(comment.id);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
              >
                Reply
              </button>
            )}
          </div>
        )}

        {replyingTo === comment.id && (
          <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Textarea
              placeholder={`Reply to ${comment.profiles?.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[44px] text-sm bg-slate-900 border-white/10 rounded-xl focus-visible:ring-primary"
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <Button 
                size="icon" 
                className="h-9 w-9 bg-primary"
                onClick={() => submitComment(true)}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                className="h-9 w-9 text-slate-500"
                onClick={() => setReplyingTo(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {comment.replies?.map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full h-full sm:h-full md:h-full lg:h-full flex flex-col p-0 gap-0 border-0 rounded-none bg-[#0a0f1e] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0a0f1e]/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-white/5 rounded-full transition-colors text-slate-400">
              <X className="w-6 h-6" />
            </button>
            <DialogTitle className="text-[17px] font-bold text-white truncate max-w-[240px] font-['Space_Grotesk']">{title}</DialogTitle>
          </div>
          <span className="text-[11px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Discussion</span>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto space-y-6 px-4 py-6 no-scrollbar pb-32">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] font-bold text-slate-500">Loading discussion...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <MessageCircleIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-white font-bold text-lg">No reviews yet</p>
              <p className="text-slate-400 text-sm mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>

        {/* Bottom Input Section */}
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-[#0a0f1e]/90 backdrop-blur-2xl z-30 pb-safe">
          <div className="max-w-2xl mx-auto flex items-end gap-3">
            <Avatar className="w-10 h-10 shrink-0 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-xs bg-slate-800 font-bold text-slate-400">{profile?.name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                placeholder="Give reviews..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[48px] max-h-32 text-[15px] font-medium bg-slate-900/80 border-slate-800 text-white rounded-[20px] px-4 py-3 placeholder:text-slate-600 focus-visible:ring-primary resize-none scrollbar-hide"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitComment();
                  }
                }}
              />
            </div>
            <Button 
              size="icon" 
              className={cn(
                "h-11 w-11 rounded-full transition-all duration-300",
                newComment.trim() ? "bg-primary text-white shadow-lg shadow-primary/20 scale-100" : "bg-slate-800 text-slate-500 scale-90"
              )}
              onClick={() => submitComment(false)}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Minimal placeholder icons
const MessageCircleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);
