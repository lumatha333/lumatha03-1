import { useState, useRef, useEffect } from 'react';
import { Send, Image, ArrowLeft, Search, Users, UserPlus, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Archive, Lock, Heart, Ghost, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useChat } from '@/hooks/useChat';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Communication() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { conversations, messages, loading, currentChatUser, fetchMessages, sendMessage, deleteMessage } = useChat();
  const { friends, friendRequests: pendingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('chats');
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [archivedChats, setArchivedChats] = useState<string[]>([]);
  const [privateChats, setPrivateChats] = useState<string[]>([]);
  const [privatePassword, setPrivatePassword] = useState('');
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ghostMode, setGhostMode] = useState<string | null>(null);
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

  useEffect(() => {
    if (user) {
      fetchFollowing();
      loadChatSettings();
    }
  }, [user]);

  const loadChatSettings = () => {
    const archived = localStorage.getItem('coc_archived_chats');
    const priv = localStorage.getItem('coc_private_chats');
    const pwd = localStorage.getItem('coc_private_password');
    const ghost = localStorage.getItem('coc_ghost_mode');
    
    setArchivedChats(archived ? JSON.parse(archived) : []);
    setPrivateChats(priv ? JSON.parse(priv) : []);
    setPrivatePassword(pwd || '');
    setGhostMode(ghost);
  };

  const fetchFollowing = async () => {
    if (!user) return;
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    
    if (following && following.length > 0) {
      const ids = following.map(f => f.following_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids);
      setFollowingList(profiles || []);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentChatUser) return;
    await sendMessage(currentChatUser, newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, bio')
      .ilike('name', `%${query}%`)
      .neq('id', user?.id || '')
      .limit(10);
    
    setSearchResults(data || []);
  };

  const handleArchiveChat = (chatUserId: string) => {
    const updated = [...archivedChats, chatUserId];
    setArchivedChats(updated);
    localStorage.setItem('coc_archived_chats', JSON.stringify(updated));
    toast.success('Chat archived');
  };

  const handleUnarchive = (chatUserId: string) => {
    const updated = archivedChats.filter(id => id !== chatUserId);
    setArchivedChats(updated);
    localStorage.setItem('coc_archived_chats', JSON.stringify(updated));
    toast.success('Chat unarchived');
  };

  const handleAddToPrivate = (chatUserId: string) => {
    if (!privatePassword) {
      toast.error('Set up private password first');
      return;
    }
    const updated = [...privateChats, chatUserId];
    setPrivateChats(updated);
    localStorage.setItem('coc_private_chats', JSON.stringify(updated));
    toast.success('Added to private chats');
  };

  const handleRemoveFromPrivate = (chatUserId: string) => {
    const updated = privateChats.filter(id => id !== chatUserId);
    setPrivateChats(updated);
    localStorage.setItem('coc_private_chats', JSON.stringify(updated));
    toast.success('Removed from private');
  };

  const handleSetupPassword = () => {
    if (setupPassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    if (setupPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    localStorage.setItem('coc_private_password', setupPassword);
    setPrivatePassword(setupPassword);
    setSetupPassword('');
    setConfirmPassword('');
    toast.success('Private password set!');
  };

  const handleUnlockPrivate = () => {
    if (passwordInput === privatePassword) {
      setIsPrivateUnlocked(true);
      setPasswordInput('');
      toast.success('Private chats unlocked');
    } else {
      toast.error('Wrong password');
    }
  };

  const handleSetGhostMode = (duration: string) => {
    localStorage.setItem('coc_ghost_mode', duration);
    setGhostMode(duration);
    toast.success(`Ghost mode: Messages disappear after ${duration}`);
  };

  const handleDeleteConversation = async (chatUserId: string) => {
    // Delete all messages between users
    if (!user) return;
    await supabase.from('messages').delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatUserId}),and(sender_id.eq.${chatUserId},receiver_id.eq.${user.id})`);
    toast.success('Conversation deleted');
    navigate('/chat');
  };

  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);

  // Filter conversations by category
  const mainChats = conversations.filter(c => 
    !archivedChats.includes(c.user_id) && !privateChats.includes(c.user_id)
  );
  const archivedConversations = conversations.filter(c => archivedChats.includes(c.user_id));
  const privateConversations = conversations.filter(c => privateChats.includes(c.user_id));

  const renderConversationItem = (conv: any, showActions = true) => (
    <div
      key={conv.user_id}
      className={`p-3 border-b border-border/50 cursor-pointer transition-all hover:bg-primary/5 ${
        currentChatUser === conv.user_id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
      }`}
      onClick={() => navigate(`/chat/${conv.user_id}`)}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarImage src={conv.user_avatar} />
          <AvatarFallback>{conv.user_name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm truncate">{conv.user_name}</p>
            <div className="flex items-center gap-1">
              {conv.unread_count > 0 && (
                <Badge className="bg-primary text-primary-foreground text-[10px] h-5">
                  {conv.unread_count}
                </Badge>
              )}
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchiveChat(conv.user_id); }}>
                      <Archive className="w-3 h-3 mr-2" /> Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAddToPrivate(conv.user_id); }}>
                      <Lock className="w-3 h-3 mr-2" /> Add to Private
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSetGhostMode('30min'); }}>
                      <Ghost className="w-3 h-3 mr-2" /> Ghost 30 min
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSetGhostMode('1day'); }}>
                      <Ghost className="w-3 h-3 mr-2" /> Ghost 1 day
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSetGhostMode('1week'); }}>
                      <Ghost className="w-3 h-3 mr-2" /> Ghost 1 week
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.user_id); }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-2" /> Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
          {conv.last_message_time && (
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          💬 Messages
        </h1>
        {ghostMode && (
          <Badge variant="secondary" className="text-[10px]">
            <Ghost className="w-3 h-3 mr-1" /> {ghostMode}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="glass-card w-full grid grid-cols-4 h-auto p-0.5 mb-3">
          <TabsTrigger value="chats" className="gap-1 text-[10px] py-1.5">
            <Send className="w-3 h-3" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-1 text-[10px] py-1.5">
            <Archive className="w-3 h-3" />
            Archive
          </TabsTrigger>
          <TabsTrigger value="private" className="gap-1 text-[10px] py-1.5">
            <Lock className="w-3 h-3" />
            Private
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-1 text-[10px] py-1.5">
            <Users className="w-3 h-3" />
            Following
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* Main Chats Tab */}
          <TabsContent value="chats" className="h-full m-0">
            <div className="flex h-full gap-3">
              {/* Conversations List */}
              <div className={`w-full md:w-72 glass-card rounded-xl overflow-hidden ${currentChatUser ? 'hidden md:flex' : 'flex'} flex-col`}>
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-7 h-8 text-xs glass-card" />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {mainChats.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Send className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No conversations</p>
                    </div>
                  ) : (
                    mainChats.map((conv) => renderConversationItem(conv))
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col">
                {currentChatUser ? (
                  <>
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => navigate('/chat')}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                          <AvatarImage src={selectedConversation?.user_avatar} />
                          <AvatarFallback>{selectedConversation?.user_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm">{selectedConversation?.user_name}</h3>
                          <p className="text-[10px] text-green-500">● Online</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                          <Video className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 p-3">
                      {loading ? (
                        <div className="flex justify-center items-center h-full">
                          <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                          <Smile className="w-12 h-12 mb-3 opacity-50" />
                          <p className="text-sm">Say hello! 👋</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((message) => {
                            const isOwn = message.sender_id === user?.id;
                            return (
                              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                                  isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
                                }`}>
                                  {message.media_url && (
                                    <img src={message.media_url} alt="Media" className="rounded-lg mb-2 max-w-full" />
                                  )}
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className={`text-[10px] ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                    </p>
                                    <button className="opacity-50 hover:opacity-100">
                                      <Heart className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    <div className="p-3 border-t border-border">
                      <div className="flex gap-2 items-center">
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 flex-shrink-0">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="flex-1 rounded-full glass-card h-9 text-sm"
                        />
                        <Button onClick={handleSend} disabled={!newMessage.trim()} size="icon" className="rounded-full h-8 w-8 flex-shrink-0">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Send className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">Select a conversation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archive" className="h-full m-0">
            <Card className="glass-card border-border h-full">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Archive className="w-4 h-4 text-primary" />
                  Archived Chats ({archivedConversations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  {archivedConversations.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No archived chats</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {archivedConversations.map((conv) => (
                        <div key={conv.user_id} className="flex items-center gap-3 p-3 glass-card rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.user_avatar} />
                            <AvatarFallback>{conv.user_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{conv.user_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleUnarchive(conv.user_id)}>
                            Unarchive
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Private Chat Tab */}
          <TabsContent value="private" className="h-full m-0">
            <Card className="glass-card border-border h-full">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lock className="w-4 h-4 text-primary" />
                  Private Chats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!privatePassword ? (
                  <div className="space-y-4 py-6">
                    <div className="text-center mb-4">
                      <Lock className="w-12 h-12 mx-auto text-primary mb-2" />
                      <p className="text-sm font-medium">Set up Private Password</p>
                      <p className="text-xs text-muted-foreground">Protect your private chats</p>
                    </div>
                    <Input
                      type="password"
                      placeholder="New password"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="text-sm"
                    />
                    <Button onClick={handleSetupPassword} className="w-full">
                      Set Password
                    </Button>
                  </div>
                ) : !isPrivateUnlocked ? (
                  <div className="space-y-4 py-6">
                    <div className="text-center mb-4">
                      <Lock className="w-12 h-12 mx-auto text-primary mb-2" />
                      <p className="text-sm font-medium">Enter Password</p>
                    </div>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleUnlockPrivate()}
                      className="text-sm"
                    />
                    <Button onClick={handleUnlockPrivate} className="w-full">
                      Unlock
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    {privateConversations.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No private chats</p>
                        <p className="text-xs mt-1">Add chats from the menu</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {privateConversations.map((conv) => (
                          <div key={conv.user_id} className="flex items-center gap-3 p-3 glass-card rounded-lg">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conv.user_avatar} />
                              <AvatarFallback>{conv.user_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{conv.user_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => navigate(`/chat/${conv.user_id}`)}>
                                <Send className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRemoveFromPrivate(conv.user_id)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following" className="h-full m-0">
            <Card className="glass-card border-border h-full">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  Following ({followingList.length})
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-18rem)]">
                  {searchQuery.length > 1 ? (
                    searchResults.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No results</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((person) => (
                          <div key={person.id} className="flex items-center gap-3 p-3 glass-card rounded-lg">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={person.avatar_url} />
                              <AvatarFallback>{person.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{person.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{person.bio || 'No bio'}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => navigate(`/chat/${person.id}`)}>
                                <Send className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => sendFriendRequest(person.id)}>
                                <UserPlus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : followingList.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Not following anyone</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {followingList.map((person) => (
                        <div key={person.id} className="flex items-center gap-3 p-3 glass-card rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={person.avatar_url} />
                            <AvatarFallback>{person.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{person.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{person.bio || 'No bio'}</p>
                          </div>
                          <Button size="sm" onClick={() => navigate(`/chat/${person.id}`)}>
                            <Send className="w-3 h-3 mr-1" /> Chat
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}