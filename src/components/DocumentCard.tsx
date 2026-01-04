import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Heart, MessageCircle, Share2, MoreVertical, Download, ExternalLink, Edit, Trash2, Lock, Globe, BookOpen } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type DocumentWithProfile = Document & { profiles?: Profile };

interface DocumentCardProps {
  doc: DocumentWithProfile;
  onDelete: (docId: string, fileUrl: string) => void;
  onDownload: (fileUrl: string, fileName: string) => void;
  onOpenInBrowser: (fileUrl: string) => void;
  onRefresh: () => void;
}

export default function DocumentCard({ doc, onDelete, onDownload, onOpenInBrowser, onRefresh }: DocumentCardProps) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isOwner = currentUser?.id === doc.user_id;
  
  const [loved, setLoved] = useState(false);
  const [loveCount, setLoveCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDescription, setEditDescription] = useState(doc.description || '');

  // Fetch reactions on mount
  useEffect(() => {
    fetchReactions();
  }, [doc.id, currentUser?.id]);

  const fetchReactions = async () => {
    try {
      // Get reaction count
      const { count } = await supabase
        .from('document_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', doc.id);
      
      setLoveCount(count || 0);

      // Check if current user has reacted
      if (currentUser?.id) {
        const { data } = await supabase
          .from('document_reactions')
          .select('id')
          .eq('document_id', doc.id)
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        setLoved(!!data);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleLove = async () => {
    if (!currentUser) {
      toast.error('Please login to react');
      return;
    }
    
    try {
      if (loved) {
        await supabase
          .from('document_reactions')
          .delete()
          .eq('document_id', doc.id)
          .eq('user_id', currentUser.id);
        setLoved(false);
        setLoveCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from('document_reactions')
          .insert({ document_id: doc.id, user_id: currentUser.id, reaction: 'love' });
        setLoved(true);
        setLoveCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: doc.title,
        text: doc.description || 'Check out this document',
        url: doc.file_url
      });
    } catch {
      await navigator.clipboard.writeText(doc.file_url);
      toast.success('Link copied!');
    }
  };

  // Fixed download function using fetch and blob
  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      toast.info('Starting download...');
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Try opening in browser first.');
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('document_id', doc.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setComments(data.map(c => ({ ...c, profile: profilesMap.get(c.user_id) })));
    }
    setShowComments(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    await supabase.from('comments').insert({
      user_id: currentUser.id,
      document_id: doc.id,
      content: newComment
    });
    setNewComment('');
    loadComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId);
    loadComments();
  };

  const handleEditDescription = async () => {
    await supabase.from('documents').update({ description: editDescription }).eq('id', doc.id);
    toast.success('Updated!');
    setEditDialogOpen(false);
    onRefresh();
  };

  return (
    <>
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-2.5 space-y-2">
          {/* User info row */}
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80" 
              onClick={() => navigate(`/profile/${doc.user_id}`)}
            >
              <Avatar className="w-7 h-7">
                <AvatarImage src={doc.profiles?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-[10px]">
                  {doc.profiles?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[11px] font-medium truncate">{doc.profiles?.name || 'Anonymous'}</p>
                <p className="text-[9px] text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Badge variant={doc.visibility === 'public' ? 'default' : 'secondary'} className="text-[8px] h-4 px-1">
                {doc.visibility === 'public' ? <Globe className="w-2 h-2 mr-0.5" /> : <Lock className="w-2 h-2 mr-0.5" />}
                {doc.visibility}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-7 w-7 border-primary/50 bg-primary/10 hover:bg-primary/20 shadow-[0_0_8px_2px_hsl(var(--primary)/0.3)]"
                  >
                    <MoreVertical className="w-4 h-4 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 glass-card">
                  <DropdownMenuItem onClick={async () => {
                    try {
                      // Fetch blob first to force browser to handle it properly
                      const response = await fetch(doc.file_url);
                      if (!response.ok) throw new Error('Failed to fetch');
                      const blob = await response.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      window.open(blobUrl, '_blank', 'noopener,noreferrer');
                      // Clean up after a delay
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                      toast.success('Opened in new tab!');
                    } catch (error) {
                      // Fallback to direct URL
                      window.open(doc.file_url, '_blank', 'noopener,noreferrer');
                    }
                  }}>
                    <ExternalLink className="w-3.5 h-3.5 mr-2" />Open in Browser
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadFile(doc.file_url, doc.file_name)}>
                    <Download className="w-3.5 h-3.5 mr-2" />Download
                  </DropdownMenuItem>
                  {isOwner && (
                    <>
                      <DropdownMenuItem onClick={() => { setEditDescription(doc.description || ''); setEditDialogOpen(true); }}>
                        <Edit className="w-3.5 h-3.5 mr-2" />Edit Description
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(doc.id, doc.file_url)}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Document info */}
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-xs truncate">{doc.title}</h3>
              {doc.description && (
                <p className="text-[10px] text-muted-foreground line-clamp-2">{doc.description}</p>
              )}
              <p className="text-[9px] text-muted-foreground mt-0.5">{doc.file_name}</p>
            </div>
          </div>

          {/* Social actions */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 text-[10px] gap-1 ${loved ? 'text-red-500' : ''}`}
              onClick={handleLove}
            >
              <Heart className={`w-3.5 h-3.5 ${loved ? 'fill-current' : ''}`} />
              {loveCount > 0 && loveCount}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px] gap-1"
              onClick={loadComments}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Comment
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px] gap-1"
              onClick={handleShare}
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="glass-card max-w-md mx-4 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">Comments</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 p-2 bg-muted/30 rounded-lg">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={comment.profile?.avatar_url} />
                    <AvatarFallback className="text-[9px]">{comment.profile?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-medium">{comment.profile?.name || 'User'}</p>
                      {comment.user_id === currentUser?.id && (
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleDeleteComment(comment.id)}>
                          <Trash2 className="w-2.5 h-2.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px]">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex gap-2 pt-2 border-t">
            <Input 
              placeholder="Add a comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 h-8 text-xs"
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button size="sm" className="h-8" onClick={handleAddComment}>Send</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Description Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-card max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Description</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px]">Description</Label>
              <Textarea 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)}
                className="glass-card text-xs min-h-[80px]"
                placeholder="Add a description..."
              />
            </div>
            <Button onClick={handleEditDescription} className="w-full h-8 text-xs">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
