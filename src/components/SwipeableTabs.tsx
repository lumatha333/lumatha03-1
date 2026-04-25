import { ReactNode, Children, memo } from 'react';
import { cn } from '@/lib/utils';

interface SwipeableTabsProps {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
  className?: string;
}

export const SwipeableTabs = memo(function SwipeableTabs({ tabs, activeTab, onTabChange, children, className }: SwipeableTabsProps) {
  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  const childArray = Children.toArray(children);

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {/* Tab bar - CSS only for mobile performance */}
      <div className="relative flex items-center rounded-xl overflow-hidden shrink-0" style={{ background: '#0d1220', border: '1px solid #1f2937' }}>
        <div
          className="absolute top-0 bottom-0 rounded-xl transition-all duration-200 ease-out"
          style={{
            left: `${activeIndex * (100 / tabs.length)}%`,
            width: `${100 / tabs.length}%`,
            background: '#7C3AED',
          }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative z-10 flex items-center gap-1 justify-center flex-1 py-2.5 transition-colors duration-200 text-xs font-semibold",
              activeTab === tab.id ? "text-white" : "text-[#64748B]"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content - fast fade only, no sliding for mobile performance */}
      <div className="mt-4 relative">
        <div className="transition-opacity duration-150">
          {childArray[activeIndex]}
        </div>
      </div>
    </div>
  );
});
