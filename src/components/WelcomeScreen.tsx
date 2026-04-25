import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/lumatha-logo.png';

// Confetti CSS
const confettiStyle = `
@keyframes confetti-fall {
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
@keyframes welcome-fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes welcome-fade-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(1.03); }
}
`;

const CONFETTI_COLORS = ['#7C3AED', '#3B82F6', '#60A5FA', '#A78BFA'];
const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  color: CONFETTI_COLORS[i % 4],
  delay: Math.random() * 2,
  duration: 2.5 + Math.random() * 2,
  size: 6 + Math.random() * 6,
  rotation: Math.random() * 360,
}));

interface Interest {
  id: string;
  icon: string;
  label: string;
}

const INTERESTS: Interest[] = [
  { id: 'connect', icon: '❤️', label: 'Connect' },
  { id: 'learn', icon: '📚', label: 'Learn' },
  { id: 'games', icon: '🎮', label: 'Games' },
  { id: 'marketplace', icon: '🛒', label: 'Buy & Sell' },
];

interface WelcomeScreenProps {
  userId: string;
  firstName: string;
  city: string;
}

export default function WelcomeScreen({ userId, firstName, city }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [messageLoading, setMessageLoading] = useState(true);

  // Fetch AI welcome message
  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('welcome-message', {
          body: { firstName, city },
        });
        if (error) throw error;
        setWelcomeMessage(data?.message || `Welcome to Lumatha, ${firstName}!`);
      } catch {
        setWelcomeMessage(`Welcome to Lumatha, ${firstName}! Your journey starts now.`);
      } finally {
        setMessageLoading(false);
      }
    };
    fetchMessage();
  }, [firstName, city]);

  // Typewriter effect
  useEffect(() => {
    if (!welcomeMessage || messageLoading) return;
    let i = 0;
    setDisplayedText('');
    const interval = setInterval(() => {
      i++;
      setDisplayedText(welcomeMessage.slice(0, i));
      if (i >= welcomeMessage.length) {
        clearInterval(interval);
        setTimeout(() => setTypewriterDone(true), 300);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [welcomeMessage, messageLoading]);

  const [fadingOut, setFadingOut] = useState(false);

  const handleLetsGo = useCallback(async () => {
    if (!selectedInterest) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        primary_interest: selectedInterest,
      } as any).eq('id', userId);
    } catch {
      // Non-critical, continue anyway
    }
    setFadingOut(true);
    setTimeout(() => navigate('/'), 500);
  }, [selectedInterest, userId, navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #0f172a 100%)',
        animation: fadingOut ? 'welcome-fade-out 0.5s ease-out forwards' : undefined,
      }}>
      <style>{confettiStyle}</style>

      {/* Confetti - Lighter colors for dark background */}
      {confettiPieces.map((piece, i) => (
        <div key={i} className="absolute pointer-events-none"
          style={{
            left: piece.left,
            top: '-20px',
            width: piece.size,
            height: piece.size * 1.5,
            background: piece.color,
            borderRadius: 2,
            animation: `confetti-fall ${piece.duration}s ${piece.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            opacity: 0,
            transform: `rotate(${piece.rotation}deg)`,
          }} />
      ))}

      {/* Logo with Ring and White Text */}
      <div 
        className="flex flex-col items-center gap-4 mb-6"
        style={{ animation: 'welcome-fade-in 0.6s ease-out forwards' }}
      >
        {/* Logo with glowing ring border */}
        <div className="relative">
          {/* Outer glow ring */}
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-blue-400/30 blur-xl"
          />
          {/* White ring border */}
          <div 
            className="absolute -inset-3 rounded-full border-2 border-white/40 bg-white/5 backdrop-blur-sm"
          />
          {/* Logo container */}
          <div className="relative rounded-full overflow-hidden bg-[#0B1120] shadow-2xl">
            <img
              src={logo}
              alt="Lumatha"
              className="mx-auto object-contain"
              style={{ width: 120, height: 120 }}
            />
          </div>
        </div>
        
        <h1 
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          style={{ 
            color: '#FFFFFF',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.02em',
            textShadow: '0 0 30px rgba(124, 58, 237, 0.5)'
          }}
        >
          Lumatha
        </h1>
        <p 
          className="text-sm tracking-widest uppercase"
          style={{ 
            color: 'rgba(255, 255, 255, 0.6)',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '0.2em'
          }}
        >
          Social Universe
        </p>
      </div>

      {/* Welcome message */}
      <div className="text-center max-w-[320px] mb-8"
        style={{ animation: 'welcome-fade-in 0.6s 0.3s ease-out both', minHeight: 60 }}>
        {messageLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: '#FFFFFF' }} />
        ) : (
          <p className="text-[20px] font-bold leading-relaxed"
            style={{ 
              fontFamily: "'Space Grotesk', sans-serif", 
              lineHeight: 1.6,
              color: '#FFFFFF'
            }}
          >
            {displayedText}
            {!typewriterDone && <span className="animate-pulse" style={{ color: '#7C3AED' }}>|</span>}
          </p>
        )}
      </div>

      {/* Interest selection */}
      {typewriterDone && (
        <div className="w-full max-w-[360px]"
          style={{ animation: 'welcome-fade-in 0.5s ease-out forwards' }}>
          <p className="text-center text-[14px] mb-4"
            style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: "'Inter', sans-serif" }}>
            What brings you to Lumatha?
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {INTERESTS.map((interest) => {
              const isSelected = selectedInterest === interest.id;
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => setSelectedInterest(interest.id)}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl transition-all duration-200"
                  style={{
                    background: isSelected ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    border: `2px solid ${isSelected ? '#7C3AED' : 'rgba(255, 255, 255, 0.2)'}`,
                    boxShadow: isSelected ? '0 4px 20px rgba(124, 58, 237, 0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  }}>
                  <span className="text-[32px] leading-none">{interest.icon}</span>
                  <span className="text-[15px] font-bold"
                    style={{ 
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {interest.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Let's Go button */}
          {selectedInterest && (
            <button
              onClick={handleLetsGo}
              disabled={saving}
              className="w-full h-[52px] rounded-xl text-white font-bold text-[16px] flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-[0.88] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                fontFamily: "'Inter', sans-serif",
                animation: 'welcome-fade-in 0.3s ease-out forwards',
              }}>
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Let's Explore Lumatha →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
