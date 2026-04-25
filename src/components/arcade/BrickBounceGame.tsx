import { useEffect, useRef, useState, useCallback } from 'react';
import { GameHeader } from '@/components/arcade/GameHeader';
import { GameOverModal } from '@/components/arcade/GameOverModal';

interface Props {
  onBack: () => void;
}

const ROW_COLORS = ['#4ECDC4', 'rgba(78,205,196,0.72)', '#3a9e9a', '#2e7d7a', '#1f5553'];

interface Brick {
  id: number; x: number; y: number; w: number; h: number;
  hitsLeft: number; maxHits: number; alive: boolean; row: number;
}

interface Popup {
  x: number; y: number; text: string; vy: number; opacity: number; color: string;
}

interface PowerUp {
  x: number; y: number; active: boolean;
}

interface GameState {
  ball: { x: number; y: number; vx: number; vy: number; radius: number };
  paddle: { x: number; y: number; width: number; height: number; baseWidth: number };
  bricks: Brick[];
  lives: number;
  phase: 'countdown' | 'playing' | 'paused' | 'gameover' | 'levelclear';
  levelClearTimer: number;
  speedMultiplier: number;
  bricksDestroyed: number;
  wideTimer: number; // frames remaining for wide paddle
  wideMaxFrames: number;
}

const STORAGE_KEY = 'lumatha_bb_best';

