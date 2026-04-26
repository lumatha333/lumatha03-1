import { useEffect, useRef, useState, useCallback } from 'react';
import { GameHeader } from '@/components/arcade/GameHeader';
import { GameOverModal } from '@/components/arcade/GameOverModal';

interface Props { onBack: () => void; }

const ACCENT = '#FB923C';
const STORAGE_KEY = 'lumatha_ss_best';

interface BallResult { type: string; color: string; }

interface GS {
  phase: 'pregame' | 'ready' | 'bowling' | 'batting' | 'result' | 'overbreak' | 'gameover';
  score: number;
  wickets: number;
  ballsBowled: number;
  totalBalls: number;
  currentOver: number;
  ballT: number;
  ballX: number;
  ballY: number;
  bowlerX: number;
  bowlerRunning: boolean;
  bowlerStartX: number;
  bowlerEndX: number;
  batAngle: number;
  batSwinging: boolean;
  batSwingFrame: number;
  hitType: string | null;
  resultTimer: number;
  resultText: string;
  resultColor: string;
  flyBall: { x: number; y: number; vx: number; vy: number; opacity: number } | null;
  tapWindowStart: number;
  tapWindowDuration: number;
  tapTime: number | null;
  particles: { x: number; y: number; vx: number; vy: number; opacity: number; color: string }[];
  // Ball tracker per over
  ballResults: BallResult[];
  // Crowd confetti
  confetti: { x: number; y: number; vy: number; opacity: number; color: string; size: number }[];
  // Milestones
  milestoneText: string;
  milestoneTimer: number;
  // Over break
  overBreakTimer: number;
  overBreakText: string;
}

