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
        background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #0a1628 100%)'
      }}
    >
      {/* Subtle glow behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
      </div>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Circular Logo - NO rectangle, NO background */}
        <div className="relative">
          <img 
            src={lumathaLogo} 
            alt="Lumatha" 
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-full"
            style={{ 
              boxShadow: '0 0 60px rgba(59, 130, 246, 0.4), 0 0 120px rgba(59, 130, 246, 0.2)'
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
