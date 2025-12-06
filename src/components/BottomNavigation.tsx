import { Home, Crown, Users, MapPin, Lock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', icon: Crown, label: 'Home', emoji: '👑', color: 'from-primary to-secondary' },
  { id: 'global', icon: Home, label: 'Feed', emoji: '🌍', color: 'from-blue-500 to-cyan-500' },
  { id: 'create', icon: Plus, label: 'Create', emoji: '✨', color: 'from-pink-500 to-rose-500', isAction: true },
  { id: 'friends', icon: Users, label: 'Friends', emoji: '👥', color: 'from-green-500 to-emerald-500' },
  { id: 'private', icon: Lock, label: 'Private', emoji: '🔒', color: 'from-violet-500 to-purple-500' },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCreate = tab.isAction;
          
          if (isCreate) {
            return (
              <Link
                key={tab.id}
                to="/create"
                className="relative -mt-6"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform hover:scale-110",
                  tab.color
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-300 min-w-[56px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <span className={cn(
                "text-lg transition-transform duration-300",
                isActive && "scale-110"
              )}>
                {tab.emoji}
              </span>
              <span className={cn(
                "text-[10px] font-medium tracking-tight",
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