function initBricks(cw: number): Brick[] {
  const cols = 8, rows = 5, sidePad = 16, gap = 4;
  const brickW = (cw - sidePad * 2 - gap * (cols - 1)) / cols;
  const brickH = 20;
  const startY = 90;
  const bricks: Brick[] = [];
  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const maxHits = r <= 1 ? 2 : 1;
      bricks.push({
        id: id++,
        x: sidePad + c * (brickW + gap),
        y: startY + r * (brickH + gap),
        w: brickW, h: brickH,
        hitsLeft: maxHits, maxHits, alive: true, row: r,
      });
    }
  }
  return bricks;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export function BrickBounceGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [gamePhase, setGamePhase] = useState<'playing' | 'gameover'>('playing');
  const scoreRef = useRef(0);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const popupsRef = useRef<Popup[]>([]);
  const powerupsRef = useRef<PowerUp[]>([]);
  const countdownRef = useRef<string | null>('3');
  const loopRunning = useRef(false);
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const gs = useRef<GameState>({
    ball: { x: 0, y: 0, vx: 3.5, vy: -4.5, radius: 8 },
    paddle: { x: 0, y: 0, width: 90, height: 13, baseWidth: 90 },
    bricks: [],
    lives: 3,
    phase: 'countdown',
    levelClearTimer: 0,
    speedMultiplier: 1,
    bricksDestroyed: 0,
    wideTimer: 0,
    wideMaxFrames: 420, // 7s @ 60fps
  });

  const bestScore = useRef(0);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) bestScore.current = parseInt(s, 10) || 0;
    } catch {}
  }, []);

  const resetBall = useCallback((cw: number, ch: number) => {
    const g = gs.current;
    g.ball.x = cw / 2;
    g.ball.y = ch - 140;
    g.ball.vx = 3.5 * g.speedMultiplier * (Math.random() > 0.5 ? 1 : -1);
    g.ball.vy = -4.5 * g.speedMultiplier;
    trailRef.current = [];
  }, []);

  const doCountdown = useCallback(async () => {
    countdownRef.current = '3';
    await sleep(750);
    countdownRef.current = '2';
    await sleep(750);
    countdownRef.current = '1';
    await sleep(750);
    countdownRef.current = 'GO!';
    await sleep(500);
    countdownRef.current = null;
    gs.current.phase = 'playing';
  }, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = gs.current;
    g.lives = 3;
    g.speedMultiplier = 1;
    g.bricksDestroyed = 0;
    g.wideTimer = 0;
    g.paddle.width = 90;
    g.paddle.baseWidth = 90;
    g.paddle.x = canvas.width / 2 - 45;
    g.paddle.y = canvas.height - 80;
    g.bricks = initBricks(canvas.width);
    scoreRef.current = 0;
    popupsRef.current = [];
    powerupsRef.current = [];
    setScore(0);
    setGamePhase('playing');
    g.phase = 'countdown';
    resetBall(canvas.width, canvas.height);
    doCountdown();
  }, [resetBall, doCountdown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gs.current.paddle.y = canvas.height - 80;
      // Rebuild offscreen grid canvas
      const gc = document.createElement('canvas');
      gc.width = canvas.width; gc.height = canvas.height;
      const gctx = gc.getContext('2d')!;
      gctx.strokeStyle = 'rgba(78,205,196,0.025)';
      gctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 36) {
        gctx.beginPath(); gctx.moveTo(x, 0); gctx.lineTo(x, canvas.height); gctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 36) {
        gctx.beginPath(); gctx.moveTo(0, y); gctx.lineTo(canvas.width, y); gctx.stroke();
      }
      gridCanvasRef.current = gc;
    };
    resize();
    window.addEventListener('resize', resize);

    const g = gs.current;
    g.paddle.x = canvas.width / 2 - 45;
    g.paddle.y = canvas.height - 80;
    g.bricks = initBricks(canvas.width);
    resetBall(canvas.width, canvas.height);
    doCountdown();

    // Input
    const onMouse = (e: MouseEvent) => {
      g.paddle.x = Math.max(0, Math.min(canvas.width - g.paddle.width, e.clientX - g.paddle.width / 2));
    };
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        g.paddle.x = Math.max(0, Math.min(canvas.width - g.paddle.width, e.touches[0].clientX - g.paddle.width / 2));
      }
    };
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('touchmove', onTouch, { passive: true });

    loopRunning.current = true;

    const loop = () => {
      if (!loopRunning.current) return;
      const cw = canvas.width, ch = canvas.height;
      const b = g.ball, p = g.paddle;

      // Wide paddle timer
      if (g.wideTimer > 0) {
        g.wideTimer--;
        if (g.wideTimer <= 0) {
          g.paddle.width = g.paddle.baseWidth;
        }
      }

      if (g.phase === 'playing') {
        // Trail
        trailRef.current.unshift({ x: b.x, y: b.y });
        if (trailRef.current.length > 7) trailRef.current.pop();

        b.x += b.vx;
        b.y += b.vy;

        if (b.x - b.radius <= 0) { b.vx = Math.abs(b.vx); b.x = b.radius; }
        if (b.x + b.radius >= cw) { b.vx = -Math.abs(b.vx); b.x = cw - b.radius; }
        if (b.y - b.radius <= 60) { b.vy = Math.abs(b.vy); b.y = 60 + b.radius; }

        // Paddle collision
        if (
          b.vy > 0 &&
          b.y + b.radius >= p.y &&
          b.y + b.radius <= p.y + p.height + 6 &&
          b.x >= p.x && b.x <= p.x + p.width
        ) {
          const hitPos = (b.x - p.x) / p.width;
          const angle = (hitPos - 0.5) * 2;
          const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          b.vx = angle * speed * 0.75;
          b.vy = -Math.abs(b.vy);
          b.y = p.y - b.radius;
        }

        // Brick collision
        for (const brick of g.bricks) {
          if (!brick.alive) continue;
          if (
            b.x + b.radius > brick.x && b.x - b.radius < brick.x + brick.w &&
            b.y + b.radius > brick.y && b.y - b.radius < brick.y + brick.h
          ) {
            const oL = b.x + b.radius - brick.x;
            const oR = brick.x + brick.w - (b.x - b.radius);
            const oT = b.y + b.radius - brick.y;
            const oB = brick.y + brick.h - (b.y - b.radius);
            const m = Math.min(oL, oR, oT, oB);
            if (m === oT || m === oB) b.vy *= -1; else b.vx *= -1;

            brick.hitsLeft--;
            if (brick.hitsLeft <= 0) {
              brick.alive = false;
              const pts = brick.maxHits === 2 ? 20 : 10;
              scoreRef.current += pts;
              g.bricksDestroyed++;
              try { navigator.vibrate?.(15); } catch {}
              popupsRef.current.push({
                x: brick.x + brick.w / 2, y: brick.y + brick.h / 2,
                text: `+${pts}`, vy: -1.2, opacity: 1.0,
                color: brick.maxHits === 2 ? '#FFD166' : '#4ECDC4',
              });
              // Power-up check
              if (g.bricksDestroyed % 15 === 0) {
                powerupsRef.current.push({ x: brick.x + brick.w / 2 - 6, y: brick.y, active: true });
              }
            } else {
              scoreRef.current += 5;
              popupsRef.current.push({
                x: brick.x + brick.w / 2, y: brick.y + brick.h / 2,
                text: '+5', vy: -1.2, opacity: 1.0, color: '#7a8ab5',
              });
            }
            setScore(scoreRef.current);
            break;
          }
        }

        // Level clear
        if (g.bricks.every(br => !br.alive)) {
          g.phase = 'levelclear';
          g.levelClearTimer = 60;
        }

        // Power-ups falling
        for (const pu of powerupsRef.current) {
          if (!pu.active) continue;
          pu.y += 1.8;
          // Catch
          if (
            pu.y + 26 >= p.y && pu.y <= p.y + p.height &&
            pu.x + 12 >= p.x && pu.x <= p.x + p.width
          ) {
            pu.active = false;
            g.paddle.width = 130;
            g.wideTimer = g.wideMaxFrames;
          }
          if (pu.y > ch + 30) pu.active = false;
        }
        powerupsRef.current = powerupsRef.current.filter(pu => pu.active);

        // Ball lost
        if (b.y > ch + 20) {
          g.lives--;
          try { navigator.vibrate?.([20, 30, 20]); } catch {}
          if (g.lives <= 0) {
            if (scoreRef.current > bestScore.current) {
              bestScore.current = scoreRef.current;
              try { localStorage.setItem(STORAGE_KEY, String(scoreRef.current)); } catch {}
            }
            setGamePhase('gameover');
          } else {
            resetBall(cw, ch);
          }
        }
      }

      // Level clear countdown
      if (g.phase === 'levelclear') {
        g.levelClearTimer--;
        if (g.levelClearTimer <= 0) {
          g.speedMultiplier = Math.min(g.speedMultiplier * 1.05, 1.8);
          g.bricks = initBricks(cw);
          resetBall(cw, ch);
          g.phase = 'playing';
        }
      }

      // Update popups
      for (const pp of popupsRef.current) {
        pp.y += pp.vy;
        pp.opacity -= 0.02;
      }
      popupsRef.current = popupsRef.current.filter(pp => pp.opacity > 0);

      // === DRAW ===
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = '#0B132B';
      ctx.fillRect(0, 0, cw, ch);

      // Subtle grid (offscreen canvas)
      if (gridCanvasRef.current) ctx.drawImage(gridCanvasRef.current, 0, 0);

      // Bricks
      for (const brick of g.bricks) {
        if (!brick.alive) continue;
        ctx.save();
        ctx.shadowColor = ROW_COLORS[brick.row];
        ctx.shadowBlur = 5;
        ctx.fillStyle = ROW_COLORS[brick.row];
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
        ctx.fill();
        if (brick.hitsLeft < brick.maxHits) {
          ctx.globalAlpha = 0.25;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(brick.x + 3, brick.y + 3);
          ctx.lineTo(brick.x + brick.w - 3, brick.y + brick.h - 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(brick.x + brick.w - 3, brick.y + 3);
          ctx.lineTo(brick.x + 3, brick.y + brick.h - 3);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }

      // Ball trail
      const trail = trailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const frac = 1 - i / 7;
        ctx.save();
        ctx.globalAlpha = 0.08 + frac * 0.37;
        ctx.fillStyle = '#4ECDC4';
        ctx.beginPath();
        ctx.arc(t.x, t.y, b.radius * (0.15 + frac * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Ball
      ctx.save();
      ctx.shadowColor = '#4ECDC4';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Paddle
      ctx.save();
      ctx.shadowColor = '#4ECDC4';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#4ECDC4';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 7);
      ctx.fill();
      ctx.restore();

      // Wide paddle timer bar
      if (g.wideTimer > 0) {
        const barW = (g.wideTimer / g.wideMaxFrames) * p.width;
        ctx.fillStyle = '#FFD166';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y - 6, barW, 3, 2);
        ctx.fill();
      }

      // Power-ups
      for (const pu of powerupsRef.current) {
        ctx.save();
        ctx.shadowColor = '#FFD166';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#FFD166';
        ctx.beginPath();
        ctx.roundRect(pu.x, pu.y, 12, 26, 6);
        ctx.fill();
        ctx.restore();
      }

      // Lives
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(20 + i * 22, ch - 28, 6, 0, Math.PI * 2);
        if (i < g.lives) { ctx.fillStyle = '#4ECDC4'; ctx.fill(); }
        else { ctx.strokeStyle = '#243057'; ctx.lineWidth = 1.5; ctx.stroke(); }
      }

      // Score popups
      for (const pp of popupsRef.current) {
        ctx.save();
        ctx.globalAlpha = pp.opacity;
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.fillStyle = pp.color;
        ctx.textAlign = 'center';
        ctx.fillText(pp.text, pp.x, pp.y);
        ctx.restore();
      }

      // Level clear text
      if (g.phase === 'levelclear') {
        const alpha = Math.min(1, g.levelClearTimer / 30);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '700 28px Outfit, sans-serif';
        ctx.fillStyle = '#4ECDC4';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#4ECDC4';
        ctx.shadowBlur = 20;
        ctx.fillText('LEVEL CLEAR', cw / 2, ch / 2);
        ctx.restore();
      }

      // Countdown
      if (countdownRef.current) {
        ctx.save();
        ctx.fillStyle = 'rgba(11,19,43,0.6)';
        ctx.fillRect(0, 0, cw, ch);
        ctx.font = '800 64px Outfit, sans-serif';
        ctx.fillStyle = '#4ECDC4';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#4ECDC4';
        ctx.shadowBlur = 30;
        ctx.fillText(countdownRef.current, cw / 2, ch / 2);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      loopRunning.current = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('touchmove', onTouch);
    };
  }, [resetBall, doCountdown]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0B132B' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
      />
      <GameHeader score={score} accentColor="#4ECDC4" onBack={onBack} extraInfo={`♥ ${gs.current.lives}`} />
      <GameOverModal
        visible={gamePhase === 'gameover'}
        score={score}
        bestScore={bestScore.current}
        xpEarned={10}
        accentColor="#4ECDC4"
        onRetry={resetGame}
        onMenu={onBack}
      />
    </div>
  );
}
