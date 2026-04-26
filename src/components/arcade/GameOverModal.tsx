import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameOverModalProps {
  visible: boolean;
  score: number;
  bestScore: number;
  xpEarned: number;
  accentColor: string;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOverModal({
  visible,
  score,
  bestScore,
  xpEarned,
  accentColor,
  onRetry,
  onMenu,
}: GameOverModalProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setDisplayScore(0);
      return;
    }
    // Count up from 0 to score over ~0.9s
    const steps = 30;
    const increment = Math.max(1, Math.ceil(score / steps));
    let current = 0;
    setDisplayScore(0);
    countRef.current = setInterval(() => {
      current += increment;
      if (current >= score) {
        current = score;
        if (countRef.current) clearInterval(countRef.current);
      }
      setDisplayScore(current);
    }, 30);
    return () => {
      if (countRef.current) clearInterval(countRef.current);
    };
  }, [visible, score]);

  if (!visible) return null;

  const isNewBest = score >= bestScore && score > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.78)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          background: '#1C2541',
          borderRadius: 24,
          padding: '36px 28px',
          width: 'min(85vw, 340px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Title */}
        <span
          style={{
            fontSize: 11,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#7a8ab5',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          GAME OVER
        </span>

        {/* Score */}
        <span
          style={{
            fontSize: 54,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            color: accentColor,
            lineHeight: 1,
          }}
        >
          {displayScore}
        </span>

        {/* New best badge */}
        {isNewBest && (
          <span
            style={{
              background: `${accentColor}26`,
              border: `1px solid ${accentColor}`,
              borderRadius: 20,
              padding: '4px 14px',
              fontSize: 11,
              fontWeight: 700,
              color: accentColor,
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            ✦ NEW BEST
          </span>
        )}

        {/* XP */}
        <span
          style={{
            background: 'rgba(255,209,102,0.13)',
            borderRadius: 20,
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 700,
            color: '#FFD166',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          ⭐ +{xpEarned} XP
        </span>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: '#243057' }} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            onClick={onRetry}
            style={{
              flex: 1,
              height: 48,
              background: accentColor,
              borderRadius: 12,
              border: 'none',
              color: '#0B132B',
              fontWeight: 700,
              fontSize: 15,
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            RETRY
          </button>
          <button
            onClick={onMenu}
            style={{
              flex: 1,
              height: 48,
              background: 'transparent',
              borderRadius: 12,
              border: '1.5px solid #243057',
              color: '#7a8ab5',
              fontWeight: 700,
              fontSize: 15,
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            MENU
          </button>
        </div>
      </motion.div>
    </div>
  );
}
