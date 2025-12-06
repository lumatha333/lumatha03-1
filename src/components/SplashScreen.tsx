import { useEffect, useState } from 'react';
import logo from '@/assets/logo.png';

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShow(false), 300);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div className="text-center space-y-6 animate-fade-in">
        <img src={logo} alt="Crown of Creation" className="w-32 h-32 mx-auto animate-pulse-glow" />
        <p className="text-lg text-muted-foreground">Crafting your cosmic journey...</p>
        <div className="w-56 mx-auto bg-muted/30 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
