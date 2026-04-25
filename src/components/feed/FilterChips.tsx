import { memo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChipsProps {
  selected: string[];
  userCountry?: string;
  userState?: string;
  onSelectionChange: (filters: string[]) => void;
}

const chipOptions = [
  { id: 'all', label: 'All', color: 'bg-blue-500/20 hover:bg-blue-500/30' },
  { id: 'videos', label: 'Videos', color: 'bg-purple-500/20 hover:bg-purple-500/30' },
  { id: 'thoughts', label: 'Thoughts', color: 'bg-amber-500/20 hover:bg-amber-500/30' },
  { id: 'pictures', label: 'Pictures', color: 'bg-pink-500/20 hover:bg-pink-500/30' },
  { id: 'news', label: 'News', color: 'bg-red-500/20 hover:bg-red-500/30' },
  { id: 'nature', label: 'Nature', color: 'bg-green-500/20 hover:bg-green-500/30' },
  { id: 'fun', label: 'Fun', color: 'bg-yellow-500/20 hover:bg-yellow-500/30' },
  { id: 'love', label: 'Love', color: 'bg-rose-500/20 hover:bg-rose-500/30' },
  { id: 'nepal', label: 'Nepal', color: 'bg-cyan-500/20 hover:bg-cyan-500/30' },
  { id: 'popular', label: 'Popular', color: 'bg-orange-500/20 hover:bg-orange-500/30' },
];

export const FilterChips = memo(({ 
  selected, 
  userCountry = 'Auto',
  userState = 'Auto',
  onSelectionChange 
}: FilterChipsProps) => {
  const handleChipClick = (id: string) => {
    if (id === 'all') {
      onSelectionChange(selected.includes('all') ? [] : ['all']);
    } else {
      let newSelected = selected.filter(s => s !== 'all');
      if (newSelected.includes(id)) {
        newSelected = newSelected.filter(s => s !== id);
      } else {
        newSelected = [...newSelected, id];
      }
      onSelectionChange(newSelected.length === 0 ? [] : newSelected);
    }
  };

  const isAllActive = selected.length === 0 || selected.includes('all');

  return (
    <div className="w-full px-2.5 py-2 bg-transparent overflow-x-auto no-scrollbar">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div className="flex items-center gap-2 whitespace-nowrap">
        {/* Content Type Filters */}
        {chipOptions.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleChipClick(chip.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 border border-white/10 hover:border-white/20",
              chip.id === 'all'
                ? isAllActive ? 'bg-blue-600/40 border-blue-400/50 text-blue-200' : 'bg-white/5 text-white/60'
                : selected.includes(chip.id)
                ? `${chip.color} border-white/30 text-white font-bold`
                : 'bg-white/5 text-white/50 hover:text-white/70'
            )}
          >
            {chip.label}
          </button>
        ))}

        {/* Location Filters */}
        <div className="flex items-center gap-2 shrink-0 ml-1 pl-2 border-l border-white/10">
          {/* Country Auto-Detect */}
          <button
            onClick={() => handleChipClick('country')}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border border-white/10 hover:border-white/20",
              selected.includes('country')
                ? 'bg-green-600/40 border-green-400/50 text-green-200'
                : 'bg-white/5 text-white/50 hover:text-white/70'
            )}
            title={`Your Country: ${userCountry}`}
          >
            🌍 {userCountry}
          </button>

          {/* State/Province Auto-Detect */}
          <button
            onClick={() => handleChipClick('state')}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border border-white/10 hover:border-white/20",
              selected.includes('state')
                ? 'bg-cyan-600/40 border-cyan-400/50 text-cyan-200'
                : 'bg-white/5 text-white/50 hover:text-white/70'
            )}
            title={`Your State/Region: ${userState}`}
          >
            📍 {userState}
          </button>
        </div>

        {/* Mood Filters */}
        <div className="flex items-center gap-2 shrink-0 ml-1 pl-2 border-l border-white/10">
          <button
            onClick={() => handleChipClick('love')}
            className={cn(
              "px-3 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 border border-white/10 hover:border-white/20",
              selected.includes('love')
                ? 'bg-rose-600/40 border-rose-400/50 text-rose-200'
                : 'bg-white/5 text-white/50 hover:text-white/70'
            )}
          >
            ❤️ Love
          </button>

          <button
            onClick={() => handleChipClick('fun')}
            className={cn(
              "px-3 py-1.5 rounded-full text-[12px] font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 border border-white/10 hover:border-white/20",
              selected.includes('fun')
                ? 'bg-yellow-600/40 border-yellow-400/50 text-yellow-200'
                : 'bg-white/5 text-white/50 hover:text-white/70'
            )}
          >
            🎉 Fun
          </button>
        </div>
      </div>
    </div>
  );
});

FilterChips.displayName = 'FilterChips';
