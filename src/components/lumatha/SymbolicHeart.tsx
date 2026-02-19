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

// Lumatha Symbolic Heart System — NO NUMBERS EVER shown to user
// 1–100 = green heart, 100–1K = red, 1K–100K = purple, 100K–1M = blue, 1M–10M = pink, 10M+ = golden
export function SymbolicHeart({ 
  likesCount, 
  isLiked, 
  onToggle, 
  className,
  size = 'md',
  showGlow = true
}: SymbolicHeartProps) {
  const getHeartStyle = (count: number, liked: boolean) => {
    if (count >= 10_000_000) {
      return { 
        color: liked ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-500/70',
        glow: liked ? 'drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : '',
        label: 'Golden'
      };
    }
    if (count >= 1_000_000) {
      return { 
        color: liked ? 'text-pink-400 fill-pink-400' : 'text-pink-500/70',
        glow: liked ? 'drop-shadow-[0_0_8px_rgba(236,72,153,0.7)]' : '',
        label: 'Iconic'
      };
    }
    if (count >= 100_000) {
      return { 
        color: liked ? 'text-blue-400 fill-blue-400' : 'text-blue-500/70',
        glow: liked ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]' : '',
        label: 'Legendary'
      };
    }
    if (count >= 1_000) {
      return { 
        color: liked ? 'text-purple-400 fill-purple-400' : 'text-purple-500/70',
        glow: liked ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]' : '',
        label: 'Beloved'
      };
    }
    if (count >= 100) {
      return { 
        color: liked ? 'text-red-500 fill-red-500' : 'text-red-400/70',
        glow: liked ? 'drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]' : '',
        label: 'Loved'
      };
    }
    // 1–100: green heart
    return { 
      color: liked ? 'text-green-400 fill-green-400' : 'text-muted-foreground',
      glow: liked ? 'drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]' : '',
      label: 'Fresh'
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
        "transition-all duration-200 active:scale-125 flex items-center",
        className
      )}
      title={isLiked ? 'Unlike' : 'Like'}
    >
      <Heart 
        className={cn(
          sizeClasses[size],
          "transition-all duration-200",
          heartStyle.color,
          showGlow && isLiked && heartStyle.glow
        )} 
      />
    </button>
  );
}

// Export utility for other components to check heart style
export function getHeartEmoji(likesCount: number): string {
  if (likesCount >= 10_000_000) return '💛';
  if (likesCount >= 1_000_000) return '🩷';
  if (likesCount >= 100_000) return '💙';
  if (likesCount >= 1_000) return '💜';
  if (likesCount >= 100) return '❤️';
  return '💚';
}
