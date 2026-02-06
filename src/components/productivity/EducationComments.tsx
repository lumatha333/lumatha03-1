import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Send, Image, Video, Reply, MoreHorizontal, Trash2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && (documentId || postId)) {
      loadComments();
    }
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
          // Check content for reply indicator (simple approach using @reply prefix)
          if (comment.content.startsWith('@reply:')) {
            const parentId = comment.content.split(':')[1]?.split(' ')[0];
            if (parentId) {
              if (!repliesMap.has(parentId)) {
                repliesMap.set(parentId, []);
              }
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

        // Attach replies to parent comments
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

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const submitComment = async (isReply = false) => {
    const text = isReply ? replyText : newComment;
    if (!text.trim() && !mediaFile) return;
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    setSubmitting(true);
    try {
      let mediaUrl = '';
      
      // Upload media if present
      if (mediaFile) {
        const fileName = `comments/${user.id}/${Date.now()}_${mediaFile.name}`;
        const isVideo = mediaFile.type.startsWith('video');
        const bucket = isVideo ? 'posts-media' : 'posts-media';
        
        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, mediaFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        mediaUrl = publicUrl;
      }

      // Build content with media
      let content = text.trim();
      if (isReply && replyingTo) {
        content = `@reply:${replyingTo} ${content}`;
      }
      if (mediaUrl) {
        const mediaType = mediaFile?.type.startsWith('video') ? 'video' : 'image';
        content += `\n[${mediaType}:${mediaUrl}]`;
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

      toast.success('Comment posted!');
      setNewComment('');
      setReplyText('');
      setReplyingTo(null);
      clearMedia();
      loadComments();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await supabase.from('comments').delete().eq('id', commentId);
      toast.success('Comment deleted');
      loadComments();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const renderMediaInContent = (content: string) => {
    // Extract media from content
    const mediaMatch = content.match(/\[(image|video):([^\]]+)\]/);
    const cleanContent = content.replace(/\[(image|video):[^\]]+\]/, '').trim();
    
    return (
      <div className="space-y-2">
        {cleanContent && <p className="text-sm">{cleanContent}</p>}
        {mediaMatch && (
          mediaMatch[1] === 'video' ? (
            <video 
              src={mediaMatch[2]} 
              controls 
              className="w-full max-w-xs rounded-lg"
            />
          ) : (
            <img 
              src={mediaMatch[2]} 
              alt="Comment media" 
              className="w-full max-w-xs rounded-lg object-cover"
            />
          )
        )}
      </div>
    );
  };

  const CommentItem = ({ comment, isReply = false }: { comment: CommentWithProfile; isReply?: boolean }) => (
    <div className={cn("flex gap-3", isReply && "ml-10 mt-2")}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={comment.profiles?.avatar_url || ''} />
        <AvatarFallback className="text-xs">{comment.profiles?.name?.[0] || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.profiles?.name || 'User'}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at || ''), { addSuffix: true })}
          </span>
        </div>
        {renderMediaInContent(comment.content)}
        <div className="flex items-center gap-2 mt-1">
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => setReplyingTo(comment.id)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}
          {comment.user_id === user?.id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-destructive"
              onClick={() => deleteComment(comment.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="mt-2 flex gap-2">
            <Textarea
              placeholder={`Reply to ${comment.profiles?.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="flex flex-col gap-1">
              <Button 
                size="icon" 
                className="h-7 w-7"
                onClick={() => submitComment(true)}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setReplyingTo(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies?.map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg truncate pr-8">{title}</DialogTitle>
        </DialogHeader>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No comments yet. Be the first!</p>
          ) : (
            comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>

        {/* New comment input */}
        <div className="border-t pt-4 space-y-3">
          {mediaPreview && (
            <div className="relative inline-block">
              {mediaFile?.type.startsWith('video') ? (
                <video src={mediaPreview} className="h-20 rounded-lg" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="h-20 rounded-lg object-cover" />
              )}
              <Button
                size="icon"
                variant="secondary"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={clearMedia}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-xs">{profile?.name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => submitComment(false)}
                  disabled={submitting || (!newComment.trim() && !mediaFile)}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleMediaSelect}
                  />
                  <div className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-muted transition-colors">
                    <Image className="w-4 h-4" />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
