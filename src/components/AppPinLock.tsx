import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete } from 'lucide-react';

export function AppPinLock({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const pinEnabled = localStorage.getItem('lumatha_pin_lock') === 'true';
    const pinCode = localStorage.getItem('lumatha_pin_code');
    const unlocked = sessionStorage.getItem('lumatha_pin_unlocked') === 'true';
    if (pinEnabled && pinCode && !unlocked) {
      setLocked(true);
    }
  }, []);

  const handleDigit = useCallback((d: string) => {
    if (d === 'back') {
      setDigits(prev => prev.slice(0, -1));
      setError('');
      return;
    }
    const nd = [...digits, d];
    setDigits(nd);
    if (nd.length === 4) {
      const code = nd.join('');
      const stored = localStorage.getItem('lumatha_pin_code');
      if (code === stored) {
        sessionStorage.setItem('lumatha_pin_unlocked', 'true');
        setLocked(false);
      } else {
        setError('Wrong PIN');
        setShake(true);
        setTimeout(() => { setShake(false); setDigits([]); }, 500);
      }
    }
  }, [digits]);

  if (!locked) return <>{children}</>;

  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'back'] as const;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFFFFF]">
      <div className="mb-6 relative">
        <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: 'rgba(124,58,237,0.3)', width: 80, height: 80, transform: 'translate(-8px,-8px)' }} />
        <Lock className="w-16 h-16 relative" style={{ color: '#7C3AED' }} />
      </div>

      <h1 className="text-black mb-1" style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 24 }}>Lumatha Locked</h1>
      <p className="mb-8" style={{ color: '#64748B', fontSize: 14 }}>Enter your PIN to continue</p>

      <motion.div
        className="flex gap-4 mb-3"
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="w-4 h-4 rounded-full transition-all duration-200"
            style={{
              background: i < digits.length ? (error ? '#ef4444' : '#7C3AED') : '#1f2937',
              border: `2px solid ${i < digits.length ? (error ? '#ef4444' : '#7C3AED') : '#374151'}`,
            }}
          />
        ))}
      </motion.div>

      {error && <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{error}</p>}
      {!error && <div className="h-6 mb-4" />}

      <div className="grid grid-cols-3 gap-4" style={{ maxWidth: 260 }}>
        {keys.map((k, i) => (
          <div key={i} className="flex items-center justify-center">
            {k === null ? <div className="w-16 h-16" /> : (
              <button
                onClick={() => handleDigit(String(k))}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 bg-gray-100 text-black border border-gray-200"
                style={{ fontSize: k === 'back' ? 14 : 22, fontWeight: 700 }}
              >
                {k === 'back' ? <Delete className="w-5 h-5" /> : k}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
