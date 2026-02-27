import { useState, useEffect, useRef, useCallback } from 'react';
import { DailyDoseCard } from '@/components/feed/DailyDoseCard';

import { 
  Gamepad2, Shuffle, Mic, Brain, Target, Paintbrush, Users, Calendar,
  Play, Pause, Check, X, Volume2, VolumeX, RefreshCw, Trophy, Star,
  Timer, Zap, Lock, ArrowRight, ChevronLeft, ChevronRight, Square,
  Circle, Minus, Eraser, Undo2, Send, StopCircle, Award, TrendingUp,
  Crown, Medal, Flame, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useGameSounds, SoundType } from '@/hooks/useGameSounds';
import { 
  randomChallenges, voicePractices, imposterSets, stressObjects,
  drawChallenges, roleScenarios, dailyChallengePool 
} from '@/data/funpunChallenges';

// Game modes configuration - Enhanced with more games
const gameModes = [
  { id: 'stats', name: 'Stats', icon: BarChart3, color: 'from-yellow-500 to-amber-500', desc: 'Your performance & leaderboards' },
  { id: 'random', name: 'Brain Logic', icon: Shuffle, color: 'from-violet-500 to-purple-600', desc: 'Puzzle & brain challenges' },
  { id: 'voice', name: 'Voice Trainer', icon: Mic, color: 'from-blue-500 to-cyan-500', desc: 'Voice clarity training' },
  { id: 'imposter', name: 'Pattern Detective', icon: Brain, color: 'from-amber-500 to-orange-500', desc: 'Logic-based detection' },
  { id: 'stress', name: 'Stress Breaker', icon: Target, color: 'from-red-500 to-rose-500', desc: 'Controlled release room' },
  { id: 'draw', name: 'Creative Canvas', icon: Paintbrush, color: 'from-green-500 to-emerald-500', desc: 'Drawing challenges' },
  { id: 'role', name: 'Decision Master', icon: Users, color: 'from-indigo-500 to-blue-600', desc: 'Scenario decisions' },
  { id: 'daily', name: 'Daily Quest', icon: Calendar, color: 'from-pink-500 to-fuchsia-500', desc: 'Daily challenge' },
];

// Level badges configuration
const LEVEL_BADGES = [
  { level: 1, name: 'Beginner', icon: '🌱', color: 'bg-green-500' },
  { level: 5, name: 'Explorer', icon: '🔍', color: 'bg-blue-500' },
  { level: 10, name: 'Challenger', icon: '⚔️', color: 'bg-purple-500' },
  { level: 20, name: 'Master', icon: '🏆', color: 'bg-yellow-500' },
  { level: 50, name: 'Legend', icon: '👑', color: 'bg-amber-500' },
  { level: 100, name: 'Mythical', icon: '🌟', color: 'bg-gradient-to-r from-pink-500 to-violet-500' },
];

