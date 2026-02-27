import lumathaLogo from '@/assets/lumatha-logo.png';

interface SectionHeaderProps {
  sectionName: string;
}

export function SectionHeader({ sectionName }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <img 
          src={lumathaLogo} 
          alt="Lumatha" 
          className="w-7 h-7 rounded-full object-contain" 
          style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.25)' }} 
        />
        <span className="text-sm font-semibold gradient-text tracking-tight">Lumatha</span>
      </div>
      <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">{sectionName}</span>
    </div>
  );
}
