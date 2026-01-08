import { useState, useEffect } from 'react';
import { Home, Plus, Lock, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  visible?: boolean;
}

const tabs = [
  { id: 'feed', icon: Home, label: 'Feed', path: '/' },
  { id: 'create', icon: Plus, label: 'Create', path: '/create', isAction: true },
  { id: 'private', icon: Lock, label: 'Private', path: '/private' },
  { id: 'notifications', icon: Bell, label: 'Alerts', path: '/notifications' },
  { id: 'profile', icon: User, label: 'Profile', path: null },
];

export function BottomNavigation({ activeTab, onTabChange, visible = true }: BottomNavigationProps) {
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
      .channel('notifications-count')
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
    } else {
      onTabChange(tab.id);
    }
  };

  const isActive = (tab: typeof tabs[0]) => {
    if (tab.path) return location.pathname === tab.path;
    if (tab.id === 'profile') return location.pathname.startsWith('/profile');
    return activeTab === tab.id;
  };

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 safe-area-bottom transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      <div className="flex justify-around items-center h-14 sm:h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);
          const isCreate = tab.isAction;
          const showBadge = tab.id === 'notifications' && unreadCount > 0;
          
          if (isCreate) {
            return (
              <Link key={tab.id} to="/create" className="relative -mt-5 sm:-mt-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 ring-4 ring-background">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 sm:px-4 rounded-lg transition-all min-w-[52px] sm:min-w-[60px] relative",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6 transition-transform", active && "scale-110")} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[9px] sm:text-[10px] font-medium", active && "text-primary")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}