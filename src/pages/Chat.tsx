import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Send, ArrowLeft, Search, Paperclip, X, MoreVertical, 
  Archive, Ghost, Trash2, Smile, Mic, Music,
  Lock, Image, Users, UserSearch, MessageCircle, Star, Phone, Video as VideoIcon,
  Palette, Eye, EyeOff, Pin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useChatProtection, WatermarkOverlay, BlurOverlay } from '@/components/chat/ChatProtection';
import { EmojiReactionPicker } from '@/components/chat/EmojiReactionPicker';
import { SharedMusicPlayer, MusicBar } from '@/components/chat/SharedMusicPlayer';
import { SwipeableChatCard } from '@/components/chat/SwipeableChatCard';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STICKERS = ['😀', '😂', '🥰', '😍', '🤩', '😎', '🥳', '😭', '😤', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'];
const GHOST_MODES = [
  { label: '30 minutes', value: 30, icon: '⚡' },
  { label: '1 day', value: 1440, icon: '🌙' },
  { label: '1 week', value: 10080, icon: '📅' },
];
const CHAT_THEMES = [
  { id: 'default', label: 'Default', bg: 'bg-background', bubble: 'bg-primary' },
  { id: 'midnight', label: 'Midnight', bg: 'bg-[#0a0e27]', bubble: 'bg-indigo-600' },
  { id: 'forest', label: 'Forest', bg: 'bg-[#0a1a0a]', bubble: 'bg-emerald-700' },
  { id: 'ocean', label: 'Ocean', bg: 'bg-[#051525]', bubble: 'bg-cyan-700' },
  { id: 'sunset', label: 'Sunset', bg: 'bg-[#1a0a0a]', bubble: 'bg-orange-700' },
  { id: 'berry', label: 'Berry', bg: 'bg-[#150a1a]', bubble: 'bg-purple-700' },
];

export default function Chat() {
  const { userId } = useParams();
  const { user, profile } = useAuth();
  const { conversations, messages, loading, currentChatUser, fetchMessages, sendMessage, deleteMessage } = useChat();
  const { isBlurred, username } = useChatProtection();
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
  const [privateUnlocked, setPrivateUnlocked] = useState(false);
  const [chatTab, setChatTab] = useState<'main' | 'find' | 'archived' | 'private'>('main');
  const [findSubTab, setFindSubTab] = useState<'suggestions' | 'network'>('suggestions');
  const [ghostMode, setGhostMode] = useState<number | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showPrivateAuth, setShowPrivateAuth] = useState(false);
  const [pendingPrivateChat, setPendingPrivateChat] = useState<string | null>(null);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [mediaGalleryTab, setMediaGalleryTab] = useState<'images' | 'videos' | 'audio'>('images');
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, number>>>({});
  const [chatTheme, setChatTheme] = useState(() => localStorage.getItem('chatTheme') || 'default');
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [activeMusicTrack, setActiveMusicTrack] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const currentTheme = CHAT_THEMES.find(t => t.id === chatTheme) || CHAT_THEMES[0];

  // Ghost mode auto-delete timer
  useEffect(() => {
    if (!ghostMode || !currentChatUser || !user) return;
    const interval = setInterval(async () => {
      const cutoff = new Date(Date.now() - ghostMode * 60 * 1000).toISOString();
      const ghostMessages = messages.filter(m => 
        m.created_at && m.created_at < cutoff &&
        (m.sender_id === user.id || m.receiver_id === user.id)
      );
      for (const msg of ghostMessages) {
        if (msg.sender_id === user.id) {
          await supabase.from('messages').delete().eq('id', msg.id);
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [ghostMode, currentChatUser, user, messages]);

  // Load Find tab data
  useEffect(() => {
    if (chatTab === 'find') loadFindData();
  }, [chatTab, user]);

  const loadFindData = async () => {
    if (!user) return;
    try {
      const [regionalRes, followingRes, friendsRes] = await Promise.all([
        supabase.from('profiles').select('*').neq('id', user.id).order('total_followers', { ascending: false }).limit(20),
        supabase.from('follows').select('following_id, profiles:following_id(*)').eq('follower_id', user.id).limit(20),
        supabase.from('friend_requests').select('sender_id, receiver_id').eq('status', 'accepted').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      ]);
      let suggestions = regionalRes.data || [];
      const userCountry = profile?.country || '';
      if (userCountry) {
        const regional = suggestions.filter(u => u.country === userCountry);
        const others = suggestions.filter(u => u.country !== userCountry);
        suggestions = [...regional, ...others];
      }
      setSuggestedUsers(suggestions.slice(0, 15));
      const followingUsers: any[] = [];
      followingRes.data?.forEach((f: any) => {
        if (f.profiles?.id) followingUsers.push(f.profiles);
      });
      const friendIds = friendsRes.data?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || [];
      if (friendIds.length > 0) {
        const { data: friendProfiles } = await supabase.from('profiles').select('*').in('id', friendIds);
        const all = [...(friendProfiles || []), ...followingUsers];
        setNetworkUsers(all.filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i));
      } else {
        setNetworkUsers(followingUsers);
      }
    } catch (error) {
      console.error('Error loading find data:', error);
    }
  };

  // When opening a chat, fetch messages and immediately mark as read locally
  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
    }
  }, [userId, fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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

  // Auto-archive chats from unfriended users
  useEffect(() => {
    if (!user || conversations.length === 0) return;
    const checkFriendStatus = async () => {
      const convUserIds = conversations.map(c => c.user_id);
      const { data: friendData } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      const friendIds = new Set(
        friendData?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || []
      );
      
      const newArchived = new Set(archivedChats);
      let changed = false;
      convUserIds.forEach(uid => {
        if (!friendIds.has(uid) && !newArchived.has(uid) && !privateChats.has(uid)) {
          newArchived.add(uid);
          changed = true;
        }
      });
      if (changed) saveArchivedChats(newArchived);
    };
    checkFriendStatus();
  }, [user, conversations]);

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
    if (newArchived.has(chatUserId)) { newArchived.delete(chatUserId); toast.success('Chat unarchived'); }
    else { newArchived.add(chatUserId); toast.success('Chat archived'); }
    saveArchivedChats(newArchived);
  };

  const addToPrivate = (chatUserId: string) => {
    savePrivateChats(new Set([...privateChats, chatUserId]));
    toast.success('Added to private chats');
  };

  const togglePrivate = (chatUserId: string) => {
    const newPrivate = new Set(privateChats);
    if (newPrivate.has(chatUserId)) { newPrivate.delete(chatUserId); toast.success('Removed from private'); }
    else { newPrivate.add(chatUserId); toast.success('Added to private chats'); }
    savePrivateChats(newPrivate);
  };

  const handlePrivateAccess = (chatUserId: string) => {
    if (privateUnlocked) {
      navigate(`/chat/${chatUserId}`);
      return;
    }
    setPendingPrivateChat(chatUserId);
    setShowPrivateAuth(true);
  };

  const verifyPrivatePassword = (input: string) => {
    const saved = localStorage.getItem('privateChatPassword');
    if (!saved) {
      localStorage.setItem('privateChatPassword', input);
      setShowPrivateAuth(false);
      setPrivateUnlocked(true);
      if (pendingPrivateChat) navigate(`/chat/${pendingPrivateChat}`);
      toast.success('Private chat password set!');
    } else if (input === saved) {
      setShowPrivateAuth(false);
      setPrivateUnlocked(true);
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
      if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name} too large. Max 10MB`); return; }
      validFiles.push(file);
      if (file.type.startsWith('image') || file.type.startsWith('video')) previews.push(URL.createObjectURL(file));
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
          .from('chat-media').upload(fileName, file, { cacheControl: '31536000', contentType: file.type });
        if (uploadError) continue;
        const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
        const mediaType = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'document';
        await sendMessage(currentChatUser, `📎 ${file.name}`, publicUrl, mediaType);
      }
      if (newMessage.trim()) await sendMessage(currentChatUser, newMessage);
      setNewMessage('');
      clearAllMedia();
    } catch { toast.error('Failed to send message'); }
    finally { setUploading(false); }
  };

  const handleReactToMessage = (messageId: string, emoji: string) => {
    setMessageReactions(prev => {
      const msgReactions = { ...(prev[messageId] || {}) };
      msgReactions[emoji] = (msgReactions[emoji] || 0) + 1;
      return { ...prev, [messageId]: msgReactions };
    });
  };

  const togglePinMessage = (messageId: string) => {
    setPinnedMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) { next.delete(messageId); toast.success('Unpinned'); }
      else { next.add(messageId); toast.success('Pinned!'); }
      return next;
    });
  };

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch { toast.error('Microphone access denied'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; }
    }
  };

  const cancelRecording = () => { stopRecording(); setAudioBlob(null); setRecordingTime(0); };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !currentChatUser || !user) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}_voice.webm`;
      const { error } = await supabase.storage.from('chat-media').upload(fileName, audioBlob, { contentType: 'audio/webm' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(fileName);
      await sendMessage(currentChatUser, '🎤 Voice message', publicUrl, 'audio');
      setAudioBlob(null);
      setRecordingTime(0);
    } catch { toast.error('Failed to send voice message'); }
    finally { setUploading(false); }
  };

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSendSticker = async (sticker: string) => {
    if (!currentChatUser) return;
    await sendMessage(currentChatUser, sticker);
    setShowStickers(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startNewChat = (targetUserId: string) => { setChatTab('main'); navigate(`/chat/${targetUserId}`); };
  const handleBackToChats = () => navigate('/chat', { replace: true });

  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);
  
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || conv.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const isArchived = archivedChats.has(conv.user_id);
    const isPrivate = privateChats.has(conv.user_id);
    if (chatTab === 'archived') return matchesSearch && isArchived;
    if (chatTab === 'private') return matchesSearch && isPrivate;
    if (chatTab === 'main') return matchesSearch && !isArchived && !isPrivate;
    return matchesSearch;
  });

  const mediaMessages = messages.filter(m => m.media_url);
  const imageMessages = mediaMessages.filter(m => m.media_type === 'image');
  const videoMessages = mediaMessages.filter(m => m.media_type === 'video');
  const audioMessages = mediaMessages.filter(m => m.media_type === 'audio');

  const pinnedMsgs = messages.filter(m => pinnedMessages.has(m.id));

  const applyTheme = (themeId: string) => {
    setChatTheme(themeId);
    localStorage.setItem('chatTheme', themeId);
    toast.success('Theme applied!');
  };

  // ─────── FULL SCREEN CHAT VIEW ───────
  if (currentChatUser) {
    return (
      <div className={cn("fixed inset-0 z-50 flex flex-col chat-protected animate-slide-in-right relative", currentTheme.bg)}>
        {/* Privacy overlays */}
        <WatermarkOverlay username={username} />
        {isBlurred && <BlurOverlay />}

        {/* Chat Header - sticky at top */}
        <div className="px-3 py-2.5 border-b border-border/30 flex items-center gap-2.5 bg-card/60 backdrop-blur-md shrink-0 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full" onClick={handleBackToChats}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="w-9 h-9 shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${currentChatUser}`)}>
            <AvatarImage src={selectedConversation?.user_avatar || undefined} />
            <AvatarFallback className="bg-primary/20 text-xs">{selectedConversation?.user_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${currentChatUser}`)}>
            <h3 className="font-semibold text-sm truncate leading-tight">{selectedConversation?.user_name}</h3>
            {ghostMode && (
              <p className="text-[9px] text-orange-400 animate-pulse leading-tight">
                Ghost • {GHOST_MODES.find(g => g.value === ghostMode)?.label}
              </p>
            )}
          </div>
          
          {/* Right icons - evenly spaced, no labels */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"
              onClick={() => toast.info('Voice call starting...')}>
              <Phone className="w-[18px] h-[18px] text-emerald-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"
              onClick={() => toast.info('Video call starting...')}>
              <VideoIcon className="w-[18px] h-[18px] text-blue-500" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreVertical className="w-[18px] h-[18px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger><Ghost className="w-4 h-4 mr-2" />Ghost Mode</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {GHOST_MODES.map((mode) => (
                      <DropdownMenuItem key={mode.value} onClick={() => { setGhostMode(mode.value); toast.success(`Ghost: ${mode.label}`); }}>
                        <span className="mr-2">{mode.icon}</span>{mode.label}
                        {ghostMode === mode.value && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem onClick={() => { setGhostMode(null); toast.success('Ghost mode off'); }}>
                      Off {!ghostMode && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger><Palette className="w-4 h-4 mr-2" />Chat Theme</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {CHAT_THEMES.map((theme) => (
                      <DropdownMenuItem key={theme.id} onClick={() => applyTheme(theme.id)}>
                        <div className={cn("w-4 h-4 rounded-full mr-2", theme.bubble)} />
                        {theme.label}
                        {chatTheme === theme.id && <span className="ml-auto text-primary">✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onClick={() => setShowMusicPlayer(true)}>
                  <Music className="w-4 h-4 mr-2" />Shared Sound
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowMediaGallery(true)}>
                  <Image className="w-4 h-4 mr-2" />Media Gallery
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Create a group chat with multiple friends!')}>
                  <Users className="w-4 h-4 mr-2" />Create Group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleArchive(currentChatUser)}>
                  <Archive className="w-4 h-4 mr-2" />{archivedChats.has(currentChatUser) ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => togglePrivate(currentChatUser)}>
                  <Lock className="w-4 h-4 mr-2" />{privateChats.has(currentChatUser) ? 'Remove from Private' : 'Add to Private'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteEntireChat(currentChatUser)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Pinned Messages */}
        {pinnedMsgs.length > 0 && (
          <div className="px-3 py-1.5 bg-primary/5 border-b border-border/30">
            <div className="flex items-center gap-2 text-xs">
              <Pin className="w-3 h-3 text-primary shrink-0" />
              <p className="truncate text-muted-foreground">{pinnedMsgs[pinnedMsgs.length - 1]?.content}</p>
              <span className="text-[9px] text-primary shrink-0">{pinnedMsgs.length} pinned</span>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3 max-w-2xl mx-auto">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const reactions = messageReactions[msg.id] || {};
              const isPinned = pinnedMessages.has(msg.id);
              
              return (
                <div key={msg.id} className={cn("flex", isOwn ? 'justify-end' : 'justify-start')}>
                  <div className={cn("max-w-[75%] relative", isOwn ? 'order-2' : '')}>
                    <div className={cn(
                      "rounded-2xl px-3 py-2 relative",
                      isOwn 
                        ? cn(currentTheme.bubble, 'text-white rounded-br-md') 
                        : 'bg-muted rounded-bl-md',
                      isPinned && 'ring-1 ring-primary/30'
                    )}>
                      {msg.media_url && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          {msg.media_type === 'image' && <img src={msg.media_url} alt="" className="max-w-full rounded-lg" draggable={false} />}
                          {msg.media_type === 'video' && <video src={msg.media_url} controls className="max-w-full rounded-lg" />}
                          {msg.media_type === 'audio' && <audio src={msg.media_url} controls className="w-full" />}
                        </div>
                      )}
                      <p className="text-sm break-words">{msg.content}</p>
                      
                      {/* Emoji Reaction Picker */}
                      <EmojiReactionPicker 
                        reactions={reactions}
                        onReact={(emoji) => handleReactToMessage(msg.id, emoji)}
                        isOwn={isOwn}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at || ''), { addSuffix: true })}
                      </p>
                      <button onClick={() => togglePinMessage(msg.id)} className="text-muted-foreground hover:text-primary transition-colors">
                        <Pin className={cn("w-2.5 h-2.5", isPinned && "text-primary fill-primary")} />
                      </button>
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
          <div className="p-2 border-t border-border/30 flex gap-2 overflow-x-auto">
            {mediaPreviews.map((preview, i) => (
              <div key={i} className="relative shrink-0">
                <img src={preview} alt="" className="h-16 w-16 object-cover rounded-lg" />
                <Button size="icon" variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full" onClick={() => removeMedia(i)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Voice Recording UI */}
        {(isRecording || audioBlob) && (
          <div className="p-3 border-t border-border/30 flex items-center gap-3 bg-destructive/5">
            <div className="flex-1 flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium">{formatRecordingTime(recordingTime)}</span>
            </div>
            {isRecording ? (
              <Button size="sm" variant="destructive" onClick={stopRecording}>Stop</Button>
            ) : audioBlob && (
              <>
                <Button size="sm" variant="outline" onClick={cancelRecording}>Cancel</Button>
                <Button size="sm" onClick={sendVoiceMessage} disabled={uploading}><Send className="w-4 h-4 mr-1" /> Send</Button>
              </>
            )}
          </div>
        )}

        {/* Input Area */}
        {!isRecording && !audioBlob && (
          <div className="p-2.5 border-t border-border/30 flex items-center gap-1.5 bg-card/60 backdrop-blur-md">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" multiple onChange={handleFileSelect} />
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-full" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setShowStickers(!showStickers)}>
                <Smile className="w-5 h-5" />
              </Button>
              {showStickers && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-card border border-border rounded-xl grid grid-cols-4 gap-1 z-10 shadow-lg">
                  {STICKERS.map((s) => (
                    <button key={s} className="text-xl p-1 hover:bg-muted rounded" onClick={() => handleSendSticker(s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress}
              placeholder="Message..." className="flex-1 rounded-full h-9" disabled={uploading} />
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-full" onClick={startRecording}>
              <Mic className="w-5 h-5" />
            </Button>
            <Button size="icon" className="h-9 w-9 rounded-full" onClick={handleSend} disabled={uploading || (!newMessage.trim() && mediaFiles.length === 0)}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Media Gallery Dialog - Tabbed */}
        <Dialog open={showMediaGallery} onOpenChange={setShowMediaGallery}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Media Gallery</DialogTitle>
            </DialogHeader>
            <Tabs value={mediaGalleryTab} onValueChange={(v) => setMediaGalleryTab(v as any)}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="images">Photos ({imageMessages.length})</TabsTrigger>
                <TabsTrigger value="videos">Videos ({videoMessages.length})</TabsTrigger>
                <TabsTrigger value="audio">Audio ({audioMessages.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="images">
                <ScrollArea className="h-[50vh]">
                  <div className="grid grid-cols-3 gap-2 p-1">
                    {imageMessages.map((msg) => (
                      <div key={msg.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={msg.media_url || ''} alt="" className="w-full h-full object-cover" draggable={false} />
                      </div>
                    ))}
                  </div>
                  {imageMessages.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">No photos</p>}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="videos">
                <ScrollArea className="h-[50vh]">
                  <div className="grid grid-cols-2 gap-2 p-1">
                    {videoMessages.map((msg) => (
                      <div key={msg.id} className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <video src={msg.media_url || ''} className="w-full h-full object-cover" controls />
                      </div>
                    ))}
                  </div>
                  {videoMessages.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">No videos</p>}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="audio">
                <ScrollArea className="h-[50vh]">
                  <div className="space-y-2 p-1">
                    {audioMessages.map((msg) => (
                      <div key={msg.id} className="p-3 rounded-lg bg-muted">
                        <audio src={msg.media_url || ''} controls className="w-full" />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(msg.created_at || ''), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                  {audioMessages.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">No audio</p>}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Shared Music Player */}
        <SharedMusicPlayer
          isOpen={showMusicPlayer}
          onClose={() => setShowMusicPlayer(false)}
          partnerName={selectedConversation?.user_name || 'User'}
        />
      </div>
    );
  }

  // ─────── CHAT LIST VIEW ───────
  return (
    <div className="space-y-4 pb-20">
      <h1 className="text-xl font-bold flex items-center gap-2">💬 Messages</h1>

      <Tabs value={chatTab} onValueChange={(v) => setChatTab(v as any)}>
        <TabsList className="w-full grid grid-cols-4 h-auto p-0.5">
          <TabsTrigger value="main" className="text-[10px] py-1.5"><MessageCircle className="w-3 h-3 mr-0.5" />Main</TabsTrigger>
          <TabsTrigger value="find" className="text-[10px] py-1.5"><UserSearch className="w-3 h-3 mr-0.5" />Find</TabsTrigger>
          <TabsTrigger value="archived" className="text-[10px] py-1.5"><Archive className="w-3 h-3 mr-0.5" />Archive</TabsTrigger>
          <TabsTrigger value="private" className="text-[10px] py-1.5"><Lock className="w-3 h-3 mr-0.5" />Private</TabsTrigger>
        </TabsList>

        {/* Main Tab */}
        <TabsContent value="main" className="mt-3 space-y-2">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search chats..." className="pl-10" />
          </div>
          {filteredConversations.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No conversations yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setChatTab('find')}>Find People</Button>
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conv) => (
              <SwipeableChatCard
                key={conv.user_id}
                onSwipeLeft={() => toggleArchive(conv.user_id)}
                leftLabel="Archive"
              >
                <Card className="glass-card cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/chat/${conv.user_id}`)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.user_avatar || undefined} />
                      <AvatarFallback className="bg-primary/20">{conv.user_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm truncate">{conv.user_name}</p>
                        <p className="text-[10px] text-muted-foreground">{conv.last_message_time && formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && <Badge variant="destructive" className="text-[10px] h-5 min-w-[20px]">{conv.unread_count}</Badge>}
                  </CardContent>
                </Card>
              </SwipeableChatCard>
            ))
          )}
        </TabsContent>

        {/* Find Tab */}
        <TabsContent value="find" className="mt-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} placeholder="Search users..." className="pl-10" />
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Search Results</p>
              {searchResults.map((u) => (
                <Card key={u.id} className="glass-card cursor-pointer hover:bg-muted/30" onClick={() => startNewChat(u.id)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url || undefined} /><AvatarFallback>{u.name?.[0]}</AvatarFallback></Avatar>
                    <div className="flex-1"><p className="font-medium text-sm">{u.name}</p><p className="text-[10px] text-muted-foreground">{u.country || 'Unknown'}</p></div>
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!userSearchQuery && (
            <>
              <div className="flex gap-2">
                <Button size="sm" variant={findSubTab === 'suggestions' ? 'default' : 'outline'} onClick={() => setFindSubTab('suggestions')} className="flex-1">
                  <Star className="w-3 h-3 mr-1" /> Suggestions
                </Button>
                <Button size="sm" variant={findSubTab === 'network' ? 'default' : 'outline'} onClick={() => setFindSubTab('network')} className="flex-1">
                  <Users className="w-3 h-3 mr-1" /> Network
                </Button>
              </div>
              {findSubTab === 'suggestions' && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Regional & Popular Users</p>
                  {suggestedUsers.map((u) => (
                    <Card key={u.id} className="glass-card cursor-pointer hover:bg-muted/30" onClick={() => startNewChat(u.id)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url || undefined} /><AvatarFallback>{u.name?.[0]}</AvatarFallback></Avatar>
                        <div className="flex-1"><p className="font-medium text-sm">{u.name}</p><p className="text-[10px] text-muted-foreground">{u.country || 'Global'}</p></div>
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </CardContent>
                    </Card>
                  ))}
                  {suggestedUsers.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No suggestions</p>}
                </div>
              )}
              {findSubTab === 'network' && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Friends & Following</p>
                  {networkUsers.map((u) => (
                    <Card key={u.id} className="glass-card cursor-pointer hover:bg-muted/30" onClick={() => startNewChat(u.id)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url || undefined} /><AvatarFallback>{u.name?.[0]}</AvatarFallback></Avatar>
                        <div className="flex-1"><p className="font-medium text-sm">{u.name}</p><p className="text-[10px] text-muted-foreground">{u.country || 'Unknown'}</p></div>
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </CardContent>
                    </Card>
                  ))}
                  {networkUsers.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Follow people to see them here</p>}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archived" className="mt-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-12 text-center">
              <Archive className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No archived chats</p>
            </CardContent></Card>
          ) : filteredConversations.map((conv) => (
            <SwipeableChatCard
              key={conv.user_id}
              onSwipeRight={() => toggleArchive(conv.user_id)}
              rightLabel="Unarchive"
            >
              <Card className="glass-card cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/chat/${conv.user_id}`)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="w-12 h-12"><AvatarImage src={conv.user_avatar || undefined} /><AvatarFallback>{conv.user_name?.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{conv.user_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                </CardContent>
              </Card>
            </SwipeableChatCard>
          ))}
        </TabsContent>

        {/* Private Tab - hides profile until unlocked */}
        <TabsContent value="private" className="mt-3 space-y-2">
          {!privateUnlocked && filteredConversations.length > 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Lock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">Private Chats Locked</p>
                <p className="text-xs text-muted-foreground mt-1">{filteredConversations.length} chat(s) protected</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setPendingPrivateChat(null); setShowPrivateAuth(true); }}>
                  Unlock
                </Button>
              </CardContent>
            </Card>
          ) : filteredConversations.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-12 text-center">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No private chats</p>
              <p className="text-xs text-muted-foreground mt-1">Add chats from the ⋮ menu</p>
            </CardContent></Card>
          ) : filteredConversations.map((conv) => (
            <SwipeableChatCard
              key={conv.user_id}
              onSwipeRight={() => togglePrivate(conv.user_id)}
              rightLabel="Unprivate"
            >
              <Card className="glass-card cursor-pointer hover:bg-muted/30" onClick={() => handlePrivateAccess(conv.user_id)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="w-12 h-12"><AvatarImage src={conv.user_avatar || undefined} /><AvatarFallback>{conv.user_name?.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{conv.user_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                </CardContent>
              </Card>
            </SwipeableChatCard>
          ))}
        </TabsContent>
      </Tabs>

      {/* Private Access Dialog */}
      <Dialog open={showPrivateAuth} onOpenChange={setShowPrivateAuth}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Private Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {localStorage.getItem('privateChatPassword') ? 'Enter password to unlock' : 'Set a password for private chats'}
            </p>
            <Input
              type="password"
              placeholder="Enter password..."
              onKeyPress={(e) => { if (e.key === 'Enter') verifyPrivatePassword((e.target as HTMLInputElement).value); }}
            />
            <Button className="w-full" onClick={(e) => {
              const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
              verifyPrivatePassword(input.value);
            }}>
              {localStorage.getItem('privateChatPassword') ? 'Unlock' : 'Set Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy note */}
      <p className="text-center text-[9px] text-muted-foreground/40 pb-2">
        Privacy protected. Screenshots may still be possible on some devices.
      </p>
    </div>
  );
}
