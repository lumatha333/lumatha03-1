import React from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EndedViewProps {
  onNewConnection: () => void;
}

export const EndedView: React.FC<EndedViewProps> = ({ onNewConnection }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-6">
      {/* Heart Animation */}
      <div className="relative">
        <div className="absolute inset-0 animate-ping opacity-30">
          <Heart className="w-24 h-24 text-primary fill-primary/20" />
        </div>
        <Heart className="w-24 h-24 text-primary fill-primary/30" />
      </div>

      {/* Message */}
      <div className="text-center space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Moment Shared 💙
        </h2>
        <p className="text-muted-foreground max-w-xs">
          Like sitting next to someone on a journey, then parting peacefully.
        </p>
      </div>

      {/* Quote */}
      <div className="glass-card px-6 py-4 rounded-2xl text-center max-w-sm">
        <p className="text-sm text-muted-foreground italic">
          "Connection is not about finding the perfect person, 
          but sharing a perfect moment."
        </p>
      </div>

      {/* Continue Button */}
      <Button
        onClick={onNewConnection}
        className="gap-2 btn-cosmic rounded-2xl px-8 py-6"
      >
        <ArrowRight className="w-5 h-5" />
        Connect Again
      </Button>
    </div>
  );
};
