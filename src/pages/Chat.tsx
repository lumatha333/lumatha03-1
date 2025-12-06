import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Send, Image, ArrowLeft, MoreVertical, Phone, Video as VideoIcon,
  Pin, Smile, Mic, Trash2, Forward, Reply, Search, Plus,
  Ghost, Timer, Lock, Tag, Star, CheckCheck, Clock, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Chat Tags for organizing conversations
const chatTags = [
  { id: 'all', label: 'All', icon: '💬', color: 'bg-primary' },
  { id: 'study', label: 'Study', icon: '📚', color: 'bg-blue-500' },
  { id: 'work', label: 'Work', icon: '💼', color: 'bg-amber-500' },
  { id: 'fun', label: 'Fun', icon: '🎉', color: 'bg-pink-500' },
  { id: 'private', label: 'Private', icon: '🔒', color: 'bg-violet-500' },
];

// Message reactions
const reactions = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export default function Chat() {
  const { userId } = useParams();
  const { user, profile } = useAuth();
  const { conversations, messages, loading, currentChatUser, fetchMessages, sendMessage, deleteMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const [whisperMode, setWhisperMode] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
    }
  }, [userId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search for users to start new chat
  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .ilike('name', `%${userSearchQuery}%`)
        .neq('id', user?.id)
        .limit(10);
      setSearchResults(data || []);
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChatUser) return;
    
    await sendMessage(currentChatUser, newMessage);
    setNewMessage('');
    
    if (whisperMode) {
      toast.info('Whisper mode: Message will auto-delete in 3 seconds', { duration: 2000 });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const togglePin = (messageId: string) => {
    setPinnedMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
        toast.success('Message unpinned');
      } else {
        next.add(messageId);
        toast.success('Message pinned');
      }
      return next;
    });
  };

  const handleReaction = (messageId: string, reaction: string) => {
    toast.success(`Reacted with ${reaction}`);
    setShowReactions(null);
  };

  const startNewChat = (userId: string) => {
    setShowUserSearch(false);
    setUserSearchQuery('');
    navigate(`/chat/${userId}`);
  };

  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);

  const filteredConversations = conversations.filter(conv => {
    if (searchQuery && !conv.user_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversations Sidebar */}
      <div className={cn(
        "w-full md:w-96 border-r border-border/50 flex flex-col",
        currentChatUser ? 'hidden md:flex' : ''
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg">💬</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">Crown Chat</h2>
                <p className="text-xs text-muted-foreground">Secure messaging</p>
              </div>
            </div>
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => setShowUserSearch(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50"
            />
          </div>

          {/* Chat Tags */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {chatTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTag(tag.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  activeTag === tag.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <span>{tag.icon}</span>
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No conversations yet</p>
              <Button 
                variant="link" 
                onClick={() => setShowUserSearch(true)}
                className="mt-2"
              >
                Start a new chat
              </Button>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.user_id}
                className={cn(
                  "w-full p-4 border-b border-border/30 transition-colors text-left hover:bg-muted/30",
                  currentChatUser === conv.user_id && "bg-muted/50"
                )}
                onClick={() => navigate(`/chat/${conv.user_id}`)}
              >
                <div className="flex gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.user_avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30">
                      {conv.user_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">{conv.user_name}</p>
                      {conv.last_message_time && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                        {conv.last_message}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                          {conv.unread_count}
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
      <div className="flex-1 flex flex-col">
        {currentChatUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => navigate('/chat')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConversation?.user_avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30">
                    {selectedConversation?.user_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation?.user_name}</h3>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <VideoIcon className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setWhisperMode(!whisperMode)}>
                      <Timer className="w-4 h-4 mr-2" />
                      Whisper Mode {whisperMode && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGhostMode(!ghostMode)}>
                      <Ghost className="w-4 h-4 mr-2" />
                      Ghost Mode {ghostMode && '✓'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Tag className="w-4 h-4 mr-2" />
                      Add Tag
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Lock className="w-4 h-4 mr-2" />
                      Lock Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mode Indicators */}
            {(whisperMode || ghostMode) && (
              <div className="px-4 py-2 bg-muted/50 flex items-center gap-2 text-xs">
                {whisperMode && (
                  <Badge variant="secondary" className="gap-1">
                    <Timer className="w-3 h-3" />
                    Whisper Mode
                  </Badge>
                )}
                {ghostMode && (
                  <Badge variant="secondary" className="gap-1">
                    <Ghost className="w-3 h-3" />
                    Ghost Mode
                  </Badge>
                )}
              </div>
            )}

            {/* Pinned Messages */}
            {pinnedMessages.size > 0 && (
              <div className="px-4 py-2 bg-primary/5 border-b border-primary/20">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Pin className="w-3 h-3" />
                  <span>{pinnedMessages.size} pinned message(s)</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-pulse text-muted-foreground">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <span className="text-4xl">👋</span>
                  </div>
                  <p className="text-muted-foreground">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    const isPinned = pinnedMessages.has(message.id);
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex group",
                          isOwn ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div className={cn(
                          "relative max-w-[75%]",
                          isPinned && "ring-2 ring-primary/50 rounded-2xl"
                        )}>
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5",
                              isOwn
                                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {message.media_url && (
                              <img
                                src={message.media_url}
                                alt="Shared media"
                                className="rounded-lg mb-2 max-w-full"
                              />
                            )}
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            <div className={cn(
                              "flex items-center gap-1.5 mt-1 text-[10px]",
                              isOwn ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
                            )}>
                              <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}</span>
                              {isOwn && <CheckCheck className="w-3 h-3" />}
                            </div>
                          </div>

                          {/* Message Actions */}
                          <div className={cn(
                            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
                            isOwn ? "-left-20" : "-right-20"
                          )}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => togglePin(message.id)}
                            >
                              <Pin className={cn("w-3.5 h-3.5", isPinned && "fill-current")} />
                            </Button>
                            {isOwn && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteMessage(message.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>

                          {/* Reactions Picker */}
                          {showReactions === message.id && (
                            <div className={cn(
                              "absolute top-full mt-1 bg-card border rounded-full px-2 py-1 flex gap-1 shadow-lg z-10",
                              isOwn ? "right-0" : "left-0"
                            )}>
                              {reactions.map((r) => (
                                <button
                                  key={r}
                                  onClick={() => handleReaction(message.id, r)}
                                  className="text-lg hover:scale-125 transition-transform"
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border/50 bg-card/50">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Plus className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Image className="h-5 w-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={whisperMode ? "Whisper message..." : "Type a message..."}
                  className={cn(
                    "flex-1",
                    whisperMode && "border-amber-500/50"
                  )}
                />
                <Button variant="ghost" size="icon">
                  <Mic className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleSend} 
                  disabled={!newMessage.trim()}
                  className="btn-cosmic"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
              <span className="text-5xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Crown Chat Universe</h3>
            <p className="text-center max-w-xs">
              Select a conversation or start a new chat to connect with friends
            </p>
            <Button 
              className="mt-6 gap-2"
              onClick={() => setShowUserSearch(true)}
            >
              <Plus className="w-4 h-4" />
              Start New Chat
            </Button>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-64">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {userSearchQuery ? 'No users found' : 'Type to search users'}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                      onClick={() => startNewChat(u.id)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback>{u.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
