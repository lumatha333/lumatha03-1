import { useState, useEffect } from 'react';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ProfileStrip } from '@/components/ProfileStrip';
import { HomeFeed } from '@/components/HomeFeed';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [activeTab, setActiveTab] = useState('global');
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user) {
      setIsReady(true);
    }
  }, [user]);

  const getTabInfo = () => {
    switch (activeTab) {
      case 'regional': return { title: '📍 Regional Content', subtitle: 'Local posts from your area' };
      case 'global': return { title: '🌍 Global Feed', subtitle: 'Discover posts from around the world' };
      case 'friends': return { title: '👥 Friends Feed', subtitle: 'Posts from people you follow' };
      case 'videos': return { title: '🎬 Videos & Reels', subtitle: 'Watch trending videos' };
      case 'private': return { title: '🔒 Private Content', subtitle: 'Your private posts' };
      default: return { title: '🌍 Global Feed', subtitle: 'Discover posts from around the world' };
    }
  };

  const tabInfo = getTabInfo();

  if (!isReady) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-24 w-full rounded-2xl" />
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
    <div className="pb-24 space-y-4">
      {/* Profile Strip - For creating content */}
      <ProfileStrip />

      {/* Tab Header */}
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-black text-foreground">{tabInfo.title}</h2>
        <p className="text-sm text-muted-foreground">{tabInfo.subtitle}</p>
      </div>

      {/* Main Feed */}
      <HomeFeed activeTab={activeTab} />

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