// Achievement badges
const ACHIEVEMENTS = [
  { id: 'first_win', name: 'First Victory', desc: 'Complete your first challenge', icon: '🎯' },
  { id: 'streak_5', name: 'Hot Streak', desc: '5 correct in a row', icon: '🔥' },
  { id: 'streak_10', name: 'On Fire', desc: '10 correct in a row', icon: '💥' },
  { id: 'perfect_day', name: 'Perfect Day', desc: 'Complete all daily challenges', icon: '⭐' },
  { id: 'brain_master', name: 'Brain Master', desc: 'Complete 50 logic puzzles', icon: '🧠' },
  { id: 'voice_pro', name: 'Voice Pro', desc: 'Complete 20 voice challenges', icon: '🎤' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Complete a challenge in under 3 seconds', icon: '⚡' },
  { id: 'level_10', name: 'Rising Star', desc: 'Reach level 10', icon: '🌟' },
];

// Progress storage keys
const STORAGE_KEYS = {
  completedChallenges: 'funpun_completed',
  incorrectChallenges: 'funpun_incorrect',
  dailyStreak: 'funpun_streak',
  totalPoints: 'funpun_points',
  currentLevel: 'funpun_level',
  completedImposters: 'funpun_imposters',
  completedVoice: 'funpun_voice',
  completedDraw: 'funpun_draw',
  completedRole: 'funpun_role',
  achievements: 'funpun_achievements',
  gamesPlayed: 'funpun_games_played',
  bestStreak: 'funpun_best_streak',
  totalTime: 'funpun_total_time',
  weeklyPoints: 'funpun_weekly',
  lastPlayedDate: 'funpun_last_date',
};

export default function FunPun() {
  const [activeMode, setActiveMode] = useState('stats');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [incorrectIds, setIncorrectIds] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [achievements, setAchievements] = useState<Set<string>>(new Set());
  const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'regional'>('global');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { playSound, playSuccessMelody, playFailureMelody, playLevelUpMelody } = useGameSounds(soundEnabled);

  // Load progress from localStorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem(STORAGE_KEYS.completedChallenges);
    const savedIncorrect = localStorage.getItem(STORAGE_KEYS.incorrectChallenges);
    const savedStreak = localStorage.getItem(STORAGE_KEYS.dailyStreak);
    const savedPoints = localStorage.getItem(STORAGE_KEYS.totalPoints);
    const savedLevel = localStorage.getItem(STORAGE_KEYS.currentLevel);
    const savedBestStreak = localStorage.getItem(STORAGE_KEYS.bestStreak);
    const savedGamesPlayed = localStorage.getItem(STORAGE_KEYS.gamesPlayed);
    const savedAchievements = localStorage.getItem(STORAGE_KEYS.achievements);

    if (savedCompleted) setCompletedIds(new Set(JSON.parse(savedCompleted)));
    if (savedIncorrect) setIncorrectIds(new Set(JSON.parse(savedIncorrect)));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedPoints) setScore(parseInt(savedPoints));
    if (savedLevel) setUserLevel(parseInt(savedLevel));
    if (savedBestStreak) setBestStreak(parseInt(savedBestStreak));
    if (savedGamesPlayed) setGamesPlayed(parseInt(savedGamesPlayed));
    if (savedAchievements) setAchievements(new Set(JSON.parse(savedAchievements)));
  }, []);

  // Save progress
  const saveProgress = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.completedChallenges, JSON.stringify([...completedIds]));
    localStorage.setItem(STORAGE_KEYS.incorrectChallenges, JSON.stringify([...incorrectIds]));
    localStorage.setItem(STORAGE_KEYS.dailyStreak, streak.toString());
    localStorage.setItem(STORAGE_KEYS.totalPoints, score.toString());
    localStorage.setItem(STORAGE_KEYS.currentLevel, userLevel.toString());
    localStorage.setItem(STORAGE_KEYS.bestStreak, bestStreak.toString());
    localStorage.setItem(STORAGE_KEYS.gamesPlayed, gamesPlayed.toString());
    localStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify([...achievements]));
  }, [completedIds, incorrectIds, streak, score, userLevel, bestStreak, gamesPlayed, achievements]);

  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Check for new achievements
  const checkAchievements = useCallback(() => {
    const newAchievements = new Set(achievements);
    
    if (completedIds.size >= 1 && !achievements.has('first_win')) {
      newAchievements.add('first_win');
      toast.success('🎯 Achievement: First Victory!');
    }
    if (streak >= 5 && !achievements.has('streak_5')) {
      newAchievements.add('streak_5');
      toast.success('🔥 Achievement: Hot Streak!');
    }
    if (streak >= 10 && !achievements.has('streak_10')) {
      newAchievements.add('streak_10');
      toast.success('💥 Achievement: On Fire!');
    }
    if (userLevel >= 10 && !achievements.has('level_10')) {
      newAchievements.add('level_10');
      toast.success('🌟 Achievement: Rising Star!');
    }
    
    if (newAchievements.size > achievements.size) {
      setAchievements(newAchievements);
    }
  }, [achievements, completedIds.size, streak, userLevel]);

  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  // Timer logic
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      if (timeLeft <= 5) playSound('tick', 0.5 + (5 - timeLeft) * 0.1);
    } else if (timeLeft === 0 && isPlaying) {
      handleTimeout();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, timeLeft]);

  const handleTimeout = () => {
    setIsPlaying(false);
    setShowResult(true);
    if (currentChallenge) {
      setIncorrectIds(prev => new Set([...prev, currentChallenge.id]));
    }
    playFailureMelody();
    toast.error('⏱️ Time\'s up!');
  };

  const getCurrentBadge = () => {
    for (let i = LEVEL_BADGES.length - 1; i >= 0; i--) {
      if (userLevel >= LEVEL_BADGES[i].level) return LEVEL_BADGES[i];
    }
    return LEVEL_BADGES[0];
  };

  const getNextBadge = () => {
    for (const badge of LEVEL_BADGES) {
      if (userLevel < badge.level) return badge;
    }
    return null;
  };

  const pointsToNextLevel = () => {
    const basePoints = 100;
    const currentLevelPoints = userLevel * basePoints;
    const progressPoints = score % currentLevelPoints;
    return { current: progressPoints, needed: currentLevelPoints };
  };

  // Mock leaderboard data
  const globalLeaderboard = [
    { rank: 1, name: 'MindMaster99', score: 15420, level: 47, badge: '👑' },
    { rank: 2, name: 'BrainNinja', score: 14200, level: 42, badge: '🥈' },
    { rank: 3, name: 'QuizKing', score: 13800, level: 40, badge: '🥉' },
    { rank: 4, name: 'PuzzlePro', score: 12500, level: 38, badge: '⭐' },
    { rank: 5, name: 'LogicLord', score: 11900, level: 35, badge: '⭐' },
    { rank: 6, name: 'ThinkTank', score: 10200, level: 32, badge: '' },
    { rank: 7, name: 'WisdomSeeker', score: 9800, level: 30, badge: '' },
    { rank: 8, name: 'BrainStorm', score: 8500, level: 27, badge: '' },
    { rank: 9, name: 'MindBender', score: 7200, level: 24, badge: '' },
    { rank: 10, name: 'IQChamp', score: 6800, level: 22, badge: '' },
  ];

  const regionalLeaderboard = [
    { rank: 1, name: 'NepaliGenius', score: 8200, level: 28, badge: '👑', country: '🇳🇵' },
    { rank: 2, name: 'HimalayanMind', score: 7500, level: 25, badge: '🥈', country: '🇳🇵' },
    { rank: 3, name: 'KathmanduKid', score: 6800, level: 22, badge: '🥉', country: '🇳🇵' },
    { rank: 4, name: 'PokharaPuzzler', score: 5900, level: 19, badge: '', country: '🇳🇵' },
    { rank: 5, name: 'EverestExplorer', score: 5200, level: 17, badge: '', country: '🇳🇵' },
  ];

  const startRandomChallenge = () => {
    playSound('start');
    setGamesPlayed(g => g + 1);
    
    const available = randomChallenges.filter(c => {
      if (completedIds.has(c.id) && !incorrectIds.has(c.id)) return false;
      return true;
    });

    const pool = available.length > 0 ? available : randomChallenges;
    const incorrectPool = pool.filter(c => incorrectIds.has(c.id));
    const targetPool = incorrectPool.length > 0 ? incorrectPool : pool;
    const levelPool = targetPool.filter(c => c.level <= userLevel + 1);
    const finalPool = levelPool.length > 0 ? levelPool : targetPool;

    const challenge = finalPool[Math.floor(Math.random() * finalPool.length)];
    setCurrentChallenge(challenge);
    setTimeLeft(challenge.time);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsPlaying(true);
  };

  const handleAnswer = (index: number) => {
    if (showResult || !currentChallenge) return;
    
    playSound('click');
    setSelectedAnswer(index);
    setIsPlaying(false);
    setShowResult(true);

    if (index === currentChallenge.correct) {
      playSuccessMelody();
      const points = currentChallenge.level * 10 + Math.floor(timeLeft / 2);
      setScore(s => s + points);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      
      setCompletedIds(prev => new Set([...prev, currentChallenge.id]));
      setIncorrectIds(prev => {
        const next = new Set(prev);
        next.delete(currentChallenge.id);
        return next;
      });
      
      // Level up check
      const newScore = score + points;
      const newLevel = Math.floor(newScore / 100) + 1;
      if (newLevel > userLevel) {
        setUserLevel(newLevel);
        playLevelUpMelody();
        toast.success(`🎉 Level Up! Now Level ${newLevel}`);
      } else {
        toast.success(`✅ Correct! +${points} points`);
      }
    } else {
      playFailureMelody();
      setStreak(0);
      setIncorrectIds(prev => new Set([...prev, currentChallenge.id]));
      toast.error('❌ Incorrect. This will appear again!');
    }
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['text-green-500', 'text-blue-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
    return colors[Math.min(level - 1, 4)];
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['Easy', 'Medium', 'Hard', 'Expert', 'Master'];
    return labels[Math.min(level - 1, 4)];
  };

  // Voice state
  const [voiceMode, setVoiceMode] = useState<'learning' | 'performance'>('learning');
  const [currentVoicePractice, setCurrentVoicePractice] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceScore, setVoiceScore] = useState<number | null>(null);
  const [voiceLevel, setVoiceLevel] = useState(1);
  const [completedVoiceIds, setCompletedVoiceIds] = useState<Set<number>>(new Set());

  const startVoicePractice = () => {
    playSound('start');
    const available = voicePractices.filter(v => v.level <= voiceLevel + 1);
    const pool = available.length > 0 ? available : voicePractices.slice(0, 5);
    const practice = pool[Math.floor(Math.random() * pool.length)];
    setCurrentVoicePractice(practice);
    setVoiceScore(null);
    setTimeLeft(15 + practice.level * 5);
    setIsPlaying(true);
  };

  const startRecording = () => {
    playSound('notification');
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPlaying(false);
    
    const clarity = Math.floor(Math.random() * 30) + 70;
    const pace = Math.floor(Math.random() * 30) + 70;
    const finalScore = Math.floor((clarity + pace) / 2);
    
    setVoiceScore(finalScore);
    
    if (finalScore >= 75) {
      playSuccessMelody();
      setScore(s => s + finalScore);
      toast.success(`🎤 Great! Score: ${finalScore}`);
    } else {
      playSound('wrong');
      toast.info(`Keep practicing. Score: ${finalScore}`);
    }
  };

  // Imposter state
  const [currentImposterSet, setCurrentImposterSet] = useState<any>(null);
  const [imposterSelected, setImposterSelected] = useState<number | null>(null);
  const [showImposterResult, setShowImposterResult] = useState(false);
  const [imposterLevel, setImposterLevel] = useState(1);

  const startImposterGame = () => {
    playSound('start');
    const available = imposterSets.filter(s => s.level <= imposterLevel + 1);
    const pool = available.length > 0 ? available : imposterSets.slice(0, 5);
    const set = pool[Math.floor(Math.random() * pool.length)];
    setCurrentImposterSet(set);
    setImposterSelected(null);
    setShowImposterResult(false);
    setTimeLeft(15 + set.level * 3);
    setIsPlaying(true);
  };

  const selectImposter = (index: number) => {
    if (showImposterResult) return;
    playSound('click');
    setImposterSelected(index);
    setShowImposterResult(true);
    setIsPlaying(false);

    if (currentImposterSet && index === currentImposterSet.imposter) {
      playSuccessMelody();
      const points = currentImposterSet.level * 15;
      setScore(s => s + points);
      setStreak(s => s + 1);
      toast.success(`🎯 Correct! +${points} points`);
    } else {
      playFailureMelody();
      setStreak(0);
      toast.error(`❌ Wrong! The imposter was: ${currentImposterSet?.items[currentImposterSet.imposter]}`);
    }
  };

  // Stress relief state
  const [stressScore, setStressScore] = useState(0);
  const [brokenObjects, setBrokenObjects] = useState<Set<number>>(new Set());

  const handleBreakObject = (objId: number) => {
    if (brokenObjects.has(objId)) return;
    const obj = stressObjects.find(o => o.id === objId);
    if (!obj) return;
    playSound(obj.sound as SoundType);
    setBrokenObjects(prev => new Set([...prev, objId]));
    setStressScore(s => s + obj.points);
  };

  const resetStressRoom = () => {
    playSound('whoosh');
    setBrokenObjects(new Set());
    if (stressScore > 0) {
      setScore(s => s + Math.floor(stressScore / 2));
      toast.success(`+${Math.floor(stressScore / 2)} points from stress relief!`);
    }
    setStressScore(0);
  };

  // Draw state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [currentDrawChallenge, setCurrentDrawChallenge] = useState<any>(null);
  const [drawTimeLeft, setDrawTimeLeft] = useState(0);
  const [drawPlaying, setDrawPlaying] = useState(false);

  const startDrawChallenge = () => {
    playSound('start');
    const pool = drawChallenges.filter(d => d.level <= userLevel + 1);
    const challenge = pool[Math.floor(Math.random() * pool.length)] || drawChallenges[0];
    setCurrentDrawChallenge(challenge);
    setDrawTimeLeft(challenge.time);
    setDrawPlaying(true);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  // Role decision state
  const [currentScenario, setCurrentScenario] = useState<any>(null);
  const [roleChoice, setRoleChoice] = useState<number | null>(null);
  const [showRoleResult, setShowRoleResult] = useState(false);

  const startRoleChallenge = () => {
    playSound('start');
    const pool = roleScenarios.filter(s => s.level <= userLevel + 1);
    const scenario = pool[Math.floor(Math.random() * pool.length)] || roleScenarios[0];
    setCurrentScenario(scenario);
    setRoleChoice(null);
    setShowRoleResult(false);
  };

  const makeRoleChoice = (index: number) => {
    setRoleChoice(index);
    setShowRoleResult(true);
    
    if (currentScenario && index === currentScenario.best) {
      playSuccessMelody();
      setScore(s => s + 25);
      toast.success('✅ Best decision! +25 points');
    } else {
      playSound('notification');
      toast.info('Good thinking! Consider the consequences.');
    }
  };

  // Daily challenge
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [currentDaily, setCurrentDaily] = useState<any>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem(STORAGE_KEYS.lastPlayedDate);
    if (lastPlayed !== today) {
      setDailyCompleted(false);
      const daily = dailyChallengePool[Math.floor(Math.random() * dailyChallengePool.length)];
      setCurrentDaily(daily);
    }
  }, []);

  const completeDailyChallenge = () => {
    if (dailyCompleted || !currentDaily) return;
    playSuccessMelody();
    setDailyCompleted(true);
    setScore(s => s + currentDaily.points);
    localStorage.setItem(STORAGE_KEYS.lastPlayedDate, new Date().toDateString());
    toast.success(`🌟 Daily complete! +${currentDaily.points} points`);
  };

  const currentBadge = getCurrentBadge();
  const nextBadge = getNextBadge();
  const levelProgress = pointsToNextLevel();

  return (
    <div className="space-y-4 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Challenge your mind, level up!</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Level Progress Bar */}
      <Card className="glass-card p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{currentBadge.icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Level {userLevel} - {currentBadge.name}</span>
              <span className="text-xs text-muted-foreground">{score} pts</span>
            </div>
            <Progress value={(levelProgress.current / levelProgress.needed) * 100} className="h-2" />
            {nextBadge && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Next: {nextBadge.icon} {nextBadge.name} (Level {nextBadge.level})
              </p>
            )}
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{streak}</span>
            </div>
            <p className="text-[9px] text-muted-foreground">Streak</p>
          </div>
        </div>
      </Card>

      {/* Game Mode Selection */}
      <div className="grid grid-cols-4 gap-2">
        {gameModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={cn(
              "p-2 rounded-xl transition-all text-center",
              activeMode === mode.id
                ? `bg-gradient-to-br ${mode.color} text-white shadow-lg scale-105`
                : "glass-card hover:bg-muted/50"
            )}
          >
            <mode.icon className="w-5 h-5 mx-auto mb-1" />
            <p className="text-[9px] font-medium truncate">{mode.name}</p>
          </button>
        ))}
      </div>

      {/* Stats Dashboard */}
      {activeMode === 'stats' && (
        <div className="space-y-4">
          {/* Your Stats */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-primary">{score}</p>
                <p className="text-[9px] text-muted-foreground">Total Points</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{userLevel}</p>
                <p className="text-[9px] text-muted-foreground">Level</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-orange-500">{bestStreak}</p>
                <p className="text-[9px] text-muted-foreground">Best Streak</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{gamesPlayed}</p>
                <p className="text-[9px] text-muted-foreground">Games</p>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4" /> Achievements ({achievements.size}/{ACHIEVEMENTS.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {ACHIEVEMENTS.map((ach) => (
                  <div
                    key={ach.id}
                    className={cn(
                      "p-2 rounded-lg text-center transition-all",
                      achievements.has(ach.id) 
                        ? "bg-primary/20 border border-primary" 
                        : "bg-muted/30 opacity-50"
                    )}
                  >
                    <span className="text-xl">{ach.icon}</span>
                    <p className="text-[8px] mt-1 truncate">{ach.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Leaderboards */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Leaderboards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={leaderboardTab} onValueChange={(v) => setLeaderboardTab(v as 'global' | 'regional')}>
                <TabsList className="w-full grid grid-cols-2 h-8 mb-3">
                  <TabsTrigger value="global" className="text-xs">🌍 Global Top 10</TabsTrigger>
                  <TabsTrigger value="regional" className="text-xs">🇳🇵 Regional</TabsTrigger>
                </TabsList>
                
                <TabsContent value="global" className="space-y-1">
                  {globalLeaderboard.map((player) => (
                    <div key={player.rank} className={cn(
                      "flex items-center gap-2 p-2 rounded-lg",
                      player.rank <= 3 ? "bg-primary/10" : "bg-muted/20"
                    )}>
                      <span className="w-6 text-center font-bold text-xs">
                        {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{player.name}</p>
                        <p className="text-[9px] text-muted-foreground">Lvl {player.level}</p>
                      </div>
                      <span className="text-xs font-bold">{player.score.toLocaleString()}</span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="regional" className="space-y-1">
                  {regionalLeaderboard.map((player) => (
                    <div key={player.rank} className={cn(
                      "flex items-center gap-2 p-2 rounded-lg",
                      player.rank <= 3 ? "bg-primary/10" : "bg-muted/20"
                    )}>
                      <span className="w-6 text-center font-bold text-xs">
                        {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                      </span>
                      <span>{player.country}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{player.name}</p>
                        <p className="text-[9px] text-muted-foreground">Lvl {player.level}</p>
                      </div>
                      <span className="text-xs font-bold">{player.score.toLocaleString()}</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
              
              {/* Your Rank */}
              <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentBadge.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium">Your Rank: #{Math.max(11, 100 - userLevel * 2)}</p>
                    <p className="text-[9px] text-muted-foreground">Keep playing to climb!</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{score.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Brain Logic Game */}
      {activeMode === 'random' && (
        <Card className="glass-card">
          <CardContent className="p-4">
            {!isPlaying && !showResult ? (
              <div className="text-center py-8">
                <Shuffle className="w-16 h-16 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">Brain Logic Challenge</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test your logic, pattern recognition, and quick thinking!
                </p>
                <div className="flex gap-2 justify-center mb-4">
                  <Badge>Level {userLevel}</Badge>
                  <Badge variant="outline">{completedIds.size} Completed</Badge>
                </div>
                <Button onClick={startRandomChallenge} className="gap-2">
                  <Play className="w-4 h-4" /> Start Challenge
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Timer */}
                <div className="flex items-center justify-between">
                  <Badge className={getDifficultyColor(currentChallenge?.level || 1)}>
                    {getDifficultyLabel(currentChallenge?.level || 1)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span className={cn("font-mono font-bold", timeLeft <= 5 && "text-red-500")}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                {/* Question */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-1">{currentChallenge?.title}</h4>
                  <p className="text-xs text-muted-foreground">{currentChallenge?.instruction}</p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-2">
                  {currentChallenge?.options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant={showResult 
                        ? index === currentChallenge.correct 
                          ? "default" 
                          : index === selectedAnswer 
                            ? "destructive" 
                            : "outline"
                        : "outline"
                      }
                      className="h-auto py-3 text-xs"
                      onClick={() => handleAnswer(index)}
                      disabled={showResult}
                    >
                      {option}
                    </Button>
                  ))}
                </div>

                {showResult && (
                  <Button onClick={startRandomChallenge} className="w-full gap-2">
                    <RefreshCw className="w-4 h-4" /> Next Challenge
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voice Trainer */}
      {activeMode === 'voice' && (
        <Card className="glass-card">
          <CardContent className="p-4">
            {!currentVoicePractice ? (
              <div className="text-center py-8">
                <Mic className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">Voice Trainer</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Practice clarity, tone, and delivery
                </p>
                <Button onClick={startVoicePractice} className="gap-2">
                  <Play className="w-4 h-4" /> Start Practice
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <Badge>Level {currentVoicePractice.level}</Badge>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm font-medium">Read aloud:</p>
                  <p className="text-lg mt-2">"{currentVoicePractice.text}"</p>
                </div>
                
                {voiceScore !== null ? (
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">{voiceScore}%</div>
                    <Progress value={voiceScore} className="h-3" />
                    <Button onClick={() => { setCurrentVoicePractice(null); setVoiceScore(null); }} className="w-full">
                      Try Another
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className="w-full gap-2"
                  >
                    {isRecording ? (
                      <><StopCircle className="w-4 h-4" /> Stop Recording</>
                    ) : (
                      <><Mic className="w-4 h-4" /> Start Recording</>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pattern Detective */}
      {activeMode === 'imposter' && (
        <Card className="glass-card">
          <CardContent className="p-4">
            {!currentImposterSet ? (
              <div className="text-center py-8">
                <Brain className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">Pattern Detective</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Find the one that doesn't belong!
                </p>
                <Button onClick={startImposterGame} className="gap-2">
                  <Play className="w-4 h-4" /> Start Game
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge>Level {currentImposterSet.level}</Badge>
                  {isPlaying && (
                    <span className="font-mono text-sm">{timeLeft}s</span>
                  )}
                </div>
                
                <p className="text-sm text-center">Find the imposter:</p>
                
                <div className="grid grid-cols-3 gap-2">
                  {currentImposterSet.items.map((item: string, index: number) => (
                    <Button
                      key={index}
                      variant={showImposterResult
                        ? index === currentImposterSet.imposter
                          ? "default"
                          : index === imposterSelected
                            ? "destructive"
                            : "outline"
                        : "outline"
                      }
                      className="h-16 text-2xl"
                      onClick={() => selectImposter(index)}
                      disabled={showImposterResult}
                    >
                      {item}
                    </Button>
                  ))}
                </div>

                {showImposterResult && (
                  <div className="space-y-2">
                    <p className="text-xs text-center text-muted-foreground">
                      Rule: {currentImposterSet.rule}
                    </p>
                    <Button onClick={startImposterGame} className="w-full gap-2">
                      <RefreshCw className="w-4 h-4" /> Next Round
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stress Breaker */}
      {activeMode === 'stress' && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Stress Relief Room</h3>
              <Badge variant="outline">{stressScore} pts</Badge>
            </div>
            
            <div className="grid grid-cols-4 gap-3 mb-4">
              {stressObjects.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => handleBreakObject(obj.id)}
                  disabled={brokenObjects.has(obj.id)}
                  className={cn(
                    "text-4xl p-4 rounded-xl transition-all",
                    brokenObjects.has(obj.id)
                      ? "opacity-30 scale-90"
                      : "hover:scale-110 active:scale-95 bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  {obj.emoji}
                </button>
              ))}
            </div>
            
            <Button onClick={resetStressRoom} variant="outline" className="w-full gap-2">
              <RefreshCw className="w-4 h-4" /> Reset & Collect Points
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Creative Canvas */}
      {activeMode === 'draw' && (
        <Card className="glass-card">
          <CardContent className="p-4">
            {!currentDrawChallenge ? (
              <div className="text-center py-8">
                <Paintbrush className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">Creative Canvas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Draw to express and challenge yourself
                </p>
                <Button onClick={startDrawChallenge} className="gap-2">
                  <Play className="w-4 h-4" /> Start Drawing
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Badge>Level {currentDrawChallenge.level}</Badge>
                  <span className="text-sm">{drawTimeLeft}s</span>
                </div>
                
                <p className="text-sm text-center bg-muted/30 p-2 rounded">
                  {currentDrawChallenge.instruction}
                </p>
                
                <div className="border-2 border-dashed border-muted rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={200}
                    className="w-full bg-white touch-none"
                    onMouseDown={() => setIsDrawing(true)}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseMove={(e) => {
                      if (!isDrawing || !canvasRef.current) return;
                      const ctx = canvasRef.current.getContext('2d');
                      if (!ctx) return;
                      const rect = canvasRef.current.getBoundingClientRect();
                      ctx.fillStyle = drawColor;
                      ctx.beginPath();
                      ctx.arc(
                        e.clientX - rect.left,
                        e.clientY - rect.top,
                        3, 0, Math.PI * 2
                      );
                      ctx.fill();
                    }}
                  />
                </div>
                
                <div className="flex gap-2">
                  {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map(color => (
                    <button
                      key={color}
                      onClick={() => setDrawColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2",
                        drawColor === color ? "border-primary" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <Button 
                  onClick={() => {
                    setScore(s => s + 20);
                    toast.success('+20 points for creativity!');
                    setCurrentDrawChallenge(null);
                  }} 
                  className="w-full"
                >
                  Submit Drawing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Decision Master */}
      {activeMode === 'role' && (
        <Card className="glass-card">
          <CardContent className="p-4">
            {!currentScenario ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">Decision Master</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Make choices, see consequences
                </p>
                <Button onClick={startRoleChallenge} className="gap-2">
                  <Play className="w-4 h-4" /> Start Scenario
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Badge>{currentScenario.role}</Badge>
                <p className="text-sm bg-muted/30 p-3 rounded">{currentScenario.situation}</p>
                
                <div className="space-y-2">
                  {currentScenario.options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant={showRoleResult
                        ? index === currentScenario.best
                          ? "default"
                          : index === roleChoice
                            ? "secondary"
                            : "outline"
                        : "outline"
                      }
                      className="w-full h-auto py-3 text-xs text-left justify-start"
                      onClick={() => makeRoleChoice(index)}
                      disabled={showRoleResult}
                    >
                      {option}
                    </Button>
                  ))}
                </div>

                {showRoleResult && roleChoice !== null && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                      Consequence: {currentScenario.consequences[roleChoice]}
                    </p>
                    <Button onClick={startRoleChallenge} className="w-full gap-2">
                      <RefreshCw className="w-4 h-4" /> Next Scenario
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Daily Quest */}
      {activeMode === 'daily' && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-center py-4">
              <Calendar className="w-16 h-16 mx-auto text-pink-500 mb-4" />
              <h3 className="text-lg font-bold mb-2">Daily Quest</h3>
              
              {currentDaily ? (
                <div className="space-y-4">
                  <Badge variant="outline">{currentDaily.type}</Badge>
                  <p className="text-sm bg-muted/30 p-4 rounded-lg">
                    {currentDaily.task}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">{currentDaily.points} points</span>
                  </div>
                  
                  {dailyCompleted ? (
                    <Badge className="bg-green-500">✓ Completed Today!</Badge>
                  ) : (
                    <Button onClick={completeDailyChallenge} className="w-full gap-2">
                      <Check className="w-4 h-4" /> Mark as Complete
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Loading daily challenge...</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <DailyDoseCard />
    </div>
  );
}