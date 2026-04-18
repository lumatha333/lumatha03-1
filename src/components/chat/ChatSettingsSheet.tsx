import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  User, Edit3, Palette, Smile, Music, Image, Ghost,
  Bell, BellOff, Archive, Lock, Users, Trash2, 
  Phone, Video as VideoIcon, Search, Pin, Volume2
} from 'lucide-react';

const CHAT_THEMES = [
  { id: 'default', label: 'Default', color: 'bg-primary' },
  { id: 'midnight', label: 'Midnight', color: 'bg-indigo-600' },
  { id: 'forest', label: 'Forest', color: 'bg-emerald-700' },
  { id: 'ocean', label: 'Ocean', color: 'bg-cyan-700' },
  { id: 'sunset', label: 'Sunset', color: 'bg-orange-700' },
  { id: 'berry', label: 'Berry', color: 'bg-purple-700' },
  { id: 'rose', label: 'Rose', color: 'bg-rose-600' },
  { id: 'amber', label: 'Amber', color: 'bg-amber-600' },
];

const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥', '💯'];

const DISAPPEAR_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: 'When seen', value: 1 },
  { label: '24 hours', value: 1440 },
  { label: '7 days', value: 10080 },
];

const MUTE_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '8 hours', value: 480 },
  { label: '24 hours', value: 1440 },
  { label: 'Until turned off', value: -1 },
];

interface ChatSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatUserName: string;
  chatUserAvatar?: string;
  chatUserId: string;
  // Settings state
  theme: string;
  onThemeChange: (theme: string) => void;
  nickname: string;
  onNicknameChange: (name: string) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  isArchived: boolean;
  onArchiveToggle: () => void;
  isPrivate: boolean;
  onPrivateToggle: () => void;
  ghostMode: number;
  onGhostModeChange: (mode: number) => void;
  onViewProfile: () => void;
  onMediaGallery: () => void;
  onMusicPlayer: () => void;
  onCreateGroup: () => void;
  onDeleteChat: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  pinnedCount: number;
}

