import { useEffect, useState } from 'react';
import lumathaLogo from '@/assets/lumatha-logo.png';

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    // Logo fades in after 800ms (slow, premium entry)
    const logoTimer = setTimeout(() => setLogoVisible(true), 800);
    // Text appears after logo is fully visible
    const textTimer = setTimeout(() => setTextVisible(true), 1800);
    // Start fade out after 4.5 seconds total
    const fadeTimer = setTimeout(() => setFadeOut(true), 4500);
    // Remove from DOM after fade completes
    const hideTimer = setTimeout(() => { setShow(false); if (onComplete) onComplete(); }, 5300);
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-800 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ 
        background: 'hsl(220 60% 8%)'
      }}
    >
      {/* Golden glow behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className={`w-80 h-80 rounded-full blur-3xl transition-opacity duration-[2000ms] ${logoVisible ? 'opacity-20' : 'opacity-0'}`}
          style={{ background: 'radial-gradient(circle, #d4a843 0%, transparent 70%)' }}
        />
      </div>

      {/* Center content */}
      <div className={`relative flex flex-col items-center gap-6 transition-all duration-[1200ms] ease-out ${logoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
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

        {/* Lumatha text */}
        <p 
          className={`text-lg sm:text-xl font-light tracking-[0.3em] uppercase transition-all duration-700 ${textVisible ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
        >
          Lumatha
        </p>
      </div>
    </div>
  );
}


