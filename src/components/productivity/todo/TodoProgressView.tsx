import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, TrendingUp, Award, Target, Flame, Trophy, Gem, Medal, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoProgressViewProps {
  onBack: () => void;
}

const HISTORY_KEY = 'lumatha_todo_history';
const STREAK_KEY = 'lumatha_streak';

export function TodoProgressView({ onBack }: TodoProgressViewProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  const history = useMemo(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : {};
  }, []);

  const streak = useMemo(() => {
    const saved = localStorage.getItem(STREAK_KEY);
    if (saved) {
      const { count } = JSON.parse(saved);
      return count;
    }
    return 0;
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    let totalCompleted = 0;
    let dailyCompleted = 0;
    let weeklyCompleted = 0;
    let monthlyCompleted = 0;
    let yearlyCompleted = 0;
    let lifetimeCompleted = 0;
    let activeDays = 0;

    Object.entries(history).forEach(([dateStr, categories]: [string, any]) => {
      const date = new Date(dateStr);
      if (date >= startDate) {
        activeDays++;
        Object.entries(categories).forEach(([category, count]: [string, any]) => {
          totalCompleted += count;
          switch (category) {
            case 'daily': dailyCompleted += count; break;
            case 'weekly': weeklyCompleted += count; break;
            case 'monthly': monthlyCompleted += count; break;
            case 'yearly': yearlyCompleted += count; break;
            case 'lifetime': lifetimeCompleted += count; break;
          }
        });
      }
    });

    return {
      totalCompleted,
      dailyCompleted,
      weeklyCompleted,
      monthlyCompleted,
      yearlyCompleted,
      lifetimeCompleted,
      activeDays
    };
  }, [history, timeRange]);

  // Generate calendar heatmap data
  const heatmapData = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toDateString();
      let count = 0;
      
      if (history[dateStr]) {
        Object.values(history[dateStr]).forEach((c: any) => { count += c; });
      }
      
      days.push({ date: dateStr, count });
    }
    
    return days;
  }, [history]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-muted/50';
    if (count < 3) return 'bg-primary/30';
    if (count < 6) return 'bg-primary/50';
    if (count < 10) return 'bg-primary/70';
    return 'bg-primary';
  };

  const getMilestone = (): { icon: React.ReactNode; label: string; color: string } => {
    if (streak >= 365) return { icon: <Trophy className="w-6 h-6" />, label: 'Legendary', color: 'text-yellow-400' };
    if (streak >= 100) return { icon: <Gem className="w-6 h-6" />, label: 'Diamond', color: 'text-cyan-400' };
    if (streak >= 30) return { icon: <Medal className="w-6 h-6" />, label: 'Gold', color: 'text-yellow-500' };
    if (streak >= 7) return { icon: <Medal className="w-6 h-6" />, label: 'Silver', color: 'text-gray-300' };
    if (streak >= 3) return { icon: <Award className="w-6 h-6" />, label: 'Bronze', color: 'text-orange-400' };
    return { icon: <Sprout className="w-6 h-6" />, label: 'Starting', color: 'text-green-400' };
  };

  const milestone = getMilestone();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">Your Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Streak & Milestone */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold">{streak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={milestone.color}>{milestone.icon}</span>
                <span className={cn("font-semibold", milestone.color)}>{milestone.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">Current Level</p>
            </div>
          </div>

          {/* Time Range Tabs */}
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="flex-1"
              >
                {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'Year'}
              </Button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-muted/30 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stats.totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Tasks Completed</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{stats.activeDays}</p>
              <p className="text-xs text-muted-foreground">Active Days</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">By Category</p>
            <div className="space-y-2">
              {[
                { label: 'Daily', count: stats.dailyCompleted, color: 'bg-blue-500' },
                { label: 'Weekly', count: stats.weeklyCompleted, color: 'bg-green-500' },
                { label: 'Monthly', count: stats.monthlyCompleted, color: 'bg-purple-500' },
                { label: 'Yearly', count: stats.yearlyCompleted, color: 'bg-orange-500' },
                { label: 'Lifetime', count: stats.lifetimeCompleted, color: 'bg-pink-500' }
              ].map(cat => (
                <div key={cat.label} className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", cat.color)} />
                  <span className="flex-1 text-sm">{cat.label}</span>
                  <span className="font-medium">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Last 30 Days Activity</p>
            <div className="flex flex-wrap gap-1">
              {heatmapData.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-4 h-4 rounded-sm transition-colors",
                    getHeatmapColor(day.count)
                  )}
                  title={`${day.date}: ${day.count} tasks`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-muted/50" />
                <div className="w-3 h-3 rounded-sm bg-primary/30" />
                <div className="w-3 h-3 rounded-sm bg-primary/50" />
                <div className="w-3 h-3 rounded-sm bg-primary/70" />
                <div className="w-3 h-3 rounded-sm bg-primary" />
              </div>
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
