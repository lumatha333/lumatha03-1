import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Gamepad2, Shuffle, Mic, Brain, Target, Paintbrush, Users, Calendar,
  Play, Pause, Check, X, Volume2, VolumeX, RefreshCw, Trophy, Star,
  Timer, Zap, Lock, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Game modes configuration
const gameModes = [
  { id: 'random', name: 'Random Discovery', icon: Shuffle, color: 'from-violet-500 to-purple-600', desc: 'Random challenge from all sections' },
  { id: 'voice', name: 'Text → Voice', icon: Mic, color: 'from-blue-500 to-cyan-500', desc: 'Voice clarity & delivery training' },
  { id: 'imposter', name: 'Guess Imposter', icon: Brain, color: 'from-amber-500 to-orange-500', desc: 'Logic-based detection game' },
  { id: 'stress', name: 'Stress Relief', icon: Target, color: 'from-red-500 to-rose-500', desc: 'Controlled stress release room' },
  { id: 'draw', name: 'Draw & Create', icon: Paintbrush, color: 'from-green-500 to-emerald-500', desc: 'Creative problem solving' },
  { id: 'role', name: 'Role Decision', icon: Users, color: 'from-indigo-500 to-blue-600', desc: 'Scenario-based decisions' },
  { id: 'daily', name: 'Daily Challenge', icon: Calendar, color: 'from-pink-500 to-fuchsia-500', desc: 'One meaningful task per day' },
];

// Random Discovery Challenges
const randomChallenges = [
  { id: 1, type: 'logic', level: 1, title: 'Pattern Match', instruction: 'Find the next number: 2, 4, 8, 16, ?', options: ['24', '32', '30', '20'], correct: 1, time: 15 },
  { id: 2, type: 'reaction', level: 1, title: 'Quick Pick', instruction: 'Select the odd one out', options: ['🍎', '🍊', '🚗', '🍇'], correct: 2, time: 10 },
  { id: 3, type: 'memory', level: 2, title: 'Remember Sequence', instruction: 'Which color came first?', options: ['Red', 'Blue', 'Green', 'Yellow'], correct: 0, time: 20 },
  { id: 4, type: 'logic', level: 2, title: 'Logical Order', instruction: 'What comes next: Mon, Wed, Fri, ?', options: ['Sat', 'Sun', 'Thu', 'Tue'], correct: 1, time: 15 },
  { id: 5, type: 'decision', level: 3, title: 'Priority Task', instruction: 'Under pressure, which task first?', options: ['Reply email', 'Fire alarm', 'Lunch break', 'Meeting prep'], correct: 1, time: 12 },
  { id: 6, type: 'pattern', level: 3, title: 'Hidden Rule', instruction: 'Find pattern: AB, BC, CD, ?', options: ['DE', 'EF', 'DD', 'CE'], correct: 0, time: 15 },
  { id: 7, type: 'logic', level: 4, title: 'Multi-Step', instruction: 'If A=1, B=2, then CAB=?', options: ['312', '321', '123', '213'], correct: 0, time: 20 },
  { id: 8, type: 'simulation', level: 5, title: 'Route Decision', instruction: 'Fastest safe route during traffic?', options: ['Highway', 'Side streets', 'Wait 30min', 'Public transit'], correct: 3, time: 25 },
];

// Voice Practice Sentences
const voicePractices = [
  { level: 1, text: 'Hello', mode: 'learning' },
  { level: 1, text: 'Good morning', mode: 'learning' },
  { level: 2, text: 'The quick brown fox jumps over the lazy dog.', mode: 'performance' },
  { level: 3, text: 'In case of emergency, please proceed to the nearest exit calmly and quickly.', mode: 'emergency' },
  { level: 4, text: 'We are pleased to announce the successful completion of our quarterly targets.', mode: 'presentation' },
  { level: 5, text: 'Attention all passengers. Due to technical difficulties, Flight 247 has been delayed by approximately 45 minutes.', mode: 'announcement' },
];

