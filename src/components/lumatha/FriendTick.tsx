import { cn } from '@/lib/utils';

interface FriendTickProps {
  friendsCount: number;
  className?: string;
  showLabel?: boolean;
}

// Lumatha Friend-Based Tick System
// Trust through genuine connections, not follower counts
export function FriendTick({ friendsCount, className, showLabel = false }: FriendTickProps) {
  const getTickInfo = (count: number) => {
    if (count >= 1000000) {
      return { 
        tick: '🔴', 
        color: 'text-red-500', 
        bgColor: 'bg-red-500/20',
        label: 'Massive Reach',
        level: 5
      };
    }
    if (count >= 100000) {
      return { 
        tick: '🟢', 
        color: 'text-green-500', 
        bgColor: 'bg-green-500/20',
        label: 'Wide Influence',
        level: 4
      };
    }
    if (count >= 10000) {
      return { 
        tick: '🔵', 
        color: 'text-blue-500', 
        bgColor: 'bg-blue-500/20',
        label: 'Community Presence',
        level: 3
      };
    }
    if (count >= 1000) {
      return { 
        tick: '⚪', 
        color: 'text-white', 
        bgColor: 'bg-white/20',
        label: 'Trusted Circle',
        level: 2
      };
    }
    if (count >= 1) {
      return { 
        tick: '⚫', 
        color: 'text-gray-800 dark:text-gray-300', 
        bgColor: 'bg-gray-500/20',
        label: 'First Connection',
        level: 1
      };
    }
    return null;
  };

  const tickInfo = getTickInfo(friendsCount);

  if (!tickInfo) return null;

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-0.5",
        className
      )}
      title={`${tickInfo.label} (${friendsCount.toLocaleString()} friends)`}
    >
      <span className="text-xs">{tickInfo.tick}</span>
      {showLabel && (
        <span className={cn("text-[9px]", tickInfo.color)}>
          {tickInfo.label}
        </span>
      )}
    </span>
  );
}
