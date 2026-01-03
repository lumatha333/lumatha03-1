import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ArrowLeft, Search, Plus, CheckCheck, Paperclip, X, MoreVertical, Archive, Ghost, Trash2, ShieldOff, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STICKERS = ['😀', '😂', '🥰', '😍', '🤩', '😎', '🥳', '😭', '😤', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'];

export default function Chat() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { conversations, messages, loading, currentChatUser, fetchMessages, sendMessage, deleteMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Screenshot prevention
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'chat-protection';
    style.textContent = `
      .chat-protected {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      .chat-protected img, .chat-protected video {
        pointer-events: none;
        -webkit-user-drag: none;
      }
      @media print {
        .chat-protected { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById('chat-protection')?.remove();
    };
  }, []);

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

  useEffect(() => {
    const stored = localStorage.getItem('archivedChats');
    if (stored) setArchivedChats(new Set(JSON.parse(stored)));
  }, []);

  const saveArchivedChats = (chats: Set<string>) => {
    localStorage.setItem('archivedChats', JSON.stringify([...chats]));
    setArchivedChats(chats);
  };

  const toggleArchive = (chatUserId: string) => {
    const newArchived = new Set(archivedChats);
    if (newArchived.has(chatUserId)) {
      newArchived.delete(chatUserId);
      toast.success('Chat unarchived');
    } else {
      newArchived.add(chatUserId);
      toast.success('Chat archived');
    }
    saveArchivedChats(newArchived);
  };

  const deleteEntireChat = async (chatUserId: string) => {
    if (!user) return;
    await supabase.from('messages').delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatUserId}),and(sender_id.eq.${chatUserId},receiver_id.eq.${user.id})`);
    toast.success('Chat deleted');
    navigate('/chat');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const previews: string[] = [];
    
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Max 10MB`);
        return;
      }
      validFiles.push(file);
      if (file.type.startsWith('image') || file.type.startsWith('video')) {
        previews.push(URL.createObjectURL(file));
      }
    });
    
    setMediaFiles(prev => [...prev, ...validFiles]);
    setMediaPreviews(prev => [...prev, ...previews]);
  };

  const removeMedia = (index: number) => {
    if (mediaPreviews[index]) URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllMedia = () => {
    mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && mediaFiles.length === 0) || !currentChatUser) return;
    
    setUploading(true);
    try {
      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(fileName, file, { cacheControl: '31536000', contentType: file.type });
        
        if (uploadError) continue;
        
        const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
        const mediaType = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'document';
        
        await sendMessage(currentChatUser, `📎 ${file.name}`, publicUrl, mediaType);
      }

      if (newMessage.trim()) {
        await sendMessage(currentChatUser, newMessage);
      }
      
      setNewMessage('');
      clearAllMedia();

      if (ghostMode) {
        toast.info('🔥 Ghost mode: Messages will disappear');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const handleSendSticker = async (sticker: string) => {
    if (!currentChatUser) return;
    await sendMessage(currentChatUser, sticker);
    setShowStickers(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startNewChat = (targetUserId: string) => {
    setShowUserSearch(false);
    setUserSearchQuery('');
    navigate(`/chat/${targetUserId}`);
  };

  // Navigate back to chat list (stay in messages section)
  const handleBackToChats = () => {
    // Use replace to properly go back to chat list without adding to history
    navigate('/chat', { replace: true });
  };

  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);
  
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || conv.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const isArchived = archivedChats.has(conv.user_id);
    return matchesSearch && (showArchived ? isArchived : !isArchived);
  });

  // Full screen chat when viewing a conversation
  if (currentChatUser) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col chat-protected animate-slide-in-right">
        {/* Chat Header */}
        <div className="p-3 border-b border-border/50 flex items-center gap-3 bg-card/80 backdrop-blur-sm shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 shrink-0 transition-transform hover:scale-110 active:scale-95" 
            onClick={handleBackToChats}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar 
            className="w-10 h-10 shrink-0 cursor-pointer ring-2 ring-transparent transition-all hover:ring-primary" 
            onClick={() => navigate(`/profile/${currentChatUser}`)}
          >
            <AvatarImage src={selectedConversation?.user_avatar || undefined} />
            <AvatarFallback className="bg-primary/20">{selectedConversation?.user_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${currentChatUser}`)}>
            <h3 className="font-semibold text-sm truncate">{selectedConversation?.user_name}</h3>
            <div className="flex items-center gap-2">
              {ghostMode && (
                <p className="text-[10px] text-orange-500 flex items-center gap-1 animate-pulse">
                  <Ghost className="w-3 h-3" /> Ghost Mode
                </p>
              )}
              <p className="text-[10px] text-green-500 flex items-center gap-1">
                <ShieldOff className="w-3 h-3" /> Protected
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 transition-transform hover:scale-110">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card w-56 animate-scale-in">
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Ghost className="w-4 h-4" />
                    Ghost Mode
                  </div>
                  <Switch checked={ghostMode} onCheckedChange={setGhostMode} />
                </div>
                <p className="text-[10px] text-muted-foreground">Disappearing messages</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleArchive(currentChatUser)} className="transition-colors">
                <Archive className="w-4 h-4 mr-2" />
                {archivedChats.has(currentChatUser) ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-green-500">
                <ShieldOff className="w-4 h-4 mr-2" />
                Screenshot Protected ✓
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteEntireChat(currentChatUser)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Entire Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
              <p className="text-sm text-muted-foreground">Say hello! 👋</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                return (
                  <div 
                    key={message.id} 
                    className={cn(
                      "flex gap-2 animate-fade-in",
                      isOwn ? "justify-end" : "justify-start"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className={cn(
                      "max-w-[75%] rounded-2xl p-3 transition-all duration-300 hover:shadow-lg",
                      isOwn 
                        ? "bg-primary text-primary-foreground rounded-br-md" 
                        : "bg-muted rounded-bl-md"
                    )}>
                      {message.media_url && (
                        <div className="mb-2 overflow-hidden rounded-lg">
                          {message.media_type === 'image' ? (
                            <img 
                              src={message.media_url} 
                              alt="" 
                              className="max-w-full max-h-64 rounded-lg object-contain transition-transform hover:scale-105" 
                            />
                          ) : message.media_type === 'video' ? (
                            <video 
                              src={message.media_url} 
                              className="max-w-full max-h-64 rounded-lg" 
                              controls 
                            />
                          ) : (
                            <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                              📎 Attachment
                            </a>
                          )}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        isOwn ? "justify-end" : "justify-start"
                      )}>
                        <span className="text-[10px] opacity-70">
                          {formatDistanceToNow(new Date(message.created_at || ''), { addSuffix: true })}
                        </span>
                        {isOwn && (
                          <CheckCheck className={cn("w-3 h-3", message.is_read ? "text-blue-400" : "opacity-50")} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Media Previews */}
        {mediaPreviews.length > 0 && (
          <div className="p-2 border-t border-border/50 bg-card/50">
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative shrink-0 animate-scale-in">
                    {mediaFiles[index]?.type.startsWith('video') ? (
                      <video src={preview} className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <img src={preview} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full transition-transform hover:scale-110"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Stickers */}
        {showStickers && (
          <div className="p-3 border-t border-border/50 bg-card/80 animate-fade-in">
            <div className="grid grid-cols-8 gap-2">
              {STICKERS.map((sticker, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  className="h-10 w-10 text-xl transition-transform hover:scale-125 active:scale-95"
                  onClick={() => handleSendSticker(sticker)}
                >
                  {sticker}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-border/50 bg-card/80 backdrop-blur-sm safe-area-bottom">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-10 w-10 transition-transform hover:scale-110 active:scale-95"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "shrink-0 h-10 w-10 transition-all hover:scale-110",
                showStickers && "bg-primary/20"
              )}
              onClick={() => setShowStickers(!showStickers)}
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-10 rounded-full bg-muted/50 border-0 focus-visible:ring-primary"
            />
            <Button 
              size="icon" 
              onClick={handleSend} 
              disabled={uploading || (!newMessage.trim() && mediaFiles.length === 0)}
              className="shrink-0 h-10 w-10 rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Chat list view
  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowArchived(!showArchived)}
            className={cn("transition-all", showArchived && "bg-primary/20")}
          >
            <Archive className="w-4 h-4 mr-1" />
            {showArchived ? 'Active' : 'Archive'}
          </Button>
          <Button size="sm" onClick={() => setShowUserSearch(true)} className="transition-transform hover:scale-105">
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 rounded-full bg-card/50"
        />
      </div>

      {/* Conversations */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground animate-pulse">Loading chats...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 space-y-3 animate-fade-in">
            <p className="text-muted-foreground">
              {showArchived ? 'No archived chats' : 'No conversations yet'}
            </p>
            {!showArchived && (
              <Button onClick={() => setShowUserSearch(true)} className="transition-transform hover:scale-105">
                Start a conversation
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv, index) => (
            <div
              key={conv.user_id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card/50 hover:bg-card cursor-pointer transition-all duration-300 hover:shadow-md hover:translate-x-1 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/chat/${conv.user_id}`)}
            >
              <Avatar className="w-12 h-12 ring-2 ring-transparent transition-all hover:ring-primary">
                <AvatarImage src={conv.user_avatar || undefined} />
                <AvatarFallback className="bg-primary/20">{conv.user_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{conv.user_name}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {conv.last_message_time && formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
              </div>
              {conv.unread_count > 0 && (
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium animate-pulse">
                  {conv.unread_count}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="glass-card animate-scale-in">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {searchResults.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-300 hover:translate-x-1 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => startNewChat(user.id)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20">{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                ))}
                {userSearchQuery && searchResults.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No users found</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}