// Imposter Game Sets
const imposterSets = [
  { level: 1, items: ['Apple', 'Banana', 'Carrot', 'Orange'], imposter: 2, rule: 'Fruits vs Vegetable' },
  { level: 2, items: ['Hammer', 'Screwdriver', 'Banana', 'Wrench'], imposter: 2, rule: 'Tools vs Food' },
  { level: 3, items: ['2', '4', '7', '8'], imposter: 2, rule: 'Even numbers only' },
  { level: 4, items: ['Paris', 'London', 'Amazon', 'Tokyo'], imposter: 2, rule: 'Cities vs River' },
  { level: 5, items: ['Input', 'Process', 'Coffee', 'Output'], imposter: 2, rule: 'System flow step' },
];

// Stress Relief Objects
const stressObjects = [
  { id: 1, type: 'glass', emoji: '🍷', sound: 'glass', points: 10 },
  { id: 2, type: 'plate', emoji: '🍽️', sound: 'ceramic', points: 15 },
  { id: 3, type: 'box', emoji: '📦', sound: 'cardboard', points: 5 },
  { id: 4, type: 'bottle', emoji: '🍾', sound: 'glass', points: 20 },
  { id: 5, type: 'cup', emoji: '☕', sound: 'ceramic', points: 12 },
  { id: 6, type: 'vase', emoji: '🏺', sound: 'glass', points: 25 },
];

// Draw Challenges
const drawChallenges = [
  { level: 1, type: 'copy', instruction: 'Draw a circle', time: 30, tools: 4 },
  { level: 2, type: 'constraint', instruction: 'Draw a house using only triangles', time: 45, tools: 2 },
  { level: 3, type: 'memory', instruction: 'Draw the shape you saw earlier', time: 30, tools: 3 },
  { level: 4, type: 'abstract', instruction: 'Represent "happiness" visually', time: 60, tools: 2, colors: 2 },
  { level: 5, type: 'complex', instruction: 'Design a logo for an eco-friendly brand', time: 90, tools: 3, colors: 3 },
];

// Role-Based Scenarios
const roleScenarios = [
  { 
    id: 1, level: 1, role: 'Leader',
    situation: 'Your team member is late for an important presentation.',
    options: ['Wait and start late', 'Start without them', 'Call to check', 'Reschedule meeting'],
    consequences: ['Client frustrated', 'Team member embarrassed', 'Shows care, slight delay', 'Unprofessional'],
    best: 2
  },
  {
    id: 2, level: 2, role: 'Responder',
    situation: 'Fire alarm goes off during a customer call.',
    options: ['Ignore and continue', 'End call immediately', 'Politely pause call', 'Transfer to colleague'],
    consequences: ['Safety risk', 'Rude behavior', 'Professional handling', 'Delays but safe'],
    best: 2
  },
  {
    id: 3, level: 3, role: 'Planner',
    situation: 'Budget cut by 30%. Which project to cancel?',
    options: ['Marketing campaign', 'Staff training', 'Equipment upgrade', 'Safety measures'],
    consequences: ['Lower visibility', 'Skill gap', 'Efficiency drop', 'Risk increase'],
    best: 0
  },
  {
    id: 4, level: 4, role: 'Mediator',
    situation: 'Two team leads disagree on project direction.',
    options: ['Side with senior', 'Split the work', 'Facilitate discussion', 'Escalate to manager'],
    consequences: ['Bias perceived', 'Fragmented work', 'Collaborative solution', 'Shows weakness'],
    best: 2
  },
  {
    id: 5, level: 5, role: 'Decision Maker',
    situation: 'Ethical dilemma: Profitable client uses unethical practices.',
    options: ['Continue business', 'End partnership', 'Negotiate changes', 'Report to authorities'],
    consequences: ['Complicit', 'Revenue loss', 'Potential change', 'Legal implications'],
    best: 2
  },
];

