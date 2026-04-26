import { useEffect, useRef, useState, useCallback } from 'react';
import { GameHeader } from '@/components/arcade/GameHeader';
import { GameOverModal } from '@/components/arcade/GameOverModal';

interface Props { onBack: () => void; }

const ACCENT = '#C084FC';
const STORAGE_KEY = 'lumatha_sc_best';

interface Disc {
  id: number; x: number; y: number; vx: number; vy: number;
  type: 'white' | 'black' | 'queen'; potted: boolean; pottingAnim: number;
}

interface Striker {
  x: number; y: number; vx: number; vy: number;
  active: boolean; potted: boolean;
}

interface GS {
  discs: Disc[];
  striker: Striker;
  phase: 'aim' | 'power' | 'moving' | 'settling' | 'bot' | 'gameover';
  playerScore: number;
  aiScore: number;
  turn: 'player' | 'ai';
  aimAngle: number;
  pullback: number;
  boardSize: number;
  boardX: number;
  boardY: number;
  pocketFlash: { x: number; y: number; opacity: number }[];
}

const POCKET_RADIUS = 20;
const DISC_RADIUS = 13;
const STRIKER_RADIUS = 16;
const FRICTION = 0.982;
const MIN_VEL = 0.15;

function getPockets(bx: number, by: number, bs: number): { x: number; y: number }[] {
  const m = 14;
  return [
    { x: bx + m, y: by + m },
    { x: bx + bs - m, y: by + m },
    { x: bx + m, y: by + bs - m },
    { x: bx + bs - m, y: by + bs - m },
  ];
}

function initDiscs(bx: number, by: number, bs: number): Disc[] {
  const cx = bx + bs / 2, cy = by + bs / 2;
  const discs: Disc[] = [];
  let id = 0;

  // Queen at center
  discs.push({ id: id++, x: cx, y: cy, vx: 0, vy: 0, type: 'queen', potted: false, pottingAnim: 0 });

  // Inner ring (6 discs alternating)
  const innerR = 22;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    discs.push({
      id: id++,
      x: cx + Math.cos(angle) * innerR,
      y: cy + Math.sin(angle) * innerR,
      vx: 0, vy: 0,
      type: i % 2 === 0 ? 'white' : 'black',
      potted: false, pottingAnim: 0,
    });
  }

  // Outer ring (12 discs alternating)
  const outerR = 44;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + 0.15;
    discs.push({
      id: id++,
      x: cx + Math.cos(angle) * outerR,
      y: cy + Math.sin(angle) * outerR,
      vx: 0, vy: 0,
      type: i % 2 === 0 ? 'white' : 'black',
      potted: false, pottingAnim: 0,
    });
  }

  return discs;
}

