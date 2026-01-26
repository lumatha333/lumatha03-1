import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Send, ArrowLeft, Search, Paperclip, X, MoreVertical, 
  Archive, Ghost, Trash2, ShieldOff, Smile, Mic, MicOff, Play, Pause, 
  Lock, Image, Users, Heart, UserSearch, MessageCircle, Star, Phone, Video as VideoIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STICKERS = ['😀', '😂', '🥰', '😍', '🤩', '😎', '🥳', '😭', '😤', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'];
const GHOST_MODES = [
  { label: '30 minutes', value: 30, icon: '⚡' },
  { label: '1 day', value: 1440, icon: '🌙' },
  { label: '1 week', value: 10080, icon: '📅' },
];

export default function Chat() {
  const { userId } = useParams();
  const { user, profile } = useAuth();
  const { conversations, messages, loading, currentChatUser, fetchMessages, sendMessage, deleteMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [networkUsers, setNetworkUsers] = useState<any[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());
  const [privateChats, setPrivateChats] = useState<Set<string>>(new Set());
  const [chatTab, setChatTab] = useState<'main' | 'find' | 'archived' | 'private'>('main');
  const [findSubTab, setFindSubTab] = useState<'suggestions' | 'network'>('suggestions');
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

  // Load Find tab data - Suggestions and Network
  useEffect(() => {
    if (chatTab === 'find') {
      loadFindData();
    }
  }, [chatTab, user]);

  const loadFindData = async () => {
    if (!user) return;
    
    try {
      // Get suggestions - regional users and popular users
      const userCountry = profile?.country || '';
      
      const [regionalRes, followingRes, friendsRes] = await Promise.all([
        // Regional + popular users (suggestions)
        supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .order('total_followers', { ascending: false })
          .limit(20),
        // Following
        supabase
          .from('follows')
          .select('following_id, profiles:following_id(*)')
          .eq('follower_id', user.id)
          .limit(20),
        // Friends
        supabase
          .from('friend_requests')
          .select('sender_id, receiver_id')
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      ]);

      // Filter regional suggestions
      let suggestions = regionalRes.data || [];
      if (userCountry) {
        const regionalUsers = suggestions.filter(u => u.country === userCountry);
        const otherUsers = suggestions.filter(u => u.country !== userCountry);
        suggestions = [...regionalUsers, ...otherUsers];
      }
      setSuggestedUsers(suggestions.slice(0, 15));

      // Network: friends + following
      const followingUsers: any[] = [];
      followingRes.data?.forEach((f: any) => {
        if (f.profiles && typeof f.profiles === 'object' && f.profiles.id) {
          followingUsers.push(f.profiles);
        }
      });
      const friendIds = friendsRes.data?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || [];
      
      if (friendIds.length > 0) {
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', friendIds);
        
        const allNetwork = [...(friendProfiles || []), ...followingUsers];
        const uniqueNetwork = allNetwork.filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i);
        setNetworkUsers(uniqueNetwork);
      } else {
        setNetworkUsers(followingUsers);
      }
    } catch (error) {
      console.error('Error loading find data:', error);
    }
  };

  useEffect(() => {
    if (userId) fetchMessages(userId);
  }, [userId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // User search in Find tab
  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearchQuery.trim()) { setSearchResults([]); return; }
      const { data } = await supabase.from('profiles').select('id, name, avatar_url, country')
        .ilike('name', `%${userSearchQuery}%`).neq('id', user?.id).limit(15);
      setSearchResults(data || []);
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, user]);

  useEffect(() => {
    const stored = localStorage.getItem('archivedChats');
    const storedPrivate = localStorage.getItem('privateChats');
    if (stored) setArchivedChats(new Set(JSON.parse(stored)));
    if (storedPrivate) setPrivateChats(new Set(JSON.parse(storedPrivate)));
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

  const handlePrivateAccess = (chatUserId: string) => {
    setPendingPrivateChat(chatUserId);
    setShowPrivateAuth(true);
  };

  const verifyPrivatePassword = (input: string) => {
    const savedPassword = localStorage.getItem('privateChatPassword');
    if (!savedPassword) {
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
    setChatTab('main');
    navigate(`/chat/${targetUserId}`);
  };

  const handleBackToChats = () => {
    navigate('/chat', { replace: true });
  };

  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);
  
  // Filter conversations - Main, Find, Archive, Private (NO "New")
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || conv.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const isArchived = archivedChats.has(conv.user_id);
    const isPrivate = privateChats.has(conv.user_id);
    
    if (chatTab === 'archived') return matchesSearch && isArchived;
    if (chatTab === 'private') return matchesSearch && isPrivate;
    if (chatTab === 'main') return matchesSearch && !isArchived && !isPrivate;
    return matchesSearch;
  });

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
          
          {/* Call Buttons */}
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => toast.info('🎤 Voice call starting...', { description: 'WebRTC audio call feature' })}
            >
              <Phone className="w-4 h-4 text-green-500" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => toast.info('📹 Video call starting...', { description: 'WebRTC video call feature' })}
            >
              <VideoIcon className="w-4 h-4 text-blue-500" />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card w-56">
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
              
              <DropdownMenuItem onClick={() => toast.info('Group chat feature', { description: 'Create group chats with multiple friends!' })}>
                <Users className="w-4 h-4 mr-2" />
                Create Group
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => toast.info('Video call feature', { description: 'Start a video call with this friend!' })}>
                <VideoIcon className="w-4 h-4 mr-2" />
                Video Call
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => toast.info('Voice call feature', { description: 'Start a voice call with this friend!' })}>
                <Phone className="w-4 h-4 mr-2" />
                Voice Call
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => toggleArchive(currentChatUser)}>
                <Archive className="w-4 h-4 mr-2" />
                {archivedChats.has(currentChatUser) ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => addToPrivate(currentChatUser)}>
                <Lock className="w-4 h-4 mr-2" />
                Add to Private
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => deleteEntireChat(currentChatUser)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3 max-w-2xl mx-auto">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const reactions = messageReactions[msg.id] || 0;
              
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                    <div className={`rounded-2xl px-3 py-2 relative ${
                      isOwn 
                        ? 'bg-primary text-primary-foreground rounded-br-md' 
                        : 'bg-muted rounded-bl-md'
                    }`}>
                      {msg.media_url && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          {msg.media_type === 'image' && (
                            <img src={msg.media_url} alt="Media" className="max-w-full rounded-lg" />
                          )}
                          {msg.media_type === 'video' && (
                            <video src={msg.media_url} controls className="max-w-full rounded-lg" />
                          )}
                          {msg.media_type === 'audio' && (
                            <audio src={msg.media_url} controls className="w-full" />
                          )}
                        </div>
                      )}
                      <p className="text-sm break-words">{msg.content}</p>
                      
                      {reactions > 0 && (
                        <div className="absolute -bottom-2 right-0 bg-red-500 text-white text-[10px] rounded-full px-1.5 flex items-center gap-0.5">
                          <Heart className="w-2.5 h-2.5 fill-current" /> {reactions}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at || ''), { addSuffix: true })}
                      </p>
                      {!isOwn && (
                        <button 
                          onClick={() => handleReactToMessage(msg.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Media Preview */}
        {mediaPreviews.length > 0 && (
          <div className="p-2 border-t border-border/50 flex gap-2 overflow-x-auto">
            {mediaPreviews.map((preview, i) => (
              <div key={i} className="relative shrink-0">
                <img src={preview} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full"
                  onClick={() => removeMedia(i)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Audio Recording UI */}
        {(isRecording || audioBlob) && (
          <div className="p-3 border-t border-border/50 flex items-center gap-3 bg-red-500/10">
            <div className="flex-1 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{formatRecordingTime(recordingTime)}</span>
            </div>
            {isRecording ? (
              <Button size="sm" variant="destructive" onClick={stopRecording}>
                Stop
              </Button>
            ) : audioBlob && (
              <>
                <Button size="sm" variant="outline" onClick={cancelRecording}>
                  Cancel
                </Button>
                <Button size="sm" onClick={sendVoiceMessage} disabled={uploading}>
                  <Send className="w-4 h-4 mr-1" /> Send
                </Button>
              </>
            )}
          </div>
        )}

        {/* Input Area */}
        {!isRecording && !audioBlob && (
          <div className="p-3 border-t border-border/50 flex items-center gap-2 bg-card/80 backdrop-blur-sm">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileSelect}
            />
            
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-5 h-5" />
            </Button>
            
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setShowStickers(!showStickers)}>
                <Smile className="w-5 h-5" />
              </Button>
              {showStickers && (
                <div className="absolute bottom-full left-0 mb-2 p-2 glass-card rounded-xl grid grid-cols-4 gap-1 z-10">
                  {STICKERS.map((sticker) => (
                    <button
                      key={sticker}
                      className="text-xl p-1 hover:bg-muted rounded"
                      onClick={() => handleSendSticker(sticker)}
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message..."
              className="flex-1 rounded-full"
              disabled={uploading}
            />

            <Button variant="ghost" size="icon" className="shrink-0" onClick={startRecording}>
              <Mic className="w-5 h-5" />
            </Button>

            <Button size="icon" onClick={handleSend} disabled={uploading || (!newMessage.trim() && mediaFiles.length === 0)}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Media Gallery Dialog */}
        <Dialog open={showMediaGallery} onOpenChange={setShowMediaGallery}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Media Gallery</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="grid grid-cols-3 gap-2">
                {mediaMessages.map((msg) => (
                  <div key={msg.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    {msg.media_type === 'image' && (
                      <img src={msg.media_url || ''} alt="Media" className="w-full h-full object-cover" />
                    )}
                    {msg.media_type === 'video' && (
                      <video src={msg.media_url || ''} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
              {mediaMessages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No media shared yet</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Chat list view - ONLY Main, Find, Archive, Private tabs
  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-xl font-bold flex items-center gap-2">
        💬 Messages
      </h1>

      {/* Tabs - Main, Find, Archive, Private (NO "New") */}
      <Tabs value={chatTab} onValueChange={(v) => setChatTab(v as any)}>
        <TabsList className="w-full grid grid-cols-4 h-auto p-0.5">
          <TabsTrigger value="main" className="text-[10px] py-1.5">
            <MessageCircle className="w-3 h-3 mr-0.5" /> Main
          </TabsTrigger>
          <TabsTrigger value="find" className="text-[10px] py-1.5">
            <UserSearch className="w-3 h-3 mr-0.5" /> Find
          </TabsTrigger>
          <TabsTrigger value="archived" className="text-[10px] py-1.5">
            <Archive className="w-3 h-3 mr-0.5" /> Archive
          </TabsTrigger>
          <TabsTrigger value="private" className="text-[10px] py-1.5">
            <Lock className="w-3 h-3 mr-0.5" /> Private
          </TabsTrigger>
        </TabsList>

        {/* Main Tab */}
        <TabsContent value="main" className="mt-3 space-y-2">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="pl-10"
            />
          </div>

          {filteredConversations.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No conversations yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setChatTab('find')}>
                  Find People
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conv) => (
              <Card
                key={conv.user_id}
                className="glass-card cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/chat/${conv.user_id}`)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.user_avatar || undefined} />
                    <AvatarFallback className="bg-primary/20">{conv.user_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">{conv.user_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {conv.last_message_time && formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-5 min-w-[20px]">
                      {conv.unread_count}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Find Tab - Suggestions + Network */}
        <TabsContent value="find" className="mt-3 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Search Results</p>
              {searchResults.map((u) => (
                <Card key={u.id} className="glass-card cursor-pointer hover:bg-muted/30" onClick={() => startNewChat(u.id)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{u.country || 'Unknown'}</p>
                    </div>
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Sub-tabs: Suggestions / Network */}
          {!userSearchQuery && (
            <>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={findSubTab === 'suggestions' ? 'default' : 'outline'}
                  onClick={() => setFindSubTab('suggestions')}
                  className="flex-1"
                >
                  <Star className="w-3 h-3 mr-1" /> Suggestions
                </Button>
                <Button
                  size="sm"
                  variant={findSubTab === 'network' ? 'default' : 'outline'}
                  onClick={() => setFindSubTab('network')}
                  className="flex-1"
                >
                  <Users className="w-3 h-3 mr-1" /> Network
                </Button>
              </div>

              {findSubTab === 'suggestions' && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Regional & Popular Users</p>
                  {suggestedUsers.map((u) => (
                    <Card key={u.id} className="glass-card cursor-pointer hover:bg-muted/30" onClick={() => startNewChat(u.id)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {u.country || 'Global'} • {u.total_followers || 0} followers
                          </p>
                        </div>
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </CardContent>
                    </Card>
                  ))}
                  {suggestedUsers.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">No suggestions</p>
                  )}
                </div>
              )}

              {findSubTab === 'network' && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Friends & Following</p>
                  {networkUsers.map((u) => (
                    <Card key={u.id} className="glass-card cursor-pointer hover:bg-muted/30" onClick={() => startNewChat(u.id)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">{u.country || 'Unknown'}</p>
                        </div>
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </CardContent>
                    </Card>
                  ))}
                  {networkUsers.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Follow people to see them here</p>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived" className="mt-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Archive className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No archived chats</p>
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conv) => (
              <Card
                key={conv.user_id}
                className="glass-card cursor-pointer hover:bg-muted/30"
                onClick={() => navigate(`/chat/${conv.user_id}`)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.user_avatar || undefined} />
                    <AvatarFallback>{conv.user_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{conv.user_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Private Tab */}
        <TabsContent value="private" className="mt-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Lock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No private chats</p>
                <p className="text-xs text-muted-foreground mt-1">Add chats to private from the three-dot menu</p>
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conv) => (
              <Card
                key={conv.user_id}
                className="glass-card cursor-pointer hover:bg-muted/30"
                onClick={() => handlePrivateAccess(conv.user_id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.user_avatar || undefined} />
                    <AvatarFallback>{conv.user_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {conv.user_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Password protected</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Private Access Dialog */}
      <Dialog open={showPrivateAuth} onOpenChange={setShowPrivateAuth}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" /> Private Chat Access
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {localStorage.getItem('privateChatPassword') 
                ? 'Enter your password to access private chats' 
                : 'Set a password to protect your private chats'}
            </p>
            <Input
              type="password"
              placeholder="Enter password..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  verifyPrivatePassword((e.target as HTMLInputElement).value);
                }
              }}
            />
            <Button 
              className="w-full" 
              onClick={(e) => {
                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                verifyPrivatePassword(input.value);
              }}
            >
              {localStorage.getItem('privateChatPassword') ? 'Unlock' : 'Set Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}