import { useNavigate } from 'react-router-dom';
import { Mountain, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const teasers = [
  { title: 'Morning Meditation', difficulty: 'Easy', desc: '5 min mindfulness' },
  { title: 'Cold Shower Challenge', difficulty: 'Hard', desc: 'Build resilience' },
  { title: 'Gratitude Journal', difficulty: 'Easy', desc: 'Write 3 things' },
];

export function AdventureTeasersInsert() {
  const navigate = useNavigate();

  return (
    <div className="py-1">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <Mountain className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Adventure Challenges</span>
        </div>
        <button onClick={() => navigate('/music-adventure')} className="text-[10px] text-primary flex items-center gap-0.5">
          See all <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {teasers.map((t, i) => (
            <div
              key={i}
              className="shrink-0 w-[220px] h-[110px] rounded-2xl glass-card p-3 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => navigate('/music-adventure')}
            >
              <div>
                <p className="text-sm font-medium leading-tight line-clamp-2">{t.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {t.difficulty}
                </span>
                <Button size="sm" className="h-6 text-[10px] px-2 rounded-xl">Start</Button>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
