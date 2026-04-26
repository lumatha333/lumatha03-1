import { useState } from 'react';

type CategoryId = 'all' | 'buy-sell' | 'services' | 'wanted' | 'jobs';

interface CategoryPill {
  id: CategoryId;
  label: string;
  dotColor: string;
}

const categories: CategoryPill[] = [
  { id: 'all', label: 'All', dotColor: '#4F8EF7' },
  { id: 'buy-sell', label: 'Buy/Sell', dotColor: '#34D399' },
  { id: 'services', label: 'Services', dotColor: '#F59E0B' },
  { id: 'wanted', label: 'Wanted', dotColor: '#EC4899' },
  { id: 'jobs', label: 'Jobs', dotColor: '#8B5CF6' },
];

interface CategoryFilterPillsProps {
  onSelect?: (category: CategoryId) => void;
}

export function CategoryFilterPills({ onSelect }: CategoryFilterPillsProps) {
  const [active, setActive] = useState<CategoryId>('all');

  const handleSelect = (id: CategoryId) => {
    setActive(id);
    onSelect?.(id);
  };

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto px-4 pb-3"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`.category-pills::-webkit-scrollbar { display: none; }`}</style>
      <div className="category-pills flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all"
            style={{
              backgroundColor: active === cat.id ? 'rgba(79, 142, 247, 0.15)' : '#1E2533',
              border: active === cat.id ? '1px solid rgba(79, 142, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.07)',
              fontSize: '13px',
              fontWeight: 600,
              color: active === cat.id ? '#4F8EF7' : '#94A3B8',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <div
              className="rounded-full"
              style={{ width: '7px', height: '7px', backgroundColor: cat.dotColor }}
            />
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
