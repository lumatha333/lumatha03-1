import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Search, Send, Link2, Copy, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle?: string;
  postContent?: string;
}

interface Friend {
  id: string;
  name: string;
  avatar_url?: string;
}

export function ShareDialog({ open, onOpenChange, postId, postTitle, postContent }: ShareDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && user) fetchFriends();
  }, [open, user]);

  const fetchFriends = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get users the current user follows
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      // Get accepted friend requests
      const { data: friendsData } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const friendIds = new Set<string>();
      followingData?.forEach(f => friendIds.add(f.following_id));
      friendsData?.forEach(f => {
        if (f.sender_id === user.id) friendIds.add(f.receiver_id);
        else friendIds.add(f.sender_id);
      });

      if (friendIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', Array.from(friendIds));
        setFriends(profiles || []);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedFriends.size === 0 || !user) return;
    setSending(true);

    try {
      const shareMessage = `📤 Shared a post: "${postTitle || 'Post'}"`;
      const postLink = `${window.location.origin}/?post=${postId}`;

      // Send message to each selected friend
      for (const friendId of selectedFriends) {
        await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: friendId,
          content: `${shareMessage}\n\n"${postContent?.slice(0, 100) || ''}..."\n\n🔗 ${postLink}`
        });

        // Create notification
        await supabase.from('notifications').insert({
          user_id: friendId,
          type: 'share',
          from_user_id: user.id,
          content: `shared a post with you`,
          link: `/chat/${user.id}`
        });
      }

      toast.success(`Sent to ${selectedFriends.size} ${selectedFriends.size === 1 ? 'friend' : 'friends'}`);
      onOpenChange(false);
      setSelectedFriends(new Set());
    } catch (error) {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    const postLink = `${window.location.origin}/?post=${postId}`;
    navigator.clipboard.writeText(postLink);
    toast.success('Link copied!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-sm mx-4 max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b border-border/30">
          <DialogTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Share with friends
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Friends List */}
        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {searchQuery ? 'No friends found' : 'Follow people to share with them'}
            </div>
          ) : (
            <div className="space-y-1 pb-2">
              {filteredFriends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => toggleFriend(friend.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                    selectedFriends.has(friend.id) 
                      ? "bg-primary/10 border border-primary/30" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={friend.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-sm">
                      {friend.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm flex-1 text-left">{friend.name}</span>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    selectedFriends.has(friend.id) 
                      ? "bg-primary border-primary" 
                      : "border-muted-foreground"
                  )}>
                    {selectedFriends.has(friend.id) && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="p-4 border-t border-border/30 space-y-2">
          <div className="flex gap-2">
            <Button 
              onClick={handleSend} 
              disabled={selectedFriends.size === 0 || sending}
              className="flex-1 gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : `Send${selectedFriends.size > 0 ? ` (${selectedFriends.size})` : ''}`}
            </Button>
            <Button variant="outline" onClick={copyLink} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
