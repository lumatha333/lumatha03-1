import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SkipForward, Send, Shield, Check, CheckCheck, BookOpen, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { SecurityTips } from './SecurityTips';
import { useSignaling } from '@/hooks/useSignaling';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { TextMemory } from './TextMemory';
import { ReportDialog } from './ReportDialog';
import { toast } from 'sonner';

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
}

const MANDATORY_STAY_SECONDS = 20; // 20 seconds before skip is available

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
  partnerId
}) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [partnerPresence, setPartnerPresence] = useState<'online' | 'away'>('online');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Security detection
  useSecurityDetection({
    enabled: true,
    onScreenshotDetected: () => onViolation?.('screenshot'),
    onRecordingDetected: () => onViolation?.('recording')
  });

  // Signaling for typing indicators and read receipts - REAL TWO-WAY TEXT
  const { isConnected, sendTyping, sendRead, sendPresence } = useSignaling({
    sessionId,
    userId: user?.id || '',
    pseudoName: myPseudoName,
    onTyping: (data) => {
      if (data.fromPseudoName !== myPseudoName) {
        setIsPartnerTyping(data.isTyping);
        if (data.isTyping) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsPartnerTyping(false);
          }, 3000);
        }
      }
    },
    onRead: (data) => {
      setReadMessageIds(prev => {
        const newSet = new Set(prev);
        data.messageIds.forEach(id => newSet.add(id));
        return newSet;
      });
    },
    onPresence: (data) => {
      if (data.fromPseudoName !== myPseudoName) {
        setPartnerPresence(data.status as 'online' | 'away');
      }
    }
  });

  // Enable skip after mandatory stay (20 seconds)
  useEffect(() => {
    if (duration >= MANDATORY_STAY_SECONDS && !canSkip) {
      setCanSkip(true);
    }
  }, [duration, canSkip]);

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Send presence on mount
  useEffect(() => {
    if (isConnected) {
      sendPresence('online');
    }
    return () => {
      if (isConnected) {
        sendPresence('away');
      }
    };
  }, [isConnected, sendPresence]);

  // Mark messages as read
  useEffect(() => {
    const unreadMessages = messages
      .filter(m => m.sender_pseudo_name !== myPseudoName && !readMessageIds.has(m.id))
      .map(m => m.id);
    
    if (unreadMessages.length > 0 && isConnected) {
      sendRead(unreadMessages);
    }
  }, [messages, myPseudoName, isConnected, sendRead, readMessageIds]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    const now = Date.now();
    if (isConnected && e.target.value.length > 0 && now - lastTypingSentRef.current > 1000) {
      sendTyping(true);
      lastTypingSentRef.current = now;
    }
  }, [isConnected, sendTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    if (isConnected) {
      sendTyping(false);
    }
    
    // This sends the message to the database and partner sees it in real-time
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputBlur = useCallback(() => {
    if (isConnected && inputValue.length > 0) {
      sendTyping(false);
    }
  }, [isConnected, inputValue, sendTyping]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessageReadStatus = (message: Message) => {
    if (message.sender_pseudo_name !== myPseudoName) return null;
    return readMessageIds.has(message.id) ? 'read' : 'sent';
  };

  const handleReport = (reason: string) => {
    onReport?.(reason);
    setShowReportDialog(false);
    toast.success('Report submitted. Thank you for keeping the community safe.');
  };

  return (
    <div className="flex flex-col h-[85vh] random-connect-protected">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center">
              <span className="text-base">💙</span>
            </div>
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
              partnerPresence === 'online' ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{partnerPseudoName.split('-')[0]}</p>
            <div className="flex items-center gap-1.5">
              {isPartnerTyping ? (
                <p className="text-[10px] text-primary animate-pulse">typing...</p>
              ) : (
                <>
                  <div className={`w-1.5 h-1.5 rounded-full ${partnerPresence === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <p className="text-[10px] text-muted-foreground">
                    {partnerPresence === 'online' ? 'Online' : 'Away'} • {formatDuration(duration)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <BookOpen className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <TextMemory memory={textMemory} onClear={onClearMemory} />
            </SheetContent>
          </Sheet>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={() => setShowReportDialog(true)}
          >
            <Flag className="w-4 h-4 text-muted-foreground hover:text-red-500" />
          </Button>
          
          <SecurityTips compact />
          
          <Button 
            onClick={onSkip} 
            variant="ghost" 
            size="icon" 
            disabled={!canSkip}
            className="rounded-full h-8 w-8"
            title={canSkip ? 'Skip to next person' : `Skip in ${MANDATORY_STAY_SECONDS - duration}s`}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mandatory Stay Notice */}
      {!canSkip && (
        <div className="px-3 py-1.5 bg-muted/50 text-center">
          <p className="text-[10px] text-muted-foreground">
            ⏱️ Skip available in {Math.max(0, MANDATORY_STAY_SECONDS - duration)}s • Take your time to connect
          </p>
        </div>
      )}

      {/* Conversation Starter */}
      <div className="p-3 flex justify-center">
        <div className="glass-card px-4 py-2.5 rounded-xl text-center max-w-sm">
          <p className="text-[10px] text-muted-foreground mb-0.5">💬 Start with this:</p>
          <p className="text-xs text-foreground italic">"{conversationStarter}"</p>
        </div>
      </div>

      {/* Messages - REAL TWO-WAY TEXT EXCHANGE */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2.5">
        {messages.map((message) => {
          const isOwn = message.sender_pseudo_name === myPseudoName;
          const readStatus = getMessageReadStatus(message);
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                </div>
                {isOwn && (
                  <div className="flex justify-end mt-0.5 mr-1">
                    {readStatus === 'read' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-muted-foreground" />
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
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onBlur={handleInputBlur}
            placeholder="Share a thought..."
            className="flex-1 rounded-full bg-muted border-0 h-10 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-10 h-10 rounded-full btn-cosmic p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Shield className="w-3 h-3 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">
            {isConnected ? (
              <span className="text-green-500">● Connected</span>
            ) : (
              <span className="text-yellow-500">● Connecting...</span>
            )} • Messages saved to memory (last 10 sessions, 24h)
          </p>
        </div>
      </div>

      {/* Report Dialog */}
      <ReportDialog 
        open={showReportDialog} 
        onClose={() => setShowReportDialog(false)} 
        onReport={handleReport}
      />
    </div>
  );
};
