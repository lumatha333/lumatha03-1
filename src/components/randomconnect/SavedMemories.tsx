import React, { useState } from 'react';
import { Video, Mic, MessageCircle, Clock, UserPlus, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export interface Memory {
  id: string;
  type: 'video' | 'audio' | 'text';
  partnerPseudoName: string;
  duration: number;
  createdAt: Date;
  expiresAt: Date;
  messages?: { content: string; isOwn: boolean }[];
  reconnectStatus?: 'pending' | 'sent' | 'received' | 'accepted' | 'declined' | null;
}

interface SavedMemoriesProps {
  memories: Memory[];
  onClearMemory?: (id: string) => void;
  onClearAll?: () => void;
  onSendReconnect?: (id: string) => void;
  onRespondReconnect?: (id: string, accept: boolean) => void;
}

const getModeIcon = (type: Memory['type']) => {
  switch (type) {
    case 'video':
      return <Video className="w-4 h-4 text-purple-500" />;
    case 'audio':
      return <Mic className="w-4 h-4 text-blue-500" />;
    case 'text':
      return <MessageCircle className="w-4 h-4 text-green-500" />;
  }
};

const getModeColor = (type: Memory['type']) => {
  switch (type) {
    case 'video':
      return 'from-purple-500/20 to-purple-500/5';
    case 'audio':
      return 'from-blue-500/20 to-blue-500/5';
    case 'text':
      return 'from-green-500/20 to-green-500/5';
  }
};

export const SavedMemories: React.FC<SavedMemoriesProps> = ({
  memories,
  onClearMemory,
  onClearAll,
  onSendReconnect,
  onRespondReconnect
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Saved Memories</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your recent conversations will appear here for 24 hours. 
          They're read-only memories, not messages.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">Saved Memories</h3>
          <span className="text-xs text-muted-foreground">({memories.length})</span>
        </div>
        {onClearAll && memories.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="text-muted-foreground">
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Info Banner */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          📝 READ-ONLY memories • Auto-delete 24h • "Connect Again" needs mutual agreement
        </p>
      </div>

      {/* Memories List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className={`rounded-xl border border-border overflow-hidden transition-all ${
                expandedId === memory.id ? 'shadow-md' : 'hover:shadow-sm'
              }`}
            >
              {/* Memory Header */}
              <div 
                className={`p-4 bg-gradient-to-r ${getModeColor(memory.type)} cursor-pointer`}
                onClick={() => setExpandedId(expandedId === memory.id ? null : memory.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
                      {getModeIcon(memory.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{memory.partnerPseudoName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="capitalize">{memory.type}</span>
                        <span>•</span>
                        <span>{formatDuration(memory.duration)}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(memory.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {getTimeRemaining(memory.expiresAt)}
                    </span>
                    {onClearMemory && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearMemory(memory.id);
                        }}
                        className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Reconnect Request UI (PUBG-style) */}
                {memory.reconnectStatus === 'received' && onRespondReconnect && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-foreground mb-2">
                      🔁 {memory.partnerPseudoName} wants to connect again
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRespondReconnect(memory.id, true);
                        }}
                        className="flex-1 h-8 gap-1 bg-green-500 hover:bg-green-600"
                      >
                        <Check className="w-3 h-3" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRespondReconnect(memory.id, false);
                        }}
                        className="flex-1 h-8 gap-1"
                      >
                        <X className="w-3 h-3" /> Decline
                      </Button>
                    </div>
                  </div>
                )}

                {/* Send Reconnect Request */}
                {!memory.reconnectStatus && onSendReconnect && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendReconnect(memory.id);
                      }}
                      className="w-full h-8 gap-1.5 text-xs"
                    >
                      <UserPlus className="w-3 h-3" /> 
                      Connect Again?
                    </Button>
                    <p className="text-[9px] text-muted-foreground text-center mt-1.5">
                      Both must agree • Valid for 24h only
                    </p>
                  </div>
                )}

                {memory.reconnectStatus === 'sent' && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-center">
                    <p className="text-xs text-primary">
                      ⏳ Reconnect request sent. Waiting for response...
                    </p>
                  </div>
                )}

                {memory.reconnectStatus === 'declined' && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-center">
                    <p className="text-xs text-muted-foreground">
                      Reconnect request was declined
                    </p>
                  </div>
                )}

                {memory.reconnectStatus === 'accepted' && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-center">
                    <p className="text-xs text-green-500">
                      ✅ Reconnect accepted! New session starting...
                    </p>
                  </div>
                )}
              </div>

              {/* Expanded Text Messages (Read-Only) */}
              {expandedId === memory.id && memory.type === 'text' && memory.messages && (
                <div className="p-4 bg-background border-t border-border max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {memory.messages.slice(-10).map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                            msg.isOwn
                              ? 'bg-primary/20 text-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-3">
                    Read-only • Cannot reply
                  </p>
                </div>
              )}

              {/* Expanded Video/Audio Summary */}
              {expandedId === memory.id && memory.type !== 'text' && (
                <div className="p-4 bg-background border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">
                    {memory.type === 'video' ? '🎥' : '🎧'} {memory.type.charAt(0).toUpperCase() + memory.type.slice(1)} call with {memory.partnerPseudoName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration: {formatDuration(memory.duration)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    No recording saved • Just a memory
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          Last {memories.length} connection{memories.length > 1 ? 's' : ''} • Auto-deleted after 24 hours
        </p>
      </div>
    </div>
  );
};
