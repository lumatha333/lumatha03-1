import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Send, ArrowLeft, Search, Paperclip, X, MoreVertical, 
  Archive, Ghost, Trash2, Smile, Mic, Music,
  Lock, Image, Users, UserSearch, MessageCircle, Star, Phone, Video as VideoIcon,
  Palette, Eye, EyeOff, Pin, Check, CheckCheck, Forward, Reply,
  Bell, BellOff, User, Edit3, Volume2, CornerUpLeft, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { SharedMusicPlayer } from '@/components/chat/SharedMusicPlayer';
import { SwipeableChatCard } from '@/components/chat/SwipeableChatCard';
import { ChatImageGrid } from '@/components/chat/ChatImageGrid';
import { ChatVideoPlayer } from '@/components/chat/ChatVideoPlayer';
import { LinkPreviewCard, extractUrls } from '@/components/chat/LinkPreviewCard';
import { UploadProgressBar } from '@/components/chat/UploadProgressBar';
import { ForwardMessageDialog } from '@/components/chat/ForwardMessageDialog';
import { SharedPostPreview, extractInternalPostId, isSharedPostMessage } from '@/components/chat/SharedPostPreview';
import { ChatSettingsSheet } from '@/components/chat/ChatSettingsSheet';
import { CallScreen } from '@/components/chat/CallScreen';