export function StrikeCircleGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [score, setScore] = useState(0);
  const [aiScoreState, setAiScoreState] = useState(0);
  const [gamePhase, setGamePhase] = useState<'playing' | 'gameover'>('playing');
  const bestScore = useRef(0);
  const gs = useRef<GS>(null!);
  const dragging = useRef(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) bestScore.current = parseInt(s, 10) || 0; } catch {}
  }, []);

  const resetStriker = useCallback((g: GS) => {
    const baseY = g.boardY + g.boardSize - 70;
    g.striker = {
      x: g.boardX + g.boardSize / 2,
      y: baseY,
      vx: 0, vy: 0, active: false, potted: false,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const bs = Math.min(canvas.width - 20, 460);
      const bx = (canvas.width - bs) / 2;
      const by = 80;
      if (!gs.current) {
        gs.current = {
          discs: initDiscs(bx, by, bs),
          striker: { x: bx + bs / 2, y: by + bs - 70, vx: 0, vy: 0, active: false, potted: false },
          phase: 'aim', playerScore: 0, aiScore: 0, turn: 'player',
          aimAngle: -Math.PI / 2, pullback: 0,
          boardSize: bs, boardX: bx, boardY: by,
          pocketFlash: [],
        };
      } else {
        gs.current.boardSize = bs;
        gs.current.boardX = bx;
        gs.current.boardY = by;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Input
    const getPos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      if ('touches' in e && e.touches.length > 0) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
      if ('clientX' in e) return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top };
      return null;
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      const g = gs.current;
      if (g.phase !== 'aim') return;
      const pos = getPos(e);
      if (!pos) return;
      const dx = pos.x - g.striker.x, dy = pos.y - g.striker.y;
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        dragging.current = true;
        dragStart.current = pos;
      }
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      const g = gs.current;
      if (!dragging.current || g.phase !== 'aim') return;
      const pos = getPos(e);
      if (!pos || !dragStart.current) return;

      // Move striker along baseline
      const newX = Math.max(g.boardX + 30, Math.min(g.boardX + g.boardSize - 30, pos.x));
      g.striker.x = newX;

      // Calculate aim angle and pullback
      const dx = dragStart.current.x - pos.x;
      const dy = dragStart.current.y - pos.y;
      if (dy > 10) {
        g.aimAngle = Math.atan2(-dy, dx) + Math.PI;
        g.pullback = Math.min(120, Math.sqrt(dx * dx + dy * dy));
        g.phase = 'power';
      }
    };
    const onUp = () => {
      const g = gs.current;
      if (!dragging.current) return;
      dragging.current = false;
      dragStart.current = null;

      if (g.phase === 'power' && g.pullback > 15) {
        const power = g.pullback * 0.12;
        g.striker.vx = Math.cos(g.aimAngle) * power;
        g.striker.vy = Math.sin(g.aimAngle) * power;
        g.striker.active = true;
        g.phase = 'moving';
        g.pullback = 0;
        try { navigator.vibrate?.(15); } catch {}
      } else {
        g.phase = 'aim';
        g.pullback = 0;
      }
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    canvas.addEventListener('touchmove', onMove, { passive: true });
    canvas.addEventListener('touchend', onUp);

    const loop = () => {
      const g = gs.current;
      if (!g) { rafRef.current = requestAnimationFrame(loop); return; }
      const { boardX: bx, boardY: by, boardSize: bs } = g;
      const cw = canvas.width, ch = canvas.height;
      const pockets = getPockets(bx, by, bs);
      const allBodies = [...g.discs.filter(d => !d.potted), ...(g.striker.active ? [g.striker] : [])];

      if (g.phase === 'moving') {
        // Physics step
        for (const body of allBodies) {
          body.x += body.vx;
          body.y += body.vy;
          body.vx *= FRICTION;
          body.vy *= FRICTION;

          const r = 'type' in body ? DISC_RADIUS : STRIKER_RADIUS;

          // Wall bounces
          if (body.x - r < bx + 8) { body.vx = Math.abs(body.vx) * 0.8; body.x = bx + 8 + r; }
          if (body.x + r > bx + bs - 8) { body.vx = -Math.abs(body.vx) * 0.8; body.x = bx + bs - 8 - r; }
          if (body.y - r < by + 8) { body.vy = Math.abs(body.vy) * 0.8; body.y = by + 8 + r; }
          if (body.y + r > by + bs - 8) { body.vy = -Math.abs(body.vy) * 0.8; body.y = by + bs - 8 - r; }
        }

        // Disc-disc collisions
        for (let i = 0; i < allBodies.length; i++) {
          for (let j = i + 1; j < allBodies.length; j++) {
            const a = allBodies[i], b = allBodies[j];
            const ra = 'type' in a ? DISC_RADIUS : STRIKER_RADIUS;
            const rb = 'type' in b ? DISC_RADIUS : STRIKER_RADIUS;
            const dx = b.x - a.x, dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = ra + rb;
            if (dist < minDist && dist > 0) {
              const nx = dx / dist, ny = dy / dist;
              const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
              const dvn = dvx * nx + dvy * ny;
              if (dvn > 0) {
                a.vx -= dvn * nx * 0.9;
                a.vy -= dvn * ny * 0.9;
                b.vx += dvn * nx * 0.9;
                b.vy += dvn * ny * 0.9;
                const overlap = (minDist - dist) / 2;
                a.x -= nx * overlap;
                a.y -= ny * overlap;
                b.x += nx * overlap;
                b.y += ny * overlap;
                try { navigator.vibrate?.(8); } catch {}
              }
            }
          }
        }

        // Pocket detection
        for (const disc of g.discs) {
          if (disc.potted) continue;
          for (const pocket of pockets) {
            const dx = disc.x - pocket.x, dy = disc.y - pocket.y;
            if (Math.sqrt(dx * dx + dy * dy) < POCKET_RADIUS) {
              disc.potted = true;
              disc.pottingAnim = 1;
              disc.vx = 0; disc.vy = 0;
              g.pocketFlash.push({ x: pocket.x, y: pocket.y, opacity: 1 });
              try { navigator.vibrate?.(25); } catch {}

              if (disc.type === 'queen') {
                if (g.turn === 'player') g.playerScore += 3;
                else g.aiScore += 3;
              } else if ((disc.type === 'white' && g.turn === 'player') || (disc.type === 'black' && g.turn === 'ai')) {
                if (g.turn === 'player') g.playerScore++;
                else g.aiScore++;
              }
              setScore(g.playerScore);
              setAiScoreState(g.aiScore);
            }
          }
        }

        // Check striker potted
        for (const pocket of pockets) {
          const dx = g.striker.x - pocket.x, dy = g.striker.y - pocket.y;
          if (g.striker.active && Math.sqrt(dx * dx + dy * dy) < POCKET_RADIUS) {
            g.striker.potted = true;
            g.striker.active = false;
            g.striker.vx = 0; g.striker.vy = 0;
            // Foul: lose a point
            if (g.turn === 'player' && g.playerScore > 0) { g.playerScore--; setScore(g.playerScore); }
          }
        }

        // Check all stopped
        const allStopped = allBodies.every(b => Math.abs(b.vx) < MIN_VEL && Math.abs(b.vy) < MIN_VEL);
        if (allStopped) {
          allBodies.forEach(b => { b.vx = 0; b.vy = 0; });
          g.phase = 'settling';

          // Check game end
          const whiteLeft = g.discs.filter(d => d.type === 'white' && !d.potted).length;
          const blackLeft = g.discs.filter(d => d.type === 'black' && !d.potted).length;

          if (whiteLeft === 0 || blackLeft === 0) {
            g.phase = 'gameover';
            if (g.playerScore > bestScore.current) {
              bestScore.current = g.playerScore;
              try { localStorage.setItem(STORAGE_KEY, String(g.playerScore)); } catch {}
            }
            setGamePhase('gameover');
          } else {
            // Next turn
            setTimeout(() => {
              const nextTurn = g.turn === 'player' ? 'ai' : 'player';
              g.turn = nextTurn;
              g.striker.potted = false;
              g.striker.active = false;
              resetStriker(g);

              if (nextTurn === 'ai') {
                g.phase = 'bot';
                // Bot shoots after delay
                setTimeout(() => {
                  // Aim at nearest target
                  const targets = g.discs.filter(d => !d.potted && d.type === 'black');
                  const target = targets.length > 0 ? targets[0] : g.discs.find(d => !d.potted);
                  if (target) {
                    const dx = target.x - g.striker.x;
                    const dy = target.y - g.striker.y;
                    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;
                    const power = 5 + Math.random() * 4;
                    g.striker.vx = Math.cos(angle) * power;
                    g.striker.vy = Math.sin(angle) * power;
                    g.striker.active = true;
                    g.phase = 'moving';
                  } else {
                    g.turn = 'player';
                    g.phase = 'aim';
                    resetStriker(g);
                  }
                }, 1200);
              } else {
                g.phase = 'aim';
              }
            }, 500);
          }
        }
      }

      // Potting animations
      for (const disc of g.discs) {
        if (disc.pottingAnim > 0) disc.pottingAnim -= 0.05;
      }

      // Pocket flashes
      for (const pf of g.pocketFlash) pf.opacity -= 0.04;
      g.pocketFlash = g.pocketFlash.filter(pf => pf.opacity > 0);

      // === DRAW ===
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = '#0B132B';
      ctx.fillRect(0, 0, cw, ch);

      // Board
      ctx.save();
      ctx.fillStyle = '#2D1B00';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(bx, by, bs, bs, 16);
      ctx.fill();
      ctx.restore();

      // Board border
      ctx.strokeStyle = '#6B3A00';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(bx + 3, by + 3, bs - 6, bs - 6, 14);
      ctx.stroke();

      // Center circle
      ctx.strokeStyle = '#6B3A0055';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx + bs / 2, by + bs / 2, 38, 0, Math.PI * 2);
      ctx.stroke();

      // Baseline
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = `rgba(192,132,252,0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 30, by + bs - 70);
      ctx.lineTo(bx + bs - 30, by + bs - 70);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pockets
      for (const pocket of pockets) {
        const grad = ctx.createRadialGradient(pocket.x, pocket.y, 0, pocket.x, pocket.y, POCKET_RADIUS);
        grad.addColorStop(0, 'rgba(0,0,0,0.9)');
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pocket flashes
      for (const pf of g.pocketFlash) {
        ctx.save();
        ctx.globalAlpha = pf.opacity;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pf.x, pf.y, POCKET_RADIUS + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Discs
      for (const disc of g.discs) {
        if (disc.potted && disc.pottingAnim <= 0) continue;
        ctx.save();
        if (disc.pottingAnim > 0 && disc.potted) {
          ctx.globalAlpha = disc.pottingAnim;
          ctx.transform(disc.pottingAnim, 0, 0, disc.pottingAnim, disc.x * (1 - disc.pottingAnim), disc.y * (1 - disc.pottingAnim));
        }
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = disc.type === 'white' ? '#F0F0F0' : disc.type === 'black' ? '#1a1a1a' : '#CC2200';
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, DISC_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = disc.type === 'white' ? '#ccc' : disc.type === 'black' ? '#444' : '#ff3300';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Dot in center
        ctx.fillStyle = disc.type === 'white' ? '#ddd' : disc.type === 'black' ? '#333' : '#ff6600';
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Striker
      if (!g.striker.potted) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = g.turn === 'player' ? ACCENT : '#7a8ab5';
        ctx.beginPath();
        ctx.arc(g.striker.x, g.striker.y, STRIKER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff44';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Aim indicator
      if ((g.phase === 'aim' || g.phase === 'power') && g.turn === 'player') {
        if (g.pullback > 15) {
          // Dotted aim line
          const len = 140;
          for (let i = 0; i < len; i += 12) {
            const t = i / len;
            const px = g.striker.x + Math.cos(g.aimAngle) * i;
            const py = g.striker.y + Math.sin(g.aimAngle) * i;
            if (px < bx + 8 || px > bx + bs - 8 || py < by + 8 || py > by + bs - 8) break;
            ctx.save();
            ctx.globalAlpha = 1 - t;
            ctx.fillStyle = ACCENT;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          // Power circle
          ctx.strokeStyle = `${ACCENT}88`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(g.striker.x, g.striker.y, STRIKER_RADIUS + (g.pullback / 120) * 20, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Score display below board
      const scoreY = by + bs + 16;
      // Player
      ctx.fillStyle = '#1C254180';
      ctx.beginPath();
      ctx.roundRect(bx, scoreY, bs / 2 - 6, 40, 10);
      ctx.fill();
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = '700 14px Outfit, sans-serif';
      ctx.fillStyle = '#E8EAF6';
      ctx.textAlign = 'center';
      ctx.fillText(`YOU: ${g.playerScore}`, bx + bs / 4 - 3, scoreY + 25);

      // AI
      ctx.fillStyle = '#1C254180';
      ctx.beginPath();
      ctx.roundRect(bx + bs / 2 + 6, scoreY, bs / 2 - 6, 40, 10);
      ctx.fill();
      ctx.strokeStyle = '#7a8ab5';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#7a8ab5';
      ctx.fillText(`AI: ${g.aiScore}`, bx + bs * 3 / 4 + 3, scoreY + 25);

      // Turn indicator text
      if (g.phase === 'aim') {
        ctx.font = '600 12px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(192,132,252,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('Drag striker to aim & shoot', cw / 2, scoreY + 70);
      }
      if (g.phase === 'bot') {
        ctx.font = '600 12px Outfit, sans-serif';
        ctx.fillStyle = '#7a8ab5';
        ctx.textAlign = 'center';
        ctx.fillText('AI is thinking...', cw / 2, scoreY + 70);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
    };
  }, [resetStriker]);

  const resetGame = useCallback(() => {
    const g = gs.current;
    const { boardX: bx, boardY: by, boardSize: bs } = g;
    g.discs = initDiscs(bx, by, bs);
    g.playerScore = 0;
    g.aiScore = 0;
    g.turn = 'player';
    g.phase = 'aim';
    g.pocketFlash = [];
    resetStriker(g);
    setScore(0);
    setAiScoreState(0);
    setGamePhase('playing');
  }, [resetStriker]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0B132B' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
      />
      <GameHeader score={score} accentColor={ACCENT} onBack={onBack} extraInfo={`AI: ${aiScoreState}`} />
      <GameOverModal
        visible={gamePhase === 'gameover'}
        score={score}
        bestScore={bestScore.current}
        xpEarned={score > aiScoreState ? 20 : 10}
        accentColor={ACCENT}
        onRetry={resetGame}
        onMenu={onBack}
      />
    </div>
  );
}
