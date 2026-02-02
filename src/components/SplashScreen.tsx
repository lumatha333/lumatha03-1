import { useEffect, useState } from 'react';
import zenpeaceLogo from '@/assets/zenpeace-logo.png';

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Auto-hide after 2.5 seconds with fade
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => setShow(false), 800);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-800 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)'
      }}
    >
      {/* Subtle golden glow behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #c9a227 0%, transparent 70%)' }}
        />
      </div>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="relative">
          <img 
            src={zenpeaceLogo} 
            alt="Zenpeace" 
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-2xl shadow-2xl"
            style={{ 
              boxShadow: '0 0 60px rgba(201, 162, 39, 0.3), 0 0 120px rgba(201, 162, 39, 0.1)'
            }}
          />
        </div>

        {/* Brand text */}
        <div className="text-center space-y-2">
          <h1 
            className="text-3xl sm:text-4xl font-bold tracking-widest"
            style={{ 
              color: '#e8d5a3',
              textShadow: '0 0 30px rgba(201, 162, 39, 0.5)'
            }}
          >
            ZENPEACE
          </h1>
          <p className="text-sm text-white/40 tracking-wider">Find Your Inner Peace</p>
        </div>

        {/* Simple loading bar */}
        <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full rounded-full"
            style={{ 
              background: 'linear-gradient(90deg, #c9a227, #e8d5a3)',
              animation: 'loadProgress 2.5s ease-out forwards',
              width: '0%'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loadProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
