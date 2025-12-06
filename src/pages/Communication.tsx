import { useState, useRef, useEffect } from 'react';
import { Send, Image, ArrowLeft, Search, Users, UserPlus, Phone, Video, MoreVertical, Smile, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const { conversations, messages, loading, currentChatUser, fetchMessages, sendMessage } = useChat();
  const { friends, friendRequests: pendingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('chats');
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

  const selectedConversation = conversations.find(c => c.user_id === currentChatUser);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          💬 Communication
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="glass-card w-full justify-start mb-4">
          <TabsTrigger value="chats" className="gap-2 flex-1">
            <Send className="w-4 h-4" />
            Chats
            {conversations.length > 0 && (
              <Badge variant="secondary" className="ml-1">{conversations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="friends" className="gap-2 flex-1">
            <Users className="w-4 h-4" />
            Friends
            <Badge variant="secondary" className="ml-1">{friends.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2 flex-1">
            <UserPlus className="w-4 h-4" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2 flex-1">
            <Search className="w-4 h-4" />
            Find
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="chats" className="h-full m-0">
            <div className="flex h-full gap-4">
              {/* Conversations List */}
              <div className={`w-full md:w-80 glass-card rounded-xl overflow-hidden ${currentChatUser ? 'hidden md:flex' : 'flex'} flex-col`}>
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search conversations..." className="pl-10 glass-card" />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm mt-2">Find friends to start chatting!</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.user_id}
                        className={`p-4 border-b border-border/50 cursor-pointer transition-all hover:bg-primary/5 ${
                          currentChatUser === conv.user_id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                        }`}
                        onClick={() => navigate(`/chat/${conv.user_id}`)}
                      >
                        <div className="flex gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarImage src={conv.user_avatar} />
                            <AvatarFallback>{conv.user_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold truncate">{conv.user_name}</p>
                              {conv.unread_count > 0 && (
                                <Badge className="bg-primary text-primary-foreground animate-pulse">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                            {conv.last_message_time && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col">
                {currentChatUser ? (
                  <>
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate('/communication')}>
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarImage src={selectedConversation?.user_avatar} />
                          <AvatarFallback>{selectedConversation?.user_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{selectedConversation?.user_name}</h3>
                          <p className="text-xs text-green-500">● Online</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                      {loading ? (
                        <div className="flex justify-center items-center h-full">
                          <div className="animate-pulse text-muted-foreground">Loading messages...</div>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                          <Smile className="w-16 h-16 mb-4 opacity-50" />
                          <p>Say hello! 👋</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => {
                            const isOwn = message.sender_id === user?.id;
                            return (
                              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                  isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
                                }`}>
                                  {message.media_url && (
                                    <img src={message.media_url} alt="Shared media" className="rounded-lg mb-2 max-w-full" />
                                  )}
                                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    <div className="p-4 border-t border-border">
                      <div className="flex gap-2 items-center">
                        <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                          <Smile className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                          <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="flex-1 rounded-full glass-card"
                        />
                        <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                          <Mic className="h-5 w-5" />
                        </Button>
                        <Button onClick={handleSend} disabled={!newMessage.trim()} size="icon" className="rounded-full btn-cosmic flex-shrink-0">
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Send className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p className="text-sm">Choose a chat to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="friends" className="h-full m-0">
            <Card className="glass-card border-border h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Your Friends ({friends.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  {friends.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No friends yet</p>
                      <p className="text-sm mt-2">Search for people to add as friends!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {friends.map((friend) => (
                        <Card key={friend.id} className="glass-card hover-lift">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                              <AvatarImage src={friend.avatar_url} />
                              <AvatarFallback>{friend.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{friend.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{friend.bio || 'No bio'}</p>
                            </div>
                            <Button size="sm" onClick={() => navigate(`/chat/${friend.id}`)}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="h-full m-0">
            <Card className="glass-card border-border h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Friend Requests ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No pending requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <Card key={request.id} className="glass-card">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={request.sender?.avatar_url} />
                                <AvatarFallback>{request.sender?.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{request.sender?.name}</p>
                                <p className="text-sm text-muted-foreground">Wants to be friends</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => acceptFriendRequest(request.id, request.sender_id)}>
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => rejectFriendRequest(request.id)}>
                                Decline
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="h-full m-0">
            <Card className="glass-card border-border h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Find People
                </CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 glass-card"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-24rem)]">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>{searchQuery.length < 2 ? 'Type to search for people' : 'No results found'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.map((person) => (
                        <Card key={person.id} className="glass-card hover-lift">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                              <AvatarImage src={person.avatar_url} />
                              <AvatarFallback>{person.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{person.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{person.bio || 'No bio'}</p>
                            </div>
                            <Button size="sm" onClick={() => {
                              sendFriendRequest(person.id);
                              toast.success('Friend request sent!');
                            }}>
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </CardContent>
                        </Card>
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