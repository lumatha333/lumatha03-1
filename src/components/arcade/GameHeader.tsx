import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameHeaderProps {
  score: number;
  accentColor: string;
  onBack: () => void;
  extraInfo?: string;
}

export function GameHeader({ score, accentColor, onBack, extraInfo }: GameHeaderProps) {
  const [pop, setPop] = useState(false);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score;
      setPop(true);
      const t = setTimeout(() => setPop(false), 200);
      return () => clearTimeout(t);
    }
  }, [score]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 10,
        background: 'rgba(11, 19, 43, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1C2541',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: '#1C2541',
          border: '1px solid #243057',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 22,
          color: '#7a8ab5',
          transition: 'border-color 0.25s ease-in-out',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = accentColor)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#243057')}
      >
        ‹
      </button>

      {/* Center — score */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <span
          style={{
            display: 'block',
            fontSize: 9,
            letterSpacing: 3,
            color: accentColor,
            textTransform: 'uppercase',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          SCORE
        </span>
        <span
          style={{
            display: 'block',
            fontSize: 26,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            color: '#E8EAF6',
            transform: pop ? 'scale(1.3)' : 'scale(1)',
            transition: 'transform 0.2s ease-out',
          }}
        >
          {score}
        </span>
      </div>

      {/* Right — extra info */}
      <div style={{ width: 38, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        {extraInfo && (
          <span
            style={{
              background: '#1C2541',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 12,
              color: accentColor,
              fontFamily: 'Outfit, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {extraInfo}
          </span>
        )}
      </div>
    </div>
  );
}
