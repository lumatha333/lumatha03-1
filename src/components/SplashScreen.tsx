import { useEffect, useState } from 'react';
import logo from '@/assets/lumatha-logo.png';

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1300);
    const hideTimer = setTimeout(() => setShow(false), 1750);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ 
        background: '#0B1120',
        color: '#FFFFFF'
      }}
    >
      {/* Center content */}
      <div className="flex flex-col items-center gap-5 transition-all duration-500 ease-out opacity-100 translate-y-0">
        {/* Logo only - no extra ring */}
        <div className="relative">
          <img
            src={logo}
            alt="Lumatha"
            className="mx-auto object-contain"
            style={{ 
              width: 140, 
              height: 140,
            }}
          />
        </div>
        
        {/* Lumatha Text */}
        <div className="transition-all duration-300 opacity-100 translate-y-0">
          <h1 
            className="text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ 
              color: '#FFFFFF',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.02em'
            }}
          >
            Lumatha
          </h1>
        </div>
        
        <div className="h-2" />
      </div>
    </div>
  );
}