const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STICKERS = ['😀', '😂', '🥰', '😍', '🤩', '😎', '🥳', '😭', '😤', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'];
const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

const THEME_MAP: Record<string, { bg: string; bubble: string }> = {
  default: { bg: 'bg-background', bubble: 'bg-primary' },
  midnight: { bg: 'bg-[#0a0e27]', bubble: 'bg-indigo-600' },
  forest: { bg: 'bg-[#0a1a0a]', bubble: 'bg-emerald-700' },
  ocean: { bg: 'bg-[#051525]', bubble: 'bg-cyan-700' },
  sunset: { bg: 'bg-[#1a0a0a]', bubble: 'bg-orange-700' },
  berry: { bg: 'bg-[#150a1a]', bubble: 'bg-purple-700' },
  rose: { bg: 'bg-[#1a0a0f]', bubble: 'bg-rose-600' },
  amber: { bg: 'bg-[#1a150a]', bubble: 'bg-amber-600' },
};

export default function Chat() {
  const { userId } = useParams();
  const { user, profile } = useAuth();
  const { conversations, messages, loading, currentChatUser, fetchMessages, sendMessage, deleteMessage } = useChat();
  const { isBlurred, username } = useChatProtection();
  const navigate = useNavigate();

  // Core state
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatTab, setChatTab] = useState<'main' | 'find' | 'archived' | 'private'>('main');
  const [findSubTab, setFindSubTab] = useState<'suggestions' | 'network'>('suggestions');

  // Media
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState(0);

  // Chat features
  const [showStickers, setShowStickers] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, number>>>({});
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [forwardMsg, setForwardMsg] = useState<{ content: string; mediaUrl?: string; mediaType?: string } | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [editingMsg, setEditingMsg] = useState<{ id: string; content: string } | null>(null);

  // Chat settings (per-chat, persisted via localStorage + DB)
  const [chatTheme, setChatTheme] = useState('default');
  const [chatNicknames, setChatNicknames] = useState<Record<string, string>>({});
  const [mutedChats, setMutedChats] = useState<Set<string>>(new Set());
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());
  const [privateChats, setPrivateChats] = useState<Set<string>>(new Set());
  const [privateUnlocked, setPrivateUnlocked] = useState(false);
  const [ghostMode, setGhostMode] = useState(0);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [mediaGalleryTab, setMediaGalleryTab] = useState<'images' | 'videos' | 'audio' | 'files'>('images');
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [showPrivateAuth, setShowPrivateAuth] = useState(false);
  const [pendingPrivateChat, setPendingPrivateChat] = useState<string | null>(null);
  const [callState, setCallState] = useState<{ open: boolean; isVideo: boolean }>({ open: false, isVideo: false });

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Find tab
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [networkUsers, setNetworkUsers] = useState<any[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentTheme = THEME_MAP[chatTheme] || THEME_MAP.default;

  // Load persisted settings
  useEffect(() => {
    const nicks = localStorage.getItem('chatNicknames');
    if (nicks) setChatNicknames(JSON.parse(nicks));
    const muted = localStorage.getItem('mutedChats');
    if (muted) setMutedChats(new Set(JSON.parse(muted)));
    const archived = localStorage.getItem('archivedChats');
    if (archived) setArchivedChats(new Set(JSON.parse(archived)));
    const priv = localStorage.getItem('privateChats');
    if (priv) setPrivateChats(new Set(JSON.parse(priv)));
  }, []);

  // Load per-chat theme
  useEffect(() => {
    if (currentChatUser) {
      const themes = JSON.parse(localStorage.getItem('chatThemes') || '{}');
      setChatTheme(themes[currentChatUser] || 'default');
      const ghosts = JSON.parse(localStorage.getItem('chatGhostModes') || '{}');
      setGhostMode(ghosts[currentChatUser] || 0);
    }
  }, [currentChatUser]);

  // Ghost mode cleanup
  useEffect(() => {
    if (!ghostMode || !currentChatUser || !user) return;
    if (ghostMode === 1) {
      messages.filter(m => m.is_read && m.sender_id === user.id).forEach(msg => {
        supabase.from('messages').delete().eq('id', msg.id).then(() => {});
      });
      return;
    }
    const interval = setInterval(async () => {
      const cutoff = new Date(Date.now() - ghostMode * 60 * 1000).toISOString();
      for (const msg of messages.filter(m => m.created_at && m.created_at < cutoff && m.sender_id === user.id)) {
        await supabase.from('messages').delete().eq('id', msg.id);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [ghostMode, currentChatUser, user, messages]);

  // Auto-archive unfriended
  useEffect(() => {
    if (!user || conversations.length === 0) return;
    const check = async () => {
      const { data } = await supabase.from('friend_requests').select('sender_id, receiver_id')
        .eq('status', 'accepted').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      const friendIds = new Set(data?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || []);
      const newArchived = new Set(archivedChats);
      let changed = false;
      conversations.forEach(c => {
        if (!friendIds.has(c.user_id) && !newArchived.has(c.user_id) && !privateChats.has(c.user_id)) {
          newArchived.add(c.user_id); changed = true;
        }
      });
      if (changed) saveSet('archivedChats', newArchived, setArchivedChats);
    };
    check();
  }, [user, conversations]);

  // Find tab
  useEffect(() => { if (chatTab === 'find') loadFindData(); }, [chatTab, user]);

  const loadFindData = async () => {
    if (!user) return;
    const [regional, following, friends] = await Promise.all([
      supabase.from('profiles').select('*').neq('id', user.id).order('total_followers', { ascending: false }).limit(20),
      supabase.from('follows').select('following_id, profiles:following_id(*)').eq('follower_id', user.id).limit(20),
      supabase.from('friend_requests').select('sender_id, receiver_id').eq('status', 'accepted').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    ]);
    let suggestions = regional.data || [];
    const country = profile?.country || '';
    if (country) {
      const r = suggestions.filter(u => u.country === country);
      const o = suggestions.filter(u => u.country !== country);
      suggestions = [...r, ...o];
    }
    setSuggestedUsers(suggestions.slice(0, 15));
    const fUsers: any[] = [];
    following.data?.forEach((f: any) => { if (f.profiles?.id) fUsers.push(f.profiles); });
    const fIds = friends.data?.map(f => f.sender_id === user.id ? f.receiver_id : f.sender_id) || [];
    if (fIds.length > 0) {
      const { data: fp } = await supabase.from('profiles').select('*').in('id', fIds);
      const all = [...(fp || []), ...fUsers];
      setNetworkUsers(all.filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i));
    } else setNetworkUsers(fUsers);
  };

  useEffect(() => { if (userId) fetchMessages(userId); }, [userId, fetchMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // User search
  useEffect(() => {
    if (!userSearchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id, name, username, avatar_url, country')
        .or(`name.ilike.%${userSearchQuery}%,username.ilike.%${userSearchQuery}%`)
        .neq('id', user?.id).limit(15);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [userSearchQuery, user]);

  // Helpers
  const saveSet = useCallback((key: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    localStorage.setItem(key, JSON.stringify([...set]));
    setter(new Set(set));
  }, []);

  const toggleInSet = useCallback((key: string, id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const n = new Set(set);
    const wasInSet = n.has(id);
    if (wasInSet) n.delete(id); else n.add(id);
    localStorage.setItem(key, JSON.stringify([...n]));
    setter(new Set(n));
    // Persist to DB
    if (user) {
      const dbField: Record<string, string> = { mutedChats: 'is_muted', archivedChats: 'is_archived', privateChats: 'is_private' };
      const field = dbField[key];
      if (field) {
        supabase.from('chat_settings').upsert({
          user_id: user.id, chat_user_id: id, [field]: !wasInSet, updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,chat_user_id' }).then(() => {});
      }
    }
  }, [user]);

  const saveChatTheme = useCallback((theme: string) => {
    setChatTheme(theme);
    if (currentChatUser && user) {
      const themes = JSON.parse(localStorage.getItem('chatThemes') || '{}');
      themes[currentChatUser] = theme;
      localStorage.setItem('chatThemes', JSON.stringify(themes));
      // Persist to DB
      supabase.from('chat_settings').upsert({
        user_id: user.id, chat_user_id: currentChatUser, theme_color: theme, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,chat_user_id' }).then(() => {});
    }
  }, [currentChatUser, user]);

  const saveChatGhostMode = useCallback((mode: number) => {
    setGhostMode(mode);
    if (currentChatUser && user) {
      const modes = JSON.parse(localStorage.getItem('chatGhostModes') || '{}');
      modes[currentChatUser] = mode;
      localStorage.setItem('chatGhostModes', JSON.stringify(modes));
      supabase.from('chat_settings').upsert({
        user_id: user.id, chat_user_id: currentChatUser, disappear_timer: mode, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,chat_user_id' }).then(() => {});
    }
  }, [currentChatUser, user]);

  const saveNickname = useCallback((name: string) => {
    if (!currentChatUser) return;
    const updated = { ...chatNicknames, [currentChatUser]: name };
    if (!name) delete updated[currentChatUser];
    setChatNicknames(updated);
    localStorage.setItem('chatNicknames', JSON.stringify(updated));
    if (user) {
      supabase.from('chat_settings').upsert({
        user_id: user.id, chat_user_id: currentChatUser, nickname: name || null, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,chat_user_id' }).then(() => {});
    }
  }, [currentChatUser, chatNicknames, user]);

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = []; const previews: string[] = [];
    files.forEach(f => {
      if (f.size > MAX_FILE_SIZE) { toast.error(`${f.name} too large`); return; }
      valid.push(f);
      if (f.type.startsWith('image') || f.type.startsWith('video')) previews.push(URL.createObjectURL(f));
    });
    setMediaFiles(p => [...p, ...valid]);
    setMediaPreviews(p => [...p, ...previews]);
  };

  const removeMedia = (i: number) => {
    if (mediaPreviews[i]) URL.revokeObjectURL(mediaPreviews[i]);
    setMediaFiles(p => p.filter((_, idx) => idx !== i));
    setMediaPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const clearAllMedia = () => {
    mediaPreviews.forEach(u => URL.revokeObjectURL(u));
    setMediaFiles([]); setMediaPreviews([]);
  };

  // Send
  const handleSend = async () => {
    if ((!newMessage.trim() && mediaFiles.length === 0) || !currentChatUser) return;

    // Edit mode
    if (editingMsg) {
      await supabase.from('messages').update({ content: newMessage, edited_at: new Date().toISOString() }).eq('id', editingMsg.id);
      setEditingMsg(null);
      setNewMessage('');
      if (currentChatUser) fetchMessages(currentChatUser);
      return;
    }

    setUploading(true); setUploadIndex(0);
    try {
      const imageFiles = mediaFiles.filter(f => f.type.startsWith('image'));
      const otherFiles = mediaFiles.filter(f => !f.type.startsWith('image'));

      if (imageFiles.length > 0) {
        const urls: string[] = [];
        for (let i = 0; i < imageFiles.length; i++) {
          setUploadIndex(i);
          const f = imageFiles[i];
          const ext = f.name.split('.').pop();
          const name = `${user?.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const { error } = await supabase.storage.from('chat-media').upload(name, f, { cacheControl: '31536000', contentType: f.type });
          if (error) continue;
          urls.push(supabase.storage.from('chat-media').getPublicUrl(name).data.publicUrl);
        }
        if (urls.length > 0) {
          await sendMessage(currentChatUser, '', urls.length === 1 ? urls[0] : JSON.stringify(urls), urls.length === 1 ? 'image' : 'images');
        }
      }

      for (let i = 0; i < otherFiles.length; i++) {
        setUploadIndex(imageFiles.length + i);
        const f = otherFiles[i];
        const ext = f.name.split('.').pop();
        const name = `${user?.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
        const { error } = await supabase.storage.from('chat-media').upload(name, f, { cacheControl: '31536000', contentType: f.type });
        if (error) continue;
        const url = supabase.storage.from('chat-media').getPublicUrl(name).data.publicUrl;
        await sendMessage(currentChatUser, '', url, f.type.startsWith('video') ? 'video' : 'document');
      }

      if (newMessage.trim()) await sendMessage(currentChatUser, newMessage);
      setNewMessage('');
      setReplyTo(null);
      clearAllMedia();
    } catch { toast.error('Failed to send'); }
    finally { setUploading(false); }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => { setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' })); stream.getTracks().forEach(t => t.stop()); };
      mr.start();
      setIsRecording(true); setRecordingTime(0);
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
      const name = `${user.id}/${Date.now()}_voice.webm`;
      const { error } = await supabase.storage.from('chat-media').upload(name, audioBlob, { contentType: 'audio/webm' });
      if (error) throw error;
      await sendMessage(currentChatUser, '🎤 Voice message', supabase.storage.from('chat-media').getPublicUrl(name).data.publicUrl, 'audio');
      setAudioBlob(null); setRecordingTime(0);
    } catch { toast.error('Failed to send voice message'); }
    finally { setUploading(false); }
  };

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleReactToMessage = (messageId: string, emoji: string) => {
    setMessageReactions(prev => {
      const r = { ...(prev[messageId] || {}) };
      r[emoji] = (r[emoji] || 0) + 1;
      return { ...prev, [messageId]: r };
    });
  };

  const togglePinMessage = (id: string) => {
    setPinnedMessages(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startNewChat = (id: string) => { setChatTab('main'); navigate(`/chat/${id}`); };
  const handleBackToChats = () => { setReplyTo(null); setEditingMsg(null); navigate('/chat', { replace: true }); };

  const deleteForEveryone = async (msgId: string) => {
    await supabase.from('messages').delete().eq('id', msgId);
  };

  const deleteForMe = (msgId: string) => {
    // Just remove from local state
    deleteMessage(msgId);
  };

  const deleteEntireChat = async (chatUserId: string) => {
    if (!user) return;
    await supabase.from('messages').delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatUserId}),and(sender_id.eq.${chatUserId},receiver_id.eq.${user.id})`);
    navigate('/chat');
  };

  const handlePrivateAccess = (chatUserId: string) => {
    if (privateUnlocked) { navigate(`/chat/${chatUserId}`); return; }
    setPendingPrivateChat(chatUserId);
    setShowPrivateAuth(true);
  };

  const verifyPrivatePassword = (input: string) => {
    const saved = localStorage.getItem('privateChatPassword');
    if (!saved) {
      localStorage.setItem('privateChatPassword', input);
      setShowPrivateAuth(false); setPrivateUnlocked(true);
      if (pendingPrivateChat) navigate(`/chat/${pendingPrivateChat}`);
    } else if (input === saved) {
      setShowPrivateAuth(false); setPrivateUnlocked(true);
      if (pendingPrivateChat) navigate(`/chat/${pendingPrivateChat}`);
    } else toast.error('Incorrect password');
  };

  // Derived
  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);
  const displayName = currentChatUser && chatNicknames[currentChatUser] ? chatNicknames[currentChatUser] : selectedConversation?.user_name;
  const pinnedMsgs = messages.filter(m => pinnedMessages.has(m.id));

  const filteredConversations = conversations.filter(conv => {
    const match = !searchQuery || conv.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const isA = archivedChats.has(conv.user_id);
    const isP = privateChats.has(conv.user_id);
    if (chatTab === 'archived') return match && isA;
    if (chatTab === 'private') return match && isP;
    if (chatTab === 'main') return match && !isA && !isP;
    return match;
  });

  const mediaMessages = messages.filter(m => m.media_url);
  const imageMessages = mediaMessages.filter(m => m.media_type === 'image' || m.media_type === 'images');
  const videoMessages = mediaMessages.filter(m => m.media_type === 'video');
  const audioMessages = mediaMessages.filter(m => m.media_type === 'audio');
  const fileMessages = mediaMessages.filter(m => m.media_type === 'document');

  // ─────── FULL SCREEN CHAT VIEW ───────
  if (currentChatUser) {
    return (
      <div className={cn("fixed inset-0 z-50 flex flex-col chat-protected animate-slide-in-right relative", currentTheme.bg)}>
        <WatermarkOverlay username={username} />
        {isBlurred && <BlurOverlay />}

        {/* Header */}
        <div className="px-3 py-2.5 border-b border-border/30 flex items-center gap-2.5 bg-card/60 backdrop-blur-md shrink-0 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full" onClick={handleBackToChats}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="w-9 h-9 shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${currentChatUser}`)}>
            <AvatarImage src={selectedConversation?.user_avatar || undefined} />
            <AvatarFallback className="bg-primary/20 text-xs">{displayName?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${currentChatUser}`)}>
            <h3 className="font-semibold text-sm truncate leading-tight">{displayName}</h3>
            <div className="flex items-center gap-1.5">
              {chatNicknames[currentChatUser] && (
                <span className="text-[9px] text-muted-foreground">({selectedConversation?.user_name})</span>
              )}
              {ghostMode > 0 && (
                <p className="text-[9px] text-orange-400 animate-pulse">Ghost</p>
              )}
              {mutedChats.has(currentChatUser) && <BellOff className="w-2.5 h-2.5 text-muted-foreground" />}
            </div>
          </div>
          
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCallState({ open: true, isVideo: false })}>
              <Phone className="w-[18px] h-[18px] text-emerald-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCallState({ open: true, isVideo: true })}>
              <VideoIcon className="w-[18px] h-[18px] text-blue-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowSettings(true)}>
              <MoreVertical className="w-[18px] h-[18px]" />
            </Button>
          </div>
        </div>

        {/* Pinned */}
        {pinnedMsgs.length > 0 && (
          <div className="px-3 py-1.5 bg-primary/5 border-b border-border/30">
            <div className="flex items-center gap-2 text-xs">
              <Pin className="w-3 h-3 text-primary shrink-0" />
              <p className="truncate text-muted-foreground">{pinnedMsgs[pinnedMsgs.length - 1]?.content}</p>
              <span className="text-[9px] text-primary shrink-0">{pinnedMsgs.length} pinned</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3 max-w-2xl mx-auto">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const reactions = messageReactions[msg.id] || {};
              const isPinned = pinnedMessages.has(msg.id);
              const isEdited = !!(msg as any).edited_at;
              
              return (
                <div key={msg.id} className={cn("flex", isOwn ? 'justify-end' : 'justify-start')}>
                  <div className={cn("max-w-[80%] relative group")}>
                    {msg.is_forwarded && (
                      <p className="text-[10px] text-muted-foreground/60 mb-0.5 flex items-center gap-1 italic">
                        <Forward className="w-2.5 h-2.5" /> Forwarded
                      </p>
                    )}
                    <div className={cn(
                      "rounded-[20px] relative overflow-hidden",
                      msg.media_url ? 'p-0' : 'px-3.5 py-2',
                      isOwn 
                        ? cn(currentTheme.bubble, 'text-white', !msg.media_url && 'rounded-br-md') 
                        : cn('bg-muted', !msg.media_url && 'rounded-bl-md'),
                      isPinned && 'ring-1 ring-primary/30'
                    )}>
                      {/* Multi-image */}
                      {msg.media_url && (msg.media_type === 'image' || msg.media_type === 'images') && (() => {
                        let urls: string[] = [];
                        try { urls = msg.media_type === 'images' ? JSON.parse(msg.media_url!) : [msg.media_url!]; } catch { urls = [msg.media_url!]; }
                        return <ChatImageGrid urls={urls} isOwn={isOwn} />;
                      })()}
                      {msg.media_url && msg.media_type === 'video' && <ChatVideoPlayer src={msg.media_url} />}
                      {msg.media_url && msg.media_type === 'audio' && (
                        <div className="p-2"><audio src={msg.media_url} controls className="w-full max-w-[260px]" /></div>
                      )}
                      {msg.media_url && msg.media_type === 'document' && (
                        <div className="p-3"><a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline"><Paperclip className="w-4 h-4" /> View Document</a></div>
                      )}
                      {msg.content && isSharedPostMessage(msg.content) && (() => {
                        const postId = extractInternalPostId(msg.content);
                        return postId ? <SharedPostPreview postId={postId} className="m-1" /> : null;
                      })()}
                      {msg.content && !msg.content.startsWith('📎 ') && msg.content !== '🎤 Voice message' && msg.content.trim() !== '' && msg.content.trim() !== ' ' && !isSharedPostMessage(msg.content) && (
                        <p className={cn("text-sm break-words leading-relaxed", msg.media_url ? "px-3.5 py-2" : "")}>{msg.content}</p>
                      )}
                      {msg.content && !isSharedPostMessage(msg.content) && extractUrls(msg.content).slice(0, 1).map(url => (
                        <LinkPreviewCard key={url} url={url} className="mt-1 mx-1 mb-1" />
                      ))}
                      <EmojiReactionPicker reactions={reactions} onReact={emoji => handleReactToMessage(msg.id, emoji)} isOwn={isOwn} />
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.created_at || ''), { addSuffix: true })}
                      </p>
                      {isEdited && <span className="text-[9px] text-muted-foreground italic">edited</span>}
                      {isOwn && (msg.is_read ? <CheckCheck className="w-3.5 h-3.5 text-primary" /> : <Check className="w-3.5 h-3.5 text-muted-foreground" />)}
                      
                      {/* Message actions */}
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-full hover:bg-muted/50 ml-auto opacity-60 hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOwn ? 'end' : 'start'} side="top" sideOffset={4} className="w-48 rounded-2xl shadow-xl border-border/40 p-1 z-[100] bg-popover">
                          {/* Quick reactions */}
                          <div className="flex items-center justify-around px-2 py-1.5 border-b border-border/30 mb-1">
                            {QUICK_REACTIONS.map(emoji => (
                              <button key={emoji} className="text-lg hover:scale-125 transition-transform" onClick={() => handleReactToMessage(msg.id, emoji)}>
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <DropdownMenuItem className="rounded-xl py-2.5 px-3 gap-3 text-sm cursor-pointer" onClick={() => {
                            setReplyTo({ id: msg.id, content: msg.content || '', senderName: isOwn ? 'You' : displayName || '' });
                          }}>
                            <CornerUpLeft className="w-4 h-4" />Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl py-2.5 px-3 gap-3 text-sm cursor-pointer" onClick={() => togglePinMessage(msg.id)}>
                            <Pin className={cn("w-4 h-4", isPinned && "text-primary fill-primary")} />
                            {isPinned ? 'Unpin' : 'Pin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl py-2.5 px-3 gap-3 text-sm cursor-pointer" onClick={() => navigator.clipboard.writeText(msg.content || '')}>
                            <Reply className="w-4 h-4" />Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl py-2.5 px-3 gap-3 text-sm cursor-pointer" onClick={() => setForwardMsg({ content: msg.content || '', mediaUrl: msg.media_url || undefined, mediaType: msg.media_type || undefined })}>
                            <Forward className="w-4 h-4" />Forward
                          </DropdownMenuItem>
                          {isOwn && (
                            <>
                              <DropdownMenuItem className="rounded-xl py-2.5 px-3 gap-3 text-sm cursor-pointer" onClick={() => { setEditingMsg({ id: msg.id, content: msg.content || '' }); setNewMessage(msg.content || ''); }}>
                                <Pencil className="w-4 h-4" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="rounded-xl py-2.5 px-3 gap-3 text-sm cursor-pointer text-destructive focus:text-destructive" onClick={() => deleteForMe(msg.id)}>
                                <Trash2 className="w-4 h-4" />Delete for me
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl py-2.5 px-3 gap-3 text-sm cursor-pointer text-destructive focus:text-destructive" onClick={() => deleteForEveryone(msg.id)}>
                                <Trash2 className="w-4 h-4" />Delete for everyone
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Reply / Edit banner */}
        {(replyTo || editingMsg) && (
          <div className="px-3 py-2 border-t border-border/30 bg-card/60 flex items-center gap-2">
            <div className="w-1 h-8 rounded-full bg-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-primary font-medium">{editingMsg ? 'Editing message' : `Replying to ${replyTo?.senderName}`}</p>
              <p className="text-xs text-muted-foreground truncate">{editingMsg?.content || replyTo?.content}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full shrink-0" onClick={() => { setReplyTo(null); setEditingMsg(null); setNewMessage(''); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Media Preview */}
        {mediaPreviews.length > 0 && (
          <div className="p-2.5 border-t border-border/20 bg-card/40 backdrop-blur-sm">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mediaPreviews.map((preview, i) => (
                <div key={i} className="relative shrink-0">
                  {mediaFiles[i]?.type.startsWith('video') ? (
                    <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center"><VideoIcon className="w-6 h-6 text-muted-foreground" /></div>
                  ) : (
                    <img src={preview} alt="" className="h-16 w-16 object-cover rounded-xl" />
                  )}
                  <Button size="icon" variant="destructive" className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full shadow-md" onClick={() => removeMedia(i)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploading && mediaFiles.length > 0 && <UploadProgressBar filesCount={mediaFiles.length} currentIndex={uploadIndex} />}

        {/* Voice Recording */}
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

        {/* Input */}
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
                  {STICKERS.map(s => (
                    <button key={s} className="text-xl p-1 hover:bg-muted rounded" onClick={() => { sendMessage(currentChatUser, s); setShowStickers(false); }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
            <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={handleKeyPress}
              placeholder={editingMsg ? "Edit message..." : "Message..."} className="flex-1 rounded-full h-9" disabled={uploading} />
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-full" onClick={startRecording}>
              <Mic className="w-5 h-5" />
            </Button>
            <Button size="icon" className="h-9 w-9 rounded-full" onClick={handleSend} disabled={uploading || (!newMessage.trim() && mediaFiles.length === 0)}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Media Gallery Dialog */}
        <Dialog open={showMediaGallery} onOpenChange={setShowMediaGallery}>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader><DialogTitle>Media, Files & Links</DialogTitle></DialogHeader>
            <Tabs value={mediaGalleryTab} onValueChange={v => setMediaGalleryTab(v as any)}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="images" className="text-xs">Photos ({imageMessages.length})</TabsTrigger>
                <TabsTrigger value="videos" className="text-xs">Videos ({videoMessages.length})</TabsTrigger>
                <TabsTrigger value="audio" className="text-xs">Audio ({audioMessages.length})</TabsTrigger>
                <TabsTrigger value="files" className="text-xs">Files ({fileMessages.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="images">
                <ScrollArea className="h-[50vh]">
                  <div className="grid grid-cols-3 gap-2 p-1">
                    {imageMessages.map(msg => (
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
                    {videoMessages.map(msg => (
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
                    {audioMessages.map(msg => (
                      <div key={msg.id} className="p-3 rounded-lg bg-muted">
                        <audio src={msg.media_url || ''} controls className="w-full" />
                        <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(msg.created_at || ''), { addSuffix: true })}</p>
                      </div>
                    ))}
                  </div>
                  {audioMessages.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">No audio</p>}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="files">
                <ScrollArea className="h-[50vh]">
                  <div className="space-y-2 p-1">
                    {fileMessages.map(msg => (
                      <a key={msg.id} href={msg.media_url || ''} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                        <Paperclip className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">Document</p>
                          <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(msg.created_at || ''), { addSuffix: true })}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  {fileMessages.length === 0 && <p className="text-center py-12 text-muted-foreground text-sm">No files</p>}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Settings Sheet */}
        <ChatSettingsSheet
          open={showSettings}
          onOpenChange={setShowSettings}
          chatUserName={selectedConversation?.user_name || ''}
          chatUserAvatar={selectedConversation?.user_avatar}
          chatUserId={currentChatUser}
          theme={chatTheme}
          onThemeChange={saveChatTheme}
          nickname={chatNicknames[currentChatUser] || ''}
          onNicknameChange={saveNickname}
          isMuted={mutedChats.has(currentChatUser)}
          onMuteToggle={() => toggleInSet('mutedChats', currentChatUser, mutedChats, setMutedChats)}
          isArchived={archivedChats.has(currentChatUser)}
          onArchiveToggle={() => toggleInSet('archivedChats', currentChatUser, archivedChats, setArchivedChats)}
          isPrivate={privateChats.has(currentChatUser)}
          onPrivateToggle={() => toggleInSet('privateChats', currentChatUser, privateChats, setPrivateChats)}
          ghostMode={ghostMode}
          onGhostModeChange={saveChatGhostMode}
          onViewProfile={() => { setShowSettings(false); navigate(`/profile/${currentChatUser}`); }}
          onMediaGallery={() => { setShowSettings(false); setShowMediaGallery(true); }}
          onMusicPlayer={() => { setShowSettings(false); setShowMusicPlayer(true); }}
          onCreateGroup={() => toast.info('Group chat coming soon!')}
          onDeleteChat={() => { setShowSettings(false); deleteEntireChat(currentChatUser); }}
          onVoiceCall={() => { setShowSettings(false); setCallState({ open: true, isVideo: false }); }}
          onVideoCall={() => { setShowSettings(false); setCallState({ open: true, isVideo: true }); }}
          pinnedCount={pinnedMsgs.length}
        />

        <SharedMusicPlayer isOpen={showMusicPlayer} onClose={() => setShowMusicPlayer(false)} partnerName={displayName || 'User'} />
        <ForwardMessageDialog open={!!forwardMsg} onOpenChange={open => !open && setForwardMsg(null)} messageContent={forwardMsg?.content || ''} mediaUrl={forwardMsg?.mediaUrl} mediaType={forwardMsg?.mediaType} />
        <CallScreen open={callState.open} onClose={() => setCallState({ open: false, isVideo: false })} callerName={displayName || 'User'} callerAvatar={selectedConversation?.user_avatar} isVideo={callState.isVideo} />
      </div>
    );
  }

  // ─────── CHAT LIST VIEW ───────
  return (
    <div className="space-y-4 pb-20">
      

      <Tabs value={chatTab} onValueChange={v => setChatTab(v as any)}>
        <TabsList className="w-full grid grid-cols-4 h-auto p-0.5">
          <TabsTrigger value="main" className="text-[10px] py-1.5"><MessageCircle className="w-3 h-3 mr-0.5" />Main</TabsTrigger>
          <TabsTrigger value="find" className="text-[10px] py-1.5"><UserSearch className="w-3 h-3 mr-0.5" />Find</TabsTrigger>
          <TabsTrigger value="archived" className="text-[10px] py-1.5"><Archive className="w-3 h-3 mr-0.5" />Archive</TabsTrigger>
          <TabsTrigger value="private" className="text-[10px] py-1.5"><Lock className="w-3 h-3 mr-0.5" />Private</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="mt-3 space-y-2">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search chats..." className="pl-10" />
          </div>
          {filteredConversations.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No conversations yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setChatTab('find')}>Find People</Button>
              </CardContent>
            </Card>
          ) : filteredConversations.map(conv => (
            <SwipeableChatCard key={conv.user_id} onSwipeLeft={() => toggleInSet('archivedChats', conv.user_id, archivedChats, setArchivedChats)} leftLabel="Archive">
              <Card className="glass-card cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/chat/${conv.user_id}`)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.user_avatar || undefined} />
                    <AvatarFallback className="bg-primary/20">{conv.user_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">{chatNicknames[conv.user_id] || conv.user_name}</p>
                        {mutedChats.has(conv.user_id) && <BellOff className="w-3 h-3 text-muted-foreground shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{conv.last_message_time && formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && <Badge variant="destructive" className="text-[10px] h-5 min-w-[20px] animate-scale-in">{conv.unread_count}</Badge>}
                </CardContent>
              </Card>
            </SwipeableChatCard>
          ))}
        </TabsContent>

        <TabsContent value="find" className="mt-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} placeholder="Search by name or @username..." className="pl-10" />
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Search Results</p>
              {searchResults.map(u => (
                <Card key={u.id} className="glass-card cursor-pointer hover:bg-muted/30" onClick={() => startNewChat(u.id)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url || undefined} /><AvatarFallback>{u.name?.[0]}</AvatarFallback></Avatar>
                    <div className="flex-1"><p className="font-medium text-sm">{u.name}</p><p className="text-[10px] text-muted-foreground">{u.username ? `@${u.username}` : u.country || 'Unknown'}</p></div>
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
                  {suggestedUsers.map(u => (
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
                  {networkUsers.map(u => (
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

        <TabsContent value="archived" className="mt-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-12 text-center">
              <Archive className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No archived chats</p>
            </CardContent></Card>
          ) : filteredConversations.map(conv => (
            <SwipeableChatCard key={conv.user_id} onSwipeRight={() => toggleInSet('archivedChats', conv.user_id, archivedChats, setArchivedChats)} rightLabel="Unarchive">
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

        <TabsContent value="private" className="mt-3 space-y-2">
          {!privateUnlocked && filteredConversations.length > 0 ? (
            <Card className="glass-card"><CardContent className="py-12 text-center">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">Private Chats Locked</p>
              <p className="text-xs text-muted-foreground mt-1">{filteredConversations.length} chat(s) protected</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setPendingPrivateChat(null); setShowPrivateAuth(true); }}>Unlock</Button>
            </CardContent></Card>
          ) : filteredConversations.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-12 text-center">
              <Lock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No private chats</p>
              <p className="text-xs text-muted-foreground mt-1">Add chats from the ⋮ menu</p>
            </CardContent></Card>
          ) : filteredConversations.map(conv => (
            <SwipeableChatCard key={conv.user_id} onSwipeRight={() => toggleInSet('privateChats', conv.user_id, privateChats, setPrivateChats)} rightLabel="Unprivate">
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
            <Input type="password" placeholder="Password..." onKeyDown={e => { if (e.key === 'Enter') verifyPrivatePassword((e.target as HTMLInputElement).value); }} />
            <Button onClick={e => { const input = (e.currentTarget.previousElementSibling as HTMLInputElement); verifyPrivatePassword(input?.value || ''); }}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
