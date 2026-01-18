import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SkipForward, PhoneOff, Eye, EyeOff, Camera, CameraOff, Mic, MicOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { toast } from 'sonner';

interface VideoConnectProps {
  myPseudoName: string;
  partnerPseudoName: string;
  conversationStarter: string;
  onSkip: () => void;
  onEnd: () => void;
  onViolation?: (type: 'screenshot' | 'recording') => void;
}

const MAX_VIDEO_DURATION = 15 * 60; // 15 minutes in seconds
const MANDATORY_STAY_SECONDS = 33;

export const VideoConnect: React.FC<VideoConnectProps> = ({
  myPseudoName,
  partnerPseudoName,
  conversationStarter,
  onSkip,
  onEnd,
  onViolation
}) => {
  const [blurEnabled, setBlurEnabled] = useState(true);
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [timeWarningShown, setTimeWarningShown] = useState(false);
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // Check for time limit
  useEffect(() => {
    if (duration >= MAX_VIDEO_DURATION - 60 && !timeWarningShown) {
      setTimeWarningShown(true);
      toast.warning('1 minute remaining in this video session');
    }
    
    if (duration >= MAX_VIDEO_DURATION) {
      toast.info('Video session limit reached (15 minutes)');
      onEnd();
    }
  }, [duration, timeWarningShown, onEnd]);

  // Initialize camera
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }, 
          audio: true 
        });
        streamRef.current = stream;
        
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.log('Camera access denied:', err);
        toast.error('Camera access is required for video chat');
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

  const getRemainingTime = () => {
    const remaining = MAX_VIDEO_DURATION - duration;
    if (remaining <= 0) return '0:00';
    return formatDuration(remaining);
  };

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-3 random-connect-protected">
      {/* Conversation Starter */}
      <div className="glass-card px-4 py-2 rounded-xl text-center max-w-sm mb-3 z-10">
        <p className="text-xs text-muted-foreground">💬 "{conversationStarter}"</p>
      </div>

      {/* Split Screen Video */}
      <div className="relative flex-1 w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-muted">
        {/* Partner Video (Top Half) */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-card to-muted flex items-center justify-center border-b border-border">
          <div 
            className={`w-full h-full flex flex-col items-center justify-center ${blurEnabled ? 'backdrop-blur-xl' : ''}`}
          >
            {/* Placeholder for partner video - in real app, this would be WebRTC stream */}
            <video
              ref={partnerVideoRef}
              autoPlay
              playsInline
              className={`absolute inset-0 w-full h-full object-cover ${blurEnabled ? 'blur-xl' : ''}`}
              style={{ display: 'none' }} // Hidden until we have actual partner stream
            />
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-xs font-medium text-secondary">{partnerPseudoName}</p>
            <p className="text-[10px] text-muted-foreground">Stranger</p>
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
          {!isCameraOn && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <CameraOff className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs font-medium text-primary bg-background/60 px-2 py-1 rounded-full">{myPseudoName}</p>
            <p className="text-[10px] text-muted-foreground">You</p>
          </div>
        </div>

        {/* Timer & Remaining Time */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <p className="text-xs font-medium text-foreground">{formatDuration(duration)}</p>
          </div>
          <div className="bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{getRemainingTime()}</p>
          </div>
        </div>

        {/* Control Buttons (Right Side) */}
        <div className="absolute top-3 right-2 flex flex-col gap-2">
          <button
            onClick={() => setBlurEnabled(!blurEnabled)}
            className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-background"
          >
            {blurEnabled ? (
              <EyeOff className="w-4 h-4 text-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-foreground" />
            )}
          </button>
          
          <button
            onClick={toggleCamera}
            className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
              isCameraOn ? 'bg-background/80 hover:bg-background' : 'bg-red-500/80 hover:bg-red-500'
            }`}
          >
            {isCameraOn ? (
              <Camera className="w-4 h-4 text-foreground" />
            ) : (
              <CameraOff className="w-4 h-4 text-white" />
            )}
          </button>
          
          <button
            onClick={toggleMic}
            className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
              isMicOn ? 'bg-background/80 hover:bg-background' : 'bg-red-500/80 hover:bg-red-500'
            }`}
          >
            {isMicOn ? (
              <Mic className="w-4 h-4 text-foreground" />
            ) : (
              <MicOff className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-2 w-full max-w-sm">
        {!canSkip && (
          <p className="text-center text-xs text-muted-foreground">
            Skip available in {MANDATORY_STAY_SECONDS - duration}s
          </p>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={onSkip}
            variant="outline"
            disabled={!canSkip}
            className="gap-2 px-5 py-5 rounded-xl flex-1"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
          
          <Button
            onClick={onEnd}
            variant="destructive"
            className="gap-2 px-5 py-5 rounded-xl flex-1"
          >
            <PhoneOff className="w-4 h-4" />
            End
          </Button>
        </div>
      </div>
    </div>
  );
};
