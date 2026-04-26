import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Shield, Check, CheckCheck, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { useSignaling } from '@/hooks/useSignaling';
import { useAuth } from '@/contexts/AuthContext';
import { ReportDialog } from './ReportDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender_pseudo_name: string;
  content: string;
  created_at: string;
  isRead?: boolean;
}

interface TextConnectProps {
  myPseudoName: string;
  partnerPseudoName: string;
  conversationStarter: string;
  messages: Message[];
  sessionId: string | null;
  textMemory: { content: string; isOwn: boolean }[];
  onSendMessage: (content: string) => void;
  onSkip: () => void;
  onViolation?: (type: 'screenshot' | 'recording') => void;
  onClearMemory?: () => void;
  onReport?: (reason: string) => void;
  partnerId?: string;
  matchedInterests?: string[];
}

const MANDATORY_STAY_SECONDS = 20;

function sessionGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${h}, 65%, 45%), hsl(${(h + 40) % 360}, 70%, 55%))`;
}

export const TextConnect: React.FC<TextConnectProps> = ({
  myPseudoName,
  partnerPseudoName,
  conversationStarter,
  messages,
  sessionId,
  textMemory,
  onSendMessage,
  onSkip,
  onViolation,
  onClearMemory,
  onReport,
  partnerId,
  matchedInterests = []
}) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [partnerPresence, setPartnerPresence] = useState<'online' | 'away'>('online');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(true);
  const [showIcebreaker, setShowIcebreaker] = useState(true);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [smartReplyCount, setSmartReplyCount] = useState(0);
  const [memorySaved, setMemorySaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  const MAX_SMART_REPLY_ROUNDS = 2;

  useSecurityDetection({
    enabled: true,
    onScreenshotDetected: () => onViolation?.('screenshot'),
    onRecordingDetected: () => onViolation?.('recording')
  });

  const { isConnected, sendTyping, sendRead, sendPresence } = useSignaling({
    sessionId,
    userId: user?.id || '',
    pseudoName: myPseudoName,
    onTyping: (data) => {
      if (data.fromPseudoName !== myPseudoName) {
        setIsPartnerTyping(data.isTyping);
        if (data.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
        }
      }
    },
    onRead: (data) => {
      setReadMessageIds(prev => {
        const newSet = new Set(prev);
        data.messageIds.forEach((id: string) => newSet.add(id));
        return newSet;
      });
    },
    onPresence: (data) => {
      if (data.fromPseudoName !== myPseudoName) setPartnerPresence(data.status as 'online' | 'away');
    },
    onPeerLeft: () => {
      toast.info('Partner left. Returning to lobby...');
      onSkip();
    }
  });

  // Skip timer
  useEffect(() => {
    if (duration >= MANDATORY_STAY_SECONDS && !canSkip) setCanSkip(true);
  }, [duration, canSkip]);

  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss privacy banner
  useEffect(() => {
    const t = setTimeout(() => setShowPrivacyBanner(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Hide icebreaker after first sent message
  useEffect(() => {
    if (messages.some(m => m.sender_pseudo_name === myPseudoName)) setShowIcebreaker(false);
  }, [messages, myPseudoName]);

  // Presence
  useEffect(() => {
    if (isConnected) sendPresence('online');
    return () => { if (isConnected) sendPresence('away'); };
  }, [isConnected, sendPresence]);

  // Mark messages as read
  useEffect(() => {
    const unread = messages
      .filter(m => m.sender_pseudo_name !== myPseudoName && !readMessageIds.has(m.id))
      .map(m => m.id);
    if (unread.length > 0 && isConnected) sendRead(unread);
  }, [messages, myPseudoName, isConnected, sendRead, readMessageIds]);

  // Smart replies - debounced, auto-disable after 2 rounds
  const lastFetchedMsgRef = React.useRef<string>('');
  const smartReplyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (smartReplyCount >= MAX_SMART_REPLY_ROUNDS) return; // Auto-disable after 2
    const partnerMsgs = messages.filter(m => m.sender_pseudo_name !== myPseudoName);
    if (partnerMsgs.length > 0) {
      const last = partnerMsgs[partnerMsgs.length - 1];
      if (last.content === lastFetchedMsgRef.current) return;
      lastFetchedMsgRef.current = last.content;

      if (smartReplyTimerRef.current) clearTimeout(smartReplyTimerRef.current);
      smartReplyTimerRef.current = setTimeout(() => {
        fetchSmartReplies(last.content);
      }, 2000);
    }
    return () => { if (smartReplyTimerRef.current) clearTimeout(smartReplyTimerRef.current); };
  }, [messages.length, smartReplyCount]);

  const fetchSmartReplies = async (msg: string) => {
    try {
      const { data } = await supabase.functions.invoke('rc-ai', {
        body: { type: 'smart-reply', messages: [{ content: msg }] }
      });
      if (data?.replies) {
        setSmartReplies(data.replies);
        setSmartReplyCount(c => c + 1);
      }
    } catch {
      setSmartReplies([]);
    }
  };

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isPartnerTyping, scrollToBottom]);
  useEffect(() => {
    const t = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(t);
  }, [messages.length, scrollToBottom]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const now = Date.now();
    if (isConnected && e.target.value.length > 0 && now - lastTypingSentRef.current > 1000) {
      sendTyping(true);
      lastTypingSentRef.current = now;
    }
  }, [isConnected, sendTyping]);

  const handleSend = (text?: string) => {
    const val = text || inputValue.trim();
    if (!val) return;
    if (isConnected) sendTyping(false);
    onSendMessage(val);
    setInputValue('');
    setSmartReplies([]);
    setTimeout(scrollToBottom, 50);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSaveMemory = () => {
    setMemorySaved(true);
    toast.success('Memory saved! 💜');
  };

  const handleSkipConfirm = () => {
    setShowSkipConfirm(false);
    onSkip();
  };

  const handleReport = (reason: string) => {
    onReport?.(reason);
    setShowReportDialog(false);
    toast.success('Report submitted.');
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const getReadStatus = (msg: Message) => {
    if (msg.sender_pseudo_name !== myPseudoName) return null;
    return readMessageIds.has(msg.id) ? 'read' : 'sent';
  };

  const partnerGradient = sessionGradient(sessionId || 'default');
  const partnerShortName = partnerPseudoName.split('-').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="flex flex-col h-screen random-connect-protected" style={{ background: 'hsl(220, 60%, 8%)' }}>
      {/* Privacy banner */}
      <AnimatePresence>
        {showPrivacyBanner && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="px-4 py-2 text-center border-b"
            style={{ background: 'hsl(220, 45%, 14%)', borderColor: 'hsl(220, 30%, 20%)' }}
          >
            <p className="text-[12px] text-[hsl(215,20%,65%)]">🛡️ Anonymous session — No screenshots</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Top bar with partner info + all actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b sticky top-0 z-30" style={{ background: 'hsl(220, 45%, 14%)', borderColor: 'hsl(220, 30%, 20%)' }}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white" style={{ background: partnerGradient }}>
              {partnerShortName[0]}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${partnerPresence === 'online' ? 'bg-[hsl(160,84%,39%)]' : 'bg-[hsl(38,92%,50%)]'}`} style={{ borderColor: 'hsl(220, 45%, 14%)' }} />
          </div>
          <div>
            <p className="font-semibold text-[14px] text-foreground leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {partnerShortName}
            </p>
            <div className="flex items-center gap-1.5">
              {isPartnerTyping ? (
                <p className="text-[10px] text-[hsl(270,70%,50%)] animate-pulse">typing...</p>
              ) : (
                <>
                  <div className={`w-1.5 h-1.5 rounded-full ${partnerPresence === 'online' ? 'bg-[hsl(160,84%,39%)]' : 'bg-[hsl(38,92%,50%)]'}`} />
                  <span className="text-[10px] text-[hsl(160,84%,39%)]">Connected</span>
                  <span className="text-[10px] text-[hsl(220,15%,35%)]">{formatDuration(duration)}</span>
                </>
              )}
            </div>
            {matchedInterests.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                {matchedInterests.map(interest => (
                  <span key={interest} className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'hsla(270,70%,50%,0.15)', color: 'hsl(260,80%,75%)' }}>
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top bar actions: Report, Save, Skip */}
        <div className="flex items-center gap-1">
          <button onClick={() => setShowReportDialog(true)} className="p-1.5 rounded-full hover:bg-white/5" title="Report">
            <Shield className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={handleSaveMemory}
            disabled={memorySaved}
            className="p-1.5 rounded-full hover:bg-white/5"
            title={memorySaved ? 'Saved' : 'Save Memory'}
          >
            <Bookmark className={`w-4 h-4 ${memorySaved ? 'text-[hsl(260,80%,75%)] fill-current' : 'text-foreground'}`} />
          </button>
          <button
            onClick={() => canSkip ? setShowSkipConfirm(true) : toast.info(`Skip in ${MANDATORY_STAY_SECONDS - duration}s`)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold ml-1"
            style={{
              background: 'hsla(0, 84%, 60%, 0.1)',
              border: '1px solid hsla(0, 84%, 60%, 0.2)',
              color: 'hsl(0, 84%, 60%)',
              opacity: canSkip ? 1 : 0.5,
            }}
          >
            Skip
          </button>
        </div>
      </div>

      {/* Icebreaker banner */}
      <AnimatePresence>
        {showIcebreaker && conversationStarter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-3 mt-2"
          >
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'hsla(270, 70%, 50%, 0.08)', border: '1px solid hsla(270, 70%, 50%, 0.15)' }}>
              <p className="text-[11px] text-[hsl(260,80%,75%)]">✨ Starter:</p>
              <p className="text-[13px] text-foreground mt-0.5">{conversationStarter}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {messages.map((message, idx) => {
          const isOwn = message.sender_pseudo_name === myPseudoName;
          const readStatus = getReadStatus(message);
          const showName = !isOwn && (idx === 0 || messages[idx - 1]?.sender_pseudo_name === myPseudoName);

          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {showName && (
                  <p className="text-[10px] font-medium mb-0.5 ml-2" style={{ color: `hsl(${Math.abs(partnerPseudoName.charCodeAt(0) * 7) % 360}, 65%, 65%)` }}>
                    {partnerShortName}
                  </p>
                )}
                <div
                  className={`px-3 py-2 ${isOwn ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}
                  style={{
                    background: isOwn
                      ? 'linear-gradient(135deg, hsl(270,70%,50%), hsl(270,60%,42%))'
                      : 'hsl(220, 35%, 18%)',
                  }}
                >
                  <p className="text-[13px] whitespace-pre-wrap break-words leading-relaxed text-white">
                    {message.content}
                  </p>
                </div>
                {isOwn && (
                  <div className="flex justify-end mt-0.5 mr-1">
                    {readStatus === 'read' ? (
                      <CheckCheck className="w-3 h-3 text-[hsl(210,100%,55%)]" />
                    ) : (
                      <Check className="w-3 h-3 text-[hsl(215,20%,50%)]" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isPartnerTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-md" style={{ background: 'hsl(220, 35%, 18%)' }}>
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-[hsl(215,20%,50%)] animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart reply chips (shown only until 2 rounds) */}
      {smartReplies.length > 0 && smartReplyCount <= MAX_SMART_REPLY_ROUNDS && (
        <div className="px-3 pb-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {smartReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => handleSend(reply)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: 'hsla(270, 70%, 50%, 0.1)',
                border: '1px solid hsla(270, 70%, 50%, 0.2)',
                color: 'hsl(260,80%,75%)',
              }}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 pb-4 pt-1.5 border-t" style={{ borderColor: 'hsl(220, 30%, 20%)', background: 'hsl(220, 45%, 14%)' }}>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Share a thought..."
            className="flex-1 rounded-full h-10 text-sm border-0"
            style={{ background: 'hsl(220, 35%, 18%)', color: 'hsl(220, 20%, 98%)' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
            style={{ background: 'linear-gradient(135deg, hsl(270,70%,50%), hsl(210,100%,55%))' }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Skip confirmation */}
      <AnimatePresence>
        {showSkipConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center pb-8 bg-black/60"
            onClick={() => setShowSkipConfirm(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="w-[90%] max-w-sm rounded-[20px] p-5"
              style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 25%)' }}
            >
              <p className="text-base font-semibold text-foreground text-center mb-4">Skip this connection?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSkipConfirm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-foreground"
                  style={{ background: 'hsla(270, 70%, 50%, 0.15)', border: '1px solid hsla(270, 70%, 50%, 0.3)' }}
                >
                  Keep Chatting
                </button>
                <button
                  onClick={handleSkipConfirm}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: 'hsla(0, 84%, 60%, 0.15)', border: '1px solid hsla(0, 84%, 60%, 0.3)', color: 'hsl(0, 84%, 60%)' }}
                >
                  Yes, Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Dialog */}
      <ReportDialog open={showReportDialog} onClose={() => setShowReportDialog(false)} onReport={handleReport} />

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
};
