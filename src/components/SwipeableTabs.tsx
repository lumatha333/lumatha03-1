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
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const [translateX, setTranslateX] = useState(0);
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  useEffect(() => {
    setTranslateX(-activeIndex * 100);
  }, [activeIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - startX.current;
    currentX.current = diff;
    const baseTranslate = -activeIndex * 100;
    const dragPercent = (diff / (containerRef.current?.offsetWidth || 400)) * 100;
    setTranslateX(baseTranslate + dragPercent);
  }, [activeIndex]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    const threshold = 50;
    if (currentX.current < -threshold && activeIndex < tabs.length - 1) {
      onTabChange(tabs[activeIndex + 1].id);
    } else if (currentX.current > threshold && activeIndex > 0) {
      onTabChange(tabs[activeIndex - 1].id);
    } else {
      setTranslateX(-activeIndex * 100);
    }
    currentX.current = 0;
  }, [activeIndex, tabs, onTabChange]);

  return (
    <div className={cn("flex flex-col overflow-hidden", className)}>
      {/* Tab bar */}
      <div className="flex items-center gap-0 p-1 rounded-2xl glass-card overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 whitespace-nowrap flex-1 justify-center text-xs font-medium",
              activeTab === tab.id
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.length > 5 ? tab.label.slice(0, 4) : tab.label}</span>
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
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${translateX}%)`,
            width: `${tabs.length * 100}%`,
            transitionDuration: isDragging.current ? '0ms' : '300ms'
          }}
        >
          {children.map((child, i) => (
            <div key={tabs[i]?.id || i} className="w-full flex-shrink-0" style={{ width: `${100 / tabs.length}%` }}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
