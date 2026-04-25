import { useEffect, useRef, useState, useCallback } from 'react';
import { GameHeader } from '@/components/arcade/GameHeader';

interface Props { onBack: () => void; }

const ACCENT = '#60A5FA';

interface GS {
  triangle: { x: number; y: number; vx: number; vy: number; angle: number; spinSpeed: number; flying: boolean };
  phase: 'aim' | 'flying' | 'scored' | 'missed' | 'botaim' | 'botflying' | 'done';
  playerScore: number;
  aiScore: number;
  roundsLeft: number; // counts down from 10
  currentTurn: 'player' | 'ai';
  dragStart: { x: number; y: number } | null;
  dragCurrent: { x: number; y: number } | null;
  trail: { x: number; y: number; opacity: number; scale: number }[];
  goalPostShake: number;
  confetti: { x: number; y: number; vy: number; vx: number; opacity: number; color: string }[];
  resultText: string;
  resultColor: string;
  resultTimer: number;
  scoreBounce: number;
  scratches: { x: number; y: number; angle: number; opacity: number }[];
  botTimer: number;
}

export function PaperFlickGame({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const doodleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gs = useRef<GS>(null!);

  const goalCenterX = useRef(0);
  const goalY = useRef(80);
  const goalGap = 110;

  const initRound = useCallback((g: GS, canvas: HTMLCanvasElement) => {
    g.triangle = { x: canvas.width / 2, y: canvas.height * 0.78, vx: 0, vy: 0, angle: 0, spinSpeed: 0, flying: false };
    g.trail = []; g.dragStart = null; g.dragCurrent = null;
    g.resultText = ''; g.resultTimer = 0; g.scratches = [];
    if (g.currentTurn === 'player') g.phase = 'aim';
    else { g.phase = 'botaim'; g.botTimer = 50; }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; goalCenterX.current = canvas.width / 2; buildDoodles(canvas); };
    resize();
    window.addEventListener('resize', resize);

    gs.current = {
      triangle: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, spinSpeed: 0, flying: false },
      phase: 'aim', playerScore: 0, aiScore: 0, roundsLeft: 10, currentTurn: 'player',
      dragStart: null, dragCurrent: null, trail: [], goalPostShake: 0, confetti: [],
      resultText: '', resultColor: '', resultTimer: 0, scoreBounce: 0, scratches: [], botTimer: 0,
    };
    initRound(gs.current, canvas);

    function buildDoodles(c: HTMLCanvasElement) {
      const dc = document.createElement('canvas'); dc.width = c.width; dc.height = c.height;
      const d = dc.getContext('2d')!;
      d.strokeStyle = '#9BB0C8'; d.lineWidth = 1.5; d.globalAlpha = 0.35;
      // Sun
      d.beginPath(); d.arc(45, 40, 10, 0, Math.PI * 2); d.stroke();
      for (let a = 0; a < 8; a++) { const r = (a / 8) * Math.PI * 2; d.beginPath(); d.moveTo(45 + Math.cos(r) * 14, 40 + Math.sin(r) * 14); d.lineTo(45 + Math.cos(r) * 20, 40 + Math.sin(r) * 20); d.stroke(); }
      // Star bottom-right
      const sx = c.width - 50, sy = c.height - 60;
      d.beginPath();
      for (let i = 0; i < 5; i++) { const a1 = (i * 72 - 90) * Math.PI / 180; const a2 = ((i * 72) + 36 - 90) * Math.PI / 180; d.lineTo(sx + Math.cos(a1) * 12, sy + Math.sin(a1) * 12); d.lineTo(sx + Math.cos(a2) * 5, sy + Math.sin(a2) * 5); }
      d.closePath(); d.stroke();
      // Heart in margin
      d.beginPath(); d.moveTo(40, c.height * 0.5); d.bezierCurveTo(40, c.height * 0.5 - 8, 52, c.height * 0.5 - 8, 46, c.height * 0.5 + 5);
      d.moveTo(40, c.height * 0.5); d.bezierCurveTo(40, c.height * 0.5 - 8, 28, c.height * 0.5 - 8, 34, c.height * 0.5 + 5); d.stroke();
      doodleCanvasRef.current = dc;
    }

    // Input
    const getPos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      if ('touches' in e && e.touches.length > 0) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
      if ('clientX' in e) return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top };
      return null;
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      const g = gs.current; if (g.phase !== 'aim') return;
      const p = getPos(e); if (p && p.y > canvas.height * 0.5) { g.dragStart = p; g.dragCurrent = p; }
    };
    const onMove = (e: MouseEvent | TouchEvent) => { const g = gs.current; if (!g.dragStart) return; const p = getPos(e); if (p) g.dragCurrent = p; };
    const onUp = () => {
      const g = gs.current;
      if (!g.dragStart || !g.dragCurrent || g.phase !== 'aim') { g.dragStart = null; g.dragCurrent = null; return; }
      const dx = g.dragStart.x - g.dragCurrent.x, dy = g.dragStart.y - g.dragCurrent.y;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy), 130);
      if (power < 15) { g.dragStart = null; g.dragCurrent = null; return; }
      const angle = Math.atan2(dy, dx);
      const speed = (power / 130) * 16;
      g.triangle.vx = Math.cos(angle) * speed; g.triangle.vy = Math.sin(angle) * speed;
      g.triangle.flying = true; g.triangle.spinSpeed = g.triangle.vx * 0.3;
      g.phase = 'flying'; g.dragStart = null; g.dragCurrent = null;
      try { navigator.vibrate?.(12); } catch {}
    };

    canvas.addEventListener('mousedown', onDown); canvas.addEventListener('mousemove', onMove); canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: true }); canvas.addEventListener('touchmove', onMove, { passive: true }); canvas.addEventListener('touchend', onUp);

    const loop = () => {
      const cw = canvas.width, ch = canvas.height;
      const g = gs.current;
      const gx = goalCenterX.current, gy = goalY.current;

      // Bot AI
      if (g.phase === 'botaim') {
        g.botTimer--;
        if (g.botTimer <= 0) {
          const aimAngle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
          const power = (0.6 + Math.random() * 0.3) * 16;
          g.triangle.vx = Math.cos(aimAngle) * power; g.triangle.vy = Math.sin(aimAngle) * power;
          g.triangle.flying = true; g.triangle.spinSpeed = g.triangle.vx * 0.3;
          g.phase = 'botflying';
        }
      }

      // Physics
      if (g.phase === 'flying' || g.phase === 'botflying') {
        const t = g.triangle;
        t.x += t.vx; t.y += t.vy;
        t.vx *= 0.992; t.vy *= 0.992;
        t.angle += t.spinSpeed * 0.05;
        t.spinSpeed *= 0.98;

        // Trail
        g.trail.push({ x: t.x, y: t.y, opacity: 0.5, scale: 0.8 });
        if (g.trail.length > 5) g.trail.shift();

        // Wall bounces
        if (t.x < 20 || t.x > cw - 20) {
          t.vx *= -0.7;
          t.x = t.x < 20 ? 20 : cw - 20;
          g.scratches.push({ x: t.x, y: t.y, angle: Math.random() * Math.PI, opacity: 0.7 });
          try { navigator.vibrate?.(8); } catch {}
        }
        if (t.y > ch - 20) {
          t.vy *= -0.7; t.y = ch - 20;
          g.scratches.push({ x: t.x, y: t.y, angle: Math.random() * Math.PI, opacity: 0.7 });
        }

        // Goal check
        const goalLeft = gx - goalGap / 2, goalRight = gx + goalGap / 2;
        if (t.y <= gy + 50 && t.y >= gy - 10 && t.x > goalLeft && t.x < goalRight && t.vy < 0) {
          // GOAL
          if (g.phase === 'flying') { g.playerScore++; setPlayerScore(g.playerScore); }
          else { g.aiScore++; setAiScore(g.aiScore); }
          g.goalPostShake = 12;
          g.resultText = '📄 GOAL!'; g.resultColor = '#4ECDC4'; g.resultTimer = 50;
          g.scoreBounce = 12;
          // Confetti
          for (let i = 0; i < 6; i++) g.confetti.push({ x: gx + (Math.random() - 0.5) * 60, y: gy, vy: -2 - Math.random() * 3, vx: (Math.random() - 0.5) * 3, opacity: 1, color: ['#FFD166', '#4ECDC4', ACCENT][i % 3] });
          t.flying = false; g.phase = g.currentTurn === 'player' ? 'scored' : 'scored';
          try { navigator.vibrate?.(25); } catch {}
          handleRoundEnd(g, canvas);
          rafRef.current = requestAnimationFrame(loop); return;
        }

        // Off screen
        if (t.y < -50 || t.x < -50 || t.x > cw + 50 || t.y > ch + 50 || (Math.abs(t.vx) < 0.15 && Math.abs(t.vy) < 0.15)) {
          g.resultText = 'MISS'; g.resultColor = '#FF6B6B'; g.resultTimer = 40;
          t.flying = false; g.phase = 'missed';
          handleRoundEnd(g, canvas);
          rafRef.current = requestAnimationFrame(loop); return;
        }
      }

      // Timers
      if (g.resultTimer > 0) g.resultTimer--;
      if (g.goalPostShake > 0) g.goalPostShake--;
      if (g.scoreBounce > 0) g.scoreBounce--;
      for (const s of g.scratches) s.opacity -= 0.035;
      g.scratches = g.scratches.filter(s => s.opacity > 0);
      for (const c of g.confetti) { c.y += c.vy; c.x += c.vx; c.vy += 0.08; c.opacity -= 0.016; }
      g.confetti = g.confetti.filter(c => c.opacity > 0);
      for (const t of g.trail) { t.opacity -= 0.06; t.scale -= 0.1; }

      // === DRAW ===
      // Notebook background
      ctx.fillStyle = '#F5F0E8'; ctx.fillRect(0, 0, cw, ch);
      // Ruled lines
      ctx.strokeStyle = 'rgba(200,216,232,0.6)'; ctx.lineWidth = 1;
      for (let y = 28; y < ch; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
      // Margin line
      ctx.strokeStyle = '#FFB3B3'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(60, ch); ctx.stroke();
      // Doodles
      if (doodleCanvasRef.current) ctx.drawImage(doodleCanvasRef.current, 0, 0);

      // Goal posts
      const postShake = g.goalPostShake > 0 ? Math.sin(g.goalPostShake * 1.5) * 4 : 0;
      ctx.fillStyle = '#3D2B1A';
      ctx.beginPath(); ctx.roundRect(gx - goalGap / 2 - 6 + postShake, gy, 12, 50, 4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(gx + goalGap / 2 - 6 + postShake, gy, 12, 50, 4); ctx.fill();
      // Crossbar
      ctx.setLineDash([6, 4]); ctx.strokeStyle = '#3D2B1A'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx - goalGap / 2 + postShake, gy + 2); ctx.lineTo(gx + goalGap / 2 + postShake, gy + 2); ctx.stroke();
      ctx.setLineDash([]);

      // Score display
      const scBounce = g.scoreBounce > 0 ? 1 + g.scoreBounce * 0.03 : 1;
      ctx.save(); ctx.textAlign = 'center';
      ctx.font = `800 ${Math.round(28 * scBounce)}px Outfit, sans-serif`;
      ctx.fillStyle = ACCENT; ctx.fillText(String(g.playerScore), gx - 50, gy - 10);
      ctx.fillStyle = '#555'; ctx.font = '700 18px Outfit, sans-serif'; ctx.fillText('-', gx, gy - 10);
      ctx.font = `800 ${Math.round(28 * scBounce)}px Outfit, sans-serif`;
      ctx.fillStyle = '#7a8ab5'; ctx.fillText(String(g.aiScore), gx + 50, gy - 10);
      ctx.restore();

      // Scratches
      for (const s of g.scratches) {
        ctx.save(); ctx.globalAlpha = s.opacity; ctx.strokeStyle = '#999'; ctx.lineWidth = 1.5;
        ctx.translate(s.x, s.y); ctx.rotate(s.angle);
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-6, i * 4); ctx.lineTo(6, i * 4); ctx.stroke(); }
        ctx.restore();
      }

      // Trail
      for (const tr of g.trail) {
        if (tr.opacity <= 0 || tr.scale <= 0) continue;
        ctx.save(); ctx.globalAlpha = tr.opacity * 0.4;
        ctx.translate(tr.x, tr.y); ctx.scale(tr.scale, tr.scale);
        ctx.fillStyle = '#c8e8c8'; ctx.strokeStyle = '#4a7a4a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(12, 8); ctx.lineTo(-12, 8); ctx.closePath();
        ctx.fill(); ctx.stroke(); ctx.restore();
      }

      // Confetti
      for (const c of g.confetti) {
        ctx.save(); ctx.globalAlpha = c.opacity; ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.moveTo(c.x, c.y - 5); ctx.lineTo(c.x + 4, c.y + 3); ctx.lineTo(c.x - 4, c.y + 3); ctx.closePath(); ctx.fill(); ctx.restore();
      }

      // Paper triangle
      if (g.triangle.flying || g.phase === 'aim' || g.phase === 'botaim') {
        ctx.save(); ctx.translate(g.triangle.x, g.triangle.y); ctx.rotate(g.triangle.angle);
        ctx.fillStyle = '#E8F4E8'; ctx.strokeStyle = '#4a7a4a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(14, 10); ctx.lineTo(-14, 10); ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Fold line
        ctx.strokeStyle = 'rgba(74,122,74,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 10); ctx.stroke();
        ctx.restore();
      }

      // Drag indicator
      if (g.dragStart && g.dragCurrent && g.phase === 'aim') {
        const dx = g.dragStart.x - g.dragCurrent.x, dy = g.dragStart.y - g.dragCurrent.y;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy), 130);
        // Elastic band
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(200,80,80,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(g.triangle.x, g.triangle.y); ctx.lineTo(g.dragCurrent.x, g.dragCurrent.y); ctx.stroke(); ctx.setLineDash([]);
        // Power ring
        const pNorm = power / 130;
        const r = pNorm * 30;
        const pr = Math.round(78 + pNorm * 177), pg = Math.round(205 - pNorm * 100), pb = Math.round(196 - pNorm * 100);
        ctx.strokeStyle = `rgb(${pr},${pg},${pb})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.triangle.x, g.triangle.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      // Aim hint
      if (g.phase === 'aim' && !g.dragStart) {
        ctx.font = '600 13px Outfit, sans-serif'; ctx.fillStyle = 'rgba(96,165,250,0.5)'; ctx.textAlign = 'center';
        ctx.fillText('DRAG BACK TO FLICK 📄', cw / 2, ch - 40);
      }

      // Turn indicator
      if (g.phase === 'botaim') {
        ctx.font = '600 13px Outfit, sans-serif'; ctx.fillStyle = '#7a8ab5'; ctx.textAlign = 'center';
        ctx.fillText('🤖 AI is aiming...', cw / 2, ch - 40);
      }

      // Result text
      if (g.resultTimer > 0) {
        const alpha = Math.min(1, g.resultTimer / 18);
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.font = '800 28px Outfit, sans-serif'; ctx.fillStyle = g.resultColor;
        ctx.textAlign = 'center'; ctx.fillText(g.resultText, cw / 2, ch * 0.45); ctx.restore();
      }

      // Round indicator
      const roundNum = Math.ceil((11 - g.roundsLeft) / 2);
      ctx.font = '600 11px Outfit, sans-serif'; ctx.fillStyle = '#999'; ctx.textAlign = 'center';
      ctx.fillText(`Round ${Math.min(roundNum, 5)} / 5`, cw / 2, ch - 16);

      // Game over overlay
      if (g.phase === 'done') {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, cw, ch);
        // Card
        const cardW = 260, cardH = 200, cardX = cw / 2 - cardW / 2, cardY = ch / 2 - cardH / 2;
        ctx.fillStyle = '#F5F0E8'; ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 16); ctx.fill();
        ctx.strokeStyle = '#C8D8E8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 16); ctx.stroke();
        ctx.textAlign = 'center';
        const result = g.playerScore > g.aiScore ? 'YOU WIN! 🎉' : g.playerScore < g.aiScore ? 'AI WINS 🤖' : 'DRAW! 🤝';
        ctx.font = '800 22px Outfit, sans-serif'; ctx.fillStyle = '#2a2a4a';
        ctx.fillText(result, cw / 2, cardY + 50);
        ctx.font = '700 16px Outfit, sans-serif'; ctx.fillStyle = '#555';
        ctx.fillText(`${g.playerScore} - ${g.aiScore}`, cw / 2, cardY + 82);
        const xp = g.playerScore > g.aiScore ? 15 : g.playerScore === g.aiScore ? 10 : 8;
        ctx.font = '700 13px Outfit, sans-serif'; ctx.fillStyle = '#D4A574';
        ctx.fillText(`⭐ +${xp} XP`, cw / 2, cardY + 110);
        // Replay button
        ctx.fillStyle = ACCENT; ctx.beginPath(); ctx.roundRect(cw / 2 - 55, cardY + 130, 110, 40, 10); ctx.fill();
        ctx.font = '700 14px Outfit, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('REPLAY', cw / 2, cardY + 155);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    function handleRoundEnd(g: GS, canvas: HTMLCanvasElement) {
      g.roundsLeft--;
      if (g.roundsLeft <= 0) {
        setTimeout(() => {
          g.phase = 'done'; setGameOver(true);
          // Save
          if (g.playerScore > g.aiScore) {
            const wins = parseInt(localStorage.getItem('lumatha_pf_wins') || '0', 10) + 1;
            try { localStorage.setItem('lumatha_pf_wins', String(wins)); } catch {}
          }
        }, 800);
      } else {
        setTimeout(() => {
          g.currentTurn = g.currentTurn === 'player' ? 'ai' : 'player';
          initRound(g, canvas);
        }, 800);
      }
    }

    // Handle clicks on game-over replay
    const onClick = (e: MouseEvent) => {
      const g = gs.current; if (g.phase !== 'done') return;
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const bx = canvas.width / 2 - 55, by = canvas.height / 2 - 100 + 130;
      if (mx >= bx && mx <= bx + 110 && my >= by && my <= by + 40) {
        gs.current = {
          triangle: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, spinSpeed: 0, flying: false },
          phase: 'aim', playerScore: 0, aiScore: 0, roundsLeft: 10, currentTurn: 'player',
          dragStart: null, dragCurrent: null, trail: [], goalPostShake: 0, confetti: [],
          resultText: '', resultColor: '', resultTimer: 0, scoreBounce: 0, scratches: [], botTimer: 0,
        };
        setPlayerScore(0); setAiScore(0); setGameOver(false);
        initRound(gs.current, canvas);
      }
    };
    canvas.addEventListener('click', onClick);

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onDown); canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown); canvas.removeEventListener('touchmove', onMove); canvas.removeEventListener('touchend', onUp);
      canvas.removeEventListener('click', onClick);
    };
  }, [initRound]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#F5F0E8' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }} />
      <GameHeader score={playerScore} accentColor={ACCENT} onBack={onBack} extraInfo={`R${Math.min(Math.ceil((11 - (gs.current?.roundsLeft ?? 10)) / 2), 5)}/5`} />
    </div>
  );
}
