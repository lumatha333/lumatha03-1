import React from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectionMode } from '@/hooks/useRandomConnect';

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
  const modeLabels = {
    audio: 'voice chat',
    video: 'video chat',
    text: 'text chat'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-6">
      {/* Animated Searching Indicator */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 animate-ping" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-ping animation-delay-150" />
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Finding someone to connect...
        </h2>
        <p className="text-muted-foreground">
          Looking for a {modeLabels[mode]} partner
        </p>
      </div>

      {/* Your Pseudo Name */}
      <div className="glass-card px-6 py-4 rounded-2xl text-center">
        <p className="text-xs text-muted-foreground mb-1">Your name for this session</p>
        <p className="text-lg font-medium gradient-text">{myPseudoName}</p>
      </div>

      {/* Tips */}
      <div className="text-center text-sm text-muted-foreground max-w-xs space-y-2">
        <p>💡 Tip: Be yourself, there's no pressure here.</p>
        <p>This is a safe space for genuine conversation.</p>
      </div>

      {/* Cancel Button */}
      <Button
        onClick={onCancel}
        variant="outline"
        className="gap-2"
      >
        <X className="w-4 h-4" />
        Cancel Search
      </Button>
    </div>
  );
};
