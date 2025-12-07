import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Users, Lock, Crown, Sparkles, ChevronRight } from 'lucide-react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ProfileStrip } from '@/components/ProfileStrip';
import { HomeFeed } from '@/components/HomeFeed';
import { 
  FeedPreviewWidget, 
  ChatPreviewWidget, 
  NotesPreviewWidget, 
  TasksPreviewWidget, 
  SavedItemsWidget, 
  TrendsWidget, 
  QuickCreateWidget,
  ProfileStatsWidget
} from '@/components/DashboardWidgets';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const feedTabs = [
  { id: 'dashboard', label: 'Home', icon: Crown, color: 'from-primary to-secondary' },
  { id: 'global', label: 'Global', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'friends', label: 'Friends', icon: Users, color: 'from-green-500 to-emerald-500' },
  { id: 'private', label: 'Private', icon: Lock, color: 'from-violet-500 to-purple-500' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user) setIsReady(true);
  }, [user]);

  if (!isReady) {
    return (
      <div className="space-y-4 pb-20 px-1">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
          <Crown className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold gradient-text truncate">Crown of Creation</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Your Universal Dashboard</p>
        </div>
      </div>

      {/* Feed Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {feedTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0",
                isActive 
                  ? "bg-gradient-to-r text-white shadow-md" 
                  : "bg-card/50 text-muted-foreground hover:bg-card",
                isActive && tab.color
              )}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' ? (
        <div className="space-y-4 animate-fade-in">
          <ProfileStatsWidget />
          <QuickCreateWidget />
          
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <FeedPreviewWidget />
            <ChatPreviewWidget />
            <NotesPreviewWidget />
            <TasksPreviewWidget />
            <SavedItemsWidget />
            <TrendsWidget />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Recent Posts
              </h2>
              <Link to="/public" className="text-xs sm:text-sm text-primary flex items-center gap-1 hover:underline">
                View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
            <HomeFeed activeTab="global" />
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <ProfileStrip />
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              {(() => {
                const TabIcon = feedTabs.find(t => t.id === activeTab)?.icon;
                const color = feedTabs.find(t => t.id === activeTab)?.color;
                return TabIcon ? (
                  <span className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0", color)}>
                    <TabIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </span>
                ) : null;
              })()}
              {feedTabs.find(t => t.id === activeTab)?.label} Feed
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {activeTab === 'global' && 'Discover posts from around the world'}
              {activeTab === 'friends' && 'Posts from people you follow'}
              {activeTab === 'private' && 'Your private posts'}
            </p>
          </div>
          <HomeFeed activeTab={activeTab} />
        </div>
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
