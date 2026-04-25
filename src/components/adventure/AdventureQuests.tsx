import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { SYSTEM_CHALLENGES } from '@/data/adventureChallenges';
import type { Challenge } from '@/data/adventureChallenges';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All', icon: '🌟' },
  { id: 'health', label: 'Health', icon: '💚' },
  { id: 'fitness', label: 'Fitness', icon: '🏃' },
  { id: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'creativity', label: 'Creative', icon: '🎨' },
  { id: 'social', label: 'Social', icon: '🤝' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🌟' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'cooking', label: 'Cooking', icon: '🍳' },
  { id: 'outdoor', label: 'Outdoor', icon: '⛰️' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'environment', label: 'Eco', icon: '🌱' },
  { id: 'nepal', label: 'Nepal', icon: '🏔️' },
  { id: 'reading', label: 'Reading', icon: '📖' },
];

const DIFFICULTY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'easy', label: 'Easy', durations: ['daily'] },
  { id: 'medium', label: 'Medium', durations: ['weekly'] },
  { id: 'hard', label: 'Hard', durations: ['monthly'] },
  { id: 'epic', label: 'Epic', durations: ['yearly', 'lifetime'] },
];

const MAX_DISPLAYED_QUESTS = 120;
const MAX_DAILY_GOAL = 20;

function getDifficulty(duration: Challenge['duration']): { label: string; color: string } {
  switch (duration) {
    case 'daily': return { label: 'Easy', color: 'bg-green-500/20 text-green-400' };
    case 'weekly': return { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' };
    case 'monthly': return { label: 'Hard', color: 'bg-orange-500/20 text-orange-400' };
    case 'yearly': return { label: 'Epic', color: 'bg-purple-500/20 text-purple-400' };
    case 'lifetime': return { label: 'Epic', color: 'bg-red-500/20 text-red-400' };
  }
}

function getDurationLabel(duration: Challenge['duration']): string {
  return duration.charAt(0).toUpperCase() + duration.slice(1);
}

interface AdventureQuestsProps {
  userId?: string;
  onPointsEarned?: (delta: number) => void;
}

export function AdventureQuests({ userId, onPointsEarned }: AdventureQuestsProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayKey = new Date().toISOString().slice(0, 10);
  const storageKey = userId ? `adv_done_${userId}_${todayKey}` : null;

  // Load completed IDs from localStorage on mount / user change
  useEffect(() => {
    if (!storageKey) { setCompletedIds(new Set()); return; }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setCompletedIds(new Set(Array.isArray(stored) ? stored : []));
    } catch { setCompletedIds(new Set()); }
  }, [storageKey]);

  const dailyChallenges = useMemo(() => SYSTEM_CHALLENGES.filter(c => c.duration === 'daily'), []);
  const dailyChallengeIds = useMemo(() => new Set(dailyChallenges.map(c => c.id)), [dailyChallenges]);

  const toggleComplete = async (id: string) => {
    const isCompleting = !completedIds.has(id);
    const next = new Set(completedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);

    setCompletedIds(next);

    // Persist to localStorage
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch {}
    }

    // Award 1 point per new completion and sync daily count to DB
    if (isCompleting && userId) {
      onPointsEarned?.(1);
      const dailyCount = Math.min(
        [...next].filter(cid => dailyChallengeIds.has(cid)).length,
        10,
      );
      supabase
        .from('challenge_daily_completions' as any)
        .upsert({ user_id: userId, date_key: todayKey, count: dailyCount }, { onConflict: 'user_id,date_key' })
        .catch(console.error);
    }
  };

  const filteredChallenges = useMemo(() => {
    const diffFilter = DIFFICULTY_FILTERS.find(d => d.id === selectedDifficulty);
    return SYSTEM_CHALLENGES.filter(c => {
      if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
      if (diffFilter && diffFilter.durations && !diffFilter.durations.includes(c.duration)) return false;
      if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).slice(0, MAX_DISPLAYED_QUESTS);
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const completedToday = [...completedIds].filter(id => dailyChallengeIds.has(id)).length;
  const goal = Math.min(dailyChallenges.length, MAX_DAILY_GOAL);
  const progressPct = goal > 0 ? Math.min(Math.round((completedToday / goal) * 100), 100) : 0;

  return (
    <div className="w-full pb-24">
      {/* Progress Header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Daily Progress</p>
            <p className="text-sm font-black text-white mt-0.5">
              <span className="text-primary">{completedToday}</span> challenges completed today
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-primary">{progressPct}%</p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPct, 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search quests..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-slate-900/50 border-white/5 rounded-full pl-11 pr-10 text-white placeholder:text-slate-600 font-bold focus-visible:ring-primary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3" role="radiogroup" aria-label="Filter by difficulty">
        {DIFFICULTY_FILTERS.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDifficulty(d.id)}
            role="radio"
            aria-checked={selectedDifficulty === d.id}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
              selectedDifficulty === d.id
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-transparent text-slate-600 border-white/5'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-4" role="radiogroup" aria-label="Filter by category">
        {CATEGORY_FILTERS.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            role="radio"
            aria-checked={selectedCategory === cat.id}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
              selectedCategory === cat.id
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-transparent text-slate-600 border-white/5'
            }`}
          >
            <span className="text-xs">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Challenges Count */}
      <div className="px-4 mb-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
          {filteredChallenges.length} quests found
        </p>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4">
        <AnimatePresence mode="popLayout">
          {filteredChallenges.map((challenge, index) => {
            const isCompleted = completedIds.has(challenge.id);
            const diff = getDifficulty(challenge.duration);
            return (
              <motion.div
                key={challenge.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`bg-slate-900/60 border rounded-2xl p-4 transition-all ${
                  isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-base leading-none">{challenge.categoryIcon}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{challenge.category}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${diff.color}`}>{diff.label}</span>
                    </div>
                    <p className={`text-sm font-bold leading-snug ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                      {challenge.title}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => toggleComplete(challenge.id)}
                    whileTap={{ scale: 0.85 }}
                    aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    className={`w-8 h-8 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/30'
                        : 'border-white/20 text-slate-600 hover:border-white/40 hover:text-slate-400'
                    }`}
                  >
                    {isCompleted
                      ? <Check className="w-4 h-4 text-white" />
                      : <Plus className="w-4 h-4" />
                    }
                  </motion.button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-500 uppercase tracking-wider">
                    {getDurationLabel(challenge.duration)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredChallenges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm font-black text-slate-400 uppercase tracking-wider">No quests found</p>
          <p className="text-xs text-slate-600 mt-1">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
}