function bezierPoint(t: number, p0: number, p1: number, p2: number): number {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

export function StreetSixGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [score, setScore] = useState(0);
  const [gamePhase, setGamePhase] = useState<'pregame' | 'playing' | 'gameover'>('pregame');
  const bestScore = useRef(0);
  const gs = useRef<GS>(null!);
  const lastTimestamp = useRef(0);
  const prevScore = useRef(0);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) bestScore.current = parseInt(s, 10) || 0; } catch {}
  }, []);

  const initGame = useCallback((): GS => ({
    phase: 'pregame', score: 0, wickets: 0, ballsBowled: 0, totalBalls: 18,
    currentOver: 1, ballT: 0, ballX: 0, ballY: 0,
    bowlerX: 0, bowlerRunning: false, bowlerStartX: 0, bowlerEndX: 0,
    batAngle: 45, batSwinging: false, batSwingFrame: 0,
    hitType: null, resultTimer: 0, resultText: '', resultColor: '',
    flyBall: null, tapWindowStart: 0, tapWindowDuration: 300,
    tapTime: null, particles: [], ballResults: [], confetti: [],
    milestoneText: '', milestoneTimer: 0,
    overBreakTimer: 0, overBreakText: '',
  }), []);

  const checkMilestone = (s: number, prev: number) => {
    const g = gs.current;
    if (prev < 100 && s >= 100) { g.milestoneText = 'CENTURY! 🌟🌟'; g.milestoneTimer = 80; }
    else if (prev < 50 && s >= 50) { g.milestoneText = 'FIFTY! 🏆'; g.milestoneTimer = 70; }
    else if (prev < 30 && s >= 30) { g.milestoneText = 'HALF CENTURY WATCH 👀'; g.milestoneTimer = 55; }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    gs.current = initGame();

    const loop = (ts: number) => {
      const dt = lastTimestamp.current > 0 ? Math.min(ts - lastTimestamp.current, 50) : 16;
      lastTimestamp.current = ts;
      const g = gs.current;
      const cw = canvas.width, ch = canvas.height;

      const pitchLeft = cw * 0.2;
      const pitchRight = cw * 0.68;
      const groundY = ch * 0.68;
      const batsmanX = pitchRight;
      const batsmanY = groundY - 30;
      const bowlerEndX = pitchLeft + 60;

      // Bowling animation
      if (g.phase === 'bowling') {
        if (g.bowlerRunning) {
          g.bowlerX += dt * 0.12;
          if (g.bowlerX >= bowlerEndX) { g.bowlerRunning = false; g.bowlerX = bowlerEndX; g.ballT = 0; }
        } else {
          g.ballT += dt * 0.0016;
          const startX = bowlerEndX + 10, startY = groundY - 70;
          const controlX = (startX + batsmanX) / 2, controlY = groundY - 140;
          const endX = batsmanX - 10, endY = batsmanY + 10;
          g.ballX = bezierPoint(g.ballT, startX, controlX, endX);
          g.ballY = bezierPoint(g.ballT, startY, controlY, endY);
          if (g.ballT >= 0.85 && g.tapWindowStart === 0) g.tapWindowStart = ts;
          if (g.ballT >= 1.0 && g.tapTime === null) {
            const isBowled = Math.random() < 0.35;
            if (isBowled) { g.hitType = 'wicket'; g.resultText = 'BOWLED! ☠️'; g.resultColor = '#FF6B6B'; g.wickets++; g.ballResults.push({ type: 'wicket', color: '#FF6B6B' }); }
            else { g.hitType = 'dot'; g.resultText = 'DOT BALL •'; g.resultColor = '#7a8ab5'; g.ballResults.push({ type: 'dot', color: '#243057' }); }
            g.phase = 'result'; g.resultTimer = 70; g.ballsBowled++;
          }
        }
      }

      // Bat swing
      if (g.batSwinging) {
        g.batSwingFrame++;
        if (g.batSwingFrame < 5) g.batAngle = 45 - g.batSwingFrame * 18;
        else if (g.batSwingFrame < 12) g.batAngle = -45 + (g.batSwingFrame - 5) * 12;
        else { g.batSwinging = false; g.batAngle = 45; }
      }

      // Result timer
      if (g.phase === 'result') {
        g.resultTimer--;
        if (g.resultTimer <= 0) {
          // Check over break
          if (g.ballsBowled > 0 && g.ballsBowled % 6 === 0 && g.ballsBowled < g.totalBalls && g.wickets < 3) {
            g.phase = 'overbreak';
            g.overBreakTimer = 90;
            g.overBreakText = `END OF OVER ${Math.floor(g.ballsBowled / 6)}`;
            g.ballResults = [];
          } else if (g.wickets >= 3 || g.ballsBowled >= g.totalBalls) {
            g.phase = 'gameover';
            if (g.score > bestScore.current) { bestScore.current = g.score; try { localStorage.setItem(STORAGE_KEY, String(g.score)); } catch {} }
            setGamePhase('gameover');
          } else {
            g.phase = 'ready'; g.tapWindowStart = 0; g.tapTime = null; g.flyBall = null;
          }
        }
      }

      // Over break timer
      if (g.phase === 'overbreak') {
        g.overBreakTimer--;
        if (g.overBreakTimer <= 0) { g.phase = 'ready'; g.tapWindowStart = 0; g.tapTime = null; g.flyBall = null; }
      }

      // Milestone timer
      if (g.milestoneTimer > 0) g.milestoneTimer--;

      // Flying ball
      if (g.flyBall) {
        g.flyBall.x += g.flyBall.vx * dt * 0.06;
        g.flyBall.y += g.flyBall.vy * dt * 0.06;
        g.flyBall.vy += dt * 0.008;
        g.flyBall.opacity -= dt * 0.001;
        if (g.flyBall.opacity <= 0) g.flyBall = null;
      }

      // Particles
      for (const p of g.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.opacity -= 0.025; }
      g.particles = g.particles.filter(p => p.opacity > 0);

      // Confetti
      for (const c of g.confetti) { c.y += c.vy; c.vy += 0.06; c.opacity -= 0.012; }
      g.confetti = g.confetti.filter(c => c.opacity > 0);

      // === DRAW ===
      const sky = ctx.createLinearGradient(0, 0, 0, ch * 0.5);
      sky.addColorStop(0, '#FF6B1A'); sky.addColorStop(0.6, '#FFB347'); sky.addColorStop(1, '#FFD89B');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, cw, ch * 0.5);

      // Buildings
      ctx.fillStyle = '#2a2a4a';
      const buildings = [[0,.38,.08,.12],[.08,.33,.06,.17],[.14,.36,.1,.14],[.28,.31,.07,.19],[.38,.35,.12,.15],[.55,.32,.08,.18],[.65,.37,.1,.13],[.78,.34,.09,.16],[.9,.36,.12,.14]];
      for (const [bx, by, bw, bh] of buildings) ctx.fillRect(bx * cw, by * ch, bw * cw, bh * ch);

      // Ground
      ctx.fillStyle = '#4A7C59'; ctx.fillRect(0, ch * 0.5, cw, ch * 0.5);

      // Pitch strip
      ctx.fillStyle = '#C4A46B'; ctx.fillRect(cw * 0.35, ch * 0.45, 80, ch * 0.25);

      // Stumps
      ctx.fillStyle = '#D4A574';
      for (let i = -1; i <= 1; i++) { ctx.fillRect(bowlerEndX + 5 + i * 5, groundY - 50, 2, 32); ctx.fillRect(batsmanX + 15 + i * 5, groundY - 50, 2, 32); }

      // Bowler
      const bwX = g.bowlerRunning ? g.bowlerX : (g.phase === 'ready' || g.phase === 'pregame' ? pitchLeft - 40 : bowlerEndX);
      ctx.save(); ctx.fillStyle = '#7a8ab5';
      ctx.beginPath(); ctx.arc(bwX, groundY - 75, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(bwX - 3, groundY - 67, 6, 26);
      ctx.save(); ctx.translate(bwX + 3, groundY - 62);
      ctx.rotate(g.bowlerRunning ? Math.sin(ts / 100) * 0.5 : -0.5);
      ctx.fillRect(0, 0, 3, 18); ctx.restore();
      ctx.fillRect(bwX - 4, groundY - 41, 3, 20); ctx.fillRect(bwX + 1, groundY - 41, 3, 20);
      ctx.restore();

      // Batsman
      ctx.save(); ctx.fillStyle = '#E8EAF6';
      ctx.beginPath(); ctx.arc(batsmanX, batsmanY - 45, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(batsmanX - 3, batsmanY - 36, 6, 28);
      ctx.fillRect(batsmanX - 5, batsmanY - 8, 3, 22); ctx.fillRect(batsmanX + 2, batsmanY - 8, 3, 22);
      ctx.save(); ctx.translate(batsmanX - 6, batsmanY - 30); ctx.rotate((g.batAngle * Math.PI) / 180);
      ctx.fillStyle = ACCENT; ctx.fillRect(-2, 0, 4, 36);
      ctx.fillStyle = '#D4A574'; ctx.fillRect(-1.5, 30, 3, 10);
      ctx.restore(); ctx.restore();

      // Ball
      if (g.phase === 'bowling' && !g.bowlerRunning && g.ballT < 1) {
        ctx.save(); ctx.shadowColor = '#CC2200'; ctx.shadowBlur = 8; ctx.fillStyle = '#CC2200';
        ctx.beginPath(); ctx.arc(g.ballX, g.ballY, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(g.ballX, g.ballY, 5, 0, Math.PI); ctx.stroke(); ctx.restore();
      }

      // Flying ball
      if (g.flyBall) {
        ctx.save(); ctx.globalAlpha = g.flyBall.opacity; ctx.shadowColor = ACCENT; ctx.shadowBlur = 12;
        ctx.fillStyle = '#CC2200'; ctx.beginPath(); ctx.arc(g.flyBall.x, g.flyBall.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // Particles
      for (const p of g.particles) {
        ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // Confetti
      for (const c of g.confetti) {
        ctx.save(); ctx.globalAlpha = c.opacity; ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // Tap window indicator
      if (g.phase === 'bowling' && g.tapWindowStart > 0 && g.tapTime === null) {
        const elapsed = ts - g.tapWindowStart;
        if (elapsed < g.tapWindowDuration) {
          ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(ts / 50) * 0.2;
          ctx.strokeStyle = ACCENT; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(batsmanX, batsmanY - 15, 30, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
      }

      // Result text
      if (g.phase === 'result' && g.resultText) {
        const alpha = Math.min(1, g.resultTimer / 25);
        ctx.save(); ctx.globalAlpha = alpha;
        const size = g.hitType === 'six' ? 48 : g.hitType === 'four' ? 42 : g.hitType === 'wicket' ? 44 : g.hitType === 'two' ? 36 : g.hitType === 'single' ? 32 : 28;
        ctx.font = `800 ${size}px Outfit, sans-serif`; ctx.fillStyle = g.resultColor;
        ctx.textAlign = 'center'; ctx.shadowColor = g.resultColor; ctx.shadowBlur = 20;
        ctx.fillText(g.resultText, cw / 2, ch * 0.35); ctx.restore();
      }

      // Milestone text
      if (g.milestoneTimer > 0) {
        const alpha = Math.min(1, g.milestoneTimer / 30);
        ctx.save(); ctx.globalAlpha = alpha; ctx.font = '800 32px Outfit, sans-serif';
        ctx.fillStyle = '#FFD166'; ctx.textAlign = 'center'; ctx.shadowColor = '#FFD166'; ctx.shadowBlur = 18;
        ctx.fillText(g.milestoneText, cw / 2, ch * 0.25); ctx.restore();
      }

      // Over break overlay
      if (g.phase === 'overbreak') {
        ctx.save(); ctx.fillStyle = 'rgba(11,19,43,0.7)'; ctx.fillRect(0, 0, cw, ch);
        const alpha = Math.min(1, g.overBreakTimer / 30);
        ctx.globalAlpha = alpha; ctx.font = '800 24px Outfit, sans-serif'; ctx.fillStyle = '#E8EAF6';
        ctx.textAlign = 'center'; ctx.fillText(g.overBreakText, cw / 2, ch * 0.4);
        ctx.font = '700 18px Outfit, sans-serif'; ctx.fillStyle = ACCENT;
        ctx.fillText(`Score: ${g.score}/${g.wickets}`, cw / 2, ch * 0.4 + 36); ctx.restore();
      }

      // Scorecard overlay (top-right)
      if (g.phase !== 'pregame') {
        const scW = 110, scH = 74, scX = cw - scW - 10, scY = 68;
        ctx.save(); ctx.fillStyle = 'rgba(11,19,43,0.88)';
        ctx.beginPath(); ctx.roundRect(scX, scY, scW, scH, 12); ctx.fill();
        ctx.font = '800 20px Outfit, sans-serif'; ctx.fillStyle = ACCENT; ctx.textAlign = 'left';
        ctx.fillText(String(g.score), scX + 12, scY + 24);
        ctx.font = '700 11px Outfit, sans-serif';
        ctx.fillStyle = '#FF6B6B'; ctx.fillText(`W: ${g.wickets}`, scX + 12, scY + 42);
        const ov = Math.floor(g.ballsBowled / 6); const bIO = g.ballsBowled % 6;
        ctx.fillStyle = '#E8EAF6'; ctx.fillText(`${ov}.${bIO} ov`, scX + 60, scY + 42);
        const rr = g.ballsBowled > 0 ? ((g.score / g.ballsBowled) * 6).toFixed(1) : '0.0';
        ctx.fillStyle = '#7a8ab5'; ctx.fillText(`RR: ${rr}`, scX + 12, scY + 60);
        ctx.restore();
      }

      // Ball tracker (last 6 balls of current over)
      if (g.phase !== 'pregame') {
        const btY = ch - 46;
        for (let i = 0; i < 6; i++) {
          const bx = cw / 2 - 55 + i * 22;
          ctx.beginPath(); ctx.arc(bx, btY, 9, 0, Math.PI * 2);
          if (i < g.ballResults.length) {
            ctx.fillStyle = g.ballResults[i].color; ctx.fill();
            // Label
            ctx.font = '700 7px Outfit, sans-serif'; ctx.fillStyle = '#E8EAF6'; ctx.textAlign = 'center';
            const t = g.ballResults[i].type;
            const label = t === 'six' ? '6' : t === 'four' ? '4' : t === 'two' ? '2' : t === 'single' ? '1' : t === 'dot' ? '•' : 'W';
            ctx.fillText(label, bx, btY + 3);
          } else {
            ctx.strokeStyle = '#243057'; ctx.lineWidth = 1.5; ctx.stroke();
          }
        }
      }

      // Tap prompt
      if (g.phase === 'ready') {
        ctx.font = '600 14px Outfit, sans-serif'; ctx.fillStyle = 'rgba(251,146,60,0.6)'; ctx.textAlign = 'center';
        ctx.fillText('TAP TO FACE BALL', cw / 2, ch - 70);
      }

      // Pre-game screen
      if (g.phase === 'pregame') {
        ctx.save(); ctx.fillStyle = 'rgba(11,19,43,0.75)'; ctx.fillRect(0, 0, cw, ch);
        ctx.font = '900 36px Outfit, sans-serif'; ctx.fillStyle = ACCENT; ctx.textAlign = 'center';
        ctx.shadowColor = ACCENT; ctx.shadowBlur = 20;
        ctx.fillText('STREET SIX', cw / 2, ch * 0.35);
        ctx.shadowBlur = 0; ctx.font = '600 14px Outfit, sans-serif'; ctx.fillStyle = '#7a8ab5';
        ctx.fillText('3 Overs · Tap to Bat', cw / 2, ch * 0.35 + 30);
        // Start button
        ctx.fillStyle = ACCENT;
        ctx.beginPath(); ctx.roundRect(cw / 2 - 65, ch * 0.5 - 22, 130, 44, 14); ctx.fill();
        ctx.font = '800 16px Outfit, sans-serif'; ctx.fillStyle = '#0B132B'; ctx.fillText('START', cw / 2, ch * 0.5 + 6);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize); };
  }, [initGame]);

  const spawnConfetti = () => {
    const g = gs.current; const canvas = canvasRef.current; if (!canvas) return;
    const colors = ['#FFD166', '#FB923C', '#4ECDC4'];
    for (let i = 0; i < 12; i++) {
      g.confetti.push({ x: Math.random() * canvas.width, y: -10, vy: 1.5 + Math.random() * 2, opacity: 1, color: colors[i % 3], size: 2 + Math.random() * 3 });
    }
  };

  const handleTap = useCallback(() => {
    const g = gs.current; const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = canvas.width, ch = canvas.height;
    const batsmanX = cw * 0.68, batsmanY = ch * 0.68 - 30;

    if (g.phase === 'pregame') { g.phase = 'ready'; setGamePhase('playing'); return; }

    if (g.phase === 'ready') {
      g.phase = 'bowling'; g.bowlerRunning = true; g.bowlerX = cw * 0.2 - 40;
      g.bowlerStartX = g.bowlerX; g.bowlerEndX = cw * 0.2 + 60;
      g.tapWindowStart = 0; g.tapTime = null; g.ballT = 0;
      return;
    }

    if (g.phase === 'bowling' && g.tapWindowStart > 0 && g.tapTime === null) {
      const now = performance.now();
      const elapsed = now - g.tapWindowStart;
      if (elapsed < g.tapWindowDuration + 50) {
        g.tapTime = elapsed; g.batSwinging = true; g.batSwingFrame = 0;
        try { navigator.vibrate?.(20); } catch {}

        let runs = 0; const rand = Math.random();
        if (elapsed < 80) {
          if (rand < 0.35) { runs = 6; g.resultText = 'SIX! 🎉'; g.resultColor = '#FFD166'; }
          else if (rand < 0.7) { runs = 4; g.resultText = 'FOUR! ⚡'; g.resultColor = ACCENT; }
          else if (rand < 0.9) { runs = 2; g.resultText = '2 RUNS'; g.resultColor = '#4ECDC4'; }
          else { runs = 1; g.resultText = '1 RUN'; g.resultColor = '#E8EAF6'; }
        } else if (elapsed < 180) {
          if (rand < 0.3) { runs = 2; g.resultText = '2 RUNS'; g.resultColor = '#4ECDC4'; }
          else if (rand < 0.7) { runs = 1; g.resultText = '1 RUN'; g.resultColor = '#E8EAF6'; }
          else { runs = 0; g.resultText = 'DOT BALL •'; g.resultColor = '#7a8ab5'; }
        } else {
          if (rand < 0.5) { runs = 0; g.resultText = 'DOT BALL •'; g.resultColor = '#7a8ab5'; }
          else if (rand < 0.7) { runs = 1; g.resultText = '1 RUN'; g.resultColor = '#E8EAF6'; }
          else { runs = -1; g.resultText = 'CAUGHT! ☠️'; g.resultColor = '#FF6B6B'; g.wickets++; }
        }

        g.hitType = runs === 6 ? 'six' : runs === 4 ? 'four' : runs === 2 ? 'two' : runs === 1 ? 'single' : runs === 0 ? 'dot' : 'wicket';

        // Ball tracker
        const btColor = runs === 6 ? '#FFD166' : runs === 4 ? '#FB923C' : runs === 2 ? '#4ECDC4' : runs === 1 ? '#E8EAF6' : runs === 0 ? '#243057' : '#FF6B6B';
        g.ballResults.push({ type: g.hitType, color: btColor });

        if (runs > 0) {
          const prev = g.score;
          g.score += runs; setScore(g.score);
          checkMilestone(g.score, prev);
          g.flyBall = { x: batsmanX, y: batsmanY, vx: 4 + (runs >= 4 ? 6 : 3), vy: -3 - (runs >= 4 ? 4 : 2), opacity: 1 };
          for (let i = 0; i < 5; i++) g.particles.push({ x: batsmanX, y: batsmanY, vx: (Math.random() - 0.3) * 4, vy: (Math.random() - 0.5) * 4, opacity: 1, color: ACCENT });
          if (runs >= 4) spawnConfetti();
          try { navigator.vibrate?.(runs >= 4 ? 40 : 20); } catch {}
        }

        g.phase = 'result'; g.resultTimer = 70; g.ballsBowled++;
      }
    }
  }, []);

  const resetGame = useCallback(() => {
    gs.current = initGame();
    gs.current.phase = 'ready';
    setScore(0); setGamePhase('playing');
    prevScore.current = 0;
  }, [initGame]);

  const g = gs.current;
  const overNum = g ? Math.floor(g.ballsBowled / 6) + 1 : 1;
  const ballInOver = g ? g.ballsBowled % 6 : 0;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0B132B' }}>
      <canvas ref={canvasRef} onClick={handleTap} onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }} />
      {gamePhase !== 'pregame' && <GameHeader score={score} accentColor={ACCENT} onBack={onBack} extraInfo={`${overNum}.${ballInOver} OV`} />}
      <GameOverModal visible={gamePhase === 'gameover'} score={score} bestScore={bestScore.current}
        xpEarned={15} accentColor={ACCENT} onRetry={resetGame} onMenu={onBack} />
    </div>
  );
}
