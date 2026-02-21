import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StickyNote, Folder, BookmarkCheck, Pin, TrendingUp, Clock, BarChart3, Flame } from 'lucide-react';

interface Note {
  id: string; title: string; content: string; folder?: string;
  pinned?: boolean; saved?: boolean; created_at: string; updated_at: string;
}

const NOTES_KEY = 'lumatha_notes_v2';
const ANALYTICS_KEY = 'lumatha_notes_analytics';

interface DailyStats {
  date: string; // YYYY-MM-DD
  notesCreated: number;
  notesEdited: number;
  wordsWritten: number;
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getWordCount(html: string) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent || '';
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function NotesAnalytics() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({ date: getToday(), notesCreated: 0, notesEdited: 0, wordsWritten: 0 });

  useEffect(() => {
    const cached = localStorage.getItem(NOTES_KEY);
    if (cached) setNotes(JSON.parse(cached));

    // Load or reset daily stats
    const savedStats = localStorage.getItem(ANALYTICS_KEY);
    if (savedStats) {
      const parsed: DailyStats = JSON.parse(savedStats);
      if (parsed.date !== getToday()) {
        // Auto-reset at midnight
        const fresh = { date: getToday(), notesCreated: 0, notesEdited: 0, wordsWritten: 0 };
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(fresh));
        setDailyStats(fresh);
      } else {
        setDailyStats(parsed);
      }
    }

    // Listen for storage changes (when notes are updated)
    const onStorage = () => {
      const c = localStorage.getItem(NOTES_KEY);
      if (c) setNotes(JSON.parse(c));
    };
    window.addEventListener('storage', onStorage);
    
    // Check for midnight reset every minute
    const interval = setInterval(() => {
      const saved = localStorage.getItem(ANALYTICS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date !== getToday()) {
          const fresh = { date: getToday(), notesCreated: 0, notesEdited: 0, wordsWritten: 0 };
          localStorage.setItem(ANALYTICS_KEY, JSON.stringify(fresh));
          setDailyStats(fresh);
        }
      }
    }, 60000);

    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
  }, []);

  const stats = useMemo(() => {
    const totalWords = notes.reduce((sum, n) => sum + getWordCount(n.content), 0);
    const pinnedCount = notes.filter(n => n.pinned).length;
    const savedCount = notes.filter(n => n.saved).length;
    const folderSet = new Set(notes.map(n => n.folder).filter(Boolean));
    
    const today = getToday();
    const todayNotes = notes.filter(n => n.created_at.startsWith(today));
    const todayEdited = notes.filter(n => n.updated_at.startsWith(today) && !n.created_at.startsWith(today));

    return {
      total: notes.length,
      totalWords,
      pinnedCount,
      savedCount,
      folders: folderSet.size,
      todayCreated: todayNotes.length,
      todayEdited: todayEdited.length,
    };
  }, [notes]);

  const statCards = [
    { icon: StickyNote, label: 'Total Notes', value: stats.total, color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400' },
    { icon: BarChart3, label: 'Total Words', value: stats.totalWords.toLocaleString(), color: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400' },
    { icon: Folder, label: 'Folders', value: stats.folders, color: 'from-teal-500/20 to-teal-500/5', iconColor: 'text-teal-400' },
    { icon: Pin, label: 'Pinned', value: stats.pinnedCount, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400' },
    { icon: BookmarkCheck, label: 'Saved', value: stats.savedCount, color: 'from-rose-500/20 to-rose-500/5', iconColor: 'text-rose-400' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Today's Activity — auto resets at midnight */}
      <Card className="glass-card border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-rose-500" />
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Today's Activity</h3>
              <p className="text-[10px] text-muted-foreground">Resets at midnight</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
              <TrendingUp className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <p className="text-lg font-bold text-emerald-400">{stats.todayCreated}</p>
              <p className="text-[9px] text-muted-foreground">Created</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/10">
              <Clock className="w-4 h-4 mx-auto text-blue-400 mb-1" />
              <p className="text-lg font-bold text-blue-400">{stats.todayEdited}</p>
              <p className="text-[9px] text-muted-foreground">Edited</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-violet-500/10 border border-violet-500/10">
              <BarChart3 className="w-4 h-4 mx-auto text-violet-400 mb-1" />
              <p className="text-lg font-bold text-violet-400">{dailyStats.wordsWritten}</p>
              <p className="text-[9px] text-muted-foreground">Words</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {statCards.map(card => (
          <Card key={card.label} className="glass-card border-border overflow-hidden">
            <CardContent className="p-3 text-center">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mx-auto mb-1.5`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
              <p className="text-lg font-bold">{card.value}</p>
              <p className="text-[9px] text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
