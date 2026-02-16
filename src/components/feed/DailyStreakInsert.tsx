import { useNavigate } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export function DailyStreakInsert() {
  const completed = parseInt(localStorage.getItem('funpun_completed') || '[]', 10) || 0;
  const target = 5;
  const pct = Math.min((completed / target) * 100, 100);
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-semibold">Daily Progress</span>
      </div>
      <Progress value={pct} className="h-2 mb-2" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{Math.round(pct)}% of daily goals</span>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-0.5 px-2" onClick={() => navigate('/music-adventure')}>
          View Goals <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
