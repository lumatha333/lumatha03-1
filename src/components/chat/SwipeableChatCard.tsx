import { useRef, useState, useCallback } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableChatCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftColor?: string;
  rightColor?: string;
}

const SWIPE_THRESHOLD = 80;

export function SwipeableChatCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = 'Archive',
  rightLabel = 'Unarchive',
  leftIcon = <Archive className="w-5 h-5" />,
  rightIcon = <ArchiveRestore className="w-5 h-5" />,
  leftColor = 'bg-orange-500',
  rightColor = 'bg-emerald-500',
}: SwipeableChatCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontal.current) return;

    // Only allow swipe in directions that have handlers
    if (dx < 0 && !onSwipeLeft) return;
    if (dx > 0 && !onSwipeRight) return;

    const clamped = Math.max(-140, Math.min(140, dx));
    setOffsetX(clamped);
  }, [swiping, onSwipeLeft, onSwipeRight]);

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (offsetX < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    } else if (offsetX > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight();
    }
    setOffsetX(0);
    isHorizontal.current = null;
  }, [offsetX, onSwipeLeft, onSwipeRight]);

  const progress = Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1);
  const isLeft = offsetX < 0;

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl">
      {/* Background action indicator */}
      {offsetX !== 0 && (
        <div className={cn(
          "absolute inset-0 flex items-center px-5 rounded-xl transition-colors",
          isLeft ? leftColor : rightColor,
          isLeft ? 'justify-end' : 'justify-start',
        )} style={{ opacity: 0.15 + progress * 0.85 }}>
          <div className={cn(
            "flex items-center gap-2 text-white font-medium text-sm",
            "transition-transform",
          )} style={{ transform: `scale(${0.7 + progress * 0.3})` }}>
            {isLeft ? leftIcon : rightIcon}
            <span>{isLeft ? leftLabel : rightLabel}</span>
          </div>
        </div>
      )}
      
      {/* Swipeable content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