// Daily Challenges
const dailyChallengePool = [
  { type: 'observation', task: 'Notice 3 new things in your daily route today', points: 50 },
  { type: 'memory', task: 'Memorize 5 random phone numbers from your contacts', points: 60 },
  { type: 'calm', task: 'Respond to every message with a 10-second pause first', points: 40 },
  { type: 'logic', task: 'Solve 3 math problems without a calculator', points: 55 },
  { type: 'creative', task: 'Write a 4-line poem about your morning', points: 45 },
  { type: 'physical', task: 'Take 10 deep breaths before every decision today', points: 35 },
  { type: 'social', task: 'Give a genuine compliment to someone you rarely talk to', points: 50 },
];

// Progress storage keys
const STORAGE_KEYS = {
  completedChallenges: 'funpun_completed',
  incorrectChallenges: 'funpun_incorrect',
  dailyStreak: 'funpun_streak',
  totalPoints: 'funpun_points',
  currentLevel: 'funpun_level',
};

export default function FunPun() {
  const [activeMode, setActiveMode] = useState('random');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [incorrectIds, setIncorrectIds] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load progress from localStorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem(STORAGE_KEYS.completedChallenges);
    const savedIncorrect = localStorage.getItem(STORAGE_KEYS.incorrectChallenges);
    const savedStreak = localStorage.getItem(STORAGE_KEYS.dailyStreak);
    const savedPoints = localStorage.getItem(STORAGE_KEYS.totalPoints);
    const savedLevel = localStorage.getItem(STORAGE_KEYS.currentLevel);

    if (savedCompleted) setCompletedIds(new Set(JSON.parse(savedCompleted)));
    if (savedIncorrect) setIncorrectIds(new Set(JSON.parse(savedIncorrect)));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedPoints) setScore(parseInt(savedPoints));
    if (savedLevel) setUserLevel(parseInt(savedLevel));
  }, []);

  // Save progress
  const saveProgress = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.completedChallenges, JSON.stringify([...completedIds]));
    localStorage.setItem(STORAGE_KEYS.incorrectChallenges, JSON.stringify([...incorrectIds]));
    localStorage.setItem(STORAGE_KEYS.dailyStreak, streak.toString());
    localStorage.setItem(STORAGE_KEYS.totalPoints, score.toString());
    localStorage.setItem(STORAGE_KEYS.currentLevel, userLevel.toString());
  }, [completedIds, incorrectIds, streak, score, userLevel]);

  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Timer logic
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isPlaying) {
      handleTimeout();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, timeLeft]);

  const playSound = (type: 'start' | 'correct' | 'wrong' | 'complete') => {
    if (!soundEnabled) return;
    // Sound would be played here - using Web Audio API in production
  };

  const handleTimeout = () => {
    setIsPlaying(false);
    setShowResult(true);
    if (currentChallenge) {
      setIncorrectIds(prev => new Set([...prev, currentChallenge.id]));
    }
    playSound('wrong');
    toast.error('⏱️ Time\'s up!');
  };

  const startRandomChallenge = () => {
    // Filter challenges based on completion status
    const available = randomChallenges.filter(c => {
      // If completed without error, skip unless all completed
      if (completedIds.has(c.id) && !incorrectIds.has(c.id)) return false;
      // Prioritize incorrect ones
      return true;
    });

    // If all completed, reset
    const pool = available.length > 0 ? available : randomChallenges;
    
    // Prioritize incorrect challenges
    const incorrectPool = pool.filter(c => incorrectIds.has(c.id));
    const targetPool = incorrectPool.length > 0 ? incorrectPool : pool;
    
    // Filter by user level
    const levelPool = targetPool.filter(c => c.level <= userLevel + 1);
    const finalPool = levelPool.length > 0 ? levelPool : targetPool;

    const challenge = finalPool[Math.floor(Math.random() * finalPool.length)];
    setCurrentChallenge(challenge);
    setTimeLeft(challenge.time);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsPlaying(true);
    playSound('start');
  };

  const handleAnswer = (index: number) => {
    if (showResult || !currentChallenge) return;
    setSelectedAnswer(index);
    setIsPlaying(false);
    setShowResult(true);

    if (index === currentChallenge.correct) {
      playSound('correct');
      const points = currentChallenge.level * 10 + Math.floor(timeLeft / 2);
      setScore(s => s + points);
      setStreak(s => s + 1);
      setCompletedIds(prev => new Set([...prev, currentChallenge.id]));
      setIncorrectIds(prev => {
        const next = new Set(prev);
        next.delete(currentChallenge.id);
        return next;
      });
      
      // Level up every 5 correct answers
      if ((completedIds.size + 1) % 5 === 0 && userLevel < 5) {
        setUserLevel(l => l + 1);
        toast.success(`🎉 Level Up! Now Level ${userLevel + 1}`);
      } else {
        toast.success(`✅ Correct! +${points} points`);
      }
    } else {
      playSound('wrong');
      setStreak(0);
      setIncorrectIds(prev => new Set([...prev, currentChallenge.id]));
      toast.error('❌ Incorrect. This will appear again!');
    }
  };

  const getDifficultyColor = (level: number) => {
    const colors = ['text-green-500', 'text-blue-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
    return colors[level - 1] || colors[0];
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['Basic', 'Timed', 'Multi-Step', 'Combined', 'Simulation'];
    return labels[level - 1] || labels[0];
  };

  // Stress Relief State
  const [stressScore, setStressScore] = useState(0);
  const [brokenObjects, setBrokenObjects] = useState<Set<number>>(new Set());
  const [stressMode, setStressMode] = useState<'free' | 'target' | 'precision'>('free');
  const [targetObject, setTargetObject] = useState<number | null>(null);

  const handleBreakObject = (objId: number) => {
    if (brokenObjects.has(objId)) return;
    
    const obj = stressObjects.find(o => o.id === objId);
    if (!obj) return;

    if (stressMode === 'target' && targetObject !== objId) {
      toast.error('Wrong target! Score reduced.');
      setStressScore(s => Math.max(0, s - 5));
      return;
    }

    setBrokenObjects(prev => new Set([...prev, objId]));
    setStressScore(s => s + obj.points);
    playSound('correct');

    if (stressMode === 'target') {
      const remaining = stressObjects.filter(o => !brokenObjects.has(o.id) && o.id !== objId);
      if (remaining.length > 0) {
        setTargetObject(remaining[Math.floor(Math.random() * remaining.length)].id);
      }
    }
  };

  const resetStressRoom = () => {
    setBrokenObjects(new Set());
    setStressScore(0);
    if (stressMode === 'target') {
      setTargetObject(stressObjects[Math.floor(Math.random() * stressObjects.length)].id);
    }
  };

  // Role Decision State
  const [currentScenario, setCurrentScenario] = useState<typeof roleScenarios[0] | null>(null);
  const [roleChoice, setRoleChoice] = useState<number | null>(null);
  const [showConsequence, setShowConsequence] = useState(false);

  const startRoleChallenge = () => {
    const available = roleScenarios.filter(s => s.level <= userLevel + 1);
    const scenario = available[Math.floor(Math.random() * available.length)];
    setCurrentScenario(scenario);
    setRoleChoice(null);
    setShowConsequence(false);
  };

  const makeRoleChoice = (index: number) => {
    if (showConsequence) return;
    setRoleChoice(index);
    setShowConsequence(true);
    
    if (currentScenario && index === currentScenario.best) {
      setScore(s => s + 30);
      toast.success('👏 Best decision! +30 points');
    } else {
      toast.info('Consider the consequences carefully.');
    }
  };

  // Daily Challenge State
  const [dailyChallenge, setDailyChallenge] = useState<typeof dailyChallengePool[0] | null>(null);
  const [dailyCompleted, setDailyCompleted] = useState(false);

  useEffect(() => {
    const today = new Date().getDay();
    const todayKey = `funpun_daily_${new Date().toDateString()}`;
    const completed = localStorage.getItem(todayKey);
    
    setDailyChallenge(dailyChallengePool[today % dailyChallengePool.length]);
    setDailyCompleted(completed === 'true');
  }, []);

  const completeDailyChallenge = () => {
    const todayKey = `funpun_daily_${new Date().toDateString()}`;
    localStorage.setItem(todayKey, 'true');
    setDailyCompleted(true);
    if (dailyChallenge) {
      setScore(s => s + dailyChallenge.points);
      setStreak(s => s + 1);
    }
    toast.success(`🎯 Daily challenge complete! +${dailyChallenge?.points} points`);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg animate-pulse-glow shrink-0">
            <Gamepad2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gradient-text">FUNPUN</h1>
            <p className="text-xs text-muted-foreground">Games for refreshing your mind</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Trophy className="w-3 h-3" /> {score} pts
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="w-3 h-3" /> {streak} streak
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Level Progress */}
      <Card className="glass-card">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level {userLevel}</span>
            <span className="text-xs text-muted-foreground">{completedIds.size} challenges completed</span>
          </div>
          <Progress value={(completedIds.size % 5) * 20} className="h-2" />
          <p className="text-[10px] text-muted-foreground mt-1">{5 - (completedIds.size % 5)} more for next level</p>
        </CardContent>
      </Card>

      {/* Game Mode Selection */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {gameModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => { setActiveMode(mode.id); setIsPlaying(false); setCurrentChallenge(null); }}
              className={cn(
                "glass-card rounded-xl p-2 text-center transition-all hover:scale-105",
                isActive && "ring-2 ring-primary shadow-lg"
              )}
            >
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mx-auto mb-1",
                mode.color
              )}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-medium truncate">{mode.name.split(' ')[0]}</p>
            </button>
          );
        })}
      </div>

      {/* Active Game Mode Content */}
      <Card className="glass-card overflow-hidden min-h-[300px]">
        <CardContent className="p-4">
          
          {/* Random Discovery Mode */}
          {activeMode === 'random' && (
            <div className="space-y-4">
              {!currentChallenge ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto animate-pulse">
                    <Shuffle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">Random Discovery</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    System randomly selects one challenge. No repetition until cycle complete.
                  </p>
                  <Button onClick={startRandomChallenge} size="lg" className="gap-2">
                    <Play className="w-5 h-5" /> START
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Timer & Level */}
                  <div className="flex items-center justify-between">
                    <Badge className={getDifficultyColor(currentChallenge.level)}>
                      Level {currentChallenge.level}: {getDifficultyLabel(currentChallenge.level)}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      <span className={cn(
                        "font-mono font-bold",
                        timeLeft <= 5 && "text-red-500 animate-pulse"
                      )}>{timeLeft}s</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={(timeLeft / currentChallenge.time) * 100} className="h-2" />

                  {/* Challenge Card */}
                  <div className="bg-muted/30 rounded-xl p-6 text-center">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{currentChallenge.title}</h4>
                    <p className="text-lg font-semibold">{currentChallenge.instruction}</p>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-3">
                    {currentChallenge.options.map((opt: string, i: number) => (
                      <Button
                        key={i}
                        variant={showResult 
                          ? i === currentChallenge.correct 
                            ? "default" 
                            : selectedAnswer === i 
                              ? "destructive" 
                              : "outline"
                          : "outline"
                        }
                        className={cn(
                          "h-14 text-base transition-all",
                          showResult && i === currentChallenge.correct && "ring-2 ring-green-500",
                          !showResult && "hover:scale-105"
                        )}
                        onClick={() => handleAnswer(i)}
                        disabled={showResult}
                      >
                        {showResult && i === currentChallenge.correct && <Check className="w-4 h-4 mr-2" />}
                        {showResult && selectedAnswer === i && i !== currentChallenge.correct && <X className="w-4 h-4 mr-2" />}
                        {opt}
                      </Button>
                    ))}
                  </div>

                  {/* Result & Next */}
                  {showResult && (
                    <div className="flex justify-center pt-4">
                      <Button onClick={startRandomChallenge} className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Next Challenge
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Voice Interaction Mode */}
          {activeMode === 'voice' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold">Text → Voice Training</h3>
              <p className="text-sm text-muted-foreground">Improve clarity, rhythm, and delivery</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-4">
                {['Learning', 'Performance', 'Mimic', 'Emotion'].map((mode) => (
                  <Button key={mode} variant="outline" size="sm" className="text-xs">
                    {mode}
                  </Button>
                ))}
              </div>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Practice:</p>
                  <p className="text-lg font-medium italic">
                    "The quick brown fox jumps over the lazy dog."
                  </p>
                </CardContent>
              </Card>

              <Button size="lg" className="gap-2">
                <Mic className="w-5 h-5" /> Start Practice
              </Button>
              <p className="text-xs text-muted-foreground">
                Read clearly in under 10 seconds. Maintain steady pace.
              </p>
            </div>
          )}

          {/* Imposter Game */}
          {activeMode === 'imposter' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold">Guess the Imposter</h3>
              <p className="text-sm text-muted-foreground">Find the element that doesn't belong</p>
              
              <div className="grid grid-cols-2 gap-3 py-4 max-w-xs mx-auto">
                {imposterSets[0].items.map((item, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="h-16 text-lg hover:scale-105 transition-all"
                    onClick={() => {
                      if (i === imposterSets[0].imposter) {
                        toast.success('🎯 Correct! You found the imposter!');
                        setScore(s => s + 20);
                      } else {
                        toast.error('❌ Not the imposter. Try again!');
                      }
                    }}
                  >
                    {item}
                  </Button>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                One item breaks the functional rule. Identify it.
              </p>
            </div>
          )}

          {/* Stress Relief Room */}
          {activeMode === 'stress' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Stress Relief Room</h3>
                <Badge variant="secondary">{stressScore} pts</Badge>
              </div>
              
              <div className="flex gap-2 justify-center">
                {(['free', 'target', 'precision'] as const).map((mode) => (
                  <Button 
                    key={mode} 
                    variant={stressMode === mode ? "default" : "outline"} 
                    size="sm"
                    onClick={() => { setStressMode(mode); resetStressRoom(); }}
                    className="text-xs capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>

              {stressMode === 'target' && targetObject && (
                <p className="text-center text-sm">
                  Target: <span className="text-lg">{stressObjects.find(o => o.id === targetObject)?.emoji}</span>
                </p>
              )}

              <div className="grid grid-cols-3 gap-4 py-4">
                {stressObjects.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => handleBreakObject(obj.id)}
                    className={cn(
                      "aspect-square rounded-xl bg-muted/30 flex items-center justify-center text-4xl transition-all",
                      brokenObjects.has(obj.id) 
                        ? "opacity-30 scale-75" 
                        : "hover:scale-110 hover:bg-muted/50 active:scale-90",
                      stressMode === 'target' && targetObject === obj.id && "ring-2 ring-primary animate-pulse"
                    )}
                    disabled={brokenObjects.has(obj.id)}
                  >
                    {brokenObjects.has(obj.id) ? '💥' : obj.emoji}
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <Button onClick={resetStressRoom} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Reset Room
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                {stressMode === 'free' ? 'Free interaction - break anything!' : 
                 stressMode === 'target' ? 'Break only the marked target.' :
                 'Limited actions - accuracy matters.'}
              </p>
            </div>
          )}

          {/* Draw & Create */}
          {activeMode === 'draw' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto">
                <Paintbrush className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold">Draw & Create</h3>
              <p className="text-sm text-muted-foreground">Creative problem-solving challenges</p>
              
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <Badge className="mb-2">Level {drawChallenges[0].level}</Badge>
                  <p className="text-lg font-medium">{drawChallenges[0].instruction}</p>
                  <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>⏱️ {drawChallenges[0].time}s</span>
                    <span>🖌️ {drawChallenges[0].tools} tools</span>
                  </div>
                </CardContent>
              </Card>

              <div className="aspect-video bg-muted/20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Canvas Area</p>
              </div>

              <Button size="lg" className="gap-2">
                <Play className="w-5 h-5" /> Start Drawing
              </Button>
            </div>
          )}

          {/* Role Decision Game */}
          {activeMode === 'role' && (
            <div className="space-y-4">
              {!currentScenario ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mx-auto">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">Role-Based Decisions</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Make decisions as different roles. Your choices have consequences.
                  </p>
                  <Button onClick={startRoleChallenge} size="lg" className="gap-2">
                    <Play className="w-5 h-5" /> START
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Role: {currentScenario.role}</Badge>
                    <Badge variant="outline">Level {currentScenario.level}</Badge>
                  </div>

                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <p className="text-base font-medium">{currentScenario.situation}</p>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    {currentScenario.options.map((opt, i) => (
                      <Button
                        key={i}
                        variant={showConsequence 
                          ? i === currentScenario.best 
                            ? "default" 
                            : roleChoice === i 
                              ? "secondary" 
                              : "outline"
                          : "outline"
                        }
                        className={cn(
                          "w-full justify-start text-left h-auto py-3 px-4",
                          showConsequence && i === currentScenario.best && "ring-2 ring-green-500"
                        )}
                        onClick={() => makeRoleChoice(i)}
                        disabled={showConsequence}
                      >
                        <div>
                          <p className="font-medium">{opt}</p>
                          {showConsequence && (
                            <p className="text-xs text-muted-foreground mt-1">
                              → {currentScenario.consequences[i]}
                            </p>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>

                  {showConsequence && (
                    <div className="flex justify-center pt-4">
                      <Button onClick={startRoleChallenge} className="gap-2">
                        <ArrowRight className="w-4 h-4" /> Next Scenario
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Daily Challenge */}
          {activeMode === 'daily' && dailyChallenge && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold">Daily Challenge</h3>
              <p className="text-sm text-muted-foreground">One meaningful task per day</p>

              <Card className={cn(
                "bg-muted/30",
                dailyCompleted && "ring-2 ring-green-500"
              )}>
                <CardContent className="p-6">
                  <Badge className="mb-3 capitalize">{dailyChallenge.type}</Badge>
                  <p className="text-lg font-medium">{dailyChallenge.task}</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">{dailyChallenge.points} points</span>
                  </div>
                </CardContent>
              </Card>

              {dailyCompleted ? (
                <div className="space-y-2">
                  <Badge variant="secondary" className="gap-1">
                    <Check className="w-3 h-3" /> Completed Today!
                  </Badge>
                  <p className="text-xs text-muted-foreground">Come back tomorrow for a new challenge</p>
                </div>
              ) : (
                <Button onClick={completeDailyChallenge} size="lg" className="gap-2">
                  <Check className="w-5 h-5" /> Mark Complete
                </Button>
              )}

              <div className="pt-4">
                <p className="text-sm font-medium">Current Streak: {streak} days 🔥</p>
                <p className="text-xs text-muted-foreground">Consistency is rewarded with depth, not just points</p>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="glass-card">
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-primary">{completedIds.size}</p>
            <p className="text-[9px] text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-orange-500">{incorrectIds.size}</p>
            <p className="text-[9px] text-muted-foreground">To Retry</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-green-500">{streak}</p>
            <p className="text-[9px] text-muted-foreground">Streak</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-2 text-center">
            <p className="text-lg font-bold text-purple-500">Lv.{userLevel}</p>
            <p className="text-[9px] text-muted-foreground">Level</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
