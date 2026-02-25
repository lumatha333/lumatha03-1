import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SwipeableTabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode[];
  className?: string;
}

export function SwipeableTabs({ tabs, activeTab, onTabChange, children, className }: SwipeableTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = 0;
    isDragging.current = true;
    isHorizontal.current = null;
    setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Lock direction after 10px movement
    if (isHorizontal.current === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }

    if (isHorizontal.current === false) return;
    if (isHorizontal.current === true) {
      // Prevent vertical scroll while swiping horizontally
      e.preventDefault();
    }

    currentX.current = dx;
    const containerW = containerRef.current?.offsetWidth || 400;
    const pct = (dx / containerW) * 100;
    // Add resistance at edges
    if ((activeIndex === 0 && dx > 0) || (activeIndex === tabs.length - 1 && dx < 0)) {
      setDragOffset(pct * 0.25);
    } else {
      setDragOffset(pct);
    }
  }, [activeIndex, tabs.length]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    isHorizontal.current = null;
    const threshold = 50;
    if (currentX.current < -threshold && activeIndex < tabs.length - 1) {
      onTabChange(tabs[activeIndex + 1].id);
    } else if (currentX.current > threshold && activeIndex > 0) {
      onTabChange(tabs[activeIndex - 1].id);
    }
    currentX.current = 0;
    setDragOffset(0);
  }, [activeIndex, tabs, onTabChange]);

  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {/* Tab bar */}
      <div className="flex items-center gap-0 p-1 rounded-2xl glass-card overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { onTabChange(tab.id); window.scrollTo({ top: 0 }); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 whitespace-nowrap flex-1 justify-center text-xs font-medium",
              activeTab === tab.id
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div
        ref={containerRef}
        className="relative overflow-hidden flex-1 mt-3 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex will-change-transform"
          style={{
            transform: `translateX(calc(${-activeIndex * 100}% + ${dragOffset}%))`,
            transition: dragOffset !== 0 ? 'none' : 'transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            width: `${tabs.length * 100}%`,
          }}
        >
          {children.map((child, i) => (
            <div key={tabs[i]?.id || i} className="flex-shrink-0" style={{ width: `${100 / tabs.length}%` }}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