export function ChatSettingsSheet({
  open, onOpenChange, chatUserName, chatUserAvatar, chatUserId,
  theme, onThemeChange, nickname, onNicknameChange,
  isMuted, onMuteToggle, isArchived, onArchiveToggle,
  isPrivate, onPrivateToggle, ghostMode, onGhostModeChange,
  onViewProfile, onMediaGallery, onMusicPlayer, onCreateGroup,
  onDeleteChat, onVoiceCall, onVideoCall, pinnedCount
}: ChatSettingsSheetProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickInput, setNickInput] = useState(nickname);

  const saveNickname = () => {
    onNicknameChange(nickInput.trim());
    setEditingNickname(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 bg-background border-l border-border/30">
        {/* Header with avatar */}
        <div className="p-5 pb-3 text-center border-b border-border/20">
          <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-primary/20 cursor-pointer" onClick={onViewProfile}>
            <AvatarImage src={chatUserAvatar} />
            <AvatarFallback className="bg-primary/20 text-lg">{chatUserName?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <h3 className="font-bold text-lg">{nickname || chatUserName}</h3>
          {nickname && <p className="text-xs text-muted-foreground">{chatUserName}</p>}

          {/* Quick actions */}
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={onVoiceCall} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Phone className="w-4 h-4 text-emerald-500" /></div>
              <span className="text-[10px] text-muted-foreground">Call</span>
            </button>
            <button onClick={onVideoCall} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><VideoIcon className="w-4 h-4 text-blue-500" /></div>
              <span className="text-[10px] text-muted-foreground">Video</span>
            </button>
            <button onClick={onViewProfile} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><User className="w-4 h-4" /></div>
              <span className="text-[10px] text-muted-foreground">Profile</span>
            </button>
            <button onClick={() => { /* search */ }} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Search className="w-4 h-4" /></div>
              <span className="text-[10px] text-muted-foreground">Search</span>
            </button>
          </div>
        </div>

        {/* Tabbed sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full grid grid-cols-4 h-10 rounded-none bg-card/50 border-b border-border/20">
            <TabsTrigger value="profile" className="text-[10px] data-[state=active]:bg-primary/10 rounded-none"><User className="w-3 h-3 mr-0.5" />Profile</TabsTrigger>
            <TabsTrigger value="customize" className="text-[10px] data-[state=active]:bg-primary/10 rounded-none"><Palette className="w-3 h-3 mr-0.5" />Style</TabsTrigger>
            <TabsTrigger value="privacy" className="text-[10px] data-[state=active]:bg-primary/10 rounded-none"><Lock className="w-3 h-3 mr-0.5" />Privacy</TabsTrigger>
            <TabsTrigger value="manage" className="text-[10px] data-[state=active]:bg-primary/10 rounded-none"><Users className="w-3 h-3 mr-0.5" />More</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)]">
            {/* PROFILE TAB */}
            <TabsContent value="profile" className="p-4 space-y-3 mt-0">
              <SettingsItem icon={<User className="w-4 h-4" />} label="View Profile" onClick={onViewProfile} />
              
              <div className="p-3 rounded-xl bg-card border border-border/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm"><Edit3 className="w-4 h-4 text-muted-foreground" /> Nickname</div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setNickInput(nickname); setEditingNickname(!editingNickname); }}>
                    {editingNickname ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
                {editingNickname ? (
                  <div className="flex gap-2">
                    <Input value={nickInput} onChange={e => setNickInput(e.target.value)} placeholder="Set nickname..." className="h-8 text-sm" />
                    <Button size="sm" className="h-8" onClick={saveNickname}>Save</Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{nickname || 'Not set'}</p>
                )}
              </div>

              <SettingsItem icon={<Image className="w-4 h-4" />} label="Shared Media, Files & Links" onClick={onMediaGallery} />
              
              {pinnedCount > 0 && (
                <SettingsItem icon={<Pin className="w-4 h-4" />} label={`${pinnedCount} Pinned Messages`} />
              )}
            </TabsContent>

            {/* CUSTOMIZE TAB */}
            <TabsContent value="customize" className="p-4 space-y-3 mt-0">
              <div className="p-3 rounded-xl bg-card border border-border/30">
                <p className="text-sm font-medium mb-3 flex items-center gap-2"><Palette className="w-4 h-4" /> Chat Theme</p>
                <div className="grid grid-cols-4 gap-2">
                  {CHAT_THEMES.map(t => (
                    <button key={t.id} onClick={() => onThemeChange(t.id)}
                      className={cn("flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all",
                        theme === t.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                      )}>
                      <div className={cn("w-8 h-8 rounded-full", t.color)} />
                      <span className="text-[10px]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/30">
                <p className="text-sm font-medium mb-3 flex items-center gap-2"><Smile className="w-4 h-4" /> Quick Reaction</p>
                <div className="flex gap-2 flex-wrap">
                  {QUICK_EMOJIS.map(emoji => (
                    <button key={emoji} className="text-2xl p-1.5 rounded-lg hover:bg-muted transition-colors hover:scale-110">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <SettingsItem icon={<Music className="w-4 h-4" />} label="Shared Sound" onClick={onMusicPlayer} />
              <SettingsItem icon={<Volume2 className="w-4 h-4" />} label="Chat Sound" sublabel="Default" />
            </TabsContent>

            {/* PRIVACY TAB */}
            <TabsContent value="privacy" className="p-4 space-y-3 mt-0">
              <div className="p-3 rounded-xl bg-card border border-border/30">
                <p className="text-sm font-medium mb-3 flex items-center gap-2"><Ghost className="w-4 h-4" /> Disappearing Messages</p>
                <div className="space-y-1.5">
                  {DISAPPEAR_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => onGhostModeChange(opt.value)}
                      className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                        ghostMode === opt.value ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                      )}>
                      {opt.label}
                      {ghostMode === opt.value && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    Mute Notifications
                  </div>
                  <Switch checked={isMuted} onCheckedChange={onMuteToggle} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm"><Archive className="w-4 h-4" /> Archive Chat</div>
                  <Switch checked={isArchived} onCheckedChange={onArchiveToggle} />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm"><Lock className="w-4 h-4" /> Add to Private</div>
                  <Switch checked={isPrivate} onCheckedChange={onPrivateToggle} />
                </div>
                <p className="text-[10px] text-muted-foreground">Lock with PIN to hide from main list</p>
              </div>
            </TabsContent>

            {/* MANAGE TAB */}
            <TabsContent value="manage" className="p-4 space-y-3 mt-0">
              <SettingsItem icon={<Users className="w-4 h-4" />} label="Create Group Chat" onClick={onCreateGroup} />
              
              <div className="pt-4 border-t border-border/20 space-y-2">
                <Button variant="destructive" className="w-full justify-start gap-2 rounded-xl" onClick={onDeleteChat}>
                  <Trash2 className="w-4 h-4" /> Delete Conversation
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function SettingsItem({ icon, label, sublabel, onClick }: { icon: React.ReactNode; label: string; sublabel?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 hover:bg-muted/30 transition-colors text-left">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-sm">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
      </div>
    </button>
  );
}
