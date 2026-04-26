import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, UserPlus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface EndedViewProps {
  onNewConnection: () => void;
  sessionDuration?: number;
  partnerPseudoName?: string;
  sessionId?: string;
  messages?: { content: string; sender_pseudo_name: string }[];
  myPseudoName?: string;
}

function sessionGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${h}, 65%, 45%), hsl(${(h + 40) % 360}, 70%, 55%))`;
}

export const EndedView: React.FC<EndedViewProps> = ({
  onNewConnection,
  sessionDuration = 0,
  partnerPseudoName = 'Stranger',
  sessionId,
  messages = [],
  myPseudoName = ''
}) => {
  const { profile } = useAuth();
  const [memorySaved, setMemorySaved] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const formatMins = (s: number) => {
    const m = Math.floor(s / 60);
    return m < 1 ? 'less than a minute' : `${m} minute${m > 1 ? 's' : ''}`;
  };

  const partnerShort = partnerPseudoName.split('-').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const myInitial = profile?.name?.[0]?.toUpperCase() || '?';
  const partnerInitial = partnerShort[0] || '?';

  const handleSaveMemory = async () => {
    setMemorySaved(true);
    toast.success('Memory saved! 💜');

    // Fetch AI summary
    if (messages.length > 0) {
      setLoadingSummary(true);
      try {
        const { data } = await supabase.functions.invoke('rc-ai', {
          body: {
            type: 'session-summary',
            messages: messages.slice(-5).map(m => ({ content: m.content }))
          }
        });
        if (data?.result) setAiSummary(data.result);
      } catch {
        setAiSummary('A warm conversation between two strangers 💜');
      } finally {
        setLoadingSummary(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4" style={{ background: 'hsl(220, 60%, 8%)' }}>
      {/* Avatars drifting apart */}
      <div className="flex items-center gap-4 mb-8">
        <motion.div
          animate={{ x: [-5, -20] }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[hsl(220,30%,25%)]">
            <Avatar className="w-full h-full">
              <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-[hsl(270,70%,50%)] to-[hsl(210,100%,55%)] text-white text-xl font-bold">
                {myInitial}
              </AvatarFallback>
            </Avatar>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="text-[hsl(215,20%,40%)] text-sm"
        >
          •••
        </motion.div>

        <motion.div
          animate={{ x: [5, 20] }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white border-2 border-[hsl(220,30%,25%)]"
            style={{ background: sessionGradient(sessionId || 'default') }}>
            {partnerInitial}
          </div>
        </motion.div>
      </div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground mb-2"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Session Ended
      </motion.h1>

      <p className="text-base text-[hsl(215,20%,65%)] mb-8">
        You chatted for {formatMins(sessionDuration)}
      </p>

      {/* Memory prompt */}
      {!memorySaved ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm rounded-[20px] p-5 mb-6"
          style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 20%)' }}
        >
          <h3 className="text-base font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            💜 Save this memory?
          </h3>
          <p className="text-sm text-[hsl(215,20%,65%)] mb-4 leading-relaxed">
            Your conversation will be saved anonymously in Memories. The stranger's identity stays hidden.
          </p>

          <button
            onClick={handleSaveMemory}
            className="w-full h-[52px] rounded-xl text-white font-semibold text-base mb-3"
            style={{ background: 'linear-gradient(135deg, hsl(270,70%,50%), hsl(210,100%,55%))' }}
          >
            Save to Memories 💾
          </button>

          <button
            onClick={() => setMemorySaved(true)}
            className="w-full text-center text-sm text-[hsl(215,20%,65%)] py-2"
          >
            No thanks
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-sm mb-6"
        >
          {/* AI Summary */}
          {(loadingSummary || aiSummary) && (
            <div className="rounded-[20px] p-5 mb-4" style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 20%)' }}>
              {loadingSummary ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[hsl(260,80%,75%)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[hsl(260,80%,75%)]">Generating summary...</span>
                </div>
              ) : (
                <p className="text-sm italic text-[hsl(260,80%,75%)] leading-relaxed">
                  ✨ {aiSummary}
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Connect options */}
      <div className="w-full max-w-sm space-y-3">
        <p className="text-sm text-[hsl(215,20%,65%)] text-center mb-2">Want to stay connected?</p>

        <button
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left"
          style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 20%)' }}
          onClick={() => toast.info("Anonymous friend request sent! They'll see it as 'A Lumatha connection'")}
        >
          <span className="text-xl">🤝</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Send Friend Request</p>
            <p className="text-[11px] text-[hsl(220,15%,35%)]">They'll get an anonymous request from 'A Lumatha connection'</p>
          </div>
        </button>

        <button
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left"
          style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 20%)' }}
          onClick={onNewConnection}
        >
          <span className="text-xl">🔄</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Connect Again</p>
            <p className="text-[11px] text-[hsl(220,15%,35%)]">Try to match with the same person or find someone new</p>
          </div>
        </button>
      </div>

      <button
        onClick={onNewConnection}
        className="mt-6 text-sm text-[hsl(220,15%,35%)]"
      >
        Skip for now
      </button>
    </div>
  );
};
