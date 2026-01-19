import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SkipForward, PhoneOff, Eye, EyeOff, Camera, CameraOff, Mic, MicOff, Clock, Phone } from 'lucide-react';
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
  onEnd,
  onViolation
}) => {
  const [blurEnabled, setBlurEnabled] = useState(true);
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [timeWarningShown, setTimeWarningShown] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

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

  // Initialize WebRTC and camera
  useEffect(() => {
    let mounted = true;
    
    const initializeVideoCall = async () => {
      try {
        // Request camera and microphone with optimal settings for video calls
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
          myVideoRef.current.muted = true; // Mute local video to prevent echo
        }

        // Create RTCPeerConnection
        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        // Add local stream tracks to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          if (!mounted) return;
          
          const [remoteStream] = event.streams;
          remoteStreamRef.current = remoteStream;
          
          // Set remote video
          if (partnerVideoRef.current) {
            partnerVideoRef.current.srcObject = remoteStream;
          }

          // Create separate audio element for clear remote audio playback
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

        // Handle ICE connection state
        pc.oniceconnectionstatechange = () => {
          console.log('ICE Connection State:', pc.iceConnectionState);
        };

        // For demo purposes: simulate partner connection after a delay
        // In production, this would be handled by a signaling server
        setTimeout(() => {
          if (mounted) {
            setConnectionStatus('connected');
            setIsConnected(true);
            // Simulate partner video with a mirrored version of local stream
            // In production, this would be the actual remote stream
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
      
      // Cleanup local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Cleanup peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Cleanup remote audio element
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
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

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-3 random-connect-protected">
      {/* Connection Status */}
      {connectionStatus === 'connecting' && (
        <div className="glass-card px-4 py-2 rounded-xl text-center mb-3 z-10">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary animate-pulse" />
            <p className="text-xs text-muted-foreground">Connecting to {partnerPseudoName}...</p>
          </div>
        </div>
      )}

      {/* Conversation Starter - Only show when connected */}
      {connectionStatus === 'connected' && (
        <div className="glass-card px-4 py-2 rounded-xl text-center max-w-sm mb-3 z-10">
          <p className="text-xs text-muted-foreground">💬 "{conversationStarter}"</p>
        </div>
      )}

      {/* Split Screen Video - Messenger Style */}
      <div className="relative flex-1 w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-muted">
        {/* Partner Video (Top Half - Main Focus) */}
        <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-card to-muted border-b border-border">
          <video
            ref={partnerVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${blurEnabled ? 'blur-xl' : ''}`}
          />
          
          {/* Partner placeholder when no video */}
          {!isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
              <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-3 animate-pulse">
                <span className="text-3xl">👤</span>
              </div>
              <p className="text-sm font-medium text-secondary">{partnerPseudoName}</p>
              <p className="text-xs text-muted-foreground mt-1">Waiting for connection...</p>
            </div>
          )}
          
          {/* Partner name badge */}
          {isConnected && (
            <div className="absolute bottom-3 left-3 bg-background/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <p className="text-xs font-medium text-secondary">{partnerPseudoName}</p>
            </div>
          )}
        </div>

        {/* My Video (Bottom Right - Picture-in-Picture Style) */}
        <div className="absolute bottom-20 right-3 w-28 h-40 rounded-xl overflow-hidden border-2 border-background shadow-lg z-10">
          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${blurEnabled ? 'blur-lg' : ''}`}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <CameraOff className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <p className="text-[10px] font-medium text-primary bg-background/60 px-1.5 py-0.5 rounded-full">You</p>
          </div>
        </div>

        {/* Timer & Remaining Time */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          <div className="bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <p className="text-xs font-medium text-foreground">{formatDuration(duration)}</p>
          </div>
          <div className="bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{getRemainingTime()}</p>
          </div>
        </div>

        {/* Control Buttons (Right Side) */}
        <div className="absolute top-14 right-2 flex flex-col gap-2 z-20">
          <button
            onClick={() => setBlurEnabled(!blurEnabled)}
            className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-background hover:scale-105"
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
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 ${
              isCameraOn ? 'bg-background/80 hover:bg-background' : 'bg-red-500/90 hover:bg-red-500'
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
            className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 ${
              isMicOn ? 'bg-background/80 hover:bg-background' : 'bg-red-500/90 hover:bg-red-500'
            }`}
            title={isMicOn ? 'Mute' : 'Unmute'}
          >
            {isMicOn ? (
              <Mic className="w-4 h-4 text-foreground" />
            ) : (
              <MicOff className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* Audio indicator when partner is speaking */}
        {isConnected && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="w-0.5 bg-green-400 rounded-full animate-pulse"
                  style={{ 
                    height: `${8 + Math.random() * 8}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-2 w-full max-w-sm">
        {!canSkip && (
          <p className="text-center text-xs text-muted-foreground">
            Skip available in {Math.max(0, MANDATORY_STAY_SECONDS - duration)}s
          </p>
        )}
        
        <div className="flex gap-3">
          <Button
            onClick={onSkip}
            variant="outline"
            disabled={!canSkip}
            className="gap-2 px-5 py-5 rounded-xl flex-1 transition-all hover:scale-[1.02]"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
          
          <Button
            onClick={onEnd}
            variant="destructive"
            className="gap-2 px-5 py-5 rounded-xl flex-1 transition-all hover:scale-[1.02]"
          >
            <PhoneOff className="w-4 h-4" />
            End
          </Button>
        </div>
      </div>
    </div>
  );
};
