import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Lock, Eye, EyeOff, KeyRound, MessageCircle, Search, 
  Heart, Archive, Shield, Users, Plus 
} from 'lucide-react';

export default function Private() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('private-chat');
  const [privatePassword, setPrivatePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [privateChats, setPrivateChats] = useState<any[]>([]);
  const [archivedChats, setArchivedChats] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Check if user has private chat password
    const storedPassword = localStorage.getItem(`private_chat_password_${user.id}`);
    setHasPassword(!!storedPassword);
    
    fetchPrivateChats();
    fetchArchivedChats();
    fetchFollowing();
  }, [user]);

  const fetchPrivateChats = async () => {
    if (!user) return;
    const privateList = JSON.parse(localStorage.getItem(`private_chats_${user.id}`) || '[]');
    
    if (privateList.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', privateList);
      setPrivateChats(data || []);
    }
  };

  const fetchArchivedChats = async () => {
    if (!user) return;
    const archivedList = JSON.parse(localStorage.getItem(`archived_chats_${user.id}`) || '[]');
    
    if (archivedList.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', archivedList);
      setArchivedChats(data || []);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey(id, name, avatar_url, bio)
      `)
      .eq('follower_id', user.id);
    
    setFollowing(data?.map(f => f.profiles).filter(Boolean) || []);
  };

  const handleSetupPassword = () => {
    if (!privatePassword || privatePassword.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    if (privatePassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    localStorage.setItem(`private_chat_password_${user?.id}`, privatePassword);
    setHasPassword(true);
    setIsUnlocked(true);
    setSetupDialogOpen(false);
    setPrivatePassword('');
    setConfirmPassword('');
    toast.success('Private chat password set!');
  };

  const handleUnlock = () => {
    const storedPassword = localStorage.getItem(`private_chat_password_${user?.id}`);
    if (enteredPassword === storedPassword) {
      setIsUnlocked(true);
      setEnteredPassword('');
      toast.success('Private chat unlocked!');
    } else {
      toast.error('Incorrect password');
    }
  };

  const addToPrivateChat = (userId: string) => {
    const privateList = JSON.parse(localStorage.getItem(`private_chats_${user?.id}`) || '[]');
    if (!privateList.includes(userId)) {
      privateList.push(userId);
      localStorage.setItem(`private_chats_${user?.id}`, JSON.stringify(privateList));
      fetchPrivateChats();
      toast.success('Added to private chats');
    }
  };

  const removeFromArchive = (userId: string) => {
    const archivedList = JSON.parse(localStorage.getItem(`archived_chats_${user?.id}`) || '[]');
    const newList = archivedList.filter((id: string) => id !== userId);
    localStorage.setItem(`archived_chats_${user?.id}`, JSON.stringify(newList));
    fetchArchivedChats();
    toast.success('Removed from archive');
  };

  const filteredFollowing = following.filter(f => 
    f?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" /> Private Zone
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-3 h-auto p-0.5">
          <TabsTrigger value="private-chat" className="gap-1 text-[10px] sm:text-xs py-2">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Private</span> Chat
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-1 text-[10px] sm:text-xs py-2">
            <Archive className="w-3.5 h-3.5" />
            Archive
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-1 text-[10px] sm:text-xs py-2">
            <Users className="w-3.5 h-3.5" />
            Following
          </TabsTrigger>
        </TabsList>

        {/* Private Chat Tab */}
        <TabsContent value="private-chat" className="space-y-3 mt-4">
          {!hasPassword ? (
            <Card className="glass-card border-border">
              <CardContent className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Set Up Private Chat</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a password to protect your private conversations
                  </p>
                </div>
                <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Lock className="w-4 h-4" /> Create Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card max-w-sm mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-center">Create Private Chat Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={privatePassword}
                            onChange={(e) => setPrivatePassword(e.target.value)}
                            placeholder="Enter password"
                            className="glass-card pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-10"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className="glass-card"
                        />
                      </div>
                      <Button onClick={handleSetupPassword} className="w-full">
                        Set Password
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : !isUnlocked ? (
            <Card className="glass-card border-border">
              <CardContent className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Private Chat Locked</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your password to access private conversations
                  </p>
                </div>
                <div className="max-w-xs mx-auto space-y-3">
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={enteredPassword}
                      onChange={(e) => setEnteredPassword(e.target.value)}
                      placeholder="Enter password"
                      className="glass-card pr-10"
                      onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button onClick={handleUnlock} className="w-full gap-2">
                    <KeyRound className="w-4 h-4" /> Unlock
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" /> Private chat unlocked
                </p>
                <Button variant="ghost" size="sm" onClick={() => setIsUnlocked(false)}>
                  <Lock className="w-4 h-4" />
                </Button>
              </div>
              
              {privateChats.length === 0 ? (
                <Card className="glass-card border-border">
                  <CardContent className="py-8 text-center">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No private chats yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add chats from the Following tab</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {privateChats.map((chat) => (
                      <Card 
                        key={chat.id} 
                        className="glass-card border-border cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => navigate(`/chat/${chat.id}`)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={chat.avatar_url} />
                            <AvatarFallback>{chat.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{chat.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Private conversation
                            </p>
                          </div>
                          <MessageCircle className="w-5 h-5 text-primary" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-3 mt-4">
          {archivedChats.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="py-8 text-center">
                <Archive className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No archived chats</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Archive chats from the chat options menu
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {archivedChats.map((chat) => (
                  <Card key={chat.id} className="glass-card border-border">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={chat.avatar_url} />
                        <AvatarFallback>{chat.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{chat.name}</p>
                        <p className="text-xs text-muted-foreground">Archived</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => navigate(`/chat/${chat.id}`)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeFromArchive(chat.id)}
                        >
                          Unarchive
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="space-y-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search following..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-card"
            />
          </div>
          
          {filteredFollowing.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="py-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No users found' : 'Not following anyone yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredFollowing.map((followedUser) => (
                  <Card key={followedUser.id} className="glass-card border-border">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar 
                        className="w-12 h-12 cursor-pointer"
                        onClick={() => navigate(`/profile/${followedUser.id}`)}
                      >
                        <AvatarImage src={followedUser.avatar_url} />
                        <AvatarFallback>{followedUser.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{followedUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {followedUser.bio || 'No bio'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => navigate(`/chat/${followedUser.id}`)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        {hasPassword && isUnlocked && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => addToPrivateChat(followedUser.id)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}