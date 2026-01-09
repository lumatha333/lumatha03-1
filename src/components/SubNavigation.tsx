import { useState, useEffect } from 'react';
import { Home, Plus, Lock, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubNavigationProps {
  visible?: boolean;
}

const tabs = [
  { id: 'feed', icon: Home, label: 'Feed', path: '/' },
  { id: 'create', icon: Plus, label: 'Create', path: '/create' },
  { id: 'private', icon: Lock, label: 'Private', path: '/private' },
  { id: 'notifications', icon: Bell, label: 'Alerts', path: '/notifications' },
  { id: 'profile', icon: User, label: 'Profile', path: null },
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
    if (tab.path) {
      navigate(tab.path);
    } else if (tab.id === 'profile' && user) {
      navigate(`/profile/${user.id}`);
    }
  };

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.path) return location.pathname === tab.path;
    if (tab.id === 'profile') return location.pathname.startsWith('/profile');
    return false;
  };

  return (
    <nav 
      className={cn(
        "w-full glass-card border-b border-border/50 transition-all duration-300",
        visible ? "opacity-100 max-h-16" : "opacity-0 max-h-0 overflow-hidden"
      )}
    >
      <div className="flex justify-around items-center h-12 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);
          const isCreate = tab.id === 'create';
          const showBadge = tab.id === 'notifications' && unreadCount > 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 sm:px-3 rounded-lg transition-all min-w-[48px] relative",
                isCreate && "bg-gradient-to-br from-primary/20 to-primary/10",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-5 h-5 transition-all",
                  active && "scale-110 text-primary",
                  isCreate && "text-primary"
                )} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 bg-destructive text-destructive-foreground text-[7px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-medium",
                active && "text-primary",
                isCreate && "text-primary"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
