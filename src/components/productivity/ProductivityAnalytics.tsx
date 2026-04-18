import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, CheckSquare, Mountain, Trophy, Flame, Calendar, 
  TrendingUp, Target, StickyNote, FileText, BookOpen, 
  ChevronDown, ChevronUp, Star, Zap, Globe, Award, Download, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TODO_KEY = 'lumatha_todos_v2';
const CUSTOM_FOLDERS_KEY = 'lumatha_custom_folders_v2';
const CHALLENGE_KEY = 'lumatha_adventure_data';
const ANALYTICS_HISTORY_KEY = 'lumatha_productivity_history';
const NOTES_KEY = 'lumatha_notes_v2';
const STREAK_KEY = 'lumatha_streak';
const TODO_HISTORY_KEY = 'lumatha_todo_history';

function getToday() { return new Date().toISOString().split('T')[0]; }
function getLast7Days() {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().split('T')[0]); }
  return days;
}
function getDayLabel(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }); }

export function ProductivityAnalytics() {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const toggleSection = (id: string) => setExpandedSection(prev => prev === id ? null : id);

  // Task stats
  const taskStats = useMemo(() => {
    let totalCompleted = 0, totalTasks = 0;
    const categoryStats: Record<string, { completed: number; total: number }> = {};
    try {
      const todosRaw = localStorage.getItem(TODO_KEY);
      if (todosRaw) {
        const todos = JSON.parse(todosRaw);
        if (typeof todos === 'object' && !Array.isArray(todos)) {
          Object.entries(todos).forEach(([cat, items]: [string, any]) => {
            if (Array.isArray(items)) {
              const completed = items.filter((t: any) => t.completed).length;
              categoryStats[cat] = { completed, total: items.length };
              totalCompleted += completed; totalTasks += items.length;
            }
          });
        }
      }
    } catch {}
    try {
      const foldersRaw = localStorage.getItem(CUSTOM_FOLDERS_KEY);
      if (foldersRaw) {
        const folders = JSON.parse(foldersRaw);
        let cc = 0, ct = 0;
        folders.forEach((f: any) => f.lists?.forEach((l: any) => l.tasks?.forEach((t: any) => { ct++; if (t.completed) cc++; })));
        if (ct > 0) { categoryStats['custom'] = { completed: cc, total: ct }; totalCompleted += cc; totalTasks += ct; }
      }
    } catch {}
    return { totalCompleted, totalTasks, categoryStats, percentage: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0 };
  }, []);

  // All-time from history
  const allTimeStats = useMemo(() => {
    let total = 0, activeDays = 0;
    try {
      const raw = localStorage.getItem(TODO_HISTORY_KEY);
      if (raw) {
        const history = JSON.parse(raw);
        Object.values(history).forEach((day: any) => {
          let dayCount = 0;
          Object.values(day).forEach((val: any) => {
            const c = typeof val === 'number' ? val : (val?.completed || 0);
            dayCount += c;
          });
          if (dayCount > 0) { activeDays++; total += dayCount; }
        });
      }
    } catch {}
    return { total, activeDays, avgPerDay: activeDays > 0 ? (total / activeDays).toFixed(1) : '0' };
  }, []);

  // Notes stats
  const notesStats = useMemo(() => {
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      if (!raw) return { total: 0, pinned: 0, totalWords: 0, writingStreak: 0 };
      const notes = JSON.parse(raw);
      const totalWords = notes.reduce((sum: number, n: any) => {
        const tmp = document.createElement('div'); tmp.innerHTML = n.content || '';
        return sum + (tmp.textContent || '').trim().split(/\s+/).filter(Boolean).length;
      }, 0);
      return { total: notes.length, pinned: notes.filter((n: any) => n.pinned).length, totalWords, writingStreak: 0 };
    } catch { return { total: 0, pinned: 0, totalWords: 0, writingStreak: 0 }; }
  }, []);

  // Adventure & Challenge stats
  const adventureStats = useMemo(() => {
    try {
      const raw = localStorage.getItem(CHALLENGE_KEY);
      if (!raw) return { challengesCompleted: 0, placesVisited: 0, completedList: [] as string[], placesList: [] as string[] };
      const data = JSON.parse(raw);
      return {
        challengesCompleted: data.completedChallenges ? Object.keys(data.completedChallenges).length : 0,
        placesVisited: data.visitedPlaces ? Object.keys(data.visitedPlaces).length : 0,
        completedList: data.completedChallenges ? Object.keys(data.completedChallenges) : [],
        placesList: data.visitedPlaces ? Object.keys(data.visitedPlaces) : [],
      };
    } catch { return { challengesCompleted: 0, placesVisited: 0, completedList: [], placesList: [] }; }
  }, []);

  const streak = useMemo(() => {
    try { const saved = localStorage.getItem(STREAK_KEY); if (saved) return JSON.parse(saved).count || 0; } catch {} return 0;
  }, []);

  const docsStats = useMemo(() => {
    try { const s = localStorage.getItem('lumatha_saved_docs'); return { savedCount: s ? JSON.parse(s).length : 0 }; } catch { return { savedCount: 0 }; }
  }, []);

  // Productivity score
  const productivityScore = Math.round((allTimeStats.total * 1.2) + (streak * 5) + (allTimeStats.activeDays * 2));

  // 7-day chart from todo history
  const chartData = useMemo(() => {
    let hist: Record<string, any> = {};
    try { const raw = localStorage.getItem(TODO_HISTORY_KEY); if (raw) hist = JSON.parse(raw); } catch {}
    return getLast7Days().map(d => {
      const dateObj = new Date(d + 'T12:00:00');
      const dateStr = dateObj.toDateString();
      let count = 0;
      if (hist[dateStr]) {
        Object.values(hist[dateStr]).forEach((val: any) => {
          count += typeof val === 'number' ? val : (val?.completed || 0);
        });
      }
      return { day: getDayLabel(d), date: d, count };
    });
  }, []);

  const maxVal = Math.max(...chartData.map(d => d.count), 1);
  const totalWeek = chartData.reduce((s, d) => s + d.count, 0);

  const sections = [
    { id: 'overview', title: 'Overview', icon: <BarChart3 className="w-4 h-4" />, color: 'text-primary', accent: 'from-primary/20 to-primary/5',
      summary: `Score: ${productivityScore} · ${allTimeStats.total} all-time tasks` },
    { id: 'tasks', title: 'Tasks & To-Do', icon: <CheckSquare className="w-4 h-4" />, color: 'text-emerald-400', accent: 'from-emerald-500/20 to-emerald-500/5',
      summary: `${taskStats.totalCompleted}/${taskStats.totalTasks} done (${taskStats.percentage}%)` },
    { id: 'notes', title: 'Notes', icon: <StickyNote className="w-4 h-4" />, color: 'text-blue-400', accent: 'from-blue-500/20 to-blue-500/5',
      summary: `${notesStats.total} notes · ${notesStats.totalWords.toLocaleString()} words` },
    { id: 'docs', title: 'Docs & Videos', icon: <FileText className="w-4 h-4" />, color: 'text-violet-400', accent: 'from-violet-500/20 to-violet-500/5',
      summary: `${docsStats.savedCount} saved` },
    { id: 'adventures', title: 'Challenges & Adventures', icon: <Trophy className="w-4 h-4" />, color: 'text-amber-400', accent: 'from-amber-500/20 to-amber-500/5',
      summary: `${adventureStats.challengesCompleted} challenges · ${adventureStats.placesVisited} places` },
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Hero Card */}
      <Card className="overflow-hidden border-border">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Learning Stats</h3>
                <p className="text-[10px] text-muted-foreground">All-time performance</p>
              </div>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">
                <Flame className="w-3 h-3" />{streak} day streak
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <CheckSquare className="w-3.5 h-3.5" />, value: allTimeStats.total, label: 'Tasks', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { icon: <StickyNote className="w-3.5 h-3.5" />, value: notesStats.total, label: 'Notes', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { icon: <Trophy className="w-3.5 h-3.5" />, value: adventureStats.challengesCompleted, label: 'Challenges', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { icon: <Mountain className="w-3.5 h-3.5" />, value: adventureStats.placesVisited, label: 'Places', color: 'text-violet-400', bg: 'bg-violet-500/10' },
            ].map((s, i) => (
              <div key={i} className={cn("text-center p-2 rounded-xl border border-border/30", s.bg)}>
                <div className={cn("mx-auto mb-0.5", s.color)}>{s.icon}</div>
                <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
                <p className="text-[8px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Chart */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">7-Day Activity</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">{totalWeek} tasks this week</span>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {chartData.map((d, i) => {
              const height = maxVal > 0 ? Math.max((d.count / maxVal) * 100, 4) : 4;
              const isToday = d.date === getToday();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[8px] font-bold text-muted-foreground">{d.count > 0 ? d.count : ''}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '56px' }}>
                    <div className={cn("w-full rounded-t-md transition-all duration-500",
                      isToday ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : d.count > 0 ? 'bg-emerald-500/25' : 'bg-muted/15'
                    )} style={{ height: `${height}%`, minHeight: '3px' }} />
                  </div>
                  <span className={cn("text-[9px]", isToday ? 'text-primary font-bold' : 'text-muted-foreground')}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Expandable Sections */}
      {sections.map(section => (
        <Card key={section.id} className="border-border overflow-hidden">
          <CardContent className="p-0">
            <button onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between p-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center", section.accent)}>
                  <span className={section.color}>{section.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-bold">{section.title}</p>
                  <p className="text-[10px] text-muted-foreground">{section.summary}</p>
                </div>
              </div>
              {expandedSection === section.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {expandedSection === section.id && (
              <div className="px-3 pb-3 space-y-2.5 border-t border-border/30 pt-2 animate-fade-in">
                {/* Overview */}
                {section.id === 'overview' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Productivity Score', value: productivityScore, icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, bg: 'bg-amber-500/10' },
                      { label: 'Active Days', value: allTimeStats.activeDays, icon: <Calendar className="w-3.5 h-3.5 text-blue-400" />, bg: 'bg-blue-500/10' },
                      { label: 'Avg Tasks/Day', value: allTimeStats.avgPerDay, icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />, bg: 'bg-emerald-500/10' },
                      { label: 'Completion Rate', value: `${taskStats.percentage}%`, icon: <Target className="w-3.5 h-3.5 text-violet-400" />, bg: 'bg-violet-500/10' },
                      { label: 'Total Words Written', value: notesStats.totalWords.toLocaleString(), icon: <BookOpen className="w-3.5 h-3.5 text-rose-400" />, bg: 'bg-rose-500/10' },
                      { label: 'Docs Saved', value: docsStats.savedCount, icon: <FileText className="w-3.5 h-3.5 text-teal-400" />, bg: 'bg-teal-500/10' },
                    ].map((s, i) => (
                      <div key={i} className={cn("flex items-center gap-2 p-2.5 rounded-xl", s.bg)}>
                        {s.icon}
                        <div>
                          <p className="text-sm font-bold">{s.value}</p>
                          <p className="text-[9px] text-muted-foreground">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {section.id === 'tasks' && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-bold text-emerald-400">{taskStats.percentage}%</span>
                      </div>
                      <div className="h-3 bg-muted/20 rounded-full overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all flex items-center justify-center"
                          style={{ width: `${Math.max(taskStats.percentage, 5)}%` }}>
                          {taskStats.percentage > 15 && <span className="text-[8px] font-bold text-white">{taskStats.percentage}%</span>}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(taskStats.categoryStats).map(([cat, stat]) => {
                        const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                        const colors: Record<string, string> = { daily: 'bg-blue-500', weekly: 'bg-teal-500', monthly: 'bg-violet-500', yearly: 'bg-amber-500', lifetime: 'bg-rose-500', custom: 'bg-emerald-500' };
                        return (
                          <div key={cat} className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full shrink-0", colors[cat] || 'bg-primary')} />
                            <span className="text-[10px] font-medium flex-1 capitalize">{cat}</span>
                            <div className="w-16 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", colors[cat])} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-12 text-right">{stat.completed}/{stat.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Notes */}
                {section.id === 'notes' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Total Notes', value: notesStats.total, icon: <StickyNote className="w-3 h-3 text-blue-400" /> },
                      { label: 'Total Words', value: notesStats.totalWords.toLocaleString(), icon: <BookOpen className="w-3 h-3 text-violet-400" /> },
                      { label: 'Pinned', value: notesStats.pinned, icon: <Star className="w-3 h-3 text-amber-400" /> },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                        {s.icon}<div><p className="text-xs font-bold">{s.value}</p><p className="text-[9px] text-muted-foreground">{s.label}</p></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Docs */}
                {section.id === 'docs' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                      <FileText className="w-3 h-3 text-violet-400" />
                      <div><p className="text-xs font-bold">{docsStats.savedCount}</p><p className="text-[9px] text-muted-foreground">Saved Docs</p></div>
                    </div>
                  </div>
                )}

                {/* Adventures */}
                {section.id === 'adventures' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <div><p className="text-xs font-bold text-amber-400">{adventureStats.challengesCompleted}</p><p className="text-[9px] text-muted-foreground">Challenges</p></div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/10">
                        <Globe className="w-3.5 h-3.5 text-violet-400" />
                        <div><p className="text-xs font-bold text-violet-400">{adventureStats.placesVisited}</p><p className="text-[9px] text-muted-foreground">Places</p></div>
                      </div>
                    </div>
                    {adventureStats.completedList.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-medium">Completed:</p>
                        <div className="max-h-28 overflow-y-auto space-y-0.5">
                          {adventureStats.completedList.slice(0, 10).map((c, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Award className="w-2.5 h-2.5 text-amber-400 shrink-0" /><span className="truncate">{c}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {adventureStats.placesList.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-medium">Places visited:</p>
                        <div className="max-h-28 overflow-y-auto space-y-0.5">
                          {adventureStats.placesList.slice(0, 10).map((p, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5 text-violet-400 shrink-0" /><span className="truncate">{p}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
