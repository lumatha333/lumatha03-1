import { Menu } from 'lucide-react';

interface SectionHeaderProps {
  sectionName: string;
  onRefresh?: () => void;
}

export function SectionHeader({ sectionName, onRefresh }: SectionHeaderProps) {
  const handleClick = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-3">
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('lumatha_mobile_sidebar_toggle'))} 
        className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl transition-transform active:scale-90 hover:bg-white/5"
      >
        <Menu className="w-6 h-6 text-blue-500" strokeWidth={2} />
      </button>
      
      <div className="flex flex-col">
        <button
          onClick={handleClick}
          className="text-base font-black tracking-wide text-blue-600 uppercase leading-none"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Lumatha
        </button>
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">{sectionName}</span>
      </div>
      
      <div className="flex-1" />
    </div>
  );
}
