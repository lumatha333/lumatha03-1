import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { 
  Bell, Heart, MessageCircle, UserPlus, Share2, CheckCheck, 
  Trash2, Users, AtSign, ListTodo, StickyNote, Mountain,
  UserCheck, UserX, Sparkles
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  content: string;
  from_user_id: string;
  is_read: boolean;
  created_at: string;
  link?: string;
  from_user?: { id: string; name: string; avatar_url?: string };
}

const TABS = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'reactions', label: 'Reactions', icon: Heart },
  { id: 'mentions', label: 'Mentions', icon: AtSign },
  { id: 'activity', label: 'Activity', icon: Sparkles },
] as const;

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friendRequests, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(n => n.from_user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);
        
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setNotifications(data.map(n => ({ ...n, from_user: profilesMap.get(n.from_user_id) })));
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All marked as read');
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase.from('notifications').delete().eq('id', notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);
    if (notification.link) navigate(notification.link);
    else if (notification.from_user_id) navigate(`/profile/${notification.from_user_id}`);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow': return <UserPlus className="w-3.5 h-3.5 text-blue-400" />;
      case 'like': return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'comment': return <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'share': return <Share2 className="w-3.5 h-3.5 text-violet-400" />;
      case 'friend_request': return <Users className="w-3.5 h-3.5 text-amber-400" />;
      case 'mention': return <AtSign className="w-3.5 h-3.5 text-cyan-400" />;
      case 'message': return <MessageCircle className="w-3.5 h-3.5 text-primary" />;
      case 'challenge': return <Mountain className="w-3.5 h-3.5 text-orange-400" />;
      case 'todo': return <ListTodo className="w-3.5 h-3.5 text-emerald-400" />;
      case 'adventure': return <Mountain className="w-3.5 h-3.5 text-teal-400" />;
      default: return <Bell className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    switch (activeTab) {
      case 'friends': return n.type === 'follow' || n.type === 'friend_request';
      case 'reactions': return n.type === 'like' || n.type === 'share';
      case 'mentions': return n.type === 'comment' || n.type === 'mention';
      case 'activity': return n.type === 'system' || n.type === 'message' || n.type === 'challenge' || n.type === 'todo' || n.type === 'adventure';
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-20">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold">Notifications</h1>
            {unreadCount > 0 && <p className="text-[10px] text-primary">{unreadCount} new</p>}
          </div>
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1" onClick={markAllAsRead} disabled={unreadCount === 0}>
          <CheckCheck className="w-3 h-3" /> Read all
        </Button>
      </div>

      {/* Friend Requests Section — always visible at top when pending */}
      {friendRequests.length > 0 && (
        <div className="p-3 border-b border-border/30 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Friend Requests ({friendRequests.length})
          </h3>
          <div className="space-y-1.5">
            {friendRequests.slice(0, 3).map(req => (
              <div key={req.id} className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/10">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={(req as any).sender?.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary/20">{(req as any).sender?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{(req as any).sender?.name || 'Someone'}</p>
                  <p className="text-[10px] text-muted-foreground">wants to be friends</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" className="h-7 w-7 rounded-lg" style={{ background: 'linear-gradient(135deg, hsl(160 60% 45%), hsl(200 70% 50%))' }}
                    onClick={() => acceptFriendRequest(req.id, req.sender_id)}>
                    <UserCheck className="w-3.5 h-3.5 text-white" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => rejectFriendRequest(req.id)}>
                    <UserX className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5 h-auto p-0.5 mx-0 rounded-none bg-muted/20 border-b border-border/20">
          {TABS.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-[9px] py-1.5 rounded-none data-[state=active]:bg-background gap-0.5 flex-col">
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <ScrollArea className="flex-1 px-2">
        {loading ? (
          <div className="space-y-2 py-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <h3 className="font-semibold text-sm">No notifications</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === 'all' ? "You're all caught up!" : `No ${activeTab} notifications yet`}
            </p>
          </div>
        ) : (
          <div className="py-2 space-y-0.5">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`group flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                  notification.is_read ? 'hover:bg-muted/30' : 'bg-primary/5 hover:bg-primary/8'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notification.from_user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/15 text-xs">{notification.from_user?.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-[2px]">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{notification.from_user?.name || 'Someone'}</span>{' '}
                    <span className="text-muted-foreground">{notification.content}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!notification.is_read && <div className="w-2 h-2 bg-primary rounded-full" />}
                  <Button size="icon" variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                    onClick={e => { e.stopPropagation(); deleteNotification(notification.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
