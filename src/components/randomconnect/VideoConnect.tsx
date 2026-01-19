import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SkipForward, Eye, EyeOff, Camera, CameraOff, Mic, MicOff, Clock, Phone, Subtitles, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { toast } from 'sonner';
import { ReportDialog } from './ReportDialog';

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

const MAX_VIDEO_DURATION = 15 * 60; // 15 minutes in seconds
const MANDATORY_STAY_SECONDS = 33;

// STUN/TURN servers for WebRTC
const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

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
  const [blurEnabled, setBlurEnabled] = useState(true);
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [timeWarningShown, setTimeWarningShown] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

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

  // Check for time limit - auto end at 15 mins
  useEffect(() => {
    if (duration >= MAX_VIDEO_DURATION - 60 && !timeWarningShown) {
      setTimeWarningShown(true);
      toast.warning('1 minute remaining in this video session');
    }
    
    if (duration >= MAX_VIDEO_DURATION) {
      toast.info('Video session limit reached (15 minutes)');
      onSkip(); // Use skip to go to next person
    }
  }, [duration, timeWarningShown, onSkip]);

  // Initialize Live Captions (Speech Recognition)
  useEffect(() => {
    if (!captionsEnabled) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setCurrentCaption('');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Live captions not supported in this browser');
      setCaptionsEnabled(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ');
      setCurrentCaption(transcript.slice(-100)); // Last 100 chars
    };

    recognition.onerror = () => {
      setCurrentCaption('');
    };

    recognition.start();
    speechRecognitionRef.current = recognition;

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [captionsEnabled]);

  // Initialize WebRTC and camera
  useEffect(() => {
    let mounted = true;
    
    const initializeVideoCall = async () => {
      try {
        // Request camera and microphone with optimal settings
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30 }
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          }
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        localStreamRef.current = stream;
        
        // Set local video
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
          myVideoRef.current.muted = true;
        }

        // Create RTCPeerConnection
        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        // Add local stream tracks
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          if (!mounted) return;
          
          const [remoteStream] = event.streams;
          remoteStreamRef.current = remoteStream;
          
          if (partnerVideoRef.current) {
            partnerVideoRef.current.srcObject = remoteStream;
          }

          // Create separate audio element for clear playback
          if (!remoteAudioRef.current) {
            const audioElement = document.createElement('audio');
            audioElement.autoplay = true;
            audioElement.setAttribute('playsinline', 'true');
            document.body.appendChild(audioElement);
            remoteAudioRef.current = audioElement;
          }
          remoteAudioRef.current.srcObject = remoteStream;
          
          setIsConnected(true);
          setConnectionStatus('connected');
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          if (!mounted) return;
          
          switch (pc.connectionState) {
            case 'connected':
              setConnectionStatus('connected');
              setIsConnected(true);
              break;
            case 'disconnected':
            case 'failed':
            case 'closed':
              setConnectionStatus('disconnected');
              setIsConnected(false);
              break;
            default:
              setConnectionStatus('connecting');
          }
        };

        // Simulate partner connection for demo
        setTimeout(() => {
          if (mounted) {
            setConnectionStatus('connected');
            setIsConnected(true);
            if (partnerVideoRef.current && localStreamRef.current) {
              partnerVideoRef.current.srcObject = localStreamRef.current;
            }
          }
        }, 2000);
        
      } catch (err) {
        console.error('Failed to initialize video call:', err);
        toast.error('Camera and microphone access is required for video chat');
      }
    };
    
    initializeVideoCall();
    
    return () => {
      mounted = false;
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }

      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
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
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, []);

  const handleReport = (reason: string) => {
    onReport?.(reason);
    setShowReportDialog(false);
    toast.success('Report submitted. Thank you for keeping the community safe.');
  };

  return (
    <div className="flex flex-col items-center min-h-[85vh] p-2 random-connect-protected">
      {/* Connection Status */}
      {connectionStatus === 'connecting' && (
        <div className="glass-card px-4 py-2 rounded-xl text-center mb-2 z-10">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary animate-pulse" />
            <p className="text-xs text-muted-foreground">Connecting to {partnerPseudoName}...</p>
          </div>
        </div>
      )}

      {/* Main Split Screen Video Container */}
      <div className="relative flex-1 w-full max-w-lg rounded-2xl overflow-hidden bg-muted shadow-lg">
        {/* Partner Video - Top Half (60%) */}
        <div className="absolute top-0 left-0 right-0 h-[55%] bg-gradient-to-b from-card to-muted border-b-2 border-background">
          <video
            ref={partnerVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${blurEnabled ? 'blur-xl' : ''}`}
          />
          
          {/* Partner placeholder when no video */}
          {!isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary/20 to-secondary/5">
              <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-3 animate-pulse">
                <span className="text-3xl">👤</span>
              </div>
              <p className="text-sm font-medium text-secondary">{partnerPseudoName}</p>
              <p className="text-xs text-muted-foreground mt-1">Waiting for connection...</p>
            </div>
          )}
          
          {/* Partner name badge */}
          {isConnected && (
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs font-medium text-secondary">{partnerPseudoName}</p>
            </div>
          )}

          {/* Audio indicator when partner is speaking */}
          {isConnected && (
            <div className="absolute bottom-3 right-3 flex items-center gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-green-400 rounded-full animate-pulse"
                  style={{ 
                    height: `${6 + Math.random() * 12}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* My Video - Bottom Half (45%) */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-card to-muted">
          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${blurEnabled ? 'blur-lg' : ''}`}
          />
          
          {/* Camera off state */}
          {!isCameraOn && (
            <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center">
              <CameraOff className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Camera Off</p>
            </div>
          )}
          
          {/* My name badge */}
          <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-xs font-medium text-primary">You • {myPseudoName.split('-')[0]}</p>
          </div>

          {/* My audio indicator */}
          {isMicOn && (
            <div className="absolute bottom-3 right-3 flex items-center gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{ 
                    height: `${5 + Math.random() * 10}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Timer & Remaining Time - Top Center */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <p className="text-xs font-semibold text-foreground">{formatDuration(duration)}</p>
            <span className="text-muted-foreground">|</span>
            <Clock className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{getRemainingTime()}</p>
          </div>
        </div>

        {/* Control Buttons - Right Side */}
        <div className="absolute top-16 right-2 flex flex-col gap-2 z-20">
          <button
            onClick={() => setBlurEnabled(!blurEnabled)}
            className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-background hover:scale-105 shadow-md"
            title={blurEnabled ? 'Remove blur' : 'Add blur'}
          >
            {blurEnabled ? (
              <EyeOff className="w-4 h-4 text-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-foreground" />
            )}
          </button>
          
          <button
            onClick={toggleCamera}
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 shadow-md ${
              isCameraOn ? 'bg-background/90 hover:bg-background' : 'bg-red-500/90 hover:bg-red-500'
            }`}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraOn ? (
              <Camera className="w-4 h-4 text-foreground" />
            ) : (
              <CameraOff className="w-4 h-4 text-white" />
            )}
          </button>
          
          <button
            onClick={toggleMic}
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 shadow-md ${
              isMicOn ? 'bg-background/90 hover:bg-background' : 'bg-red-500/90 hover:bg-red-500'
            }`}
            title={isMicOn ? 'Mute' : 'Unmute'}
          >
            {isMicOn ? (
              <Mic className="w-4 h-4 text-foreground" />
            ) : (
              <MicOff className="w-4 h-4 text-white" />
            )}
          </button>

          <button
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 shadow-md ${
              captionsEnabled ? 'bg-primary/90 hover:bg-primary' : 'bg-background/90 hover:bg-background'
            }`}
            title={captionsEnabled ? 'Disable captions' : 'Enable live captions'}
          >
            <Subtitles className={`w-4 h-4 ${captionsEnabled ? 'text-white' : 'text-foreground'}`} />
          </button>

          <button
            onClick={() => setShowReportDialog(true)}
            className="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-red-500/20 hover:scale-105 shadow-md"
            title="Report user"
          >
            <Flag className="w-4 h-4 text-muted-foreground hover:text-red-500" />
          </button>
        </div>

        {/* Live Captions Overlay */}
        {captionsEnabled && currentCaption && (
          <div className="absolute bottom-[46%] left-2 right-2 z-20">
            <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg mx-auto max-w-xs">
              <p className="text-white text-sm text-center leading-relaxed">{currentCaption}</p>
            </div>
          </div>
        )}
      </div>

      {/* Conversation Starter - Below video */}
      {connectionStatus === 'connected' && (
        <div className="glass-card px-4 py-2 rounded-xl text-center max-w-sm mt-3">
          <p className="text-xs text-muted-foreground">💬 "{conversationStarter}"</p>
        </div>
      )}

      {/* Skip Button Only */}
      <div className="mt-4 w-full max-w-sm">
        {!canSkip && (
          <p className="text-center text-xs text-muted-foreground mb-2">
            ⏱️ Skip available in {Math.max(0, MANDATORY_STAY_SECONDS - duration)}s
          </p>
        )}
        
        <Button
          onClick={onSkip}
          variant="outline"
          disabled={!canSkip}
          className="w-full gap-2 py-6 rounded-xl transition-all hover:scale-[1.02]"
        >
          <SkipForward className="w-5 h-5" />
          {canSkip ? 'Skip to Next Person' : `Wait ${Math.max(0, MANDATORY_STAY_SECONDS - duration)}s...`}
        </Button>
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
