import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';
import { useMemo } from 'react';

interface SymbolicHeartProps {
  likesCount: number;
  isLiked: boolean;
  onToggle?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  postId?: string;
}

// Lumatha Random Heart — every post gets a unique random color, NO number tiers
const heartPalette = [
  { color: 'text-green-400 fill-green-400', unlit: 'text-green-500/50' },
  { color: 'text-red-500 fill-red-500', unlit: 'text-red-400/50' },
  { color: 'text-purple-400 fill-purple-400', unlit: 'text-purple-500/50' },
  { color: 'text-blue-400 fill-blue-400', unlit: 'text-blue-500/50' },
  { color: 'text-pink-400 fill-pink-400', unlit: 'text-pink-500/50' },
  { color: 'text-yellow-400 fill-yellow-400', unlit: 'text-yellow-500/50' },
  { color: 'text-orange-400 fill-orange-400', unlit: 'text-orange-500/50' },
  { color: 'text-cyan-400 fill-cyan-400', unlit: 'text-cyan-500/50' },
  { color: 'text-rose-400 fill-rose-400', unlit: 'text-rose-500/50' },
  { color: 'text-emerald-400 fill-emerald-400', unlit: 'text-emerald-500/50' },
  { color: 'text-violet-400 fill-violet-400', unlit: 'text-violet-500/50' },
  { color: 'text-amber-400 fill-amber-400', unlit: 'text-amber-500/50' },
  { color: 'text-teal-400 fill-teal-400', unlit: 'text-teal-500/50' },
  { color: 'text-fuchsia-400 fill-fuchsia-400', unlit: 'text-fuchsia-500/50' },
  { color: 'text-lime-400 fill-lime-400', unlit: 'text-lime-500/50' },
  { color: 'text-indigo-400 fill-indigo-400', unlit: 'text-indigo-500/50' },
];

// Deterministic hash from postId so same post always gets same color
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function SymbolicHeart({ 
  likesCount, 
  isLiked, 
  onToggle, 
  className,
  size = 'md',
  postId = '',
}: SymbolicHeartProps) {
  // Each post gets a stable random color from the palette
  const palette = useMemo(() => {
    const idx = hashStr(postId || String(likesCount)) % heartPalette.length;
    return heartPalette[idx];
  }, [postId, likesCount]);

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
          isLiked ? palette.color : palette.unlit
        )} 
      />
    </button>
  );
}

// Export utility for other components
export function getHeartEmoji(likesCount: number): string {
  const emojis = ['💚', '❤️', '💜', '💙', '🩷', '💛', '🧡', '🩵', '🩶', '💗'];
  return emojis[Math.abs(likesCount) % emojis.length];
}
