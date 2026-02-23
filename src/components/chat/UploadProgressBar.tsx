import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressBarProps {
  filesCount: number;
  currentIndex: number;
  className?: string;
}

export function UploadProgressBar({ filesCount, currentIndex, className }: UploadProgressBarProps) {
  const percent = filesCount > 0 ? Math.round(((currentIndex + 1) / filesCount) * 100) : 0;

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-t border-border/30', className)}>
      <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Sending media...</span>
          <span>{currentIndex + 1}/{filesCount}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
