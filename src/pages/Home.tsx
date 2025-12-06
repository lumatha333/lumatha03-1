import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, Users, Video, Lock, MapPin, 
  Sparkles, TrendingUp, ChevronRight, Crown
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const feedTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Crown, color: 'from-primary to-secondary' },
  { id: 'global', label: 'Global', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'friends', label: 'Friends', icon: Users, color: 'from-green-500 to-emerald-500' },
  { id: 'regional', label: 'Local', icon: MapPin, color: 'from-amber-500 to-orange-500' },
  { id: 'videos', label: 'Videos', icon: Video, color: 'from-pink-500 to-rose-500' },
  { id: 'private', label: 'Private', icon: Lock, color: 'from-violet-500 to-purple-500' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user) {
      setIsReady(true);
    }
  }, [user]);

  if (!isReady) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-5">
      {/* Header with Crown Logo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
            <Crown className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Crown of Creation</h1>
            <p className="text-xs text-muted-foreground">Your Universal Dashboard</p>
          </div>
        </div>
      </div>

      {/* Feed Tabs - Scrollable */}
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-2 min-w-max pb-1">
          {feedTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive 
                    ? "bg-gradient-to-r text-white shadow-lg" 
                    : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground",
                  isActive && tab.color
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'dashboard' ? (
        <div className="space-y-5 animate-fade-in">
          {/* Profile Stats */}
          <ProfileStatsWidget />

          {/* Quick Create */}
          <QuickCreateWidget />

          {/* Widget Grid */}
          <div className="grid grid-cols-2 gap-3">
            <FeedPreviewWidget />
            <ChatPreviewWidget />
            <NotesPreviewWidget />
            <TasksPreviewWidget />
            <SavedItemsWidget />
            <TrendsWidget />
          </div>

          {/* Recent Activity Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Recent Posts
              </h2>
              <Link 
                to="/public" 
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <HomeFeed activeTab="global" />
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Profile Strip - For creating content */}
          <ProfileStrip />

          {/* Tab Header */}
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-2">
              {feedTabs.find(t => t.id === activeTab)?.icon && (
                <span className={cn(
                  "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                  feedTabs.find(t => t.id === activeTab)?.color
                )}>
                  {(() => {
                    const TabIcon = feedTabs.find(t => t.id === activeTab)?.icon;
                    return TabIcon ? <TabIcon className="w-4 h-4 text-white" /> : null;
                  })()}
                </span>
              )}
              {feedTabs.find(t => t.id === activeTab)?.label} Feed
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'global' && 'Discover posts from around the world'}
              {activeTab === 'friends' && 'Posts from people you follow'}
              {activeTab === 'regional' && 'Local posts from your area'}
              {activeTab === 'videos' && 'Watch trending videos'}
              {activeTab === 'private' && 'Your private posts'}
            </p>
          </div>

          {/* Main Feed */}
          <HomeFeed activeTab={activeTab} />
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
