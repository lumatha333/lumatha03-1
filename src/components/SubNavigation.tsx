import { useState, useEffect } from 'react';
import { Home, Lock, Bell, User, Video, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubNavigationProps {
  visible?: boolean;
}

const tabs = [
  { id: 'feed', icon: Home, path: '/', label: 'Feed', color: 'text-blue-500' },
  { id: 'videos', icon: Video, path: '/?filter=videos', label: 'VDOs', color: 'text-red-500' },
  { id: 'search', icon: Search, path: '/search', label: 'Search', color: 'text-cyan-500' },
  { id: 'private', icon: Lock, path: '/private', label: 'Private', color: 'text-green-500' },
  { id: 'notifications', icon: Bell, path: '/notifications', label: 'Alerts', color: 'text-orange-500' },
  { id: 'profile', icon: User, path: null, label: 'Profile', color: 'text-teal-500' },
];

export function SubNavigation({ visible = true }: SubNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnreadCount();
    const channel = supabase
      .channel('sub-nav-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchUnreadCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.id === 'videos') {
      localStorage.setItem('lumatha_feed_filter', 'videos');
      navigate('/');
      window.dispatchEvent(new CustomEvent('feedFilterChange', { detail: 'videos' }));
    } else if (tab.id === 'search') {
      navigate('/search');
    } else if (tab.path) {
      if (tab.id === 'feed') {
        localStorage.setItem('lumatha_feed_filter', 'all');
        window.dispatchEvent(new CustomEvent('feedFilterChange', { detail: 'all' }));
      }
      navigate(tab.path);
    } else if (tab.id === 'profile' && user) {
      navigate(`/profile/${user.id}`);
    }
  };

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.id === 'videos') {
      return location.pathname === '/' && localStorage.getItem('lumatha_feed_filter') === 'videos';
    }
    if (tab.id === 'feed') {
      return location.pathname === '/' && localStorage.getItem('lumatha_feed_filter') !== 'videos';
    }
    if (tab.id === 'search') return location.pathname === '/search';
    if (tab.path) return location.pathname === tab.path;
    if (tab.id === 'profile') return location.pathname.startsWith('/profile');
    return false;
  };

  if (!visible) return null;

  return (
    <div className="flex items-center justify-end gap-4">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab);
        const showBadge = tab.id === 'notifications' && unreadCount > 0;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all relative",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={tab.label}
          >
            <div className="relative">
              <Icon className={cn("w-[18px] h-[18px]", active ? "text-primary" : "")} />
              {showBadge && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[7px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className={cn("text-[10px] font-medium hidden sm:inline", active ? "text-primary" : "text-muted-foreground")}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
