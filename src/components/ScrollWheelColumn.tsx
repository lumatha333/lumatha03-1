import { useRef, useEffect, useCallback } from 'react';

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

interface ScrollWheelColumnProps {
  items: { value: string; display: string }[];
  value: string;
  onChange: (v: string) => void;
}

export function ScrollWheelColumn({ items, value, onChange }: ScrollWheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scrollToValue = useCallback((val: string, smooth = true) => {
    const idx = items.findIndex(i => i.value === val);
    if (idx >= 0 && containerRef.current) {
      containerRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' });
    }
  }, [items]);

  useEffect(() => {
    if (value) scrollToValue(value, false);
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const idx = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIdx = Math.max(0, Math.min(idx, items.length - 1));
      containerRef.current.scrollTo({ top: clampedIdx * ITEM_HEIGHT, behavior: 'smooth' });
      onChange(items[clampedIdx].value);
    }, 80);
  };

  return (
    <div className="flex-1 relative" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{
        height: ITEM_HEIGHT * 2,
        background: 'linear-gradient(to bottom, #1e293b 0%, #1e293bcc 40%, transparent 100%)',
      }} />
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none" style={{
        height: ITEM_HEIGHT * 2,
        background: 'linear-gradient(to top, #1e293b 0%, #1e293bcc 40%, transparent 100%)',
      }} />
      <div className="absolute left-1 right-1 z-[5] pointer-events-none rounded-lg" style={{
        top: ITEM_HEIGHT * 2,
        height: ITEM_HEIGHT,
        background: 'rgba(124, 58, 237, 0.08)',
        border: '1px solid rgba(124, 58, 237, 0.15)',
      }} />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
        }}
      >
        {items.map((item) => {
          const isSelected = item.value === value;
          return (
            <div
              key={item.value}
              onClick={() => { onChange(item.value); scrollToValue(item.value); }}
              className="flex items-center justify-center cursor-pointer select-none transition-all duration-150"
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: 'center',
                fontSize: isSelected ? 18 : 14,
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? '#ffffff' : '#4B5563',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {item.display}
            </div>
          );
        })}
      </div>
    </div>
  );
}
