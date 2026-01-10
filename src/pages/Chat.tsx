import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Send, ArrowLeft, Search, Plus, CheckCheck, Paperclip, X, MoreVertical, 
  Archive, Ghost, Trash2, ShieldOff, Smile, Mic, MicOff, Play, Pause, 
  Phone, Video, Lock, Image, Users, Clock, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STICKERS = ['😀', '😂', '🥰', '😍', '🤩', '😎', '🥳', '😭', '😤', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'];
const GHOST_MODES = [
  { label: '30 minutes', value: 30, icon: '⚡' },
  { label: '1 day', value: 1440, icon: '🌙' },
  { label: '1 week', value: 10080, icon: '📅' },
];

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
  const [privateChats, setPrivateChats] = useState<Set<string>>(new Set());
  const [chatTab, setChatTab] = useState<'main' | 'archived' | 'private' | 'following'>('main');
  const [ghostMode, setGhostMode] = useState<number | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [privatePassword, setPrivatePassword] = useState('');
  const [showPrivateAuth, setShowPrivateAuth] = useState(false);
  const [pendingPrivateChat, setPendingPrivateChat] = useState<string | null>(null);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Screenshot prevention
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'chat-protection';
    style.textContent = `
      .chat-protected {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      .chat-protected img, .chat-protected video {
        pointer-events: none;
        -webkit-user-drag: none;
      }
      @media print { .chat-protected { display: none !important; } }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById('chat-protection')?.remove(); };
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
    const storedPrivate = localStorage.getItem('privateChats');
    const storedPassword = localStorage.getItem('privateChatPassword');
    if (stored) setArchivedChats(new Set(JSON.parse(stored)));
    if (storedPrivate) setPrivateChats(new Set(JSON.parse(storedPrivate)));
    if (storedPassword) setPrivatePassword(storedPassword);
  }, []);

  const saveArchivedChats = (chats: Set<string>) => {
    localStorage.setItem('archivedChats', JSON.stringify([...chats]));
    setArchivedChats(chats);
  };

  const savePrivateChats = (chats: Set<string>) => {
    localStorage.setItem('privateChats', JSON.stringify([...chats]));
    setPrivateChats(chats);
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

  const addToPrivate = (chatUserId: string) => {
    const newPrivate = new Set([...privateChats, chatUserId]);
    savePrivateChats(newPrivate);
    toast.success('Added to private chats');
  };

  const removeFromPrivate = (chatUserId: string) => {
    const newPrivate = new Set(privateChats);
    newPrivate.delete(chatUserId);
    savePrivateChats(newPrivate);
    toast.success('Removed from private');
  };

  const handlePrivateAccess = (chatUserId: string) => {
    const savedPassword = localStorage.getItem('privateChatPassword');
    if (!savedPassword) {
      // First time - set password
      setPendingPrivateChat(chatUserId);
      setShowPrivateAuth(true);
    } else {
      // Verify password
      setPendingPrivateChat(chatUserId);
      setShowPrivateAuth(true);
    }
  };

  const verifyPrivatePassword = (input: string) => {
    const savedPassword = localStorage.getItem('privateChatPassword');
    if (!savedPassword) {
      // Setting password for first time
      localStorage.setItem('privateChatPassword', input);
      setShowPrivateAuth(false);
      if (pendingPrivateChat) navigate(`/chat/${pendingPrivateChat}`);
      toast.success('Private chat password set!');
    } else if (input === savedPassword) {
      setShowPrivateAuth(false);
      if (pendingPrivateChat) navigate(`/chat/${pendingPrivateChat}`);
    } else {
      toast.error('Incorrect password');
    }
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
        toast.info(`🔥 Ghost mode: Messages disappear in ${GHOST_MODES.find(g => g.value === ghostMode)?.label}`);
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const handleReactToMessage = (messageId: string) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: (prev[messageId] || 0) + 1
    }));
    toast.success('❤️');
  };

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.info('🎤 Recording...');
    } catch (error) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !currentChatUser || !user) return;
    
    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}_voice.webm`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
      await sendMessage(currentChatUser, '🎤 Voice message', publicUrl, 'audio');
      
      setAudioBlob(null);
      setRecordingTime(0);
      toast.success('Voice message sent!');
    } catch (error) {
      toast.error('Failed to send voice message');
    } finally {
      setUploading(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const handleBackToChats = () => {
    navigate('/chat', { replace: true });
  };

  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);
  
  // Filter conversations by category
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || conv.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const isArchived = archivedChats.has(conv.user_id);
    const isPrivate = privateChats.has(conv.user_id);
    
    if (chatTab === 'archived') return matchesSearch && isArchived;
    if (chatTab === 'private') return matchesSearch && isPrivate;
    if (chatTab === 'main') return matchesSearch && !isArchived && !isPrivate;
    return matchesSearch; // following
  });

  // Get media from messages for gallery
  const mediaMessages = messages.filter(m => m.media_url && ['image', 'video'].includes(m.media_type || ''));

  // Full screen chat view
  if (currentChatUser) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col chat-protected animate-slide-in-right">
        {/* Chat Header */}
        <div className="p-3 border-b border-border/50 flex items-center gap-3 bg-card/80 backdrop-blur-sm shrink-0">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={handleBackToChats}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="w-10 h-10 shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${currentChatUser}`)}>
            <AvatarImage src={selectedConversation?.user_avatar || undefined} />
            <AvatarFallback className="bg-primary/20">{selectedConversation?.user_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${currentChatUser}`)}>
            <h3 className="font-semibold text-sm truncate">{selectedConversation?.user_name}</h3>
            <div className="flex items-center gap-2">
              {ghostMode && (
                <p className="text-[10px] text-orange-500 flex items-center gap-1 animate-pulse">
                  <Ghost className="w-3 h-3" /> {GHOST_MODES.find(g => g.value === ghostMode)?.label}
                </p>
              )}
              <p className="text-[10px] text-green-500 flex items-center gap-1">
                <ShieldOff className="w-3 h-3" /> Protected
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card w-56">
              {/* Ghost Mode */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Ghost className="w-4 h-4 mr-2" />
                  Ghost Mode
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {GHOST_MODES.map((mode) => (
                    <DropdownMenuItem 
                      key={mode.value} 
                      onClick={() => { setGhostMode(mode.value); toast.success(`Ghost mode: ${mode.label}`); }}
                    >
                      <span className="mr-2">{mode.icon}</span>
                      {mode.label}
                      {ghostMode === mode.value && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => { setGhostMode(null); toast.success('Ghost mode off'); }}>
                    Off
                    {!ghostMode && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuItem onClick={() => setShowMediaGallery(true)}>
                <Image className="w-4 h-4 mr-2" />
                Media Gallery
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => toast.info('Group chat coming soon!')}>
                <Users className="w-4 h-4 mr-2" />
                Create Group
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => toggleArchive(currentChatUser)}>
                <Archive className="w-4 h-4 mr-2" />
                {archivedChats.has(currentChatUser) ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              
              {privateChats.has(currentChatUser) ? (
                <DropdownMenuItem onClick={() => removeFromPrivate(currentChatUser)}>
                  <Lock className="w-4 h-4 mr-2" />
                  Remove from Private
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => addToPrivate(currentChatUser)}>
                  <Lock className="w-4 h-4 mr-2" />
                  Add to Private
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => deleteEntireChat(currentChatUser)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chat
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
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Say hello! 👋</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === user?.id;
                const reactionCount = messageReactions[message.id] || 0;
                return (
                  <div 
                    key={message.id} 
                    className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}
                  >
                    <div 
                      className={cn(
                        "max-w-[75%] rounded-2xl p-3 relative group",
                        isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                      )}
                      onDoubleClick={() => handleReactToMessage(message.id)}
                    >
                      {message.media_url && (
                        <div className="mb-2 overflow-hidden rounded-lg">
                          {message.media_type === 'image' ? (
                            <img src={message.media_url} alt="" className="max-w-full max-h-64 rounded-lg object-contain" />
                          ) : message.media_type === 'video' ? (
                            <video src={message.media_url} className="max-w-full max-h-64 rounded-lg" controls playsInline preload="metadata" />
                          ) : message.media_type === 'audio' ? (
                            <div className="flex items-center gap-2 bg-black/10 rounded-lg p-2">
                              <Mic className="w-4 h-4 text-primary shrink-0" />
                              <audio src={message.media_url} controls className="w-full h-8" preload="metadata" />
                            </div>
                          ) : (
                            <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                              📎 Attachment
                            </a>
                          )}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={cn("flex items-center gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
                        <span className="text-[10px] opacity-70">
                          {formatDistanceToNow(new Date(message.created_at || ''), { addSuffix: true })}
                        </span>
                        {isOwn && message.is_read && <CheckCheck className="w-3 h-3 text-blue-400" />}
                      </div>
                      
                      {/* Reaction count */}
                      {reactionCount > 0 && (
                        <div className="absolute -bottom-2 right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          {reactionCount}
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

        {/* Media Gallery Dialog */}
        <Dialog open={showMediaGallery} onOpenChange={setShowMediaGallery}>
          <DialogContent className="glass-card max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Media Gallery</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
              {mediaMessages.length === 0 ? (
                <p className="col-span-3 text-center text-sm text-muted-foreground py-8">No media shared yet</p>
              ) : (
                mediaMessages.map((msg) => (
                  <div key={msg.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {msg.media_type === 'image' ? (
                      <img src={msg.media_url!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={msg.media_url!} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Input Area */}
        <div className="p-3 border-t border-border/50 bg-card/80 backdrop-blur-sm shrink-0 space-y-2">
          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative shrink-0">
                  <img src={preview} alt="" className="h-16 w-16 object-cover rounded-lg" />
                  <button 
                    onClick={() => removeMedia(index)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Voice Recording UI */}
          {audioBlob && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <audio src={URL.createObjectURL(audioBlob)} controls className="flex-1 h-8" />
              <Button size="sm" onClick={sendVoiceMessage} disabled={uploading}>
                <Send className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelRecording}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-5 h-5" />
            </Button>
            
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setShowStickers(!showStickers)}>
                <Smile className="w-5 h-5" />
              </Button>
              {showStickers && (
                <div className="absolute bottom-12 left-0 bg-card border border-border rounded-lg p-2 grid grid-cols-4 gap-1 shadow-lg z-10">
                  {STICKERS.map((sticker) => (
                    <button key={sticker} onClick={() => handleSendSticker(sticker)} className="text-2xl p-1 hover:bg-muted rounded">
                      {sticker}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn("h-10 w-10", isRecording && "text-red-500 animate-pulse")}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            {isRecording && (
              <span className="text-sm text-red-500 font-mono">{formatRecordingTime(recordingTime)}</span>
            )}
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message..."
              className="flex-1 h-10"
              disabled={isRecording}
            />
            
            <Button onClick={handleSend} disabled={uploading || (!newMessage.trim() && mediaFiles.length === 0)} size="icon" className="h-10 w-10 shrink-0">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Chat List View
  return (
    <div className="space-y-3 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">💬 Messages</h1>
        <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="w-4 h-4" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle className="text-sm">New Message</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Search users..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="glass-card"
            />
            <ScrollArea className="max-h-64">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => startNewChat(result.id)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={result.avatar_url} />
                    <AvatarFallback>{result.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{result.name}</span>
                </button>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chat Categories */}
      <Tabs value={chatTab} onValueChange={(v) => setChatTab(v as any)}>
        <TabsList className="w-full grid grid-cols-4 h-auto p-0.5">
          <TabsTrigger value="main" className="text-[10px] py-1.5">Main</TabsTrigger>
          <TabsTrigger value="archived" className="text-[10px] py-1.5 gap-0.5">
            <Archive className="w-3 h-3" />Archive
          </TabsTrigger>
          <TabsTrigger value="private" className="text-[10px] py-1.5 gap-0.5">
            <Lock className="w-3 h-3" />Private
          </TabsTrigger>
          <TabsTrigger value="following" className="text-[10px] py-1.5">Following</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 glass-card"
        />
      </div>

      {/* Private Chat Password Dialog */}
      <Dialog open={showPrivateAuth} onOpenChange={setShowPrivateAuth}>
        <DialogContent className="glass-card max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {localStorage.getItem('privateChatPassword') ? 'Enter Password' : 'Set Private Password'}
            </DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Enter password..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') verifyPrivatePassword((e.target as HTMLInputElement).value);
            }}
            className="glass-card"
          />
          <Button onClick={(e) => {
            const input = (e.target as HTMLElement).parentElement?.querySelector('input');
            if (input) verifyPrivatePassword(input.value);
          }}>
            {localStorage.getItem('privateChatPassword') ? 'Unlock' : 'Set Password'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Conversation List */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Loading...</p>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {chatTab === 'archived' ? 'No archived chats' : 
               chatTab === 'private' ? 'No private chats' : 
               'No conversations yet'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.user_id}
              onClick={() => {
                if (chatTab === 'private' || privateChats.has(conv.user_id)) {
                  handlePrivateAccess(conv.user_id);
                } else {
                  navigate(`/chat/${conv.user_id}`);
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl glass-card hover:bg-muted/50 transition-all"
            >
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={conv.user_avatar} />
                  <AvatarFallback className="bg-primary/20">{conv.user_name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                {privateChats.has(conv.user_id) && (
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                    <Lock className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">{conv.user_name}</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {conv.last_message ? formatDistanceToNow(new Date(), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
              </div>
              {(conv.unread_count || 0) > 0 && (
                <Badge className="bg-primary text-primary-foreground rounded-full h-5 min-w-[20px] flex items-center justify-center text-[10px]">
                  {conv.unread_count}
                </Badge>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}