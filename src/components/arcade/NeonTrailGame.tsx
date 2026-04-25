import { useEffect, useRef, useState, useCallback } from 'react';
import { GameHeader } from '@/components/arcade/GameHeader';
import { GameOverModal } from '@/components/arcade/GameOverModal';

interface Props {
  onBack: () => void;
}

const CELL = 18;
const STORAGE_KEY = 'lumatha_nt_best';

interface Particle {
  x: number; y: number; vx: number; vy: number; opacity: number; radius: number;
}
interface Milestone {
  text: string; opacity: number;
}

interface GS {
  trail: { x: number; y: number }[];
  dir: { x: number; y: number };
  nextDir: { x: number; y: number };
  food: { x: number; y: number };
  growPending: number;
  tickMs: number;
  lastTick: number;
  phase: 'playing' | 'dying' | 'dead';
  cols: number;
  rows: number;
  deathFlashes: number;
  deathTimer: number;
  timeLeft: number; // for timed mode
  lastTimestamp: number;
}

export function NeonTrailGame({ onBack, timedMode = false }: Props & { timedMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [gamePhase, setGamePhase] = useState<'playing' | 'gameover'>('playing');
  const scoreRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const milestoneRef = useRef<Milestone | null>(null);
  const dotGridCanvas = useRef<HTMLCanvasElement | null>(null);
  const gs = useRef<GS>(null!);
  const bestScore = useRef(0);
  const loopRunning = useRef(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) bestScore.current = parseInt(s, 10) || 0;
    } catch {}
  }, []);

  const spawnFood = useCallback((cols: number, rows: number, trail: { x: number; y: number }[]) => {
    let fx: number, fy: number;
    do {
      fx = Math.floor(Math.random() * cols);
      fy = Math.floor(Math.random() * rows);
    } while (trail.some(c => c.x === fx && c.y === fy));
    return { x: fx, y: fy };
  }, []);

  const triggerDeath = useCallback(() => {
    const g = gs.current;
    g.phase = 'dying';
    g.deathFlashes = 6;
    g.deathTimer = 0;
  }, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cols = Math.floor(canvas.width / CELL);
    const rows = Math.floor((canvas.height - 60) / CELL);
    const trail = [
      { x: 10, y: 15 }, { x: 9, y: 15 }, { x: 8, y: 15 }, { x: 7, y: 15 }, { x: 6, y: 15 },
    ];
    gs.current = {
      trail, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
      food: spawnFood(cols, rows, trail),
      growPending: 0, tickMs: 130, lastTick: 0,
      phase: 'playing', cols, rows,
      deathFlashes: 0, deathTimer: 0,
      timeLeft: 60, lastTimestamp: 0,
    };
    scoreRef.current = 0;
    particlesRef.current = [];
    milestoneRef.current = null;
    setScore(0);
    setGamePhase('playing');
  }, [spawnFood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const cols = Math.floor(canvas.width / CELL);
    const rows = Math.floor((canvas.height - 60) / CELL);
    const trail = [
      { x: 10, y: 15 }, { x: 9, y: 15 }, { x: 8, y: 15 }, { x: 7, y: 15 }, { x: 6, y: 15 },
    ];
    gs.current = {
      trail, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
      food: spawnFood(cols, rows, trail),
      growPending: 0, tickMs: 130, lastTick: 0,
      phase: 'playing', cols, rows,
      deathFlashes: 0, deathTimer: 0,
      timeLeft: 60, lastTimestamp: 0,
    };

    // Build dot grid offscreen canvas
    const dgc = document.createElement('canvas');
    dgc.width = canvas.width; dgc.height = canvas.height;
    const dgCtx = dgc.getContext('2d')!;
    dgCtx.fillStyle = 'rgba(0,245,255,0.04)';
    for (let x = 0; x <= cols; x++) {
      for (let y = 0; y <= rows; y++) {
        dgCtx.fillRect(x * CELL, y * CELL + 60, 1, 1);
      }
    }
    dotGridCanvas.current = dgc;

    // Swipe
    let touchStartX = 0, touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        gs.current.nextDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
      } else {
        gs.current.nextDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, { x: number; y: number }> = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      };
      if (map[e.key]) { gs.current.nextDir = map[e.key]; e.preventDefault(); }
    };
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);

    loopRunning.current = true;

    const loop = (ts: number) => {
      if (!loopRunning.current) return;
      const g = gs.current;
      const cw = canvas.width, ch = canvas.height;

      // Timed mode
      if (timedMode && g.phase === 'playing') {
        if (g.lastTimestamp > 0) {
          g.timeLeft -= (ts - g.lastTimestamp) / 1000;
          if (g.timeLeft <= 0) {
            g.timeLeft = 0;
            g.phase = 'dead';
            if (scoreRef.current > bestScore.current) {
              bestScore.current = scoreRef.current;
              try { localStorage.setItem(STORAGE_KEY, String(scoreRef.current)); } catch {}
            }
            setGamePhase('gameover');
          }
        }
        g.lastTimestamp = ts;
      }

      // Tick
      if (g.phase === 'playing' && ts - g.lastTick >= g.tickMs) {
        g.lastTick = ts;
        // Apply dir (block reversal)
        const nd = g.nextDir;
        if (!(nd.x === -g.dir.x && nd.y === -g.dir.y)) {
          g.dir = { ...nd };
        }
        const head = g.trail[0];
        const nh = { x: head.x + g.dir.x, y: head.y + g.dir.y };

        // Wall collision
        if (nh.x < 0 || nh.x >= g.cols || nh.y < 0 || nh.y >= g.rows) {
          triggerDeath();
        }
        // Self collision
        else if (g.trail.some(c => c.x === nh.x && c.y === nh.y)) {
          triggerDeath();
        } else {
          g.trail.unshift(nh);
          if (g.growPending > 0) g.growPending--;
          else g.trail.pop();

          // Food check
          if (nh.x === g.food.x && nh.y === g.food.y) {
            scoreRef.current += 10;
            setScore(scoreRef.current);
            g.growPending += 4;
            g.tickMs = Math.max(72, g.tickMs * 0.97);
            // Particles
            const fx = g.food.x * CELL + CELL / 2;
            const fy = g.food.y * CELL + 60 + CELL / 2;
            for (let i = 0; i < 6; i++) {
              particlesRef.current.push({
                x: fx, y: fy,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                opacity: 1, radius: 3,
              });
            }
            g.food = spawnFood(g.cols, g.rows, g.trail);
            // Milestones
            if (scoreRef.current === 50) milestoneRef.current = { text: 'NICE ✓', opacity: 1 };
            else if (scoreRef.current === 100) milestoneRef.current = { text: 'GREAT ✓✓', opacity: 1 };
            else if (scoreRef.current === 200) milestoneRef.current = { text: 'LEGENDARY ✓✓✓', opacity: 1 };
          }
        }
      }

      // Death flashing
      if (g.phase === 'dying') {
        g.deathTimer++;
        if (g.deathTimer % 6 === 0) g.deathFlashes--;
        if (g.deathFlashes <= 0) {
          g.phase = 'dead';
          if (scoreRef.current > bestScore.current) {
            bestScore.current = scoreRef.current;
            try { localStorage.setItem(STORAGE_KEY, String(scoreRef.current)); } catch {}
          }
          setGamePhase('gameover');
        }
      }

      // Update particles
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.opacity -= 0.045;
      }
      particlesRef.current = particlesRef.current.filter(p => p.opacity > 0);

      // Milestone fade
      if (milestoneRef.current) {
        milestoneRef.current.opacity -= 0.014;
        if (milestoneRef.current.opacity <= 0) milestoneRef.current = null;
      }

      // === DRAW ===
      ctx.fillStyle = '#050A18';
      ctx.fillRect(0, 0, cw, ch);

      // Dot grid
      if (dotGridCanvas.current) ctx.drawImage(dotGridCanvas.current, 0, 0);

      // Wall border
      ctx.strokeStyle = 'rgba(0,245,255,0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 61, cw - 2, ch - 62);

      const trailLen = g.trail.length;
      const glowBlur = trailLen > 20 ? 22 : trailLen > 10 ? 16 : 10;
      const flashWhite = g.phase === 'dying' && g.deathTimer % 6 < 3;

      // Trail body
      for (let i = g.trail.length - 1; i >= 1; i--) {
        const c = g.trail[i];
        const frac = 1 - i / g.trail.length;
        const px = c.x * CELL + 1;
        const py = c.y * CELL + 61;
        ctx.save();
        ctx.globalAlpha = 0.3 + frac * 0.7;
        ctx.fillStyle = flashWhite ? '#ffffff' : lerpColor('#003f44', '#00F5FF', frac);
        ctx.beginPath();
        ctx.roundRect(px, py, CELL - 2, CELL - 2, 4);
        ctx.fill();
        ctx.restore();
      }

      // Head
      if (g.trail.length > 0) {
        const h = g.trail[0];
        ctx.save();
        ctx.shadowColor = '#00F5FF';
        ctx.shadowBlur = glowBlur;
        ctx.fillStyle = flashWhite ? '#ffffff' : '#00F5FF';
        ctx.beginPath();
        ctx.arc(h.x * CELL + CELL / 2, h.y * CELL + 60 + CELL / 2, CELL * 0.44, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Food
      const fPulse = Math.sin(Date.now() / 380) * 2;
      ctx.save();
      ctx.shadowColor = '#FFD166';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#FFD166';
      ctx.beginPath();
      ctx.arc(
        g.food.x * CELL + CELL / 2,
        g.food.y * CELL + 60 + CELL / 2,
        CELL * 0.33 + fPulse, 0, Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      // Particles
      for (const p of particlesRef.current) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = '#FFD166';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Milestone text
      if (milestoneRef.current) {
        ctx.save();
        ctx.globalAlpha = milestoneRef.current.opacity;
        ctx.font = '700 28px Outfit, sans-serif';
        ctx.fillStyle = '#00F5FF';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00F5FF';
        ctx.shadowBlur = 20;
        ctx.fillText(milestoneRef.current.text, cw / 2, ch / 2);
        ctx.restore();
      }

      // Timer bar (timed mode)
      if (timedMode && g.phase === 'playing') {
        const barW = (g.timeLeft / 60) * cw;
        ctx.fillStyle = '#1C2541';
        ctx.fillRect(0, 60, cw, 4);
        ctx.fillStyle = '#00F5FF';
        ctx.fillRect(0, 60, barW, 4);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      loopRunning.current = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [spawnFood, triggerDeath, timedMode]);

  const setDir = (x: number, y: number) => {
    if (gs.current) gs.current.nextDir = { x, y };
  };

  const timerStr = timedMode && gs.current ? `${Math.floor(gs.current.timeLeft / 60)}:${String(Math.floor(gs.current.timeLeft % 60)).padStart(2, '0')}` : undefined;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#050A18' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
      />
      <GameHeader
        score={score}
        accentColor="#00F5FF"
        onBack={onBack}
        extraInfo={timerStr}
      />

      {/* D-pad */}
      {gamePhase === 'playing' && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          zIndex: 20, userSelect: 'none',
        }}>
          <DPadBtn label="▲" onPress={() => setDir(0, -1)} />
          <div style={{ display: 'flex', gap: 4 }}>
            <DPadBtn label="◀" onPress={() => setDir(-1, 0)} />
            <div style={{ width: 54, height: 54 }} />
            <DPadBtn label="▶" onPress={() => setDir(1, 0)} />
          </div>
          <DPadBtn label="▼" onPress={() => setDir(0, 1)} />
        </div>
      )}

      <GameOverModal
        visible={gamePhase === 'gameover'}
        score={score}
        bestScore={bestScore.current}
        xpEarned={score > bestScore.current ? 15 : 10}
        accentColor="#00F5FF"
        onRetry={resetGame}
        onMenu={onBack}
      />
    </div>
  );
}

function DPadBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
      onMouseDown={onPress}
      style={{
        width: 54, height: 54,
        background: 'rgba(28,37,65,0.88)',
        borderRadius: 12,
        border: '1px solid #243057',
        color: '#00F5FF',
        fontSize: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
