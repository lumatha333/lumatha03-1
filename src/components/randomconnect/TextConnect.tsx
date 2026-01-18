import React, { useState, useRef, useEffect } from 'react';
import { SkipForward, X, Send, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { SecurityTips } from './SecurityTips';

interface Message {
  id: string;
  sender_pseudo_name: string;
  content: string;
  created_at: string;
}

interface TextConnectProps {
  myPseudoName: string;
  partnerPseudoName: string;
  conversationStarter: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onSkip: () => void;
  onEnd: () => void;
  onViolation?: (type: 'screenshot' | 'recording') => void;
}

const MANDATORY_STAY_SECONDS = 33;

export const TextConnect: React.FC<TextConnectProps> = ({
  myPseudoName,
  partnerPseudoName,
  conversationStarter,
  messages,
  onSendMessage,
  onSkip,
  onEnd,
  onViolation
}) => {
  const [inputValue, setInputValue] = useState('');
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Security detection
  useSecurityDetection({
    enabled: true,
    onScreenshotDetected: () => onViolation?.('screenshot'),
    onRecordingDetected: () => onViolation?.('recording')
  });

  // Enable skip after mandatory stay
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[80vh] random-connect-protected">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center">
            <span className="text-base">💙</span>
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{partnerPseudoName}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="text-[10px] text-green-500">Online • {formatDuration(duration)}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <SecurityTips compact />
          
          <Button 
            onClick={onSkip} 
            variant="ghost" 
            size="icon" 
            disabled={!canSkip}
            className="rounded-full h-8 w-8"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          <Button 
            onClick={onEnd} 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8 text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mandatory Stay Notice */}
      {!canSkip && (
        <div className="px-3 py-1.5 bg-muted/50 text-center">
          <p className="text-[10px] text-muted-foreground">
            Skip available in {MANDATORY_STAY_SECONDS - duration}s • Take your time to connect
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2.5">
        {messages.map((message) => {
          const isOwn = message.sender_pseudo_name === myPseudoName;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
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
            No timestamps • No read receipts • Just thoughts
          </p>
        </div>
      </div>
    </div>
  );
};
