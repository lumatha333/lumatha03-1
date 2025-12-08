import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, ArrowLeft, Search, Plus, CheckCheck, Image, Paperclip, X, FileText } from 'lucide-react';
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
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Chat() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { conversations, messages, loading, currentChatUser, fetchMessages, sendMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Max 10MB');
      return;
    }
    setMediaFile(file);
    if (file.type.startsWith('image')) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaPreview(null);
    }
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !mediaFile) || !currentChatUser) return;
    
    setUploading(true);
    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(fileName, mediaFile, { cacheControl: '31536000', contentType: mediaFile.type });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
        mediaUrl = publicUrl;
        mediaType = mediaFile.type.startsWith('image') ? 'image' : 'document';
      }

      await sendMessage(currentChatUser, newMessage || `📎 ${mediaFile?.name || 'File'}`, mediaUrl, mediaType);
      setNewMessage('');
      clearMedia();
    } catch (error) {
      console.error('Send failed:', error);
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
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
      {/* Sidebar */}
      <div className={cn(
        "w-full sm:w-72 border-r border-border/50 flex flex-col shrink-0",
        currentChatUser ? 'hidden sm:flex' : ''
      )}>
        <div className="p-3 border-b border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Chats</h2>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowUserSearch(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No chats yet</p>
              <Button variant="link" size="sm" onClick={() => setShowUserSearch(true)}>Start a chat</Button>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.user_id}
                className={cn(
                  "w-full p-2.5 border-b border-border/20 transition-colors text-left hover:bg-muted/30",
                  currentChatUser === conv.user_id && "bg-muted/50"
                )}
                onClick={() => navigate(`/chat/${conv.user_id}`)}
              >
                <div className="flex gap-2.5">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarImage src={conv.user_avatar || undefined} />
                    <AvatarFallback className="bg-primary/20 text-xs">{conv.user_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{conv.user_name}</p>
                      {conv.unread_count > 0 && (
                        <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
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
            <div className="p-2.5 border-b border-border/50 flex items-center gap-2 bg-card/50 shrink-0">
              <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8 shrink-0" onClick={() => navigate('/chat')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={selectedConversation?.user_avatar || undefined} />
                <AvatarFallback className="bg-primary/20 text-xs">{selectedConversation?.user_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <h3 className="font-medium text-sm truncate">{selectedConversation?.user_name}</h3>
            </div>

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
                    
                    return (
                      <div key={message.id} className={cn("flex", isOwn ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          "rounded-2xl px-3 py-2 max-w-[80%]",
                          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {message.media_url && (
                            <div className="mb-1.5">
                              {isImage ? (
                                <img src={message.media_url} alt="" className="rounded-lg max-w-full max-h-48 object-cover" />
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
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Media Preview */}
            {mediaFile && (
              <div className="px-3 py-2 border-t border-border/50 bg-muted/50 flex items-center gap-2">
                {mediaPreview ? (
                  <img src={mediaPreview} alt="" className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{mediaFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(mediaFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <Button size="icon" variant="ghost" onClick={clearMedia} className="h-7 w-7">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="p-2.5 border-t border-border/50 bg-card/50 shrink-0">
              <div className="flex gap-2 items-center">
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file'; input.accept = 'image/*,.pdf,.doc,.docx,.txt';
                  input.onchange = (e) => handleFileSelect(e as any);
                  input.click();
                }}>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 h-9"
                  disabled={uploading}
                />
                <Button size="icon" onClick={handleSend} disabled={(!newMessage.trim() && !mediaFile) || uploading} className="h-8 w-8 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden sm:flex flex-col items-center justify-center h-full">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-base font-semibold mb-1">Messages</h3>
            <p className="text-sm text-muted-foreground mb-3">Send messages & files</p>
            <Button size="sm" onClick={() => setShowUserSearch(true)}>New Chat</Button>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
        <DialogContent className="max-w-xs mx-4">
          <DialogHeader><DialogTitle className="text-base">New Chat</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="pl-8 h-9" autoFocus />
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((u) => (
                  <button key={u.id} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted" onClick={() => startNewChat(u.id)}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-xs">{u.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{u.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}