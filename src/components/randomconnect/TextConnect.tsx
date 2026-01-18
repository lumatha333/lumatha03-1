import React, { useState, useRef, useEffect } from 'react';
import { SkipForward, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
}

export const TextConnect: React.FC<TextConnectProps> = ({
  myPseudoName,
  partnerPseudoName,
  conversationStarter,
  messages,
  onSendMessage,
  onSkip,
  onEnd
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center">
            <span className="text-lg">💙</span>
          </div>
          <div>
            <p className="font-medium text-foreground">{partnerPseudoName}</p>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSkip} variant="ghost" size="icon" className="rounded-full">
            <SkipForward className="w-5 h-5" />
          </Button>
          <Button onClick={onEnd} variant="ghost" size="icon" className="rounded-full text-destructive">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Conversation Starter */}
      <div className="p-4 flex justify-center">
        <div className="glass-card px-4 py-3 rounded-xl text-center max-w-sm">
          <p className="text-xs text-muted-foreground mb-1">💬 Start with this:</p>
          <p className="text-sm text-foreground italic">"{conversationStarter}"</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {messages.map((message) => {
          const isOwn = message.sender_pseudo_name === myPseudoName;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share a thought..."
            className="flex-1 rounded-full bg-muted border-0"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-12 h-12 rounded-full btn-cosmic"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          No timestamps • No read receipts • Just thoughts
        </p>
      </div>
    </div>
  );
};
