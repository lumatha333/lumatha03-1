import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, Calendar, TrendingUp, Award, Target, Flame, Trophy, Gem, Medal, Sprout,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckSquare, Folder, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TODO_CATEGORIES, TodoCategory } from '@/data/defaultTodos';

interface TodoProgressViewProps {
  onBack: () => void;
}

const STORAGE_KEY = 'lumatha_todos_v2';
const CUSTOM_FOLDERS_KEY = 'lumatha_custom_folders_v2';
const HISTORY_KEY = 'lumatha_todo_history';
const STREAK_KEY = 'lumatha_streak';

interface DayHistory {
  [category: string]: { completed: number; total: number; items?: string[] };
}

interface WeekSummary {
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalCompleted: number;
  totalTasks: number;
  categories: Record<string, number>;
  days: { date: string; completed: number }[];
  completedItems: string[];
}

interface MonthSummary {
  monthLabel: string;
  totalCompleted: number;
  weeks: number;
  categories: Record<string, number>;
  completedItems: string[];
}

// Save completion history when tasks are toggled
function getHistory(): Record<string, DayHistory> {
  const saved = localStorage.getItem(HISTORY_KEY);
  return saved ? JSON.parse(saved) : {};
}

function getTodos(): Record<string, any[]> {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return {};
  return JSON.parse(saved);
}

