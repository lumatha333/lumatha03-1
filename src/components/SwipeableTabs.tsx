import { useState, useRef, useCallback, ReactNode, memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipeableTabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode[];
  className?: string;
}

export const SwipeableTabs = memo(function SwipeableTabs({ tabs, activeTab, onTabChange, children, className }: SwipeableTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentDx = useRef(0);
  const isDragging = useRef(false);
  const directionLocked = useRef<'h' | 'v' | null>(null);
  const [dragPct, setDragPct] = useState(0);
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentDx.current = 0;
    isDragging.current = true;
    directionLocked.current = null;
    setDragPct(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (directionLocked.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      directionLocked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }

    if (directionLocked.current !== 'h') return;
    e.preventDefault();

    currentDx.current = dx;
    const w = containerRef.current?.offsetWidth || 400;
    // pct is in terms of container width (which is tabs.length * 100% of parent)
    let pct = (dx / w) * (100 / tabs.length);
    // Edge resistance
    if ((activeIndex === 0 && dx > 0) || (activeIndex === tabs.length - 1 && dx < 0)) {
      pct *= 0.2;
    }
    setDragPct(pct);
  }, [activeIndex, tabs.length]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    directionLocked.current = null;
    const threshold = 40;
    if (currentDx.current < -threshold && activeIndex < tabs.length - 1) {
      onTabChange(tabs[activeIndex + 1].id);
    } else if (currentDx.current > threshold && activeIndex > 0) {
      onTabChange(tabs[activeIndex - 1].id);
    }
    currentDx.current = 0;
    setDragPct(0);
  }, [activeIndex, tabs, onTabChange]);

  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {/* Tab bar */}
      <div className="flex items-center gap-0 p-1 rounded-2xl glass-card overflow-x-auto no-scrollbar shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { onTabChange(tab.id); }}
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
        className="relative overflow-hidden flex-1 mt-3"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <div
          className="flex"
          style={{
            transform: `translateX(calc(${-activeIndex * (100 / tabs.length)}% + ${dragPct}%))`,
            transition: dragPct !== 0 ? 'none' : 'transform 250ms cubic-bezier(0.2,0.8,0.2,1)',
            width: `${tabs.length * 100}%`,
            willChange: dragPct !== 0 ? 'transform' : 'auto',
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
});
