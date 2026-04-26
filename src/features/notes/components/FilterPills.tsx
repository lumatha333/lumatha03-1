import React from 'react';
import { NoteCategory } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { cn } from '@/lib/utils';

interface FilterPillProps {
  id: NoteCategory | 'all';
  label: string;
  isActive: boolean;
  onClick: () => void;
  dotColor?: string;
}

export const FilterPill: React.FC<FilterPillProps> = ({ id, label, isActive, onClick, dotColor }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 h-8 px-4 rounded-full flex items-center gap-2 transition-all duration-200 border",
        isActive 
          ? "bg-[#7B5CF0] border-transparent text-white font-bold" 
          : "bg-white/5 border-white/10 text-[#9CA3AF] hover:bg-white/10"
      )}
    >
      {dotColor && !isActive && (
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ background: dotColor }} 
        />
      )}
      <span className="text-[13px]">{label}</span>
    </button>
  );
};

export const FilterPillRow: React.FC<{
  activeFilter: string;
  onFilterChange: (filter: any) => void;
}> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pinned', label: 'Pinned', dot: CATEGORY_COLORS.pinned },
    { id: 'saved', label: 'Saved', dot: CATEGORY_COLORS.saved },
    { id: 'purple', label: 'Purple', dot: CATEGORY_COLORS.purple },
    { id: 'golden', label: 'Gold', dot: CATEGORY_COLORS.golden },
    { id: 'cool', label: 'Cool', dot: CATEGORY_COLORS.cool },
    { id: 'warm', label: 'Warm', dot: CATEGORY_COLORS.warm },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
      {filters.map(f => (
        <FilterPill
          key={f.id}
          id={f.id as any}
          label={f.label}
          isActive={activeFilter === f.id}
          onClick={() => onFilterChange(f.id)}
          dotColor={f.dot}
        />
      ))}
    </div>
  );
};
