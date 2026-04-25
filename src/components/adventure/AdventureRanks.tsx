import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, MapPin, Plane, ChevronRight, Sparkles, Globe, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// League system
const LEAGUES = [
  { name: 'Bronze', min: 0, max: 49, icon: '🥉', gradient: 'linear-gradient(135deg, #431407, #7c2d12)' },
  { name: 'Silver', min: 50, max: 99, icon: '🥈', gradient: 'linear-gradient(135deg, #1c1c1c, #374151)' },
  { name: 'Gold', min: 100, max: 199, icon: '🥇', gradient: 'linear-gradient(135deg, #78350f, #92400e)' },
  { name: 'Diamond', min: 200, max: 499, icon: '💎', gradient: 'linear-gradient(135deg, #1e1b4b, #312e81)' },
  { name: 'Legend', min: 500, max: Infinity, icon: '👑', gradient: 'linear-gradient(135deg, #713f12, #78350f)' },
];

// Achievement badges
const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', desc: '1st challenge done', icon: '🎯', unlockAt: 1, type: 'challenges', gradient: 'linear-gradient(135deg, #14532d, #166534)' },
  { id: 'challenger', name: 'Challenger', desc: '10 challenges done', icon: '⚡', unlockAt: 10, type: 'challenges', gradient: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)' },
  { id: 'on_fire', name: 'On Fire', desc: '7 day streak', icon: '🔥', unlockAt: 7, type: 'streak', gradient: 'linear-gradient(135deg, #7c2d12, #b45309)' },
  { id: 'champion', name: 'Champion', desc: 'Reach #1 rank', icon: '🏆', unlockAt: 1, type: 'rank', gradient: 'linear-gradient(135deg, #78350f, #92400e)' },
  { id: 'explorer', name: 'Explorer', desc: 'Visit 10 places', icon: '🗺️', unlockAt: 10, type: 'places', gradient: 'linear-gradient(135deg, #164e63, #0c4a6e)' },
  { id: 'storyteller', name: 'Storyteller', desc: 'Share 3 stories', icon: '✈️', unlockAt: 3, type: 'stories', gradient: 'linear-gradient(135deg, #4a044e, #6b21a8)' },
  { id: 'nepal_pride', name: 'Nepal Pride', desc: 'Visit 5 Nepal places', icon: '🇳🇵', unlockAt: 5, type: 'nepal_places', gradient: 'linear-gradient(135deg, #0f4c35, #065f46)' },
  { id: 'diamond_league', name: 'Diamond', desc: 'Reach Diamond league', icon: '💎', unlockAt: 200, type: 'points', gradient: 'linear-gradient(135deg, #1e1b4b, #312e81)' },
  { id: 'legend', name: 'Legend', desc: '500+ points', icon: '👑', unlockAt: 500, type: 'points', gradient: 'linear-gradient(135deg, #713f12, #78350f)' },
];

interface AdventureRanksProps {
  userPoints?: number;
  userXP?: number;
  challengeCount?: number;
  placesCount?: number;
  storiesCount?: number;
  travelSavesCount?: number;
  travelViewsCount?: number;
  travelLikesCount?: number;
  onNavigate?: (tab: string) => void;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl: string;
  country: string;
  points: number;
}

