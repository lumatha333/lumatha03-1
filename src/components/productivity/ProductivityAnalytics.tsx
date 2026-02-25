import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, CheckSquare, Mountain, Trophy, Flame, Calendar, 
  TrendingUp, Target, Award, Sparkles, ArrowUpRight, Clock
} from 'lucide-react';

const TODO_KEY = 'lumatha_todos_v2';
const CHALLENGE_KEY = 'lumatha_adventure_data';
const ANALYTICS_HISTORY_KEY = 'lumatha_productivity_history';

interface DayRecord {
  date: string;
  todosCompleted: number;
  challengesCompleted: number;
  placesVisited: number;
}

function getToday() { return new Date().toISOString().split('T')[0]; }
function getLast7Days() {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().split('T')[0]); }
  return days;
}
function getDayLabel(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }); }

export function ProductivityAnalytics() {
  const [history, setHistory] = useState<Record<string, DayRecord>>({});
  const [todayStats, setTodayStats] = useState({ todosCompleted: 0, challengesCompleted: 0, totalTodos: 0, totalChallenges: 0, placesVisited: 0 });

  useEffect(() => {
    // Load history
    const saved = localStorage.getItem(ANALYTICS_HISTORY_KEY);
    if (saved) setHistory(JSON.parse(saved));

    // Calculate today's stats
    const calcStats = () => {
      let todosCompleted = 0, totalTodos = 0;
      try {
        const todosRaw = localStorage.getItem(TODO_KEY);
        if (todosRaw) {
          const todos = JSON.parse(todosRaw);
          if (Array.isArray(todos)) {
            totalTodos = todos.length;
            todosCompleted = todos.filter((t: any) => t.completed).length;
          } else if (typeof todos === 'object') {
            Object.values(todos).forEach((cat: any) => {
              if (Array.isArray(cat)) { totalTodos += cat.length; todosCompleted += cat.filter((t: any) => t.completed).length; }
            });
          }
        }
      } catch {}

      let challengesCompleted = 0, totalChallenges = 0, placesVisited = 0;
      try {
        const advRaw = localStorage.getItem(CHALLENGE_KEY);
        if (advRaw) {
          const adv = JSON.parse(advRaw);
          if (adv.completedChallenges) { challengesCompleted = Object.keys(adv.completedChallenges).length; }
          if (adv.visitedPlaces) { placesVisited = Object.keys(adv.visitedPlaces).length; }
          totalChallenges = 50; // approximate
        }
      } catch {}

      setTodayStats({ todosCompleted, challengesCompleted, totalTodos, totalChallenges, placesVisited });

      // Save today's record
      const today = getToday();
      const newHistory = { ...history };
      newHistory[today] = { date: today, todosCompleted, challengesCompleted, placesVisited };
      // Keep 30 days
      const keys = Object.keys(newHistory).sort();
      if (keys.length > 30) keys.slice(0, keys.length - 30).forEach(k => delete newHistory[k]);
      localStorage.setItem(ANALYTICS_HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    };

    calcStats();
    const interval = setInterval(calcStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    return getLast7Days().map(d => ({
      day: getDayLabel(d), date: d,
      todos: history[d]?.todosCompleted || 0,
      challenges: history[d]?.challengesCompleted || 0,
      places: history[d]?.placesVisited || 0,
    }));
  }, [history]);

  const maxVal = Math.max(...chartData.map(d => d.todos + d.challenges), 1);
  const totalWeekTodos = chartData.reduce((s, d) => s + d.todos, 0);
  const totalWeekChallenges = chartData.reduce((s, d) => s + d.challenges, 0);
  const streak = useMemo(() => {
    let count = 0;
    const days = getLast7Days().reverse();
    for (const d of days) {
      if ((history[d]?.todosCompleted || 0) > 0) count++;
      else break;
    }
    return count;
  }, [history]);

  const todoPercent = todayStats.totalTodos > 0 ? Math.round((todayStats.todosCompleted / todayStats.totalTodos) * 100) : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Today's Overview */}
      <Card className="glass-card border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Today's Progress</h3>
                <p className="text-[10px] text-muted-foreground">{todoPercent}% tasks done</p>
              </div>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                <Flame className="w-3 h-3" />{streak} day streak
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/10">
              <CheckSquare className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <p className="text-lg font-bold text-emerald-400">{todayStats.todosCompleted}</p>
              <p className="text-[9px] text-muted-foreground">Tasks Done</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-violet-500/10 border border-violet-500/10">
              <Trophy className="w-4 h-4 mx-auto text-violet-400 mb-1" />
              <p className="text-lg font-bold text-violet-400">{todayStats.challengesCompleted}</p>
              <p className="text-[9px] text-muted-foreground">Challenges</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/10">
              <Mountain className="w-4 h-4 mx-auto text-blue-400 mb-1" />
              <p className="text-lg font-bold text-blue-400">{todayStats.placesVisited}</p>
              <p className="text-[9px] text-muted-foreground">Places</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Overall</span>
              <span>{todayStats.todosCompleted}/{todayStats.totalTodos} tasks</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${todoPercent}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Activity Chart */}
      <Card className="glass-card border-border overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">7-Day Activity</h3>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" />Tasks</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-violet-500" />Challenges</div>
            </div>
          </div>

          <div className="flex items-end gap-1.5 h-24">
            {chartData.map((d, i) => {
              const total = d.todos + d.challenges;
              const height = maxVal > 0 ? Math.max((total / maxVal) * 100, 4) : 4;
              const isToday = d.date === getToday();
              const todoHeight = total > 0 ? (d.todos / total) * height : 0;
              const challengeHeight = total > 0 ? (d.challenges / total) * height : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-medium text-muted-foreground">{total > 0 ? total : ''}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '72px' }}>
                    <div className="w-full flex flex-col justify-end rounded-t-md overflow-hidden" style={{ height: `${height}%`, minHeight: '3px' }}>
                      {challengeHeight > 0 && <div className={`w-full ${isToday ? 'bg-violet-500' : 'bg-violet-500/30'}`} style={{ height: `${(d.challenges / total) * 100}%` }} />}
                      {todoHeight > 0 && <div className={`w-full ${isToday ? 'bg-emerald-500' : 'bg-emerald-500/30'}`} style={{ height: `${(d.todos / total) * 100}%` }} />}
                    </div>
                  </div>
                  <span className={`text-[9px] ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="glass-card border-border">
          <CardContent className="p-3 text-center">
            <Award className="w-5 h-5 mx-auto text-amber-400 mb-1" />
            <p className="text-xl font-bold">{totalWeekTodos}</p>
            <p className="text-[9px] text-muted-foreground">Tasks This Week</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border">
          <CardContent className="p-3 text-center">
            <Sparkles className="w-5 h-5 mx-auto text-violet-400 mb-1" />
            <p className="text-xl font-bold">{totalWeekChallenges}</p>
            <p className="text-[9px] text-muted-foreground">Challenges This Week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
