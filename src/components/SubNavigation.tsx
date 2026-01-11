import { useState, useEffect } from 'react';
import { Home, Lock, Bell, User, Video, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubNavigationProps {
  visible?: boolean;
}

// 6 icons: Home, VDOs, Search, Private, Notifications, Profile
const tabs = [
  { id: 'feed', icon: Home, path: '/', label: 'Home' },
  { id: 'videos', icon: Video, path: '/?filter=videos', label: 'VDOs' },
  { id: 'search', icon: Search, path: '/search', label: 'Search' },
  { id: 'private', icon: Lock, path: '/private', label: 'Private' },
  { id: 'notifications', icon: Bell, path: '/notifications', label: 'Alerts' },
  { id: 'profile', icon: User, path: null, label: 'Profile' },
];

export function SubNavigation({ visible = true }: SubNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
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

    // Subscribe to new notifications
    const channel = supabase
      .channel('sub-nav-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.id === 'videos') {
      localStorage.setItem('zenpeace_feed_filter', 'videos');
      navigate('/');
      window.dispatchEvent(new CustomEvent('feedFilterChange', { detail: 'videos' }));
    } else if (tab.path) {
      if (tab.id === 'feed') {
        localStorage.setItem('zenpeace_feed_filter', 'all');
        window.dispatchEvent(new CustomEvent('feedFilterChange', { detail: 'all' }));
      }
      navigate(tab.path);
    } else if (tab.id === 'profile' && user) {
      navigate(`/profile/${user.id}`);
    }
  };

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.id === 'videos') {
      const filter = localStorage.getItem('zenpeace_feed_filter');
      return location.pathname === '/' && filter === 'videos';
    }
    if (tab.id === 'feed') {
      const filter = localStorage.getItem('zenpeace_feed_filter');
      return location.pathname === '/' && filter !== 'videos';
    }
    if (tab.id === 'search') return location.pathname === '/search';
    if (tab.path) return location.pathname === tab.path;
    if (tab.id === 'profile') return location.pathname.startsWith('/profile');
    return false;
  };

  return (
    <nav 
      className={cn(
        "w-full glass-card border-b border-border/50 transition-all duration-300",
        visible ? "opacity-100 max-h-14" : "opacity-0 max-h-0 overflow-hidden"
      )}
    >
      <div className="flex justify-around items-center h-11 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);
          const showBadge = tab.id === 'notifications' && unreadCount > 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex items-center justify-center p-2 rounded-full transition-all relative",
                active 
                  ? "text-primary bg-primary/15" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
              title={tab.label}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 transition-all",
                  active && "scale-110 text-primary"
                )} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
