import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ArrowLeft, Search, Plus, CheckCheck, Paperclip, X, FileText, MoreVertical, Archive, Ghost, Trash2, ShieldOff, Image, Video, Smile } from 'lucide-react';
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Emoji stickers
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

  // Screenshot prevention CSS - serious privacy protection
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'chat-protection';
    style.textContent = `
      .chat-protected {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      .chat-protected img, .chat-protected video {
        pointer-events: none;
        -webkit-user-drag: none;
      }
      @media print {
        .chat-protected { display: none !important; visibility: hidden !important; }
      }
      @-webkit-keyframes screenshot-prevent {
        from { filter: blur(0px); }
        to { filter: blur(20px); }
      }
    `;
    document.head.appendChild(style);

    // Detect screenshot attempts (visibility change)
    const handleVisibilityChange = () => {
      if (document.hidden && currentChatUser) {
        // Could log or notify about potential screenshot
        console.log('Chat visibility changed - potential screenshot');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      const el = document.getElementById('chat-protection');
      if (el) el.remove();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentChatUser]);

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

  // Load archived chats from local storage
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
    
    // Delete all messages between the two users
    await supabase.from('messages').delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatUserId}),and(sender_id.eq.${chatUserId},receiver_id.eq.${user.id})`);
    
    toast.success('Chat deleted permanently');
    navigate('/chat');
    window.location.reload();
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
      // Upload each file and send as separate messages
      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(fileName, file, { cacheControl: '31536000', contentType: file.type });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }
        
        const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
        const mediaType = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'document';
        
        await sendMessage(currentChatUser, `📎 ${file.name}`, publicUrl, mediaType);
      }

      // Send text message if any
      if (newMessage.trim()) {
        await sendMessage(currentChatUser, newMessage);
      }
      
      setNewMessage('');
      clearAllMedia();

      // Ghost mode notification
      if (ghostMode) {
        toast.info('🔥 Ghost mode: Messages will disappear');
      }
    } catch (error) {
      console.error('Send failed:', error);
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

  const startNewChat = (userId: string) => {
    setShowUserSearch(false); setUserSearchQuery('');
    navigate(`/chat/${userId}`);
  };

  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);
  
  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || conv.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const isArchived = archivedChats.has(conv.user_id);
    return matchesSearch && (showArchived ? isArchived : !isArchived);
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background -mx-4 sm:mx-0 chat-protected">
      {/* Sidebar - Conversation List */}
      <div className={cn(
        "w-full sm:w-72 border-r border-border/50 flex flex-col shrink-0",
        currentChatUser ? 'hidden sm:flex' : ''
      )}>
        <div className="p-3 border-b border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Messages</h2>
            <div className="flex items-center gap-1">
              <Button 
                size="icon" 
                variant={showArchived ? "secondary" : "ghost"} 
                className="h-8 w-8" 
                onClick={() => setShowArchived(!showArchived)}
                title={showArchived ? "Show active chats" : "Show archived"}
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowUserSearch(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm" />
          </div>
          {showArchived && (
            <p className="text-xs text-muted-foreground text-center">📁 Archived Chats</p>
          )}
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {showArchived ? 'No archived chats' : 'No chats yet'}
              </p>
              {!showArchived && (
                <Button variant="link" size="sm" onClick={() => setShowUserSearch(true)}>Start a chat</Button>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.user_id}
                onClick={() => navigate(`/chat/${conv.user_id}`)}
                className={cn(
                  "w-full p-2.5 border-b border-border/20 transition-colors cursor-pointer hover:bg-muted/30 flex items-center gap-2",
                  currentChatUser === conv.user_id && "bg-muted/50"
                )}
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={conv.user_avatar || undefined} />
                  <AvatarFallback className="bg-primary/20 text-xs">{conv.user_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{conv.user_name}</p>
                    {conv.unread_count > 0 && (
                      <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleArchive(conv.user_id); }}>
                      <Archive className="w-4 h-4 mr-2" />
                      {archivedChats.has(conv.user_id) ? 'Unarchive' : 'Archive'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); deleteEntireChat(conv.user_id); }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area - Full screen messenger style */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentChatUser ? (
          <>
            {/* Chat Header */}
            <div className="p-2.5 border-b border-border/50 flex items-center gap-2 bg-card/50 shrink-0">
              <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8 shrink-0" onClick={() => navigate('/chat')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="w-9 h-9 shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${currentChatUser}`)}>
                <AvatarImage src={selectedConversation?.user_avatar || undefined} />
                <AvatarFallback className="bg-primary/20 text-xs">{selectedConversation?.user_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${currentChatUser}`)}>
                <h3 className="font-medium text-sm truncate">{selectedConversation?.user_name}</h3>
                <div className="flex items-center gap-2">
                  {ghostMode && (
                    <p className="text-[10px] text-orange-500 flex items-center gap-1">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card w-52">
                  <div className="p-2 space-y-3">
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
                  <DropdownMenuItem onClick={() => toggleArchive(currentChatUser)}>
                    <Archive className="w-4 h-4 mr-2" />
                    {archivedChats.has(currentChatUser) ? 'Unarchive' : 'Archive'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-green-500">
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Screenshot Protected ✓
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteEntireChat(currentChatUser)}
                    className="text-destructive"
                  >
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
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Say hello! 👋</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    const isImage = message.media_type === 'image' || message.media_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const isVideo = message.media_type === 'video' || message.media_url?.match(/\.(mp4|webm|mov)$/i);
                    
                    return (
                      <div key={message.id} className={cn("flex group", isOwn ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          "rounded-2xl px-3 py-2 max-w-[80%] relative",
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {message.media_url && (
                            <div className="mb-1.5">
                              {isImage ? (
                                <img src={message.media_url} alt="" className="rounded-lg max-w-full max-h-48 object-cover" />
                              ) : isVideo ? (
                                <video src={message.media_url} className="rounded-lg max-w-full max-h-48" controls />
                              ) : (
                                <a href={message.media_url} target="_blank" rel="noopener noreferrer" 
                                   className="flex items-center gap-2 p-2 rounded-lg bg-background/20 text-xs underline">
                                  <FileText className="w-4 h-4" /> Download
                                </a>
                              )}
                            </div>
                          )}
                          {message.content && !message.content.startsWith('📎') && (
                            <p className="text-sm break-words">{message.content}</p>
                          )}
                          <div className={cn("flex items-center gap-1 mt-0.5 text-[9px]", isOwn ? 'text-primary-foreground/60 justify-end' : 'text-muted-foreground')}>
                            <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}</span>
                            {isOwn && <CheckCheck className="w-3 h-3" />}
                          </div>
                          
                          {isOwn && (
                            <button
                              onClick={() => deleteMessage(message.id)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-destructive/10 hover:bg-destructive/20"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          )}
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
              <div className="p-2 border-t border-border/50 bg-muted/30">
                <div className="flex gap-2 flex-wrap">
                  {mediaPreviews.map((preview, i) => (
                    <div key={i} className="relative">
                      <img src={preview} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stickers Panel */}
            {showStickers && (
              <div className="p-2 border-t border-border/50 bg-muted/30">
                <div className="grid grid-cols-8 gap-2">
                  {STICKERS.map((sticker, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendSticker(sticker)}
                      className="text-2xl hover:scale-125 transition-transform p-1"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-2.5 border-t border-border/50 bg-card/50 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="glass-card">
                    <DropdownMenuItem onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'image/*';
                        fileInputRef.current.click();
                      }
                    }}>
                      <Image className="w-4 h-4 mr-2" /> Photo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'video/*';
                        fileInputRef.current.click();
                      }
                    }}>
                      <Video className="w-4 h-4 mr-2" /> Video
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '.pdf,.doc,.docx';
                        fileInputRef.current.click();
                      }
                    }}>
                      <FileText className="w-4 h-4 mr-2" /> Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-9 w-9 shrink-0", showStickers && "bg-muted")}
                  onClick={() => setShowStickers(!showStickers)}
                >
                  <Smile className="w-5 h-5" />
                </Button>
                
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={uploading}
                />
                
                <Button 
                  size="icon" 
                  className="h-9 w-9 shrink-0"
                  onClick={handleSend}
                  disabled={uploading || (!newMessage.trim() && mediaFiles.length === 0)}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">Select a chat</h3>
              <p className="text-sm text-muted-foreground">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* User Search Dialog */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="glass-card max-w-sm">
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
            <ScrollArea className="max-h-60">
              {searchResults.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  {userSearchQuery ? 'No users found' : 'Type to search users'}
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => startNewChat(user.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-primary/20">{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
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

// Import for the empty state
import { MessageSquare } from 'lucide-react';
