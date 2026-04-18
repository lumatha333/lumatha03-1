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
    <div className="flex items-center justify-between mb-3">
      <div className="flex-1" />
      <button
        onClick={handleClick}
        className="text-base font-bold gradient-text tracking-tight hover:opacity-80 transition-opacity"
      >
        Lumatha
      </button>
      <div className="flex-1 flex justify-end">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">{sectionName}</span>
      </div>
    </div>
  );
}
