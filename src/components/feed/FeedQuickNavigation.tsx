import { usePremiumWidgets } from '@/components/navigation/GlobalQuickNav';
import { useRef } from 'react';

export function FeedQuickNavigation() {
  const widgets = usePremiumWidgets();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!widgets || widgets.length === 0) return null;

  return (
    <div className="w-full mb-6 relative group">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">✨</span> Explore & Discover
        </h2>
      </div>
      
      {/* Horizontal scrolling container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
      >
        {widgets.map((widget, index) => (
          <div 
            key={index} 
            className="w-[85vw] max-w-[320px] shrink-0 snap-start"
          >
            {widget}
          </div>
        ))}
      </div>
    </div>
  );
}
