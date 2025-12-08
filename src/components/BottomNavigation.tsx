import { Shuffle, Users, Lock, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'all', icon: Shuffle, label: 'Feed', color: 'from-primary to-secondary' },
  { id: 'friends', icon: Users, label: 'Following', color: 'from-green-500 to-emerald-500' },
  { id: 'create', icon: Plus, label: 'Create', color: 'from-pink-500 to-rose-500', isAction: true },
  { id: 'private', icon: Lock, label: 'Private', color: 'from-violet-500 to-purple-500' },
  { id: 'profile', icon: User, label: 'Profile', color: 'from-pink-500 to-rose-500' },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 safe-area-bottom">
      <div className="flex justify-around items-center h-14 sm:h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCreate = tab.isAction;
          
          if (isCreate) {
            return (
              <Link key={tab.id} to="/create" className="relative -mt-5 sm:-mt-6">
                <div className={cn(
                  "w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform hover:scale-110",
                  tab.color
                )}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 sm:px-3 rounded-lg transition-all min-w-[48px] sm:min-w-[56px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-transform", isActive && "scale-110")} />
              <span className={cn("text-[9px] sm:text-[10px] font-medium", isActive && "text-primary")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
