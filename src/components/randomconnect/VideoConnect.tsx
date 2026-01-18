import React, { useState, useEffect, useRef } from 'react';
import { SkipForward, PhoneOff, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoConnectProps {
  myPseudoName: string;
  partnerPseudoName: string;
  conversationStarter: string;
  onSkip: () => void;
  onEnd: () => void;
}

export const VideoConnect: React.FC<VideoConnectProps> = ({
  myPseudoName,
  partnerPseudoName,
  conversationStarter,
  onSkip,
  onEnd
}) => {
  const [blurEnabled, setBlurEnabled] = useState(true);
  const [duration, setDuration] = useState(0);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        streamRef.current = stream;
        
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.log('Camera access denied');
      }
    };
    
    startVideo();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-4">
      {/* Conversation Starter */}
      <div className="glass-card px-4 py-3 rounded-xl text-center max-w-sm mb-4 z-10">
        <p className="text-xs text-muted-foreground">💬 "{conversationStarter}"</p>
      </div>

      {/* Split Screen Video */}
      <div className="relative flex-1 w-full max-w-lg aspect-[9/16] rounded-3xl overflow-hidden bg-muted">
        {/* Partner Video (Top Half) - Placeholder */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-card to-muted flex items-center justify-center border-b border-border">
          <div 
            className={`w-full h-full flex flex-col items-center justify-center ${blurEnabled ? 'backdrop-blur-xl' : ''}`}
          >
            <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
              <span className="text-3xl">👤</span>
            </div>
            <p className="text-sm font-medium text-secondary">{partnerPseudoName}</p>
            <p className="text-xs text-muted-foreground">Stranger</p>
          </div>
        </div>

        {/* My Video (Bottom Half) */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-muted overflow-hidden">
          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${blurEnabled ? 'blur-xl' : ''}`}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/20">
            <p className="text-sm font-medium text-primary">{myPseudoName}</p>
            <p className="text-xs text-muted-foreground">You</p>
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
          <p className="text-xs text-foreground">{formatDuration(duration)}</p>
        </div>

        {/* Blur Toggle */}
        <button
          onClick={() => setBlurEnabled(!blurEnabled)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          {blurEnabled ? (
            <EyeOff className="w-5 h-5 text-foreground" />
          ) : (
            <Eye className="w-5 h-5 text-foreground" />
          )}
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-6">
        <Button
          onClick={onSkip}
          variant="outline"
          className="gap-2 px-6 py-6 rounded-2xl"
        >
          <SkipForward className="w-5 h-5" />
          Skip
        </Button>
        
        <Button
          onClick={onEnd}
          variant="destructive"
          className="gap-2 px-6 py-6 rounded-2xl"
        >
          <PhoneOff className="w-5 h-5" />
          End
        </Button>
      </div>
    </div>
  );
};
