import { useEffect, useState, useRef } from 'react';
import zenpeaceIntro from '@/assets/zenpeace-intro.mp4';

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Show skip button after 5 seconds
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 5000);

    return () => clearTimeout(skipTimer);
  }, []);

  const handleVideoEnd = () => {
    setIsFading(true);
    setTimeout(() => setShow(false), 1000);
  };

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(() => setShow(false), 500);
  };

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-1000 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Nature Video Background */}
      <video
        ref={videoRef}
        src={zenpeaceIntro}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

      {/* Skip Button - appears after 5 seconds */}
      {showSkip && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 px-4 py-2 text-sm text-white/60 hover:text-white/90 
                     bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full 
                     transition-all duration-300 animate-fade-in z-10"
        >
          Skip
        </button>
      )}

      {/* Minimal Loading Indicator at bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
        <div className="w-32 h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/60 animate-pulse-glow rounded-full" style={{ width: '100%' }} />
        </div>
        <p className="text-xs text-white/40 tracking-widest uppercase">Zenpeace</p>
      </div>
    </div>
  );
}
