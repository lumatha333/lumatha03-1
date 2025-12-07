import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ArrowLeft, MoreVertical, Search, Plus, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export default function Chat() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { conversations, messages, loading, currentChatUser, fetchMessages, sendMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) fetchMessages(userId);
  }, [userId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearchQuery.trim()) { setSearchResults([]); return; }
      const { data } = await supabase.from('profiles').select('id, name, avatar_url')
        .ilike('name', `%${userSearchQuery}%`).neq('id', user?.id).limit(10);
      setSearchResults(data || []);
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChatUser) return;
    await sendMessage(currentChatUser, newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startNewChat = (userId: string) => {
    setShowUserSearch(false); setUserSearchQuery('');
    navigate(`/chat/${userId}`);
  };

  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);
  const filteredConversations = conversations.filter(conv => 
    !searchQuery || conv.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background -mx-4 sm:mx-0">
      {/* Conversations Sidebar */}
      <div className={cn(
        "w-full sm:w-80 md:w-96 border-r border-border/50 flex flex-col shrink-0",
        currentChatUser ? 'hidden sm:flex' : ''
      )}>
        <div className="p-3 sm:p-4 border-b border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-base">💬</span>
              </div>
              <div>
                <h2 className="text-base font-bold">Messages</h2>
                <p className="text-[10px] text-muted-foreground">Secure messaging</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowUserSearch(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-muted/50 h-9 text-sm" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Send className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No conversations</p>
              <Button variant="link" size="sm" onClick={() => setShowUserSearch(true)}>Start a chat</Button>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.user_id}
                className={cn(
                  "w-full p-3 border-b border-border/30 transition-colors text-left hover:bg-muted/30",
                  currentChatUser === conv.user_id && "bg-muted/50"
                )}
                onClick={() => navigate(`/chat/${conv.user_id}`)}
              >
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={conv.user_avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-sm">
                      {conv.user_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{conv.user_name}</p>
                      {conv.last_message_time && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                      {conv.unread_count > 0 && (
                        <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center shrink-0 ml-2">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentChatUser ? (
          <>
            <div className="p-3 border-b border-border/50 flex items-center justify-between bg-card/50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8 shrink-0" onClick={() => navigate('/chat')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={selectedConversation?.user_avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-sm">
                    {selectedConversation?.user_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm truncate">{selectedConversation?.user_name}</h3>
                  <p className="text-[10px] text-muted-foreground">Online</p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-3 sm:p-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <span className="text-3xl">👋</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={cn("flex", isOwn ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          "rounded-2xl px-3 py-2 max-w-[85%] sm:max-w-[75%]",
                          isOwn ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground" : "bg-muted"
                        )}>
                          {message.media_url && (
                            <img src={message.media_url} alt="Media" className="rounded-lg mb-2 max-w-full" />
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-[10px]",
                            isOwn ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
                          )}>
                            <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}</span>
                            {isOwn && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t border-border/50 bg-card/50 shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 bg-muted/50"
                />
                <Button size="icon" onClick={handleSend} disabled={!newMessage.trim()} className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden sm:flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Your Messages</h3>
            <p className="text-sm text-muted-foreground mb-4">Select a conversation or start a new one</p>
            <Button onClick={() => setShowUserSearch(true)}>New Message</Button>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="glass-card max-w-sm mx-4">
          <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="pl-9" autoFocus />
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((u) => (
                  <button key={u.id} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => startNewChat(u.id)}>
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-sm">{u.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{u.name}</span>
                  </button>
                ))}
              </div>
            )}
            {userSearchQuery && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
