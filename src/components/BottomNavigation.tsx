import { MapPin, Globe, Users, Video, Lock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'regional', icon: MapPin, label: 'Regional', emoji: '📍' },
  { id: 'global', icon: Globe, label: 'Global', emoji: '🌍' },
  { id: 'friends', icon: Users, label: 'Friends', emoji: '👥' },
  { id: 'videos', icon: Video, label: 'Videos', emoji: '🎬' },
  { id: 'private', icon: Lock, label: 'Private', emoji: '🔒' },
  { id: 'profile', icon: User, label: 'Profile', emoji: '👤' },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-xl transition-all duration-300 min-w-[48px]",
                isActive 
                  ? "text-primary bg-primary/15 scale-105 shadow-lg" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <span className={cn(
                "text-lg transition-transform duration-300",
                isActive && "animate-bounce"
              )}>
                {tab.emoji}
              </span>
              <span className={cn(
                "text-[9px] font-semibold tracking-tight",
                isActive && "text-primary"
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
