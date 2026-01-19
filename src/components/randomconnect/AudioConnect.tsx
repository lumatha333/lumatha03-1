import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SkipForward, Volume2, VolumeX, Mic, MicOff, Phone, Flag, Subtitles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAmbientSounds } from '@/hooks/useAmbientSounds';
import { AmbientSoundSelector } from './AmbientSoundSelector';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { ReportDialog } from './ReportDialog';
import { toast } from 'sonner';

interface AudioConnectProps {
  myPseudoName: string;
  partnerPseudoName: string;
  conversationStarter: string;
  onSkip: () => void;
  onViolation?: (type: 'screenshot' | 'recording') => void;
  onReport?: (reason: string) => void;
  sessionId?: string;
  partnerId?: string;
}

const MANDATORY_STAY_SECONDS = 33;

// STUN servers for WebRTC
const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const AudioConnect: React.FC<AudioConnectProps> = ({
  myPseudoName,
  partnerPseudoName,
  conversationStarter,
  onSkip,
  onViolation,
  onReport,
  sessionId,
  partnerId
}) => {
  const [myVoiceLevel, setMyVoiceLevel] = useState(0);
  const [partnerVoiceLevel, setPartnerVoiceLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [roadPosition, setRoadPosition] = useState(0);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  
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

  // Animate road movement (visual only, no sound)
  useEffect(() => {
    const roadInterval = setInterval(() => {
      setRoadPosition(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(roadInterval);
  }, []);

  // Enable skip after mandatory stay
  useEffect(() => {
    if (duration >= MANDATORY_STAY_SECONDS && !canSkip) {
      setCanSkip(true);
    }
  }, [duration, canSkip]);

  // Initialize Live Captions
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
      setCurrentCaption(transcript.slice(-100));
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

  // Initialize WebRTC audio call
  useEffect(() => {
    let mounted = true;

    const initializeAudioCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1
          }
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        localStreamRef.current = stream;
        
        // Set up audio analysis
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        analyserRef.current.fftSize = 256;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        const updateVoiceLevel = () => {
          if (!mounted) return;
          
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setMyVoiceLevel(Math.min(100, average * 1.5));
          }
          animationFrameRef.current = requestAnimationFrame(updateVoiceLevel);
        };
        updateVoiceLevel();

        // Create RTCPeerConnection
        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        stream.getAudioTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          if (!mounted) return;
          
          const [remoteStream] = event.streams;
          remoteStreamRef.current = remoteStream;

          if (!remoteAudioRef.current) {
            const audioElement = document.createElement('audio');
            audioElement.autoplay = true;
            audioElement.setAttribute('playsinline', 'true');
            document.body.appendChild(audioElement);
            remoteAudioRef.current = audioElement;
          }
          remoteAudioRef.current.srcObject = remoteStream;
          
          // Analyze remote audio
          if (audioContextRef.current) {
            const remoteAnalyser = audioContextRef.current.createAnalyser();
            const remoteSource = audioContextRef.current.createMediaStreamSource(remoteStream);
            remoteSource.connect(remoteAnalyser);
            remoteAnalyser.fftSize = 256;
            const remoteDataArray = new Uint8Array(remoteAnalyser.frequencyBinCount);
            
            const updateRemoteLevel = () => {
              if (!mounted) return;
              remoteAnalyser.getByteFrequencyData(remoteDataArray);
              const avg = remoteDataArray.reduce((a, b) => a + b) / remoteDataArray.length;
              setPartnerVoiceLevel(Math.min(100, avg * 1.5));
              requestAnimationFrame(updateRemoteLevel);
            };
            updateRemoteLevel();
          }
          
          setIsConnected(true);
          setConnectionStatus('connected');
        };

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

        // Simulate connection for demo
        setTimeout(() => {
          if (mounted) {
            setConnectionStatus('connected');
            setIsConnected(true);
            const simulatePartner = () => {
              if (!mounted) return;
              setPartnerVoiceLevel(Math.random() * 60 + (Math.random() > 0.7 ? 30 : 0));
              setTimeout(simulatePartner, 150 + Math.random() * 200);
            };
            simulatePartner();
          }
        }, 2000);
        
      } catch (err) {
        console.error('Failed to initialize audio call:', err);
        toast.error('Microphone access is required for audio chat');
      }
    };
    
    initializeAudioCall();
    
    return () => {
      mounted = false;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
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

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerOn(!remoteAudioRef.current.muted);
    }
  }, []);

  const handleReport = (reason: string) => {
    onReport?.(reason);
    setShowReportDialog(false);
    toast.success('Report submitted. Thank you for keeping the community safe.');
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[85vh] p-4 random-connect-protected">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
          <p className="text-sm font-medium text-foreground">{formatDuration(duration)}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 shadow-md ${
              captionsEnabled ? 'bg-primary/90' : 'bg-background/80'
            }`}
            title={captionsEnabled ? 'Disable captions' : 'Enable live captions'}
          >
            <Subtitles className={`w-4 h-4 ${captionsEnabled ? 'text-white' : 'text-foreground'}`} />
          </button>
          
          <AmbientSoundSelector
            currentSound={currentSound}
            volume={volume}
            isPlaying={isPlaying}
            onSelectSound={playSound}
            onVolumeChange={updateVolume}
            compact
          />
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus === 'connecting' && (
        <div className="glass-card px-4 py-3 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="w-5 h-5 text-primary animate-pulse" />
            <p className="text-sm text-foreground">Connecting...</p>
          </div>
          <p className="text-xs text-muted-foreground">Finding {partnerPseudoName}</p>
        </div>
      )}

      {/* Conversation Starter */}
      {connectionStatus === 'connected' && (
        <div className="glass-card px-5 py-3 rounded-2xl text-center max-w-sm">
          <p className="text-xs text-muted-foreground mb-1">💬 Start with this:</p>
          <p className="text-sm text-foreground italic">"{conversationStarter}"</p>
        </div>
      )}

      {/* Car Interior UI - Two People in a Car */}
      <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
        {/* Road View (Moving) - Visual only */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-card">
          {/* Sky */}
          <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-primary/10 to-transparent" />
          
          {/* Road markings (animated) */}
          <div 
            className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col gap-6 opacity-30"
            style={{ transform: `translateX(-50%) translateY(${roadPosition}px)` }}
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-1 h-8 bg-muted-foreground/50 rounded-full" />
            ))}
          </div>
          
          {/* Trees sliding (subtle) */}
          <div 
            className="absolute top-4 left-4 opacity-20"
            style={{ transform: `translateY(${roadPosition * 0.5}px)` }}
          >
            <span className="text-2xl">🌲</span>
          </div>
          <div 
            className="absolute top-8 right-4 opacity-20"
            style={{ transform: `translateY(${(roadPosition + 30) * 0.5}px)` }}
          >
            <span className="text-xl">🌳</span>
          </div>
        </div>

        {/* Dashboard / Car Interior */}
        <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-card via-card/95 to-transparent rounded-t-[2rem]">
          {/* Two Seats Layout */}
          <div className="flex justify-around items-center h-full px-6 pt-8">
            {/* Left Seat - You (Driver) */}
            <div className="flex flex-col items-center gap-3 relative">
              {/* Seat back */}
              <div className="absolute -top-2 w-24 h-28 bg-muted/30 rounded-t-full rounded-b-lg -z-10" />
              
              {/* Voice orb */}
              <div 
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center transition-all duration-75 border-2 border-primary/20"
                style={{
                  boxShadow: isMicOn ? `0 0 ${myVoiceLevel / 2}px ${myVoiceLevel / 3}px hsl(var(--primary) / ${Math.min(0.6, myVoiceLevel / 100)})` : 'none',
                  transform: isMicOn ? `scale(${1 + myVoiceLevel / 300})` : 'scale(1)'
                }}
              >
                {myVoiceLevel > 20 && isMicOn && (
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping"
                    style={{ animationDuration: '0.6s' }}
                  />
                )}
                {isMicOn ? (
                  <Mic className="w-8 h-8 text-primary" />
                ) : (
                  <MicOff className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              <div className="text-center">
                <p className="text-xs font-bold text-primary">{myPseudoName.split('-')[0]}</p>
                <p className="text-[10px] text-muted-foreground">You</p>
              </div>
              
              {/* Voice level bar */}
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-75"
                  style={{ width: isMicOn ? `${myVoiceLevel}%` : '0%' }}
                />
              </div>
            </div>

            {/* Center - Connection Line */}
            <div className="flex flex-col items-center gap-2 -mt-8">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse shadow-lg`} />
              <div className="w-px h-20 bg-gradient-to-b from-primary/30 via-muted to-secondary/30" />
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse shadow-lg`} />
            </div>

            {/* Right Seat - Partner (Passenger) */}
            <div className="flex flex-col items-center gap-3 relative">
              {/* Seat back */}
              <div className="absolute -top-2 w-24 h-28 bg-muted/30 rounded-t-full rounded-b-lg -z-10" />
              
              {/* Voice orb */}
              <div 
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-secondary/40 to-secondary/10 flex items-center justify-center transition-all duration-75 border-2 border-secondary/20"
                style={{
                  boxShadow: isConnected && isSpeakerOn ? `0 0 ${partnerVoiceLevel / 2}px ${partnerVoiceLevel / 3}px hsl(var(--secondary) / ${Math.min(0.6, partnerVoiceLevel / 100)})` : 'none',
                  transform: isConnected && isSpeakerOn ? `scale(${1 + partnerVoiceLevel / 300})` : 'scale(1)'
                }}
              >
                {partnerVoiceLevel > 20 && isConnected && isSpeakerOn && (
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-secondary/50 animate-ping"
                    style={{ animationDuration: '0.6s' }}
                  />
                )}
                {isSpeakerOn ? (
                  <Volume2 className="w-8 h-8 text-secondary" />
                ) : (
                  <VolumeX className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              <div className="text-center">
                <p className="text-xs font-bold text-secondary">{partnerPseudoName.split('-')[0]}</p>
                <p className="text-[10px] text-muted-foreground">Stranger</p>
              </div>
              
              {/* Voice level bar */}
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary rounded-full transition-all duration-75"
                  style={{ width: isConnected && isSpeakerOn ? `${partnerVoiceLevel}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Captions Overlay */}
        {captionsEnabled && currentCaption && (
          <div className="absolute bottom-28 left-4 right-4 z-20">
            <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-white text-sm text-center">{currentCaption}</p>
            </div>
          </div>
        )}

        {/* Report Button */}
        <button
          onClick={() => setShowReportDialog(true)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-red-500/20 hover:scale-105 shadow-md"
          title="Report user"
        >
          <Flag className="w-4 h-4 text-muted-foreground hover:text-red-500" />
        </button>
      </div>

      {/* Quick Audio Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg ${
            isMicOn ? 'bg-primary/20 text-primary border-2 border-primary/30' : 'bg-red-500/20 text-red-500 border-2 border-red-500/30'
          }`}
        >
          {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        <button
          onClick={toggleSpeaker}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg ${
            isSpeakerOn ? 'bg-secondary/20 text-secondary border-2 border-secondary/30' : 'bg-red-500/20 text-red-500 border-2 border-red-500/30'
          }`}
        >
          {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </div>

      {/* Skip Button Only */}
      <div className="w-full max-w-sm mt-4">
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
