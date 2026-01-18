import React, { useState, useEffect, useRef } from 'react';
import { SkipForward, PhoneOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioConnectProps {
  myPseudoName: string;
  partnerPseudoName: string;
  conversationStarter: string;
  onSkip: () => void;
  onEnd: () => void;
}

export const AudioConnect: React.FC<AudioConnectProps> = ({
  myPseudoName,
  partnerPseudoName,
  conversationStarter,
  onSkip,
  onEnd
}) => {
  const [myVoiceLevel, setMyVoiceLevel] = useState(0);
  const [partnerVoiceLevel, setPartnerVoiceLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Simulate voice level detection (in real app, use WebRTC)
  useEffect(() => {
    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        analyserRef.current.fftSize = 256;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        const updateLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setMyVoiceLevel(Math.min(100, average * 1.5));
          }
          requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (err) {
        console.log('Microphone access denied');
      }
    };
    
    startAudio();
    
    // Simulate partner speaking
    const partnerInterval = setInterval(() => {
      setPartnerVoiceLevel(Math.random() * 60);
    }, 200);
    
    return () => {
      clearInterval(partnerInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
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
    <div className="flex flex-col items-center justify-between min-h-[80vh] p-4">
      {/* Conversation Starter */}
      <div className="glass-card px-6 py-4 rounded-2xl text-center max-w-sm">
        <p className="text-xs text-muted-foreground mb-2">💬 Start with this:</p>
        <p className="text-sm text-foreground italic">"{conversationStarter}"</p>
      </div>

      {/* Car Interior UI */}
      <div className="relative w-full max-w-md aspect-[4/3] my-8">
        {/* Car Dashboard Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background rounded-3xl overflow-hidden">
          {/* Road View (Top) */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-primary/20 to-transparent">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-muted-foreground/30 animate-pulse" />
          </div>
          
          {/* Dashboard */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-card to-card/80 rounded-t-3xl border-t border-border/50">
            {/* Two Seats */}
            <div className="flex justify-around items-center h-full px-6">
              {/* Left Seat - You */}
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center"
                  style={{
                    boxShadow: `0 0 ${myVoiceLevel / 2}px ${myVoiceLevel / 4}px hsl(var(--primary) / ${myVoiceLevel / 100})`
                  }}
                >
                  {/* Voice Wave Animation */}
                  {myVoiceLevel > 10 && (
                    <>
                      <div 
                        className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping"
                        style={{ animationDuration: '1s' }}
                      />
                    </>
                  )}
                  <Volume2 className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">You</p>
                  <p className="text-sm font-medium text-primary">{myPseudoName}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-24 bg-border" />

              {/* Right Seat - Partner */}
              <div className="flex flex-col items-center gap-3">
                <div 
                  className="relative w-20 h-20 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center"
                  style={{
                    boxShadow: `0 0 ${partnerVoiceLevel / 2}px ${partnerVoiceLevel / 4}px hsl(var(--secondary) / ${partnerVoiceLevel / 100})`
                  }}
                >
                  {partnerVoiceLevel > 10 && (
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-secondary/50 animate-ping"
                      style={{ animationDuration: '1s' }}
                    />
                  )}
                  <Volume2 className="w-8 h-8 text-secondary" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Stranger</p>
                  <p className="text-sm font-medium text-secondary">{partnerPseudoName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Road Sound Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-muted-foreground/50 rounded-full animate-pulse"
                  style={{ 
                    height: `${8 + Math.random() * 8}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <span>Road ambience</span>
          </div>
        </div>
      </div>

      {/* Duration */}
      <p className="text-muted-foreground text-sm mb-4">
        {formatDuration(duration)}
      </p>

      {/* Controls */}
      <div className="flex gap-4">
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
