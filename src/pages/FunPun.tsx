import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Gamepad2, Shuffle, Mic, Brain, Target, Paintbrush, Users, Calendar,
  Play, Pause, Check, X, Volume2, VolumeX, RefreshCw, Trophy, Star,
  Timer, Zap, Lock, ArrowRight, ChevronLeft, ChevronRight, Square,
  Circle, Minus, Eraser, Undo2, Send, StopCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useGameSounds, SoundType } from '@/hooks/useGameSounds';
import { 
  randomChallenges, voicePractices, imposterSets, stressObjects,
  drawChallenges, roleScenarios, dailyChallengePool 
} from '@/data/funpunChallenges';

// Game modes configuration
const gameModes = [
  { id: 'stats', name: 'Stats', icon: Trophy, color: 'from-yellow-500 to-amber-500', desc: 'View your performance stats' },
  { id: 'random', name: 'Random Discovery', icon: Shuffle, color: 'from-violet-500 to-purple-600', desc: 'Random challenge from all sections' },
  { id: 'voice', name: 'Text → Voice', icon: Mic, color: 'from-blue-500 to-cyan-500', desc: 'Voice clarity & delivery training' },
  { id: 'imposter', name: 'Guess Imposter', icon: Brain, color: 'from-amber-500 to-orange-500', desc: 'Logic-based detection game' },
  { id: 'stress', name: 'Stress Relief', icon: Target, color: 'from-red-500 to-rose-500', desc: 'Controlled stress release room' },
  { id: 'draw', name: 'Draw & Create', icon: Paintbrush, color: 'from-green-500 to-emerald-500', desc: 'Creative problem solving' },
  { id: 'role', name: 'Role Decision', icon: Users, color: 'from-indigo-500 to-blue-600', desc: 'Scenario-based decisions' },
  { id: 'daily', name: 'Daily Challenge', icon: Calendar, color: 'from-pink-500 to-fuchsia-500', desc: 'One meaningful task per day' },
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
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { playSound, playSuccessMelody, playFailureMelody, playLevelUpMelody } = useGameSounds(soundEnabled);

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

  // Timer logic with tick sound
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      
      // Play tick sound for last 5 seconds
      if (timeLeft <= 5) {
        playSound('tick', 0.5 + (5 - timeLeft) * 0.1);
      }
    } else if (timeLeft === 0 && isPlaying) {
      handleTimeout();
    }
    return () => { 
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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

  const startRandomChallenge = () => {
    playSound('start');
    
    // Filter challenges based on completion status
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
      setStreak(s => s + 1);
      setCompletedIds(prev => new Set([...prev, currentChallenge.id]));
      setIncorrectIds(prev => {
        const next = new Set(prev);
        next.delete(currentChallenge.id);
        return next;
      });
      
      if ((completedIds.size + 1) % 5 === 0 && userLevel < 5) {
        setUserLevel(l => l + 1);
        playLevelUpMelody();
        toast.success(`🎉 Level Up! Now Level ${userLevel + 1}`);
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
    return colors[level - 1] || colors[0];
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['Basic', 'Timed', 'Multi-Step', 'Combined', 'Simulation'];
    return labels[level - 1] || labels[0];
  };

  // ============================================
  // VOICE INTERACTION STATE
  // ============================================
  const [voiceMode, setVoiceMode] = useState<'learning' | 'performance' | 'mimic' | 'emotion'>('learning');
  const [currentVoicePractice, setCurrentVoicePractice] = useState<typeof voicePractices[0] | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceScore, setVoiceScore] = useState<number | null>(null);
  const [voiceLevel, setVoiceLevel] = useState(1);
  const [completedVoiceIds, setCompletedVoiceIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.completedVoice);
    if (saved) setCompletedVoiceIds(new Set(JSON.parse(saved)));
  }, []);

  const startVoicePractice = () => {
    playSound('start');
    const available = voicePractices.filter(v => 
      v.level <= voiceLevel + 1 && 
      (v.mode === voiceMode || voiceMode === 'learning') &&
      !completedVoiceIds.has(v.id)
    );
    const pool = available.length > 0 ? available : voicePractices.filter(v => v.level <= voiceLevel + 1);
    const practice = pool[Math.floor(Math.random() * pool.length)];
    setCurrentVoicePractice(practice);
    setVoiceScore(null);
    setTimeLeft(10 + practice.level * 5);
    setIsPlaying(true);
  };

  const startRecording = () => {
    playSound('notification');
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPlaying(false);
    
    // Simulate voice evaluation
    const clarity = Math.floor(Math.random() * 30) + 70;
    const pace = Math.floor(Math.random() * 30) + 70;
    const tone = Math.floor(Math.random() * 30) + 70;
    const finalScore = Math.floor((clarity + pace + tone) / 3);
    
    setVoiceScore(finalScore);
    
    if (finalScore >= 80) {
      playSuccessMelody();
      setScore(s => s + finalScore);
      if (currentVoicePractice) {
        setCompletedVoiceIds(prev => {
          const next = new Set([...prev, currentVoicePractice.id]);
          localStorage.setItem(STORAGE_KEYS.completedVoice, JSON.stringify([...next]));
          return next;
        });
      }
      if (voiceLevel < 5 && completedVoiceIds.size > 0 && completedVoiceIds.size % 3 === 0) {
        setVoiceLevel(l => l + 1);
        playLevelUpMelody();
        toast.success(`🎤 Voice Level Up! Now Level ${voiceLevel + 1}`);
      } else {
        toast.success(`🎤 Great delivery! Score: ${finalScore}`);
      }
    } else {
      playSound('wrong');
      toast.info(`Practice more. Score: ${finalScore}`);
    }
  };

  // ============================================
  // IMPOSTER GAME STATE
  // ============================================
  const [currentImposterSet, setCurrentImposterSet] = useState<typeof imposterSets[0] | null>(null);
  const [imposterSelected, setImposterSelected] = useState<number | null>(null);
  const [showImposterResult, setShowImposterResult] = useState(false);
  const [imposterLevel, setImposterLevel] = useState(1);
  const [completedImposterIds, setCompletedImposterIds] = useState<Set<number>>(new Set());
  const [imposterTimeLeft, setImposterTimeLeft] = useState(0);
  const [imposterPlaying, setImposterPlaying] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.completedImposters);
    if (saved) setCompletedImposterIds(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    if (imposterPlaying && imposterTimeLeft > 0) {
      const timer = setTimeout(() => setImposterTimeLeft(t => t - 1), 1000);
      if (imposterTimeLeft <= 5) playSound('tick', 0.5);
      return () => clearTimeout(timer);
    } else if (imposterTimeLeft === 0 && imposterPlaying) {
      setImposterPlaying(false);
      setShowImposterResult(true);
      playFailureMelody();
      toast.error('⏱️ Time\'s up!');
    }
  }, [imposterPlaying, imposterTimeLeft]);

  const startImposterGame = () => {
    playSound('start');
    const available = imposterSets.filter(s => 
      s.level <= imposterLevel + 1 && !completedImposterIds.has(s.id)
    );
    const pool = available.length > 0 ? available : imposterSets.filter(s => s.level <= imposterLevel + 1);
    const set = pool[Math.floor(Math.random() * pool.length)];
    setCurrentImposterSet(set);
    setImposterSelected(null);
    setShowImposterResult(false);
    setImposterTimeLeft(set.level >= 3 ? 15 + set.level * 3 : 0);
    setImposterPlaying(set.level >= 3);
  };

  const selectImposter = (index: number) => {
    if (showImposterResult) return;
    playSound('click');
    setImposterSelected(index);
    setShowImposterResult(true);
    setImposterPlaying(false);

    if (currentImposterSet && index === currentImposterSet.imposter) {
      playSuccessMelody();
      const points = currentImposterSet.level * 15;
      setScore(s => s + points);
      setCompletedImposterIds(prev => {
        const next = new Set([...prev, currentImposterSet.id]);
        localStorage.setItem(STORAGE_KEYS.completedImposters, JSON.stringify([...next]));
        return next;
      });
      if (completedImposterIds.size > 0 && completedImposterIds.size % 4 === 0 && imposterLevel < 5) {
        setImposterLevel(l => l + 1);
        playLevelUpMelody();
        toast.success(`🧠 Logic Level Up! Now Level ${imposterLevel + 1}`);
      } else {
        toast.success(`🎯 Correct! +${points} points. Rule: ${currentImposterSet.rule}`);
      }
    } else {
      playFailureMelody();
      toast.error(`❌ Wrong! The imposter was: ${currentImposterSet?.items[currentImposterSet.imposter]}`);
    }
  };

  // ============================================
  // STRESS RELIEF STATE
  // ============================================
  const [stressScore, setStressScore] = useState(0);
  const [brokenObjects, setBrokenObjects] = useState<Set<number>>(new Set());
  const [stressMode, setStressMode] = useState<'free' | 'target' | 'precision' | 'endurance'>('free');
  const [targetObject, setTargetObject] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState(1);
  const [actionsLeft, setActionsLeft] = useState(10);
  const [stressTimeLeft, setStressTimeLeft] = useState(0);

  useEffect(() => {
    if (stressMode === 'endurance' && stressTimeLeft > 0) {
      const timer = setTimeout(() => setStressTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [stressMode, stressTimeLeft]);

  const handleBreakObject = (objId: number) => {
    if (brokenObjects.has(objId)) return;
    if (stressMode === 'precision' && actionsLeft <= 0) {
      toast.error('No actions left!');
      return;
    }
    
    const obj = stressObjects.find(o => o.id === objId);
    if (!obj) return;

    // Play appropriate sound
    playSound(obj.sound as SoundType);

    if (stressMode === 'target' && targetObject !== objId) {
      playSound('wrong');
      toast.error('Wrong target! Score reduced.');
      setStressScore(s => Math.max(0, s - 5));
      return;
    }

    setBrokenObjects(prev => new Set([...prev, objId]));
    setStressScore(s => s + obj.points);
    
    if (stressMode === 'precision') {
      setActionsLeft(a => a - 1);
    }

    if (stressMode === 'target') {
      const remaining = stressObjects.filter(o => !brokenObjects.has(o.id) && o.id !== objId);
      if (remaining.length > 0) {
        setTargetObject(remaining[Math.floor(Math.random() * remaining.length)].id);
      } else {
        playSuccessMelody();
        toast.success(`🎉 All targets cleared! Score: ${stressScore + obj.points}`);
        setScore(s => s + stressScore + obj.points);
      }
    }
  };

  const resetStressRoom = () => {
    playSound('whoosh');
    setBrokenObjects(new Set());
    setStressScore(0);
    setActionsLeft(10 - stressLevel);
    if (stressMode === 'target') {
      setTargetObject(stressObjects[Math.floor(Math.random() * stressObjects.length)].id);
    }
    if (stressMode === 'endurance') {
      setStressTimeLeft(30);
    }
  };

  // ============================================
  // DRAW & CREATE STATE
  // ============================================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [currentDrawChallenge, setCurrentDrawChallenge] = useState<typeof drawChallenges[0] | null>(null);
  const [drawTimeLeft, setDrawTimeLeft] = useState(0);
  const [drawPlaying, setDrawPlaying] = useState(false);
  const [undosLeft, setUndosLeft] = useState(5);
  const [drawLevel, setDrawLevel] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [completedDrawIds, setCompletedDrawIds] = useState<Set<number>>(new Set());
  const drawHistoryRef = useRef<ImageData[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.completedDraw);
    if (saved) setCompletedDrawIds(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    if (drawPlaying && drawTimeLeft > 0) {
      const timer = setTimeout(() => setDrawTimeLeft(t => t - 1), 1000);
      if (drawTimeLeft <= 5) playSound('tick', 0.5);
      return () => clearTimeout(timer);
    } else if (drawTimeLeft === 0 && drawPlaying) {
      setDrawPlaying(false);
      submitDrawing();
    }
  }, [drawPlaying, drawTimeLeft]);

  const startDrawChallenge = () => {
    playSound('start');
    const available = drawChallenges.filter(d => 
      d.level <= drawLevel + 1 && !completedDrawIds.has(d.id)
    );
    const pool = available.length > 0 ? available : drawChallenges.filter(d => d.level <= drawLevel + 1);
    const challenge = pool[Math.floor(Math.random() * pool.length)];
    setCurrentDrawChallenge(challenge);
    setDrawTimeLeft(challenge.time);
    setUndosLeft(challenge.undos || 5);
    drawHistoryRef.current = [];
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    if (challenge.type === 'memory' && challenge.preview) {
      setShowPreview(true);
      setTimeout(() => {
        setShowPreview(false);
        setDrawPlaying(true);
      }, 3000);
    } else {
      setDrawPlaying(true);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawPlaying) return;
    playSound('pencil');
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Save state for undo
        drawHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (drawHistoryRef.current.length > 10) drawHistoryRef.current.shift();
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        ctx.beginPath();
        ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawPlaying) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // Touch event handlers for mobile drawing
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawPlaying) return;
    e.preventDefault();
    playSound('pencil');
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (drawHistoryRef.current.length > 10) drawHistoryRef.current.shift();
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        ctx.beginPath();
        ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
      }
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawPlaying) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        ctx.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
  };

  const handleCanvasTouchEnd = () => {
    setIsDrawing(false);
  };

  const undoDraw = () => {
    if (undosLeft <= 0 || drawHistoryRef.current.length === 0) return;
    playSound('pop');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const lastState = drawHistoryRef.current.pop();
        if (lastState) {
          ctx.putImageData(lastState, 0, 0);
          setUndosLeft(u => u - 1);
        }
      }
    }
  };

  const clearCanvas = () => {
    playSound('whoosh');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const submitDrawing = () => {
    setDrawPlaying(false);
    // Simulate scoring
    const creativity = Math.floor(Math.random() * 30) + 70;
    const points = Math.floor(creativity * (currentDrawChallenge?.level || 1) / 10);
    
    playSuccessMelody();
    setScore(s => s + points);
    
    if (currentDrawChallenge) {
      setCompletedDrawIds(prev => {
        const next = new Set([...prev, currentDrawChallenge.id]);
        localStorage.setItem(STORAGE_KEYS.completedDraw, JSON.stringify([...next]));
        return next;
      });
    }
    
    toast.success(`🎨 Drawing submitted! +${points} points`);
    
    if (completedDrawIds.size > 0 && completedDrawIds.size % 3 === 0 && drawLevel < 5) {
      setDrawLevel(l => l + 1);
      playLevelUpMelody();
      toast.success(`🖌️ Art Level Up! Now Level ${drawLevel + 1}`);
    }
  };

  // ============================================
  // ROLE DECISION STATE
  // ============================================
  const [currentScenario, setCurrentScenario] = useState<typeof roleScenarios[0] | null>(null);
  const [roleChoice, setRoleChoice] = useState<number | null>(null);
  const [showConsequence, setShowConsequence] = useState(false);
  const [roleLevel, setRoleLevel] = useState(1);
  const [completedRoleIds, setCompletedRoleIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.completedRole);
    if (saved) setCompletedRoleIds(new Set(JSON.parse(saved)));
  }, []);

  const startRoleChallenge = () => {
    playSound('decision');
    const available = roleScenarios.filter(s => 
      s.level <= roleLevel + 1 && !completedRoleIds.has(s.id)
    );
    const pool = available.length > 0 ? available : roleScenarios.filter(s => s.level <= roleLevel + 1);
    const scenario = pool[Math.floor(Math.random() * pool.length)];
    setCurrentScenario(scenario);
    setRoleChoice(null);
    setShowConsequence(false);
  };

  const makeRoleChoice = (index: number) => {
    if (showConsequence) return;
    playSound('click');
    setRoleChoice(index);
    setShowConsequence(true);
    
    if (currentScenario && index === currentScenario.best) {
      playSuccessMelody();
      const points = currentScenario.level * 20;
      setScore(s => s + points);
      setCompletedRoleIds(prev => {
        const next = new Set([...prev, currentScenario.id]);
        localStorage.setItem(STORAGE_KEYS.completedRole, JSON.stringify([...next]));
        return next;
      });
      
      if (completedRoleIds.size > 0 && completedRoleIds.size % 3 === 0 && roleLevel < 5) {
        setRoleLevel(l => l + 1);
        playLevelUpMelody();
        toast.success(`👔 Decision Level Up! Now Level ${roleLevel + 1}`);
      } else {
        toast.success(`👏 Best decision! +${points} points`);
      }
    } else {
      playSound('notification');
      toast.info('Consider the consequences carefully.');
    }
  };

  // ============================================
  // DAILY CHALLENGE STATE
  // ============================================
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
    playSuccessMelody();
    if (dailyChallenge) {
      setScore(s => s + dailyChallenge.points);
      setStreak(s => s + 1);
    }
    toast.success(`🎯 Daily challenge complete! +${dailyChallenge?.points} points`);
  };

  // ============================================
  // RENDER
  // ============================================
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
              onClick={() => { 
                playSound('click');
                setActiveMode(mode.id); 
                setIsPlaying(false); 
                setCurrentChallenge(null); 
              }}
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
          
          {/* Stats Dashboard */}
          {activeMode === 'stats' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold">Performance Stats</h3>
                <p className="text-sm text-muted-foreground">Track your progress across all games</p>
              </div>

              {/* Overall Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                  <CardContent className="p-3 text-center">
                    <Trophy className="w-6 h-6 mx-auto mb-1 text-violet-500" />
                    <p className="text-2xl font-bold">{score}</p>
                    <p className="text-[10px] text-muted-foreground">Total Points</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                  <CardContent className="p-3 text-center">
                    <Zap className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                    <p className="text-2xl font-bold">{streak}</p>
                    <p className="text-[10px] text-muted-foreground">Day Streak</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                  <CardContent className="p-3 text-center">
                    <Check className="w-6 h-6 mx-auto mb-1 text-green-500" />
                    <p className="text-2xl font-bold">{completedIds.size}</p>
                    <p className="text-[10px] text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                  <CardContent className="p-3 text-center">
                    <Star className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold">{userLevel}</p>
                    <p className="text-[10px] text-muted-foreground">Current Level</p>
                  </CardContent>
                </Card>
              </div>

              {/* Game-specific Stats */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Game Progress</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Shuffle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Random Discovery</p>
                        <p className="text-[10px] text-muted-foreground">Level {userLevel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{completedIds.size}/{randomChallenges.length}</p>
                      <Progress value={(completedIds.size / randomChallenges.length) * 100} className="w-16 h-1" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Mic className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Voice Training</p>
                        <p className="text-[10px] text-muted-foreground">Level {voiceLevel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{completedVoiceIds.size}/{voicePractices.length}</p>
                      <Progress value={(completedVoiceIds.size / voicePractices.length) * 100} className="w-16 h-1" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Guess Imposter</p>
                        <p className="text-[10px] text-muted-foreground">Level {imposterLevel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{completedImposterIds.size}/{imposterSets.length}</p>
                      <Progress value={(completedImposterIds.size / imposterSets.length) * 100} className="w-16 h-1" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Paintbrush className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Draw & Create</p>
                        <p className="text-[10px] text-muted-foreground">Level {drawLevel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{completedDrawIds.size}/{drawChallenges.length}</p>
                      <Progress value={(completedDrawIds.size / drawChallenges.length) * 100} className="w-16 h-1" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Role Decision</p>
                        <p className="text-[10px] text-muted-foreground">Level {roleLevel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{completedRoleIds.size}/{roleScenarios.length}</p>
                      <Progress value={(completedRoleIds.size / roleScenarios.length) * 100} className="w-16 h-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Achievements</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className={cn(
                    "p-2 rounded-lg text-center border",
                    score >= 100 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-muted/20 border-muted"
                  )}>
                    <span className="text-xl">{score >= 100 ? '🏆' : '🔒'}</span>
                    <p className="text-[9px] mt-1">100 Points</p>
                  </div>
                  <div className={cn(
                    "p-2 rounded-lg text-center border",
                    score >= 500 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-muted/20 border-muted"
                  )}>
                    <span className="text-xl">{score >= 500 ? '⭐' : '🔒'}</span>
                    <p className="text-[9px] mt-1">500 Points</p>
                  </div>
                  <div className={cn(
                    "p-2 rounded-lg text-center border",
                    score >= 1000 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-muted/20 border-muted"
                  )}>
                    <span className="text-xl">{score >= 1000 ? '👑' : '🔒'}</span>
                    <p className="text-[9px] mt-1">1000 Points</p>
                  </div>
                  <div className={cn(
                    "p-2 rounded-lg text-center border",
                    streak >= 7 ? "bg-green-500/10 border-green-500/30" : "bg-muted/20 border-muted"
                  )}>
                    <span className="text-xl">{streak >= 7 ? '🔥' : '🔒'}</span>
                    <p className="text-[9px] mt-1">7 Day Streak</p>
                  </div>
                  <div className={cn(
                    "p-2 rounded-lg text-center border",
                    userLevel >= 3 ? "bg-blue-500/10 border-blue-500/30" : "bg-muted/20 border-muted"
                  )}>
                    <span className="text-xl">{userLevel >= 3 ? '🎯' : '🔒'}</span>
                    <p className="text-[9px] mt-1">Level 3</p>
                  </div>
                  <div className={cn(
                    "p-2 rounded-lg text-center border",
                    userLevel >= 5 ? "bg-purple-500/10 border-purple-500/30" : "bg-muted/20 border-muted"
                  )}>
                    <span className="text-xl">{userLevel >= 5 ? '💎' : '🔒'}</span>
                    <p className="text-[9px] mt-1">Master</p>
                  </div>
                </div>
              </div>

              {/* Reset Progress */}
              <div className="pt-4 border-t border-border/50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm('Reset all progress? This cannot be undone.')) {
                      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
                      window.location.reload();
                    }
                  }}
                >
                  Reset All Progress
                </Button>
              </div>
            </div>
          )}
          
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
                    Difficulty adapts to your history.
                  </p>
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                    <span>📊 {randomChallenges.length} challenges</span>
                    <span>✅ {completedIds.size} completed</span>
                    <span>🔄 {incorrectIds.size} to retry</span>
                  </div>
                  <Button onClick={startRandomChallenge} size="lg" className="gap-2">
                    <Play className="w-5 h-5" /> START
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
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

                  <Progress value={(timeLeft / currentChallenge.time) * 100} className="h-2" />

                  <div className="bg-muted/30 rounded-xl p-6 text-center">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">{currentChallenge.title}</h4>
                    <p className="text-lg font-semibold">{currentChallenge.instruction}</p>
                  </div>

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
            <div className="space-y-4">
              {!currentVoicePractice ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">Text → Voice Training</h3>
                  <p className="text-sm text-muted-foreground">Improve clarity, rhythm, and delivery</p>
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>Level {voiceLevel}</span>
                    <span>•</span>
                    <span>{completedVoiceIds.size} completed</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
                    {(['learning', 'performance', 'mimic', 'emotion'] as const).map((mode) => (
                      <Button 
                        key={mode} 
                        variant={voiceMode === mode ? "default" : "outline"} 
                        size="sm" 
                        className="text-xs capitalize"
                        onClick={() => setVoiceMode(mode)}
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Learning:</strong> Basic words & phrases</p>
                    <p><strong>Performance:</strong> Clear delivery under time</p>
                    <p><strong>Mimic:</strong> Repeat after system</p>
                    <p><strong>Emotion:</strong> Tone-based delivery</p>
                  </div>

                  <Button onClick={startVoicePractice} size="lg" className="gap-2">
                    <Play className="w-5 h-5" /> Start Practice
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Level {currentVoicePractice.level}</Badge>
                    {isPlaying && (
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4" />
                        <span className={cn("font-mono", timeLeft <= 5 && "text-red-500")}>{timeLeft}s</span>
                      </div>
                    )}
                  </div>

                  <Card className="bg-muted/30">
                    <CardContent className="p-6 text-center">
                      <p className="text-xs text-muted-foreground mb-2 capitalize">{currentVoicePractice.mode} Mode</p>
                      <p className="text-xl font-medium italic">"{currentVoicePractice.text}"</p>
                      {currentVoicePractice.environment && (
                        <p className="text-xs text-muted-foreground mt-2">🔊 Environment: {currentVoicePractice.environment}</p>
                      )}
                    </CardContent>
                  </Card>

                  {voiceScore === null ? (
                    <div className="flex justify-center gap-4">
                      {!isRecording ? (
                        <Button onClick={startRecording} size="lg" className="gap-2" disabled={!isPlaying}>
                          <Mic className="w-5 h-5" /> Start Recording
                        </Button>
                      ) : (
                        <Button onClick={stopRecording} size="lg" variant="destructive" className="gap-2 animate-pulse">
                          <StopCircle className="w-5 h-5" /> Stop & Submit
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{voiceScore}/100</p>
                        <p className="text-sm text-muted-foreground">
                          {voiceScore >= 90 ? 'Excellent!' : voiceScore >= 80 ? 'Great job!' : voiceScore >= 70 ? 'Good effort!' : 'Keep practicing!'}
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <Button onClick={() => { setCurrentVoicePractice(null); setVoiceScore(null); }} className="gap-2">
                          <RefreshCw className="w-4 h-4" /> Next Practice
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Imposter Game */}
          {activeMode === 'imposter' && (
            <div className="space-y-4">
              {!currentImposterSet ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">Guess the Imposter</h3>
                  <p className="text-sm text-muted-foreground">Find the element that doesn't belong based on logic</p>
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>Level {imposterLevel}</span>
                    <span>•</span>
                    <span>{completedImposterIds.size}/{imposterSets.length} completed</span>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Level 1-2:</strong> No timer</p>
                    <p><strong>Level 3+:</strong> Timer enabled</p>
                    <p><strong>Level 4+:</strong> Hidden rules</p>
                  </div>

                  <Button onClick={startImposterGame} size="lg" className="gap-2">
                    <Play className="w-5 h-5" /> START
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Level {currentImposterSet.level}</Badge>
                    {imposterTimeLeft > 0 && (
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4" />
                        <span className={cn("font-mono", imposterTimeLeft <= 5 && "text-red-500")}>{imposterTimeLeft}s</span>
                      </div>
                    )}
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    One item breaks the rule. Identify the imposter.
                  </p>

                  {currentImposterSet.level >= 3 && !showImposterResult && (
                    <Progress value={(imposterTimeLeft / (15 + currentImposterSet.level * 3)) * 100} className="h-2" />
                  )}

                  <div className="grid grid-cols-2 gap-3 py-4 max-w-sm mx-auto">
                    {currentImposterSet.items.map((item, i) => (
                      <Button 
                        key={i} 
                        variant={showImposterResult
                          ? i === currentImposterSet.imposter
                            ? "default"
                            : imposterSelected === i
                              ? "destructive"
                              : "outline"
                          : "outline"
                        }
                        className={cn(
                          "h-16 text-lg transition-all",
                          showImposterResult && i === currentImposterSet.imposter && "ring-2 ring-green-500",
                          !showImposterResult && "hover:scale-105"
                        )}
                        onClick={() => selectImposter(i)}
                        disabled={showImposterResult}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>

                  {showImposterResult && (
                    <div className="space-y-3">
                      <p className="text-center text-sm">
                        <strong>Rule:</strong> {currentImposterSet.rule}
                      </p>
                      <div className="flex justify-center">
                        <Button onClick={() => setCurrentImposterSet(null)} className="gap-2">
                          <RefreshCw className="w-4 h-4" /> Next Challenge
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stress Relief Room */}
          {activeMode === 'stress' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Stress Relief Room</h3>
                <Badge variant="secondary">{stressScore} pts</Badge>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {(['free', 'target', 'precision', 'endurance'] as const).map((mode) => (
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

              <div className="text-xs text-muted-foreground text-center">
                {stressMode === 'free' && 'Free interaction - break anything!'}
                {stressMode === 'target' && targetObject && (
                  <span>Target: <span className="text-2xl">{stressObjects.find(o => o.id === targetObject)?.emoji}</span></span>
                )}
                {stressMode === 'precision' && <span>Actions left: {actionsLeft}</span>}
                {stressMode === 'endurance' && <span>Time: {stressTimeLeft}s</span>}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4">
                {stressObjects.map((obj) => (
                  <button
                    key={obj.id}
                    onClick={() => handleBreakObject(obj.id)}
                    className={cn(
                      "aspect-square rounded-xl bg-muted/30 flex flex-col items-center justify-center text-3xl sm:text-4xl transition-all relative",
                      brokenObjects.has(obj.id) 
                        ? "opacity-30 scale-75" 
                        : "hover:scale-110 hover:bg-muted/50 active:scale-90",
                      stressMode === 'target' && targetObject === obj.id && "ring-2 ring-primary animate-pulse"
                    )}
                    disabled={brokenObjects.has(obj.id)}
                  >
                    {brokenObjects.has(obj.id) ? '💥' : obj.emoji}
                    <span className="text-[8px] text-muted-foreground mt-1">{obj.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <Button onClick={resetStressRoom} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Reset Room
                </Button>
              </div>
            </div>
          )}

          {/* Draw & Create */}
          {activeMode === 'draw' && (
            <div className="space-y-4">
              {!currentDrawChallenge ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto">
                    <Paintbrush className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">Draw & Create</h3>
                  <p className="text-sm text-muted-foreground">Creative problem-solving challenges</p>
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>Level {drawLevel}</span>
                    <span>•</span>
                    <span>{completedDrawIds.size} completed</span>
                  </div>

                  <Button onClick={startDrawChallenge} size="lg" className="gap-2">
                    <Play className="w-5 h-5" /> Start Challenge
                  </Button>
                </div>
              ) : showPreview ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-sm text-muted-foreground">Memorize this pattern:</p>
                  <p className="text-6xl">{currentDrawChallenge.preview}</p>
                  <p className="text-xs text-muted-foreground animate-pulse">Starting in 3 seconds...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">Level {currentDrawChallenge.level}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Undos: {undosLeft}</span>
                      <Timer className="w-4 h-4" />
                      <span className={cn("font-mono text-sm", drawTimeLeft <= 10 && "text-red-500")}>{drawTimeLeft}s</span>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-2 text-center">
                    <p className="text-sm font-medium">{currentDrawChallenge.instruction}</p>
                    <p className="text-xs text-muted-foreground">
                      Tools: {currentDrawChallenge.tools} | 
                      {currentDrawChallenge.colors && ` Colors: ${currentDrawChallenge.colors} |`}
                      Time: {currentDrawChallenge.time}s
                    </p>
                  </div>

                  <div className="flex items-center gap-2 justify-center flex-wrap">
                    <div className="flex gap-1">
                      {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].slice(0, currentDrawChallenge.colors || 5).map(color => (
                        <button
                          key={color}
                          onClick={() => setDrawColor(color)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2",
                            drawColor === color ? "border-primary" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {[2, 4, 8].map(size => (
                        <button
                          key={size}
                          onClick={() => setBrushSize(size)}
                          className={cn(
                            "w-8 h-8 rounded border flex items-center justify-center",
                            brushSize === size ? "border-primary bg-primary/10" : "border-muted"
                          )}
                        >
                          <div className="rounded-full bg-foreground" style={{ width: size * 2, height: size * 2 }} />
                        </button>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={undoDraw} disabled={undosLeft <= 0}>
                      <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearCanvas}>
                      <Eraser className="w-4 h-4" />
                    </Button>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={200}
                    className="border rounded-lg bg-white w-full max-w-sm mx-auto cursor-crosshair touch-none"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onTouchStart={handleCanvasTouchStart}
                    onTouchMove={handleCanvasTouchMove}
                    onTouchEnd={handleCanvasTouchEnd}
                  />

                  <div className="flex justify-center gap-2">
                    <Button onClick={submitDrawing} className="gap-2">
                      <Send className="w-4 h-4" /> Submit Drawing
                    </Button>
                  </div>
                </div>
              )}
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
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span>Level {roleLevel}</span>
                    <span>•</span>
                    <span>{completedRoleIds.size} completed</span>
                  </div>
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
                      <Button onClick={() => setCurrentScenario(null)} className="gap-2">
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
              <p className="text-sm text-muted-foreground">One meaningful task per day. Personal progress only.</p>

              <Card className={cn(
                "bg-muted/30",
                dailyCompleted && "ring-2 ring-green-500"
              )}>
                <CardContent className="p-6">
                  <Badge className="mb-3 capitalize">{dailyChallenge.type}</Badge>
                  <p className="text-lg font-medium">{dailyChallenge.task}</p>
                  <div className="flex justify-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" /> {dailyChallenge.points} pts
                    </span>
                    <span className="capitalize">{dailyChallenge.difficulty}</span>
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
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
