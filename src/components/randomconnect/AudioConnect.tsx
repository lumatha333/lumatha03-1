import React, { useState, useEffect, useRef } from 'react';
import { SkipForward, PhoneOff, Volume2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAmbientSounds } from '@/hooks/useAmbientSounds';
import { AmbientSoundSelector } from './AmbientSoundSelector';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';

interface AudioConnectProps {
  myPseudoName: string;
  partnerPseudoName: string;
  conversationStarter: string;
  onSkip: () => void;
  onEnd: () => void;
  onViolation?: (type: 'screenshot' | 'recording') => void;
}

export const AudioConnect: React.FC<AudioConnectProps> = ({
  myPseudoName,
  partnerPseudoName,
  conversationStarter,
  onSkip,
  onEnd,
  onViolation
}) => {
  const [myVoiceLevel, setMyVoiceLevel] = useState(0);
  const [partnerVoiceLevel, setPartnerVoiceLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const MANDATORY_STAY_SECONDS = 33;
  
  const { 
    currentSound, 
    volume, 
    isPlaying, 
    playSound, 
    updateVolume 
  } = useAmbientSounds();

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

  // Voice level detection
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
    
    // Simulate partner speaking (in real app, this comes from WebRTC)
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
    <div className="flex flex-col items-center justify-between min-h-[80vh] p-4 random-connect-protected">
      {/* Header with Timer & Controls */}
      <div className="w-full flex items-center justify-between">
        <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <p className="text-sm font-medium text-foreground">{formatDuration(duration)}</p>
        </div>
        
        <AmbientSoundSelector
          currentSound={currentSound}
          volume={volume}
          isPlaying={isPlaying}
          onSelectSound={playSound}
          onVolumeChange={updateVolume}
          compact
        />
      </div>

      {/* Conversation Starter */}
      <div className="glass-card px-5 py-3 rounded-2xl text-center max-w-sm">
        <p className="text-xs text-muted-foreground mb-1">💬 Start with this:</p>
        <p className="text-sm text-foreground italic">"{conversationStarter}"</p>
      </div>

      {/* Car Interior UI */}
      <div className="relative w-full max-w-md aspect-[4/3]">
        {/* Car Dashboard Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background rounded-3xl overflow-hidden">
          {/* Road View (Top) */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-primary/10 to-transparent">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-muted-foreground/20 animate-pulse" />
            <div className="absolute bottom-4 left-1/3 w-0.5 h-4 bg-muted-foreground/10 animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute bottom-4 right-1/3 w-0.5 h-4 bg-muted-foreground/10 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
          
          {/* Dashboard */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-card to-card/80 rounded-t-3xl border-t border-border/30">
            {/* Two Seats */}
            <div className="flex justify-around items-center h-full px-4">
              {/* Left Seat - You */}
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center transition-all duration-100"
                  style={{
                    boxShadow: `0 0 ${myVoiceLevel / 3}px ${myVoiceLevel / 5}px hsl(var(--primary) / ${myVoiceLevel / 150})`
                  }}
                >
                  {myVoiceLevel > 10 && (
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping"
                      style={{ animationDuration: '1s' }}
                    />
                  )}
                  <Volume2 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">You</p>
                  <p className="text-xs font-medium text-primary">{myPseudoName}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-20 bg-border/50" />

              {/* Right Seat - Partner */}
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="relative w-16 h-16 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center transition-all duration-100"
                  style={{
                    boxShadow: `0 0 ${partnerVoiceLevel / 3}px ${partnerVoiceLevel / 5}px hsl(var(--secondary) / ${partnerVoiceLevel / 150})`
                  }}
                >
                  {partnerVoiceLevel > 10 && (
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-secondary/40 animate-ping"
                      style={{ animationDuration: '1s' }}
                    />
                  )}
                  <Volume2 className="w-6 h-6 text-secondary" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Stranger</p>
                  <p className="text-xs font-medium text-secondary">{partnerPseudoName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Sound Indicator */}
        {isPlaying && currentSound !== 'none' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-background/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <Music className="w-3 h-3 animate-pulse" />
              <span className="capitalize">{currentSound}</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3 w-full max-w-sm">
        {!canSkip && (
          <p className="text-center text-xs text-muted-foreground">
            Skip available in {MANDATORY_STAY_SECONDS - duration}s
          </p>
        )}
        
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onSkip}
            variant="outline"
            disabled={!canSkip}
            className="gap-2 px-5 py-5 rounded-xl flex-1 max-w-32"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
          
          <Button
            onClick={onEnd}
            variant="destructive"
            className="gap-2 px-5 py-5 rounded-xl flex-1 max-w-32"
          >
            <PhoneOff className="w-4 h-4" />
            End
          </Button>
        </div>
      </div>
    </div>
  );
};
