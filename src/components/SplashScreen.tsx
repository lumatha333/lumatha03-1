import { useEffect, useState } from 'react';
import lumathaLogo from '@/assets/lumatha-logo.png';

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2200);
    const hideTimer = setTimeout(() => setShow(false), 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ 
        background: 'linear-gradient(135deg, hsl(220 60% 8%) 0%, hsl(220 50% 12%) 50%, hsl(220 60% 8%) 100%)'
      }}
    >
      {/* Golden glow behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #d4a843 0%, transparent 70%)' }}
        />
      </div>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Circular Logo */}
        <div className="relative">
          <img 
            src={lumathaLogo} 
            alt="Lumatha" 
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-2xl"
            style={{ 
              filter: 'drop-shadow(0 0 30px rgba(212, 168, 67, 0.4))',
            }}
          />
        </div>

        {/* Universe text */}
        <p 
          className="text-lg sm:text-xl font-light tracking-[0.3em] uppercase"
          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
        >
          Universe
        </p>
      </div>
    </div>
  );
}
