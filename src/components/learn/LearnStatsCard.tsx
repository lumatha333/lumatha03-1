import { useState, useMemo } from 'react';
import { TrendingUp, Zap, Star, Target } from 'lucide-react';

interface LearnStats {
  dailyActive: number;
  weeklyViews: number;
  monthlyAchievements: number;
  currentStreak: number;
}

interface LearnStatsCardProps {
  stats: LearnStats;
}

/**
 * Professional Learn Statistics Card
 * Desktop: 4-column grid with RGB border lighting
 * Mobile: Vertical stack with animated counter
 */
export function LearnStatsCard({ stats }: LearnStatsCardProps) {
  const [expandedOnMobile, setExpandedOnMobile] = useState(false);

  const statItems = useMemo(
    () => [
      { icon: Zap, label: 'Daily Active',  value: stats.dailyActive, color: 'from-blue-500 to-cyan-500' },
      { icon: TrendingUp, label: 'Weekly Views', value: stats.weeklyViews, color: 'from-emerald-500 to-teal-500' },
      { icon: Target, label: 'Monthly Goals', value: stats.monthlyAchievements, color: 'from-amber-500 to-orange-500' },
      { icon: Star, label: 'Current Streak', value: stats.currentStreak, color: 'from-purple-500 to-pink-500' },
    ],
    [stats],
  );

  return (
    <div
      className="mx-4 mt-6 rounded-2xl p-4 overflow-hidden"
      style={{
        background: 'rgba(17, 24, 39, 0.8)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        boxShadow: `
          inset 0 1px 2px rgba(59, 130, 246, 0.1),
          0 0 24px rgba(59, 130, 246, 0.12),
          0 0 32px rgba(34, 197, 94, 0.08),
          0 0 40px rgba(239, 68, 68, 0.06)
        `,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header with title and RGB accent bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'rgba(148, 163, 184, 0.15)' }}>
        <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Learning Progress
        </h3>
        <button
          onClick={() => setExpandedOnMobile(!expandedOnMobile)}
          className="sm:hidden text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expandedOnMobile ? '▼' : '▶'}
        </button>

        {/* RGB accent bar (desktop only) */}
        <div className="hidden sm:flex gap-1 h-1">
          <div className="flex-1 rounded-full bg-gradient-to-r from-blue-500 to-transparent" />
          <div className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-transparent" />
          <div className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-transparent" />
        </div>
      </div>

      {/* Desktop Grid - 4 columns */}
      <div className="hidden sm:grid grid-cols-4 gap-3">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="relative group p-3 rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105"
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1.5px solid rgba(148, 163, 184, 0.2)',
                boxShadow: `
                  inset 0 1px 2px rgba(${item.color === 'from-blue-500 to-cyan-500' ? '59, 130, 246' : item.color === 'from-emerald-500 to-teal-500' ? '16, 185, 129' : item.color === 'from-amber-500 to-orange-500' ? '217, 119, 6' : '168, 85, 247'}, 0.15),
                  0 0 16px rgba(${item.color === 'from-blue-500 to-cyan-500' ? '59, 130, 246' : item.color === 'from-emerald-500 to-teal-500' ? '16, 185, 129' : item.color === 'from-amber-500 to-orange-500' ? '217, 119, 6' : '168, 85, 247'}, 0.1)
                `,
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                background: `linear-gradient(135deg, rgba(${item.color === 'from-blue-500 to-cyan-500' ? '59, 130, 246' : item.color === 'from-emerald-500 to-teal-500' ? '16, 185, 129' : item.color === 'from-amber-500 to-orange-500' ? '217, 119, 6' : '168, 85, 247'}, 0.05), transparent)`,
              }} />
              <div className="relative z-10">
                <Icon className="w-5 h-5 mb-2" style={{
                  color: item.color === 'from-blue-500 to-cyan-500' ? '#3B82F6' : item.color === 'from-emerald-500 to-teal-500' ? '#10B981' : item.color === 'from-amber-500 to-orange-500' ? '#D97706' : '#A855F7',
                }} />
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Stack - Vertical with toggle */}
      {expandedOnMobile && (
        <div className="sm:hidden space-y-2">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-between p-2 rounded-lg"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{
                    color: item.color === 'from-blue-500 to-cyan-500' ? '#3B82F6' : item.color === 'from-emerald-500 to-teal-500' ? '#10B981' : item.color === 'from-amber-500 to-orange-500' ? '#D97706' : '#A855F7',
                  }} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-sm font-bold text-white">{item.value}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
