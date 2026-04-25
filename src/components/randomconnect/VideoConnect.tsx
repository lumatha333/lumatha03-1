import React, { useState, useEffect, useCallback } from 'react';
import { SkipForward, Eye, EyeOff, Camera, CameraOff, Mic, MicOff, Clock, Subtitles, Flag, Video, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { useDailyCall } from '@/hooks/useDailyCall';
import { toast } from 'sonner';
import { ReportDialog } from './ReportDialog';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';

interface VideoConnectProps {
  myPseudoName: string;
  partnerPseudoName: string;
  conversationStarter: string;
  onSkip: () => void;
  onViolation?: (type: 'screenshot' | 'recording') => void;
  onReport?: (reason: string) => void;
  sessionId?: string;
  partnerId?: string;
}

const MAX_VIDEO_DURATION = 15 * 60;
const MANDATORY_STAY_SECONDS = 20;

export const VideoConnect: React.FC<VideoConnectProps> = ({
  myPseudoName,
  partnerPseudoName,
  conversationStarter,
  onSkip,
  onViolation,
  onReport,
  sessionId,
  partnerId
}) => {
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [timeWarningShown, setTimeWarningShown] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Security detection
  useSecurityDetection({
    enabled: true,
    onScreenshotDetected: () => onViolation?.('screenshot'),
    onRecordingDetected: () => onViolation?.('recording')
  });

  // Daily.co call
  const {
    isConnected,
    isMicOn,
    isCameraOn,
    hasRemoteParticipant,
    localVideoRef,
    remoteVideoRef,
    callObjectRef,
    toggleMic,
    toggleCamera,
    leave,
  } = useDailyCall({
    sessionId,
    mode: 'video',
    myPseudoName,
    onPartnerJoined: () => {},
    onPartnerLeft: () => {
      toast.info('Partner left. Returning to lobby...');
      onSkip();
    },
    onError: (msg) => toast.error(msg),
  });

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Enable skip after mandatory stay
  useEffect(() => {
    if (duration >= MANDATORY_STAY_SECONDS && !canSkip) setCanSkip(true);
  }, [duration, canSkip]);

  // Time limit
  useEffect(() => {
    if (duration >= MAX_VIDEO_DURATION - 60 && !timeWarningShown) {
      setTimeWarningShown(true);
      toast.warning('1 minute remaining in this video session');
    }
    if (duration >= MAX_VIDEO_DURATION) {
      toast.info('Video session limit reached (15 minutes)');
      leave().then(() => onSkip());
    }
  }, [duration, timeWarningShown, onSkip, leave]);

  // Live captions
  useEffect(() => {
    if (!captionsEnabled) { setCurrentCaption(''); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Live captions not supported'); setCaptionsEnabled(false); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
      setCurrentCaption(t.slice(-100));
    };
    recognition.onerror = () => setCurrentCaption('');
    recognition.start();
    return () => recognition.stop();
  }, [captionsEnabled]);

  // Cleanup on skip
  const handleSkip = useCallback(() => {
    leave().then(() => onSkip());
  }, [leave, onSkip]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const getRemainingTime = () => formatDuration(Math.max(0, MAX_VIDEO_DURATION - duration));

  const handleReport = (reason: string) => {
    onReport?.(reason);
    setShowReportDialog(false);
    toast.success('Report submitted. Thank you for keeping the community safe.');
  };

  return (
    <div className="flex flex-col items-center min-h-[85vh] p-2 random-connect-protected">
      {/* Connection Status */}
      <div className="w-full max-w-lg flex items-center justify-center mb-2">
        {isConnected && hasRemoteParticipant ? (
          <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Face-to-face active • Both can see and hear each other
            </p>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Connecting...</p>
          </div>
        )}
      </div>

      {/* Main Split Screen Video */}
      <div className="relative flex-1 w-full max-w-lg rounded-2xl overflow-hidden bg-muted shadow-lg">
        {/* Partner Video - Top Half (55%) */}
        <div className="absolute top-0 left-0 right-0 h-[55%] bg-gradient-to-b from-card to-muted border-b-2 border-background">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${blurEnabled ? 'blur-xl' : ''}`}
          />

          {!hasRemoteParticipant && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary/20 to-secondary/5">
              <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                <Video className="w-8 h-8 text-secondary/60 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-secondary">{partnerPseudoName}</p>
              <p className="text-xs text-muted-foreground mt-1">Waiting for partner's video...</p>
            </div>
          )}

          {hasRemoteParticipant && (
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-green-500" />
              <p className="text-xs font-medium text-secondary">{partnerPseudoName}</p>
              <Volume2 className="w-3 h-3 text-green-500 ml-1" />
            </div>
          )}
        </div>

        {/* My Video - Bottom Half (45%) */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-card to-muted">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${blurEnabled ? 'blur-lg' : ''}`}
          />

          {!isCameraOn && (
            <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center">
              <CameraOff className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Camera Off</p>
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-xs font-medium text-primary">You • {myPseudoName.split('-')[0]}</p>
          </div>
        </div>

        {/* Timer */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <ConnectionQualityIndicator callObject={callObjectRef.current} isConnected={isConnected} />
            <p className="text-xs font-semibold text-foreground">{formatDuration(duration)}</p>
            <span className="text-muted-foreground">|</span>
            <Clock className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{getRemainingTime()}</p>
          </div>
        </div>

        {/* Controls - Right Side */}
        <div className="absolute top-16 right-2 flex flex-col gap-2 z-20">
          <button onClick={() => setBlurEnabled(!blurEnabled)}
            className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:scale-105 shadow-md">
            {blurEnabled ? <EyeOff className="w-4 h-4 text-foreground" /> : <Eye className="w-4 h-4 text-foreground" />}
          </button>

          <button onClick={toggleCamera}
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center hover:scale-105 shadow-md ${isCameraOn ? 'bg-background/90' : 'bg-red-500/90'}`}>
            {isCameraOn ? <Camera className="w-4 h-4 text-foreground" /> : <CameraOff className="w-4 h-4 text-white" />}
          </button>

          <button onClick={toggleMic}
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center hover:scale-105 shadow-md ${isMicOn ? 'bg-background/90' : 'bg-red-500/90'}`}>
            {isMicOn ? <Mic className="w-4 h-4 text-foreground" /> : <MicOff className="w-4 h-4 text-white" />}
          </button>

          <button onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center hover:scale-105 shadow-md ${captionsEnabled ? 'bg-primary/90' : 'bg-background/90'}`}>
            <Subtitles className={`w-4 h-4 ${captionsEnabled ? 'text-white' : 'text-foreground'}`} />
          </button>

          <button onClick={() => setShowReportDialog(true)}
            className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/20 hover:scale-105 shadow-md">
            <Flag className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Live Captions */}
        {captionsEnabled && currentCaption && (
          <div className="absolute bottom-[46%] left-2 right-2 z-20">
            <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg mx-auto max-w-xs">
              <p className="text-white text-sm text-center">{currentCaption}</p>
            </div>
          </div>
        )}
      </div>

      {/* Conversation Starter */}
      {isConnected && (
        <div className="glass-card px-4 py-2 rounded-xl text-center max-w-sm mt-3">
          <p className="text-xs text-muted-foreground">💬 "{conversationStarter}"</p>
        </div>
      )}

      {/* Skip Button */}
      <div className="mt-4 w-full max-w-sm">
        {!canSkip && (
          <p className="text-center text-xs text-muted-foreground mb-2">
            ⏱️ Skip available in {Math.max(0, MANDATORY_STAY_SECONDS - duration)}s
          </p>
        )}
        <Button onClick={handleSkip} variant="outline" disabled={!canSkip}
          className="w-full gap-2 py-6 rounded-xl transition-all hover:scale-[1.02]">
          <SkipForward className="w-5 h-5" />
          {canSkip ? 'Skip to Next Person' : `Wait ${Math.max(0, MANDATORY_STAY_SECONDS - duration)}s...`}
        </Button>
      </div>

      {/* Remote audio element */}
      <audio id="remote-audio" autoPlay style={{ display: 'none' }} />

      <ReportDialog open={showReportDialog} onClose={() => setShowReportDialog(false)} onReport={handleReport} />
    </div>
  );
};
