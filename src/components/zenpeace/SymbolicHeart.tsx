import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

interface SymbolicHeartProps {
  likesCount: number;
  isLiked: boolean;
  onToggle?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showGlow?: boolean;
}

// Zenpeace Symbolic Heart System
// Feeling over counting - users never see numbers
// Only different heart styles based on engagement level
export function SymbolicHeart({ 
  likesCount, 
  isLiked, 
  onToggle, 
  className,
  size = 'md',
  showGlow = true
}: SymbolicHeartProps) {
  // Internal logic for heart stages (user never sees numbers)
  const getHeartStyle = (count: number, liked: boolean) => {
    if (count >= 100000) {
      return { 
        color: liked ? 'text-blue-500 fill-blue-500' : 'text-blue-400',
        glow: 'shadow-blue-500/50',
        label: 'Special'
      };
    }
    if (count >= 1000) {
      return { 
        color: liked ? 'text-white fill-white' : 'text-gray-300',
        glow: 'shadow-white/30',
        label: 'Beloved'
      };
    }
    if (count >= 100) {
      return { 
        color: liked ? 'text-gray-800 fill-gray-800 dark:text-gray-200 dark:fill-gray-200' : 'text-gray-600 dark:text-gray-400',
        glow: 'shadow-gray-500/30',
        label: 'Appreciated'
      };
    }
    // Default red heart (1-100)
    return { 
      color: liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground',
      glow: 'shadow-red-500/40',
      label: 'Loved'
    };
  };

  const heartStyle = getHeartStyle(likesCount, isLiked);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        "transition-all duration-300 active:scale-125",
        isLiked && showGlow && `drop-shadow-lg ${heartStyle.glow}`,
        className
      )}
      title={isLiked ? 'Unlike' : 'Like'}
    >
      <Heart 
        className={cn(
          sizeClasses[size],
          "transition-all duration-200",
          heartStyle.color,
          isLiked && "animate-pulse"
        )} 
      />
    </button>
  );
}

// Export utility for other components to check heart style
export function getHeartEmoji(likesCount: number): string {
  if (likesCount >= 100000) return '💙';
  if (likesCount >= 1000) return '🤍';
  if (likesCount >= 100) return '🖤';
  return '❤️';
}