function getCustomFolders(): any[] {
  const saved = localStorage.getItem(CUSTOM_FOLDERS_KEY);
  return saved ? JSON.parse(saved) : [];
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDateStr(d: Date): string {
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function getMonthStr(d: Date): string {
  return d.toLocaleDateString('en', { month: 'long', year: 'numeric' });
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

const CATEGORY_COLORS: Record<string, string> = {
  daily: 'bg-blue-500',
  weekly: 'bg-teal-500',
  monthly: 'bg-violet-500',
  yearly: 'bg-amber-500',
  lifetime: 'bg-rose-500',
  custom: 'bg-emerald-500',
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  daily: 'text-blue-400',
  weekly: 'text-teal-400',
  monthly: 'text-violet-400',
  yearly: 'text-amber-400',
  lifetime: 'text-rose-400',
  custom: 'text-emerald-400',
};

export function TodoProgressView({ onBack }: TodoProgressViewProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'yearly' | 'weekly' | 'monthly'>('overview');
  const [yearOffset, setYearOffset] = useState(0);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const history = useMemo(() => getHistory(), []);
  const todos = useMemo(() => getTodos(), []);
  const customFolders = useMemo(() => getCustomFolders(), []);

  const streak = useMemo(() => {
    const saved = localStorage.getItem(STREAK_KEY);
    if (saved) { const { count } = JSON.parse(saved); return count; }
    return 0;
  }, []);

  // Current stats from todos
  const currentStats = useMemo(() => {
    const stats: Record<string, { completed: number; total: number }> = {};
    let totalCompleted = 0, totalAll = 0;
    
    Object.entries(todos).forEach(([cat, items]) => {
      if (Array.isArray(items)) {
        const completed = items.filter((t: any) => t.completed).length;
        stats[cat] = { completed, total: items.length };
        totalCompleted += completed;
        totalAll += items.length;
      }
    });

    // Custom folders
    let customCompleted = 0, customTotal = 0;
    customFolders.forEach((folder: any) => {
      folder.lists?.forEach((list: any) => {
        list.tasks?.forEach((task: any) => {
          customTotal++;
          if (task.completed) customCompleted++;
        });
      });
    });
    if (customTotal > 0) {
      stats['custom'] = { completed: customCompleted, total: customTotal };
      totalCompleted += customCompleted;
      totalAll += customTotal;
    }

    return { stats, totalCompleted, totalAll };
  }, [todos, customFolders]);

  // 365-day heatmap data
  const yearData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear() + yearOffset;
    const days: { date: string; count: number; dayOfWeek: number; month: number; dayNum: number }[] = [];
    
    const startDate = new Date(year, 0, 1);
    const endDate = yearOffset === 0 ? now : new Date(year, 11, 31);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toDateString();
      let count = 0;
      if (history[dateStr]) {
        Object.values(history[dateStr]).forEach((c: any) => {
          if (typeof c === 'number') count += c;
          else if (c?.completed) count += c.completed;
        });
      }
      days.push({ 
        date: dateStr, count, 
        dayOfWeek: d.getDay(), 
        month: d.getMonth(),
        dayNum: d.getDate()
      });
    }
    return days;
  }, [history, yearOffset]);

  const totalYearCompleted = yearData.reduce((s, d) => s + d.count, 0);
  const activeDaysYear = yearData.filter(d => d.count > 0).length;

  // Weekly breakdown
  const weeklyBreakdown = useMemo((): WeekSummary[] => {
    const weeks: WeekSummary[] = [];
    const now = new Date();
    
    for (let w = 0; w < 12; w++) {
      const weekEnd = new Date(now.getTime() - w * 7 * 86400000);
      const weekStart = new Date(weekEnd.getTime() - 6 * 86400000);
      
      let totalCompleted = 0, totalTasks = 0;
      const categories: Record<string, number> = {};
      const days: { date: string; completed: number }[] = [];
      const completedItems: string[] = [];
      
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toDateString();
        let dayCount = 0;
        if (history[dateStr]) {
          Object.entries(history[dateStr]).forEach(([cat, val]: [string, any]) => {
            const count = typeof val === 'number' ? val : (val?.completed || 0);
            dayCount += count;
            categories[cat] = (categories[cat] || 0) + count;
            if (val?.items) completedItems.push(...val.items);
          });
        }
        days.push({ date: getDateStr(new Date(d)), completed: dayCount });
        totalCompleted += dayCount;
      }
      
      weeks.push({
        weekLabel: `${getDateStr(weekStart)} – ${getDateStr(weekEnd)}`,
        startDate: formatDate(weekStart),
        endDate: formatDate(weekEnd),
        totalCompleted,
        totalTasks,
        categories,
        days,
        completedItems
      });
    }
    return weeks;
  }, [history]);

  // Monthly breakdown
  const monthlyBreakdown = useMemo((): MonthSummary[] => {
    const months: MonthSummary[] = [];
    const now = new Date();
    
    for (let m = 0; m < 12; m++) {
      const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      let totalCompleted = 0;
      const categories: Record<string, number> = {};
      const completedItems: string[] = [];
      
      for (let d = new Date(month); d <= monthEnd && d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toDateString();
        if (history[dateStr]) {
          Object.entries(history[dateStr]).forEach(([cat, val]: [string, any]) => {
            const count = typeof val === 'number' ? val : (val?.completed || 0);
            totalCompleted += count;
            categories[cat] = (categories[cat] || 0) + count;
            if (val?.items) completedItems.push(...val.items);
          });
        }
      }
      
      months.push({
        monthLabel: getMonthStr(month),
        totalCompleted,
        weeks: Math.ceil(monthEnd.getDate() / 7),
        categories,
        completedItems
      });
    }
    return months;
  }, [history]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    if (count < 3) return 'bg-emerald-500/30';
    if (count < 6) return 'bg-emerald-500/50';
    if (count < 10) return 'bg-emerald-500/70';
    return 'bg-emerald-500';
  };

  const getMilestone = () => {
    if (streak >= 365) return { icon: <Trophy className="w-5 h-5" />, label: 'Legendary', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-600/10' };
    if (streak >= 100) return { icon: <Gem className="w-5 h-5" />, label: 'Diamond', color: 'text-cyan-400', bg: 'from-cyan-500/20 to-cyan-600/10' };
    if (streak >= 30) return { icon: <Medal className="w-5 h-5" />, label: 'Gold', color: 'text-yellow-500', bg: 'from-yellow-500/20 to-amber-600/10' };
    if (streak >= 7) return { icon: <Medal className="w-5 h-5" />, label: 'Silver', color: 'text-gray-300', bg: 'from-gray-400/20 to-gray-500/10' };
    if (streak >= 3) return { icon: <Award className="w-5 h-5" />, label: 'Bronze', color: 'text-orange-400', bg: 'from-orange-500/20 to-orange-600/10' };
    return { icon: <Sprout className="w-5 h-5" />, label: 'Starting', color: 'text-green-400', bg: 'from-green-500/20 to-green-600/10' };
  };

  const milestone = getMilestone();

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Group year data into weeks for GitHub-style grid
  const yearGrid = useMemo(() => {
    const weeks: (typeof yearData[0] | null)[][] = [];
    let currentWeek: (typeof yearData[0] | null)[] = [];
    
    // Pad first week
    if (yearData.length > 0) {
      for (let i = 0; i < yearData[0].dayOfWeek; i++) {
        currentWeek.push(null);
      }
    }
    
    yearData.forEach(day => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);
    
    return weeks;
  }, [yearData]);

  // Month labels for the grid
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    yearGrid.forEach((week, i) => {
      const firstDay = week.find(d => d !== null);
      if (firstDay && firstDay.month !== lastMonth) {
        labels.push({ month: MONTHS_SHORT[firstDay.month], weekIndex: i });
        lastMonth = firstDay.month;
      }
    });
    return labels;
  }, [yearGrid]);

  const sections = [
    { id: 'overview', label: 'Overview', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'yearly', label: '365 Days', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'weekly', label: 'Weekly', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'monthly', label: 'Monthly', icon: <Award className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className="space-y-3 page-enter">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-base font-bold flex-1">Progress & Stats</h2>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0",
              activeSection === s.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
            {s.icon}{s.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW SECTION */}
      {activeSection === 'overview' && (
        <>
          {/* Streak & Milestone */}
          <Card className="overflow-hidden border-border">
            <div className="h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-violet-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-black tabular-nums">{streak}</p>
                    <p className="text-[10px] text-muted-foreground">Day Streak</p>
                  </div>
                </div>
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br", milestone.bg)}>
                  <span className={milestone.color}>{milestone.icon}</span>
                  <div className="text-right">
                    <span className={cn("text-sm font-bold", milestone.color)}>{milestone.label}</span>
                    <p className="text-[9px] text-muted-foreground">Level</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Progress by Category */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />Current Progress
              </h3>
              {Object.entries(currentStats.stats).map(([cat, stat]) => {
                const pct = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                const catInfo = TODO_CATEGORIES.find(c => c.id === cat);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full", CATEGORY_COLORS[cat] || 'bg-primary')} />
                        <span className="text-xs font-medium capitalize">{catInfo?.label || cat}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stat.completed}/{stat.total}</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700 relative",
                        cat === 'daily' ? 'bg-blue-500' : cat === 'weekly' ? 'bg-teal-500' : cat === 'monthly' ? 'bg-violet-500' : 
                        cat === 'yearly' ? 'bg-amber-500' : cat === 'lifetime' ? 'bg-rose-500' : 'bg-emerald-500'
                      )} style={{ width: `${pct}%` }}>
                        {pct > 15 && (
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-white">{pct}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Overall */}
              <div className="pt-2 border-t border-border/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Overall</span>
                  <span className="text-xs font-bold gradient-text">
                    {currentStats.totalAll > 0 ? Math.round((currentStats.totalCompleted / currentStats.totalAll) * 100) : 0}%
                  </span>
                </div>
                <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-rose-500 rounded-full transition-all duration-700 relative"
                    style={{ width: `${currentStats.totalAll > 0 ? (currentStats.totalCompleted / currentStats.totalAll) * 100 : 0}%` }}>
                    <div className="absolute inset-0 bg-white/15 animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>{currentStats.totalCompleted} done</span>
                  <span>{currentStats.totalAll - currentStats.totalCompleted} remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-border">
              <CardContent className="p-3 text-center">
                <Target className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                <p className="text-xl font-black">{totalYearCompleted}</p>
                <p className="text-[9px] text-muted-foreground">This Year</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-3 text-center">
                <Calendar className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                <p className="text-xl font-black">{activeDaysYear}</p>
                <p className="text-[9px] text-muted-foreground">Active Days</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-3 text-center">
                <Folder className="w-4 h-4 mx-auto text-violet-400 mb-1" />
                <p className="text-xl font-black">{customFolders.length}</p>
                <p className="text-[9px] text-muted-foreground">Custom Lists</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 365-DAY HEATMAP */}
      {activeSection === 'yearly' && (
        <Card className="border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {new Date().getFullYear() + yearOffset} Activity
              </h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYearOffset(y => y - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {yearOffset !== 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setYearOffset(0)}>
                    Today
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setYearOffset(y => Math.min(y + 1, 0))} disabled={yearOffset >= 0}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stats summary */}
            <div className="flex items-center gap-4 text-xs">
              <span className="font-medium">{totalYearCompleted} <span className="text-muted-foreground">tasks</span></span>
              <span className="font-medium">{activeDaysYear} <span className="text-muted-foreground">active days</span></span>
            </div>

            {/* Month labels */}
            <div className="overflow-x-auto no-scrollbar">
              <div style={{ minWidth: `${yearGrid.length * 13 + 28}px` }}>
                <div className="flex gap-0 mb-1 ml-7">
                  {monthLabels.map((ml, i) => (
                    <span key={i} className="text-[9px] text-muted-foreground absolute" 
                      style={{ left: `${ml.weekIndex * 13 + 28}px`, position: 'relative' }}>
                      {ml.month}
                    </span>
                  ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-[2px]">
                  {/* Day labels */}
                  <div className="flex flex-col gap-[2px] pr-1">
                    {['', 'M', '', 'W', '', 'F', ''].map((d, i) => (
                      <span key={i} className="text-[8px] text-muted-foreground h-[11px] flex items-center">{d}</span>
                    ))}
                  </div>
                  
                  {yearGrid.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[2px]">
                      {Array.from({ length: 7 }, (_, di) => {
                        const day = week[di];
                        if (!day) return <div key={di} className="w-[11px] h-[11px]" />;
                        return (
                          <div key={di}
                            className={cn("w-[11px] h-[11px] rounded-[2px] transition-colors cursor-default", getHeatmapColor(day.count))}
                            title={`${day.date}: ${day.count} tasks completed`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-[2px]">
                {['bg-muted/30', 'bg-emerald-500/30', 'bg-emerald-500/50', 'bg-emerald-500/70', 'bg-emerald-500'].map((c, i) => (
                  <div key={i} className={cn("w-[11px] h-[11px] rounded-[2px]", c)} />
                ))}
              </div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WEEKLY BREAKDOWN */}
      {activeSection === 'weekly' && (
        <div className="space-y-2">
          {weeklyBreakdown.map((week, i) => (
            <Card key={i} className="border-border overflow-hidden">
              <CardContent className="p-0">
                <button onClick={() => setExpandedWeek(expandedWeek === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center",
                      i === 0 ? "bg-primary/20" : "bg-muted/30"
                    )}>
                      <span className={cn("text-sm font-bold", i === 0 ? "text-primary" : "text-muted-foreground")}>
                        W{12 - i}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium">{week.weekLabel}</p>
                      <p className="text-[10px] text-muted-foreground">{week.totalCompleted} tasks completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {week.days.map((d, di) => (
                        <div key={di} className={cn("w-1.5 h-4 rounded-full",
                          d.completed > 0 ? 'bg-emerald-500' : 'bg-muted/30'
                        )} />
                      ))}
                    </div>
                    {expandedWeek === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                
                {expandedWeek === i && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2 animate-fade-in">
                    {/* Daily breakdown */}
                    <div className="grid grid-cols-7 gap-1">
                      {week.days.map((d, di) => (
                        <div key={di} className="text-center">
                          <p className="text-[9px] text-muted-foreground">{d.date.split(' ')[0]}</p>
                          <div className={cn("w-full h-6 rounded-md flex items-center justify-center text-[10px] font-bold mt-0.5",
                            d.completed > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted/20 text-muted-foreground/40'
                          )}>
                            {d.completed || '–'}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Category breakdown */}
                    {Object.keys(week.categories).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(week.categories).map(([cat, count]) => (
                          <span key={cat} className={cn("text-[10px] px-2 py-0.5 rounded-full bg-muted/30 font-medium",
                            CATEGORY_TEXT_COLORS[cat] || 'text-foreground'
                          )}>
                            {cat}: {count}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {week.completedItems.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] text-muted-foreground font-medium">Completed:</p>
                        <div className="max-h-32 overflow-y-auto space-y-0.5">
                          {week.completedItems.slice(0, 15).map((item, ii) => (
                            <p key={ii} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CheckSquare className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{item}</span>
                            </p>
                          ))}
                          {week.completedItems.length > 15 && (
                            <p className="text-[10px] text-muted-foreground/60">+{week.completedItems.length - 15} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MONTHLY BREAKDOWN */}
      {activeSection === 'monthly' && (
        <div className="space-y-2">
          {monthlyBreakdown.map((month, i) => (
            <Card key={i} className="border-border overflow-hidden">
              <CardContent className="p-0">
                <button onClick={() => setExpandedMonth(expandedMonth === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center",
                      i === 0 ? "bg-violet-500/20" : "bg-muted/30"
                    )}>
                      <Calendar className={cn("w-4 h-4", i === 0 ? "text-violet-400" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{month.monthLabel}</p>
                      <p className="text-[10px] text-muted-foreground">{month.totalCompleted} tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-bold", month.totalCompleted > 0 ? 'text-violet-400' : 'text-muted-foreground/40')}>
                      {month.totalCompleted}
                    </span>
                    {expandedMonth === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                
                {expandedMonth === i && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2 animate-fade-in">
                    {Object.keys(month.categories).length > 0 ? (
                      <div className="space-y-1.5">
                        {Object.entries(month.categories).map(([cat, count]) => {
                          const pct = month.totalCompleted > 0 ? Math.round((count / month.totalCompleted) * 100) : 0;
                          return (
                            <div key={cat} className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", CATEGORY_COLORS[cat] || 'bg-primary')} />
                              <span className="text-[10px] font-medium flex-1 capitalize">{cat}</span>
                              <span className="text-[10px] text-muted-foreground">{count} ({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">No activity recorded</p>
                    )}
                    
                    {month.completedItems.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] text-muted-foreground font-medium">Completed tasks:</p>
                        <div className="max-h-32 overflow-y-auto space-y-0.5">
                          {month.completedItems.slice(0, 20).map((item, ii) => (
                            <p key={ii} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CheckSquare className="w-2.5 h-2.5 text-violet-400 shrink-0" />
                              <span className="truncate">{item}</span>
                            </p>
                          ))}
                          {month.completedItems.length > 20 && (
                            <p className="text-[10px] text-muted-foreground/60">+{month.completedItems.length - 20} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}