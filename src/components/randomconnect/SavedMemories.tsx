import React, { useState } from 'react';
import { MessageCircle, Mic, Video, Check, X, UserPlus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export interface Memory {
  id: string;
  type: 'video' | 'audio' | 'text';
  partnerPseudoName: string;
  duration: number;
  createdAt: Date;
  expiresAt: Date;
  messages?: { content: string; isOwn: boolean }[];
  reconnectStatus?: 'pending' | 'sent' | 'received' | 'accepted' | 'declined' | null;
  aiSummary?: string;
}

interface SavedMemoriesProps {
  memories: Memory[];
  onClearMemory?: (id: string) => void;
  onClearAll?: () => void;
  onSendReconnect?: (id: string) => void;
  onRespondReconnect?: (id: string, accept: boolean) => void;
}

function sessionGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${h}, 65%, 45%), hsl(${(h + 40) % 360}, 70%, 55%))`;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  return mins < 1 ? '<1 min' : `${mins} min`;
};

export const SavedMemories: React.FC<SavedMemoriesProps> = ({
  memories,
  onClearMemory,
  onClearAll,
  onSendReconnect,
  onRespondReconnect
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Stats
  const totalHours = Math.round(memories.reduce((sum, m) => sum + m.duration, 0) / 3600 * 10) / 10;
  const friendsMade = memories.filter(m => m.reconnectStatus === 'accepted').length;

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center" style={{ background: 'hsl(220, 60%, 8%)' }}>
        <span className="text-6xl mb-4">💜</span>
        <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          No memories yet
        </h3>
        <p className="text-sm text-[hsl(215,20%,65%)] max-w-xs mb-6">
          Start a Random Connect session to make your first memory
        </p>
        <button className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg, hsl(270,70%,50%), hsl(210,100%,55%))' }}
        >
          Start Connecting →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'hsl(220, 60%, 8%)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Memories
            </h2>
            <p className="text-sm text-[hsl(215,20%,65%)]">Your anonymous connections</p>
          </div>
          {onClearAll && memories.length > 0 && (
            <button onClick={onClearAll} className="p-2 rounded-full hover:bg-white/5">
              <Trash2 className="w-4 h-4 text-[hsl(215,20%,50%)]" />
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { emoji: '💜', label: 'Total', value: memories.length },
            { emoji: '⏱️', label: 'Hours', value: totalHours },
            { emoji: '🤝', label: 'Friends', value: friendsMade },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 20%)' }}
            >
              <span className="text-lg">{stat.emoji}</span>
              <p className="text-base font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-[hsl(220,15%,35%)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Memory cards */}
      <ScrollArea className="flex-1 mt-2">
        <div className="px-4 pb-6 space-y-3">
          {memories.map((memory, idx) => {
            const partnerShort = memory.partnerPseudoName.split('-').slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const isExpanded = expandedId === memory.id;

            return (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-[20px] overflow-hidden"
                style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 20%)' }}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : memory.id)}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: sessionGradient(memory.id) }}>
                        {partnerShort[0]}
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {partnerShort}
                        </p>
                        <p className="text-[12px] text-[hsl(220,15%,35%)]">
                          {format(memory.createdAt, 'MMM d')} • {formatDuration(memory.duration)}
                        </p>
                      </div>
                    </div>
                    {onClearMemory && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onClearMemory(memory.id); }}
                        className="p-1.5 rounded-full hover:bg-white/5"
                      >
                        <X className="w-3.5 h-3.5 text-[hsl(215,20%,50%)]" />
                      </button>
                    )}
                  </div>

                  {/* AI Summary placeholder */}
                  {memory.aiSummary && (
                    <p className="text-sm italic text-[hsl(260,80%,75%)] leading-relaxed mb-2">
                      ✨ {memory.aiSummary}
                    </p>
                  )}

                  {/* Bottom row */}
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-[hsl(220,15%,35%)]">
                      💜 {memory.messages?.length || 0} messages
                    </p>

                    {/* Reconnect status */}
                    {memory.reconnectStatus === 'received' && onRespondReconnect ? (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onRespondReconnect(memory.id, true); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium"
                          style={{ background: 'hsla(160, 84%, 39%, 0.1)', border: '1px solid hsla(160, 84%, 39%, 0.2)', color: 'hsl(160, 84%, 39%)' }}
                        >
                          <Check className="w-3 h-3" /> Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRespondReconnect(memory.id, false); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium"
                          style={{ background: 'hsla(0, 84%, 60%, 0.1)', border: '1px solid hsla(0, 84%, 60%, 0.2)', color: 'hsl(0, 84%, 60%)' }}
                        >
                          <X className="w-3 h-3" /> Decline
                        </button>
                      </div>
                    ) : memory.reconnectStatus === 'sent' ? (
                      <span className="text-[11px] text-[hsl(270,70%,50%)]">⏳ Waiting...</span>
                    ) : memory.reconnectStatus === 'accepted' ? (
                      <span className="text-[11px] text-[hsl(160,84%,39%)]">✅ Connected</span>
                    ) : memory.reconnectStatus === 'declined' ? (
                      <span className="text-[11px] text-[hsl(215,20%,50%)]">Declined</span>
                    ) : onSendReconnect ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onSendReconnect(memory.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium"
                        style={{ background: 'hsla(270, 70%, 50%, 0.1)', border: '1px solid hsla(270, 70%, 50%, 0.2)', color: 'hsl(260, 80%, 75%)' }}
                      >
                        🤝 Connect
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Expanded messages */}
                <AnimatePresence>
                  {isExpanded && memory.messages && memory.messages.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t"
                      style={{ borderColor: 'hsl(220, 30%, 20%)' }}
                    >
                      <div className="p-4 max-h-60 overflow-y-auto space-y-2">
                        {memory.messages.slice(-10).map((msg, i) => (
                          <div key={i} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${msg.isOwn ? 'rounded-br-md' : 'rounded-bl-md'}`}
                              style={{
                                background: msg.isOwn ? 'hsla(270, 70%, 50%, 0.2)' : 'hsl(220, 35%, 18%)',
                                color: 'hsl(220, 20%, 90%)',
                              }}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        <p className="text-[10px] text-[hsl(220,15%,35%)] text-center mt-2">Read-only • Cannot reply</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
