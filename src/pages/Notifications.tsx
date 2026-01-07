import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { 
  Bell, Heart, MessageCircle, UserPlus, Share2, Check, CheckCheck, 
  Trash2, Users, Image as ImageIcon, AtSign
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  content: string;
  from_user_id: string;
  is_read: boolean;
  created_at: string;
  link?: string;
  from_user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

      // Fetch user profiles for notifications
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(n => n.from_user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);
        
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const enrichedNotifications = data.map(n => ({
          ...n,
          from_user: profilesMap.get(n.from_user_id)
        }));
        setNotifications(enrichedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
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
    toast.success('All notifications marked as read');
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase.from('notifications').delete().eq('id', notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.success('Notification deleted');
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.from_user_id) {
      navigate(`/profile/${notification.from_user_id}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'share': return <Share2 className="w-4 h-4 text-purple-500" />;
      case 'friend_request': return <Users className="w-4 h-4 text-orange-500" />;
      case 'mention': return <AtSign className="w-4 h-4 text-cyan-500" />;
      case 'message': return <MessageCircle className="w-4 h-4 text-primary" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'follows') return n.type === 'follow' || n.type === 'friend_request';
    if (activeTab === 'reactions') return n.type === 'like';
    if (activeTab === 'comments') return n.type === 'comment';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-20">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 text-xs gap-1"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all read
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-0.5 mx-0 rounded-none bg-muted/30 border-b border-border/30">
          <TabsTrigger value="all" className="text-[10px] py-1.5 rounded-none data-[state=active]:bg-background">All</TabsTrigger>
          <TabsTrigger value="follows" className="text-[10px] py-1.5 rounded-none data-[state=active]:bg-background">
            <UserPlus className="w-3 h-3 mr-0.5" /> Follows
          </TabsTrigger>
          <TabsTrigger value="reactions" className="text-[10px] py-1.5 rounded-none data-[state=active]:bg-background">
            <Heart className="w-3 h-3 mr-0.5" /> Reactions
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-[10px] py-1.5 rounded-none data-[state=active]:bg-background">
            <MessageCircle className="w-3 h-3 mr-0.5" /> Comments
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <ScrollArea className="flex-1 px-2">
        {loading ? (
          <div className="space-y-2 py-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
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
            <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-sm">No notifications</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === 'all' ? "You're all caught up!" : `No ${activeTab} notifications yet`}
            </p>
          </div>
        ) : (
          <div className="py-2 space-y-1">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  notification.is_read ? 'bg-transparent hover:bg-muted/30' : 'bg-primary/5 hover:bg-primary/10'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* User Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notification.from_user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-sm">
                      {notification.from_user?.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  {/* Notification type icon */}
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{notification.from_user?.name || 'Someone'}</span>
                    {' '}
                    <span className="text-muted-foreground">{notification.content}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                )}

                {/* Delete button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
