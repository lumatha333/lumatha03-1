import { useEffect, useState } from 'react';
import lumathaLogo from '@/assets/lumatha-logo.png';

export function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)'
      }}
    >
      {/* Subtle golden glow behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #c9a227 0%, transparent 70%)' }}
        />
      </div>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo - clean, no animations */}
        <div className="relative">
          <img 
            src={lumathaLogo} 
            alt="Lumatha" 
            className="w-40 h-40 sm:w-52 sm:h-52 object-contain rounded-3xl"
            style={{ 
              boxShadow: '0 0 80px rgba(201, 162, 39, 0.4), 0 0 160px rgba(201, 162, 39, 0.15)'
            }}
          />
        </div>

        {/* Brand text */}
        <div className="text-center space-y-3">
          <h1 
            className="text-4xl sm:text-5xl font-bold tracking-widest"
            style={{ 
              color: '#e8d5a3',
              textShadow: '0 0 40px rgba(201, 162, 39, 0.5)'
            }}
          >
            LUMATHA
          </h1>
          <p className="text-sm sm:text-base text-white/40 tracking-wider">Find Your Inner Peace</p>
        </div>

        {/* Simple loading bar */}
        <div className="w-56 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
          <div 
            className="h-full rounded-full"
            style={{ 
              background: 'linear-gradient(90deg, #c9a227, #e8d5a3)',
              width: '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
}
