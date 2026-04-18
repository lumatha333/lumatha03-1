import { useNavigate } from 'react-router-dom';
import { Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickConnectInsert() {
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-2xl p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
        <Heart className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Random Connect</p>
        <p className="text-[10px] text-muted-foreground">Meet someone new anonymously</p>
        <p className="text-[9px] text-muted-foreground/70 flex items-center gap-0.5 mt-0.5">
          <Shield className="w-2.5 h-2.5" /> Leave anytime · Safety first
        </p>
      </div>
      <Button size="sm" className="h-8 text-xs rounded-xl px-3 shrink-0" onClick={() => navigate('/random-connect')}>
        Start
      </Button>
    </div>
  );
}
