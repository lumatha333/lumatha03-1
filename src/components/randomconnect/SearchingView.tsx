import React, { useState, useEffect, useCallback } from 'react';
import { ConnectionMode } from '@/hooks/useRandomConnect';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface SearchingViewProps {
  mode: ConnectionMode;
  myPseudoName: string;
  onCancel: () => void;
}

export const SearchingView: React.FC<SearchingViewProps> = ({
  mode,
  myPseudoName,
  onCancel
}) => {
  const { profile } = useAuth();
  const [icebreaker, setIcebreaker] = useState('');
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [dotIndex, setDotIndex] = useState(0);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => setDotIndex(i => (i + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

  // AI icebreaker after 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIcebreaker();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchIcebreaker = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('rc-ai', {
        body: { type: 'icebreaker' }
      });
      if (!error && data?.result) {
        setIcebreaker(data.result);
        setShowIcebreaker(true);
      }
    } catch {
      setIcebreaker("If you could visit any place in Nepal tomorrow, where would you go?");
      setShowIcebreaker(true);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(icebreaker);
    toast.success('Copied to clipboard!');
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    onCancel();
  };

  const initial = profile?.name?.[0]?.toUpperCase() || myPseudoName[0]?.toUpperCase() || '?';
  const modeLabel = mode === 'text' ? 'Text' : mode === 'audio' ? 'Audio' : 'Video';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'hsl(220, 60%, 8%)' }}>
      {/* Pulsing background circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              border: '1px solid hsla(270, 70%, 50%, 0.1)',
              animation: `rcPulseRing ${3 + i}s ease-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Mode badge */}
      <div className="absolute top-8 z-10">
        <div className="px-4 py-1.5 rounded-full text-[12px] font-medium"
          style={{ background: 'hsla(270, 70%, 50%, 0.15)', border: '1px solid hsla(270, 70%, 50%, 0.25)', color: 'hsl(260,80%,75%)' }}>
          {modeLabel} Connect
        </div>
      </div>

      {/* Avatar pair */}
      <div className="relative z-10 flex items-center gap-6 mb-8">
        {/* Your avatar */}
        <div className="relative">
          <div
            className="absolute -inset-1 rounded-full animate-[spin_3s_linear_infinite]"
            style={{ background: 'conic-gradient(hsl(270,70%,50%), hsl(210,100%,55%), hsl(270,70%,50%))' }}
          />
          <div className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center overflow-hidden" style={{ background: 'hsl(220, 60%, 8%)' }}>
            <div className="w-[66px] h-[66px] rounded-full overflow-hidden">
              <Avatar className="w-full h-full">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-[hsl(270,70%,50%)] to-[hsl(210,100%,55%)] text-white text-2xl font-bold">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: dotIndex > i ? 1 : 0.2, scale: dotIndex > i ? 1.2 : 0.8 }}
              transition={{ duration: 0.2 }}
              className="w-2.5 h-2.5 rounded-full bg-[hsl(270,70%,50%)]"
            />
          ))}
        </div>

        {/* Stranger avatar */}
        <div className="relative">
          <div
            className="absolute -inset-1 rounded-full animate-[spin_3s_linear_infinite]"
            style={{
              background: 'conic-gradient(hsl(270,70%,50%), hsl(210,100%,55%), hsl(270,70%,50%))',
              animationDirection: 'reverse'
            }}
          />
          <div className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: 'hsl(220, 60%, 8%)' }}>
            <div className="w-[66px] h-[66px] rounded-full bg-[hsl(220,30%,20%)] flex items-center justify-center">
              <span className="text-2xl text-[hsl(215,20%,50%)]">?</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status text */}
      <div className="relative z-10 text-center mb-1">
        <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Finding your match{'.'.repeat(dotIndex)}
        </h2>
      </div>

      <p className="text-[13px] text-[hsl(220,15%,35%)] relative z-10">
        Usually under 30 seconds
      </p>

      {/* AI Icebreaker card */}
      <AnimatePresence>
        {showIcebreaker && icebreaker && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="relative z-10 mx-4 mt-8 w-full max-w-sm"
          >
            <div
              className="rounded-[20px] p-5"
              style={{
                background: 'hsl(220, 45%, 14%)',
                border: '1px solid hsla(270, 70%, 50%, 0.3)',
              }}
            >
              <p className="text-sm text-[hsl(260,80%,75%)] mb-2">✨ Conversation starter ready!</p>
              <p className="text-base font-semibold text-foreground italic leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                "{icebreaker}"
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleCopy}
                  className="flex-1 px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
                  style={{ background: 'hsla(270, 70%, 50%, 0.2)', border: '1px solid hsla(270, 70%, 50%, 0.3)' }}
                >
                  Use this opener →
                </button>
                <button
                  onClick={fetchIcebreaker}
                  className="text-sm text-[hsl(215,20%,65%)]"
                >
                  🔄 New
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel button */}
      <div className="absolute bottom-12 z-10">
        <button onClick={handleCancel} className="text-base text-[hsl(215,20%,65%)]">
          Cancel
        </button>
      </div>

      {/* Cancel confirmation */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center pb-8 bg-black/60"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="w-[90%] max-w-sm rounded-[20px] p-5"
              style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 25%)' }}
            >
              <p className="text-base font-semibold text-foreground text-center mb-4">Leave queue?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-foreground"
                  style={{ background: 'hsla(270, 70%, 50%, 0.15)', border: '1px solid hsla(270, 70%, 50%, 0.3)' }}
                >
                  Stay
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'hsla(0, 84%, 60%, 0.15)', border: '1px solid hsla(0, 84%, 60%, 0.3)', color: 'hsl(0, 84%, 60%)' }}
                >
                  Yes, Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes rcPulseRing {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
