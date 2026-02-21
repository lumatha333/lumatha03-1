import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  StickyNote, Folder, BookmarkCheck, Pin, TrendingUp, Clock, 
  BarChart3, Flame, Calendar, Sparkles, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

interface Note {
  id: string; title: string; content: string; folder?: string;
  pinned?: boolean; saved?: boolean; created_at: string; updated_at: string;
}

const NOTES_KEY = 'lumatha_notes_v2';
const ANALYTICS_KEY = 'lumatha_notes_analytics';
const WEEKLY_KEY = 'lumatha_notes_weekly';

interface DailyStats {
  date: string;
  notesCreated: number;
  notesEdited: number;
  wordsWritten: number;
}

interface WeeklyRecord {
  [date: string]: { created: number; edited: number; words: number };
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

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en', { weekday: 'short' });
}

export function NotesAnalytics() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({ date: getToday(), notesCreated: 0, notesEdited: 0, wordsWritten: 0 });
  const [weeklyData, setWeeklyData] = useState<WeeklyRecord>({});

  useEffect(() => {
    const cached = localStorage.getItem(NOTES_KEY);
    if (cached) setNotes(JSON.parse(cached));

    // Load daily stats
    const savedStats = localStorage.getItem(ANALYTICS_KEY);
    if (savedStats) {
      const parsed: DailyStats = JSON.parse(savedStats);
      if (parsed.date !== getToday()) {
        // Save yesterday's data to weekly before reset
        saveToWeekly(parsed);
        const fresh = { date: getToday(), notesCreated: 0, notesEdited: 0, wordsWritten: 0 };
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(fresh));
        setDailyStats(fresh);
      } else {
        setDailyStats(parsed);
      }
    }

    // Load weekly
    const savedWeekly = localStorage.getItem(WEEKLY_KEY);
    if (savedWeekly) setWeeklyData(JSON.parse(savedWeekly));

    const onStorage = () => {
      const c = localStorage.getItem(NOTES_KEY);
      if (c) setNotes(JSON.parse(c));
      const a = localStorage.getItem(ANALYTICS_KEY);
      if (a) setDailyStats(JSON.parse(a));
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('notesUpdated', onStorage);
    
    // Midnight reset check
    const interval = setInterval(() => {
      const saved = localStorage.getItem(ANALYTICS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date !== getToday()) {
          saveToWeekly(parsed);
          const fresh = { date: getToday(), notesCreated: 0, notesEdited: 0, wordsWritten: 0 };
          localStorage.setItem(ANALYTICS_KEY, JSON.stringify(fresh));
          setDailyStats(fresh);
        }
      }
    }, 60000);

    return () => { 
      window.removeEventListener('storage', onStorage); 
      window.removeEventListener('notesUpdated', onStorage);
      clearInterval(interval); 
    };
  }, []);

  const saveToWeekly = (stats: DailyStats) => {
    const saved = localStorage.getItem(WEEKLY_KEY);
    const data: WeeklyRecord = saved ? JSON.parse(saved) : {};
    data[stats.date] = { created: stats.notesCreated, edited: stats.notesEdited, words: stats.wordsWritten };
    // Keep only last 30 days
    const keys = Object.keys(data).sort();
    if (keys.length > 30) {
      keys.slice(0, keys.length - 30).forEach(k => delete data[k]);
    }
    localStorage.setItem(WEEKLY_KEY, JSON.stringify(data));
    setWeeklyData(data);
  };

  const stats = useMemo(() => {
    const totalWords = notes.reduce((sum, n) => sum + getWordCount(n.content), 0);
    const pinnedCount = notes.filter(n => n.pinned).length;
    const savedCount = notes.filter(n => n.saved).length;
    const folderSet = new Set(notes.map(n => n.folder).filter(Boolean));
    
    const today = getToday();
    const todayNotes = notes.filter(n => n.created_at.startsWith(today));
    const todayEdited = notes.filter(n => n.updated_at.startsWith(today) && !n.created_at.startsWith(today));

    return { total: notes.length, totalWords, pinnedCount, savedCount, folders: folderSet.size, todayCreated: todayNotes.length, todayEdited: todayEdited.length };
  }, [notes]);

  // Weekly chart data
  const chartData = useMemo(() => {
    const days = getLast7Days();
    const today = getToday();
    return days.map(d => {
      if (d === today) {
        return { day: getDayLabel(d), date: d, created: dailyStats.notesCreated, edited: dailyStats.notesEdited, words: dailyStats.wordsWritten };
      }
      const rec = weeklyData[d];
      return { day: getDayLabel(d), date: d, created: rec?.created || 0, edited: rec?.edited || 0, words: rec?.words || 0 };
    });
  }, [weeklyData, dailyStats]);

  const maxActivity = Math.max(...chartData.map(d => d.created + d.edited), 1);

  // Comparison with yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayData = weeklyData[yesterdayStr];
  const todayTotal = stats.todayCreated + stats.todayEdited;
  const yesterdayTotal = (yesterdayData?.created || 0) + (yesterdayData?.edited || 0);
  const trend = todayTotal - yesterdayTotal;

  // Time until midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const hoursLeft = Math.floor((midnight.getTime() - now.getTime()) / 3600000);
  const minsLeft = Math.floor(((midnight.getTime() - now.getTime()) % 3600000) / 60000);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Today's Activity — auto resets at midnight */}
      <Card className="glass-card border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-rose-500" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Today's Activity</h3>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Resets in {hoursLeft}h {minsLeft}m
                </p>
              </div>
            </div>
            {trend !== 0 && (
              <div className={`flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend)} vs yesterday
              </div>
            )}
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

      {/* Weekly Activity Chart */}
      <Card className="glass-card border-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">7-Day Activity</h3>
          </div>
          
          <div className="flex items-end gap-1.5 h-24">
            {chartData.map((d, i) => {
              const total = d.created + d.edited;
              const height = maxActivity > 0 ? Math.max((total / maxActivity) * 100, 4) : 4;
              const isToday = d.date === getToday();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-medium text-muted-foreground">{total > 0 ? total : ''}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '72px' }}>
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 ${isToday ? 'bg-gradient-to-t from-primary to-primary/60' : 'bg-primary/25'}`}
                      style={{ height: `${height}%`, minHeight: '3px' }}
                    />
                  </div>
                  <span className={`text-[9px] ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2 text-[9px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-primary" />
              Today
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-primary/25" />
              Past
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {[
          { icon: StickyNote, label: 'Total Notes', value: stats.total, color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400' },
          { icon: BarChart3, label: 'Total Words', value: stats.totalWords.toLocaleString(), color: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400' },
          { icon: Folder, label: 'Folders', value: stats.folders, color: 'from-teal-500/20 to-teal-500/5', iconColor: 'text-teal-400' },
          { icon: Pin, label: 'Pinned', value: stats.pinnedCount, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400' },
          { icon: BookmarkCheck, label: 'Saved', value: stats.savedCount, color: 'from-rose-500/20 to-rose-500/5', iconColor: 'text-rose-400' },
        ].map(card => (
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