export function AdventureRanks({
  userPoints: userPointsProp,
  userXP,
  challengeCount = 0,
  placesCount = 0,
  storiesCount = 0,
  travelSavesCount = 0,
  travelViewsCount = 0,
  travelLikesCount = 0,
  onNavigate = () => {}
}: AdventureRanksProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userPoints = typeof userPointsProp === 'number' ? userPointsProp : (userXP || 0);
  const [scope, setScope] = useState<'global' | 'country'>('global');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [animatedRank, setAnimatedRank] = useState(0);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserAbsoluteRank, setCurrentUserAbsoluteRank] = useState<number | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const topLeaderboard = useMemo(() => leaderboard.slice(0, 10), [leaderboard]);

  const currentLeague = LEAGUES.find(l => userPoints >= l.min && userPoints <= l.max) || LEAGUES[0];
  const nextLeague = LEAGUES[LEAGUES.indexOf(currentLeague) + 1];
  const progressToNext = nextLeague
    ? ((userPoints - currentLeague.min) / (nextLeague.min - currentLeague.min)) * 100
    : 100;

  const unlockedAchievements = ACHIEVEMENTS.filter(a => {
    if (a.type === 'challenges') return challengeCount >= a.unlockAt;
    if (a.type === 'places') return placesCount >= a.unlockAt;
    if (a.type === 'stories') return storiesCount >= a.unlockAt;
    if (a.type === 'points') return userPoints >= a.unlockAt;
    if (a.type === 'rank') return currentUserAbsoluteRank === 1;
    return false;
  });

  useEffect(() => {
    const targetRank = currentUserAbsoluteRank || 0;
    if (targetRank <= 0) {
      setAnimatedRank(0);
      return;
    }
    let current = Math.max(targetRank + 8, 12);
    const interval = setInterval(() => {
      current -= 1;
      setAnimatedRank(Math.max(current, targetRank));
      if (current <= targetRank) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [currentUserAbsoluteRank]);

  useEffect(() => {
    let current = 0;
    const step = Math.ceil(userPoints / 20) || 1;
    const interval = setInterval(() => {
      current = Math.min(current + step, userPoints);
      setAnimatedPoints(current);
      if (current >= userPoints) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [userPoints]);

  const loadLeaderboard = async () => {
    if (!user?.id) return;
    setLoadingLeaderboard(true);
    try {
      const { data: pointsRows } = await supabase.from('user_points').select('user_id, total_points').order('total_points', { ascending: false }).limit(200);
      const userIds = (pointsRows || []).map(row => row.user_id);
      const { data: profileRows } = await supabase.from('profiles').select('id, name, avatar_url, country').in('id', userIds.length > 0 ? userIds : [user.id]);
      const profileMap = new Map(profileRows?.filter(p => p && p.id).map(p => [p.id, p]));
      const pointsMap = new Map(pointsRows?.filter(r => r && r.user_id).map(r => [r.user_id, r.total_points]));
      if (!pointsMap.has(user.id)) pointsMap.set(user.id, userPoints);

      const rows = (pointsRows || []).filter(row => row && row.user_id).map((row: any) => {
        const p = profileMap.get(row.user_id);
        return {
          userId: row.user_id,
          name: p?.name || 'Explorer',
          avatarUrl: p?.avatar_url || '',
          country: p?.country || '',
          points: pointsMap.get(row.user_id) || 0,
        };
      });

      const scoped = rows.filter((entry) => {
        if (scope === 'global') return true;
        return (entry.country || '').toLowerCase() === (profile?.country || '').toLowerCase();
      });

      scoped.sort((a, b) => b.points - a.points);
      const absoluteRank = scoped.findIndex((entry) => entry.userId === user.id);
      setCurrentUserAbsoluteRank(absoluteRank >= 0 ? absoluteRank + 1 : null);
      setLeaderboard(scoped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => { loadLeaderboard(); }, [scope, user?.id, userPoints]);

  return (
    <div className="space-y-6 pb-12 w-full">
      <div className="relative mx-4 p-6 rounded-[32px] overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #0B0D1F 0%, #161B33 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <div className="absolute -right-10 -top-10 text-[180px] opacity-[0.03] pointer-events-none select-none">🏆</div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-primary/90">Your Rank</span>
          </div>
          <button onClick={() => setScope(scope === 'global' ? 'country' : 'global')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
            {scope === 'global' ? <Globe className="w-3 h-3" /> : <Flag className="w-3 h-3" />}
            {scope === 'global' ? 'World' : (profile?.country || 'Nepal')}
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
            <span className="text-[84px] font-black leading-none bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {currentUserAbsoluteRank ? `#${animatedRank}` : '---'}
            </span>
            <div className="absolute -inset-4 bg-primary/20 blur-[40px] -z-10 rounded-full" />
          </motion.div>
          <div className="mt-4 flex items-center gap-3">
            <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-black uppercase tracking-widest">
              ⚡ {animatedPoints} Points
            </div>
            <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[11px] font-black uppercase tracking-widest">
              🎯 {challengeCount} Done
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Next: {nextLeague?.name || 'Legend'} League</span>
            <span className="text-[10px] font-black text-white">{Math.round(progressToNext)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} className="h-full bg-primary" />
          </div>
        </div>
      </div>

      <div className="mx-4 grid grid-cols-1 gap-4">
        <div className="rounded-[24px] bg-[#0B0D1F] border border-white/5 p-5 shadow-xl">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Achievements</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {ACHIEVEMENTS.map(ach => {
              const isUnlocked = unlockedAchievements.some(a => a.id === ach.id);
              return (
                <div key={ach.id} className={cn("shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 border", isUnlocked ? "border-white/10 shadow-lg" : "opacity-20 grayscale border-transparent bg-white/5")} style={{ background: isUnlocked ? ach.gradient : undefined }} title={ach.name}>
                  {ach.icon}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] bg-[#0B0D1F] border border-white/5 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Leaderboard</h3>
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{scope}</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {leaderboard.map((entry, idx) => {
              if (!entry || !entry.userId) return null;
              return (
                <div key={entry.userId} className={cn("flex items-center gap-3 p-4 border-b border-white/5 last:border-0", entry.userId === user?.id && "bg-primary/5")}>
                  <span className={cn("w-6 text-[11px] font-black", idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-700" : "text-slate-600")}>
                    {idx + 1}
                  </span>
                  <Avatar className="w-9 h-9 border border-white/10">
                    <AvatarImage src={entry.avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-slate-800 text-[10px] font-black text-primary">{entry.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{entry.name || 'Explorer'}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{entry.country || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">{entry.points}</p>
                    <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">PTS</p>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      </div>
    </div>
  );
}
