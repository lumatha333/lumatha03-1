import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationsPanelSkeleton } from '@/components/ui/skeleton-loaders';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  Bell, Heart, MessageCircle, UserPlus, Share2, CheckCheck,
  Trash2, Users, AtSign, Mountain, UserCheck, UserX, Zap,
  Shield, Target, Loader2, Gamepad2, Compass, BookOpen, 
  ShoppingCart, Music, PlayCircle, Star, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { beginPerfTrace, endPerfTrace } from '@/lib/perfMarkers';

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
  { id: 'all', label: 'All', icon: '🔔' },
  { id: 'friends', label: 'Friends', icon: '👥' },
  { id: 'reactions', label: 'Reactions', icon: '❤️' },
  { id: 'mentions', label: 'Mentions', icon: '@' },
  { id: 'activity', label: 'Activity', icon: '⚡' },
] as const;

function NotificationIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ReactNode; bg: string }> = {
    like: { icon: <Heart className="w-3.5 h-3.5 text-white" />, bg: '#ef4444' },
    comment: { icon: <MessageCircle className="w-3.5 h-3.5 text-white" />, bg: '#3B82F6' },
    follow: { icon: <UserPlus className="w-3.5 h-3.5 text-white" />, bg: '#7C3AED' },
    friend_request: { icon: <Users className="w-3.5 h-3.5 text-white" />, bg: '#7C3AED' },
    mention: { icon: <AtSign className="w-3.5 h-3.5 text-white" />, bg: '#f97316' },
    share: { icon: <Share2 className="w-3.5 h-3.5 text-white" />, bg: '#8b5cf6' },
    challenge: { icon: <Target className="w-3.5 h-3.5 text-white" />, bg: '#22c55e' },
    system: { icon: <Zap className="w-3.5 h-3.5 text-white" />, bg: '#eab308' },
    message: { icon: <MessageCircle className="w-3.5 h-3.5 text-white" />, bg: '#06b6d4' },
    todo: { icon: <Bell className="w-3.5 h-3.5 text-white" />, bg: '#f59e0b' },
    adventure: { icon: <Mountain className="w-3.5 h-3.5 text-white" />, bg: '#14b8a6' },
    warning: { icon: <Shield className="w-3.5 h-3.5 text-white" />, bg: '#ef4444' },
  };
  const entry = map[type] || { icon: <Bell className="w-3.5 h-3.5 text-white" />, bg: '#6b7280' };
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: entry.bg }}>
      {entry.icon}
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friendRequests, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const VIRTUAL_ROW_HEIGHT = 92;
  const VIRTUAL_OVERSCAN = 10;

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Auto-mark all notifications as read when page opens
      supabase.from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(() => {});
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const trace = beginPerfTrace('notifications.fetch', { userId: user.id });
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
      endPerfTrace(trace, { slowMs: 220 });
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 80 && !refreshing) handleRefresh();
  };

  const markAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
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

  const filteredNotifications = notifications.filter(n => {
    switch (activeTab) {
      case 'friends': return n.type === 'follow' || n.type === 'friend_request';
      case 'reactions': return n.type === 'like' || n.type === 'share';
      case 'mentions': return n.type === 'comment' || n.type === 'mention';
      case 'activity': return n.type === 'system' || n.type === 'message' || n.type === 'challenge' || n.type === 'todo' || n.type === 'adventure';
      default: return true;
    }
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const updateViewport = () => setViewportHeight(container.clientHeight || 0);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    setScrollTop(0);
    const container = scrollRef.current;
    if (container) container.scrollTop = 0;
  }, [activeTab]);

  const virtualized = useMemo(() => {
    const total = filteredNotifications.length;
    const enabled = total > 80;
    if (!enabled) {
      return {
        enabled,
        startIndex: 0,
        endIndex: total,
        topSpacer: 0,
        bottomSpacer: 0,
        items: filteredNotifications,
      };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
    const visibleCount = Math.ceil((viewportHeight || 600) / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
    const endIndex = Math.min(total, startIndex + visibleCount);
    return {
      enabled,
      startIndex,
      endIndex,
      topSpacer: startIndex * VIRTUAL_ROW_HEIGHT,
      bottomSpacer: Math.max(0, (total - endIndex) * VIRTUAL_ROW_HEIGHT),
      items: filteredNotifications.slice(startIndex, endIndex),
    };
  }, [filteredNotifications, scrollTop, viewportHeight]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-20" style={{ background: '#0a0f1e' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 }}>
              Notify
            </h1>
            <p className="text-xs text-slate-400">{unreadCount > 0 ? `${unreadCount} new messages` : 'No new messages'}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-sm font-medium px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors">
            Mark read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="px-4 flex gap-1 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? '#7C3AED' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#94A3B8',
              border: activeTab === tab.id ? 'none' : '1px solid #1f2937',
              fontFamily: "'Inter'",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Pull to refresh indicator */}
      {refreshing && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#7C3AED' }} />
        </div>
      )}

      {/* Friend Requests */}
      {friendRequests.length > 0 && (activeTab === 'all' || activeTab === 'friends') && (
        <div className="px-4 pb-3 space-y-2">
          <h3 className="text-xs font-semibold flex items-center gap-1.5 px-1" style={{ color: '#94A3B8' }}>
            <Users className="w-3 h-3" /> Friend Requests ({friendRequests.length})
          </h3>
          {friendRequests.slice(0, 3).map(req => (
            <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#111827', border: '1px solid #1f2937' }}>
              <Avatar className="w-10 h-10">
                <AvatarImage src={(req as any).sender?.avatar_url} />
                <AvatarFallback style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', color: 'white', fontSize: 13 }}>
                  {(req as any).sender?.name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{(req as any).sender?.name || 'Someone'}</p>
                <p className="text-xs" style={{ color: '#94A3B8' }}>wants to be friends</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #059669)' }}
                  onClick={() => acceptFriendRequest(req.id, req.sender_id)}
                >
                  <UserCheck className="w-4 h-4 text-white" />
                </button>
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: '#1f2937' }}
                  onClick={() => rejectFriendRequest(req.id)}
                >
                  <UserX className="w-4 h-4" style={{ color: '#94A3B8' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications List */}
      <div
        className="flex-1 overflow-y-auto"
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onScroll={(e) => setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)}
      >
        {loading ? (
          <div className="px-4">
            <NotificationsPanelSkeleton count={5} />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔔</span>
            <h3 className="text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 20 }}>
              All caught up!
            </h3>
            <p className="text-sm" style={{ color: '#94A3B8', fontFamily: "'Inter'" }}>
              {activeTab === 'all' ? 'No new updates' : `No ${activeTab} updates yet`}
            </p>
          </div>
        ) : (
          <div>
            {virtualized.enabled && virtualized.topSpacer > 0 && (
              <div style={{ height: virtualized.topSpacer }} />
            )}
            {virtualized.items.map(notification => (
              <div
                key={notification.id}
                className="group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors relative"
                style={{ borderBottom: '1px solid #1f2937', background: notification.is_read ? 'transparent' : 'rgba(124,58,237,0.05)' }}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Unread bar */}
                {!notification.is_read && (
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: '#7C3AED' }} />
                )}

                {/* Avatar or system icon */}
                <div className="relative shrink-0 mt-0.5">
                  {notification.type === 'system' || notification.type === 'warning' ? (
                    <NotificationIcon type={notification.type} />
                  ) : (
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={notification.from_user?.avatar_url || undefined} />
                      <AvatarFallback style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', color: 'white', fontSize: 13 }}>
                        {notification.from_user?.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {notification.type !== 'system' && notification.type !== 'warning' && (
                    <div className="absolute -bottom-1 -right-1">
                      <NotificationIcon type={notification.type} />
                    </div>
                  )}
                </div>

                {/* Content - Horizontal Layout */}
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    {(() => {
                      const actorName = (notification.type === 'todo' || notification.type === 'system' || notification.type === 'warning')
                        ? 'Lumatha'
                        : (notification.from_user?.name || 'Someone');
                      return (
                        <p className="text-sm leading-snug" style={{ fontFamily: "'Inter'" }}>
                          <span className="font-semibold text-white">{actorName}</span>{' '}
                          <span style={{ color: '#d1d5db' }}>{notification.content}</span>
                        </p>
                      );
                    })()}
                  </div>
                  <p className="text-xs whitespace-nowrap" style={{ color: '#6B7280', fontFamily: "'Inter'" }}>
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-1.5 shrink-0 mt-1">
                  {notification.type === 'follow' && (
                    <button
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white active:scale-95 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}
                      onClick={e => { e.stopPropagation(); }}
                    >
                      Follow back
                    </button>
                  )}
                  <button
                    className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: '#1f2937' }}
                    onClick={e => { e.stopPropagation(); deleteNotification(notification.id); }}
                  >
                    <Trash2 className="w-3 h-3" style={{ color: '#94A3B8' }} />
                  </button>
                </div>
              </div>
            ))}
            {virtualized.enabled && virtualized.bottomSpacer > 0 && (
              <div style={{ height: virtualized.bottomSpacer }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
