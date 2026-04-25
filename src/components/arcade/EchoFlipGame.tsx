import { useState, useRef, useEffect, useCallback } from 'react';
import { GameHeader } from '@/components/arcade/GameHeader';
import { GameOverModal } from '@/components/arcade/GameOverModal';

interface Props {
  onBack: () => void;
}

const THEMES: Record<string, { label: string; icons: string[] }> = {
  school: { label: '📚 School', icons: ['✏️', '📏', '🎒', '📐', '🔭', '📻', '🖥️', '📟'] },
  tech: { label: '💾 Tech', icons: ['💾', '📺', '🖱️', '⌨️', '📠', '🔋', '📡', '🕹️'] },
  snacks: { label: '🍭 Snacks', icons: ['🍭', '🍿', '🥤', '🍦', '🧃', '🍪', '🎂', '🍩'] },
};

const STORAGE_KEY = 'lumatha_ef_best';

interface Card {
  id: number;
  icon: string;
  pairId: number;
  state: 'hidden' | 'revealed' | 'matched';
  anim: '' | 'matched-bounce' | 'wrong-shake';
  wrongBorder: boolean;
}

function createDeck(icons: string[]): Card[] {
  const cards = icons.flatMap((icon, i) => [
    { id: i * 2, icon, pairId: i, state: 'hidden' as const, anim: '' as const, wrongBorder: false },
    { id: i * 2 + 1, icon, pairId: i, state: 'hidden' as const, anim: '' as const, wrongBorder: false },
  ]);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function EchoFlipGame({ onBack }: Props) {
  const [theme, setTheme] = useState<string>('school');
  const [cards, setCards] = useState<Card[]>(() => createDeck(THEMES.school.icons));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef(false);
  const bestScore = useRef(0);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) bestScore.current = parseInt(s, 10) || 0;
    } catch {}
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = useCallback(() => {
    if (started.current) return;
    started.current = true;
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, []);

  const switchTheme = useCallback((t: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    started.current = false;
    setTheme(t);
    setCards(createDeck(THEMES[t].icons));
    setFlipped([]);
    setLocked(false);
    setScore(0);
    setMoves(0);
    setDone(false);
    setShowModal(false);
    setShowCelebration(false);
    setElapsed(0);
  }, []);

  const matchedPairs = cards.filter(c => c.state === 'matched').length / 2;

  const handleTap = useCallback((id: number) => {
    if (locked || done) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.state !== 'hidden' || flipped.includes(id)) return;

    startTimer();

    const newCards = cards.map(c => c.id === id ? { ...c, state: 'revealed' as const, anim: '' as const, wrongBorder: false } : c);
    const newFlipped = [...flipped, id];

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      setCards(newCards);
      setFlipped(newFlipped);

      const c1 = newCards.find(c => c.id === newFlipped[0])!;
      const c2 = newCards.find(c => c.id === newFlipped[1])!;

      setTimeout(() => {
        if (c1.pairId === c2.pairId) {
          // Match!
          try { navigator.vibrate?.(20); } catch {}
          const matched = newCards.map(c =>
            c.id === c1.id || c.id === c2.id
              ? { ...c, state: 'matched' as const, anim: 'matched-bounce' as const }
              : c
          );
          setCards(matched);
          const newScore = score + 20;
          setScore(newScore);
          // Clear anim after duration
          setTimeout(() => setCards(prev => prev.map(c =>
            c.anim === 'matched-bounce' ? { ...c, anim: '' as const } : c
          )), 350);
          if (matched.every(c => c.state === 'matched')) {
            setDone(true);
            if (timerRef.current) clearInterval(timerRef.current);
            // Save perfect memory flag
            const finalMoves = moves + 1;
            if (finalMoves <= 8) {
              localStorage.setItem('lumatha_ef_perfect', '1');
            }
            // Celebration then modal
            setShowCelebration(true);
            setTimeout(() => {
              setShowCelebration(false);
              setShowModal(true);
            }, 700);
          }
        } else {
          // Wrong
          setCards(prev => prev.map(c =>
            c.id === c1.id || c.id === c2.id
              ? { ...c, anim: 'wrong-shake' as const, wrongBorder: true }
              : c
          ));
          setTimeout(() => {
            setCards(prev => prev.map(c =>
              c.id === c1.id || c.id === c2.id
                ? { ...c, state: 'hidden' as const, anim: '' as const, wrongBorder: false }
                : c
            ));
          }, 950);
        }
        setFlipped([]);
        setLocked(false);
      }, 950);
    } else {
      setCards(newCards);
      setFlipped(newFlipped);
    }
  }, [cards, flipped, locked, done, score, moves, startTimer]);

  const finalScore = done
    ? Math.max(50, 200 + Math.max(0, 300 - elapsed * 3) - Math.max(0, moves - 10) * 8)
    : score;

  const resetGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    started.current = false;
    setCards(createDeck(THEMES[theme].icons));
    setFlipped([]);
    setLocked(false);
    setScore(0);
    setMoves(0);
    setDone(false);
    setShowModal(false);
    setShowCelebration(false);
    setElapsed(0);
  }, [theme]);

  useEffect(() => {
    if (done && finalScore > bestScore.current) {
      bestScore.current = finalScore;
      try { localStorage.setItem(STORAGE_KEY, String(finalScore)); } catch {}
    }
  }, [done, finalScore]);

  const timerStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  const cardSize = Math.min((window.innerWidth - 52) / 4, 78);
  const totalPairs = 8;

  return (
    <div style={{ width: '100%', height: '100%', background: '#0B132B', position: 'relative', overflow: 'auto' }}>
      <style>{`
        @keyframes matchedBounce {
          0% { transform: rotateY(180deg) scale(1); }
          50% { transform: rotateY(180deg) scale(1.18); }
          100% { transform: rotateY(180deg) scale(1); }
        }
        @keyframes wrongShake {
          0% { transform: rotateY(180deg) translateX(0); }
          25% { transform: rotateY(180deg) translateX(-5px); }
          75% { transform: rotateY(180deg) translateX(5px); }
          100% { transform: rotateY(180deg) translateX(0); }
        }
        @keyframes celebPop {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.4); opacity: 1; }
          70% { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(1.0); opacity: 0; }
        }
        .matched-bounce { animation: matchedBounce 0.35s ease-out; }
        .wrong-shake { animation: wrongShake 0.35s ease-out; }
      `}</style>

      <GameHeader score={score} accentColor="#FFD166" onBack={onBack} extraInfo={timerStr} />

      {/* Theme selector */}
      <div style={{
        display: 'flex', gap: 8, justifyContent: 'center',
        marginTop: 68, padding: '0 20px',
      }}>
        {Object.entries(THEMES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => switchTheme(key)}
            style={{
              background: theme === key ? 'rgba(255,209,102,0.13)' : '#1C2541',
              border: `1px solid ${theme === key ? '#FFD166' : '#243057'}`,
              borderRadius: 20,
              padding: '5px 14px',
              fontSize: 11,
              fontWeight: 700,
              color: theme === key ? '#FFD166' : '#7a8ab5',
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(4, ${cardSize}px)`,
        gap: 10,
        justifyContent: 'center',
        padding: '14px 20px 0',
      }}>
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => handleTap(card.id)}
            style={{ width: cardSize, height: cardSize, perspective: 600, cursor: 'pointer' }}
          >
            <div
              className={card.anim || undefined}
              style={{
                width: '100%', height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: card.anim ? 'none' : 'transform 0.38s ease',
                transform: card.state !== 'hidden' ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                borderRadius: 12, background: '#1C2541',
                border: '1px solid #243057',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#2a3a5c', fontFamily: 'Outfit, sans-serif',
              }}>?</div>
              {/* Back */}
              <div style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                borderRadius: 12,
                background: card.state === 'matched' ? '#0f2b0f' : '#243057',
                border: `1.5px solid ${
                  card.wrongBorder ? '#FF6B6B' :
                  card.state === 'matched' ? '#4ECDC4' : '#FFD166'
                }`,
                boxShadow: card.state === 'matched' ? '0 0 8px rgba(78,205,196,0.5)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30,
              }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ padding: '12px 26px 0', textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: '#7a8ab5', fontFamily: 'Outfit, sans-serif' }}>
          {matchedPairs} / {totalPairs} pairs
        </span>
        <div style={{ marginTop: 6, height: 4, background: '#243057', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#FFD166', borderRadius: 2,
            width: `${(matchedPairs / totalPairs) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Moves */}
      <div style={{
        textAlign: 'right', padding: '6px 26px 0',
        fontFamily: 'Outfit, sans-serif', fontSize: 11, color: '#4a5568',
      }}>
        {moves} moves
      </div>

      {/* Celebration */}
      {showCelebration && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 80, animation: 'celebPop 0.7s ease-out forwards' }}>🎉</span>
        </div>
      )}

      <GameOverModal
        visible={showModal}
        score={finalScore}
        bestScore={bestScore.current}
        xpEarned={moves <= 10 ? 15 : 10}
        accentColor="#FFD166"
        onRetry={resetGame}
        onMenu={onBack}
      />
    </div>
  );
}
