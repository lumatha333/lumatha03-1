import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlayCircle, Search, Lock, Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FeedFilterTabsProps {
  contentFilter: string;
  onContentFilterChange: (filter: string) => void;
  subFilter?: string;
  onSubFilterChange?: (filter: string) => void;
}

const desktopTabs = [
  { id: 'feed', label: 'Feed', path: '/', icon: Home },
  { id: 'videos', label: 'Videos', path: '/?filter=videos', icon: PlayCircle },
  { id: 'search', label: 'Search', path: '/search', icon: Search },
  { id: 'private', label: 'Private', path: '/private', icon: Lock },
  { id: 'notifications', label: 'Notify', path: '/notifications', icon: Bell },
  { id: 'profile', label: 'Profile', path: null, icon: User },
];

export function FeedFilterTabs({
  contentFilter,
  onContentFilterChange,
}: FeedFilterTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleTabClick = (tab: any) => {
    if (tab.id === 'videos') {
      localStorage.setItem('lumatha_feed_filter', 'videos');
      onContentFilterChange('videos');
      navigate('/');
    } else if (tab.id === 'feed') {
      localStorage.setItem('lumatha_feed_filter', 'all');
      onContentFilterChange('all');
      navigate('/');
    } else if (tab.id === 'profile' && user) {
      navigate(`/profile/${user.id}`);
    } else if (tab.path) {
      navigate(tab.path);
    }
  };

  const isTabActive = (tab: any) => {
    if (tab.id === 'videos') return location.pathname === '/' && contentFilter === 'videos';
    if (tab.id === 'feed') return location.pathname === '/' && contentFilter !== 'videos';
    if (tab.id === 'search') return location.pathname === '/search';
    if (tab.id === 'profile') return location.pathname.startsWith('/profile');
    if (tab.path) return location.pathname === tab.path;
    return false;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop-only filters and navigation tabs */}
      <div 
        className="hidden md:flex items-center gap-[4px] w-full"
      >
        <div className="flex items-center gap-[4px] w-full flex-nowrap overflow-hidden">
          {desktopTabs.map((tab) => {
            const isActive = isTabActive(tab);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 px-0.5 py-1.5 rounded-2xl transition-all duration-300 min-w-0",
                  isActive 
                    ? "bg-[#7C3AED] text-white shadow-lg shadow-primary/20" 
                    : "bg-transparent border border-[#1f2937] text-[#94A3B8] hover:bg-[#111827] hover:text-white"
                )}
                style={{ 
                  fontSize: '9.5px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  borderRadius: '16px',
                }}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-muted-foreground")} />
                <span className="truncate w-full px-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
