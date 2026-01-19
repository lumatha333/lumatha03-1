import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SkipForward, PhoneOff, Volume2, VolumeX, Mic, MicOff, Music, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAmbientSounds } from '@/hooks/useAmbientSounds';
import { AmbientSoundSelector } from './AmbientSoundSelector';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { toast } from 'sonner';

interface AudioConnectProps {
  myPseudoName: string;
  partnerPseudoName: string;
  conversationStarter: string;
  onSkip: () => void;
  onEnd: () => void;
  onViolation?: (type: 'screenshot' | 'recording') => void;
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
  onEnd,
  onViolation
}) => {
  const [myVoiceLevel, setMyVoiceLevel] = useState(0);
  const [partnerVoiceLevel, setPartnerVoiceLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
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

  // Initialize WebRTC audio call
  useEffect(() => {
    let mounted = true;

    const initializeAudioCall = async () => {
      try {
        // Request microphone with optimal audio settings
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
        
        // Set up audio analysis for voice level visualization
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

        // Add local audio track
        stream.getAudioTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Handle remote audio stream
        pc.ontrack = (event) => {
          if (!mounted) return;
          
          const [remoteStream] = event.streams;
          remoteStreamRef.current = remoteStream;

          // Create audio element for remote audio playback
          if (!remoteAudioRef.current) {
            const audioElement = document.createElement('audio');
            audioElement.autoplay = true;
            audioElement.setAttribute('playsinline', 'true');
            document.body.appendChild(audioElement);
            remoteAudioRef.current = audioElement;
          }
          remoteAudioRef.current.srcObject = remoteStream;
          
          // Analyze remote audio for voice level
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

        // Handle connection state
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

        // Simulate connection for demo (in production, handled by signaling server)
        setTimeout(() => {
          if (mounted) {
            setConnectionStatus('connected');
            setIsConnected(true);
            // Simulate partner voice levels
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

  return (
    <div className="flex flex-col items-center justify-between min-h-[80vh] p-4 random-connect-protected">
      {/* Header with Timer & Controls */}
      <div className="w-full flex items-center justify-between">
        <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
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

      {/* Car Interior UI - Voice Visualization */}
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
                  className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center transition-all duration-75"
                  style={{
                    boxShadow: isMicOn ? `0 0 ${myVoiceLevel / 2}px ${myVoiceLevel / 4}px hsl(var(--primary) / ${Math.min(0.5, myVoiceLevel / 100)})` : 'none',
                    transform: isMicOn ? `scale(${1 + myVoiceLevel / 400})` : 'scale(1)'
                  }}
                >
                  {myVoiceLevel > 15 && isMicOn && (
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping"
                      style={{ animationDuration: '0.8s' }}
                    />
                  )}
                  {isMicOn ? (
                    <Volume2 className="w-7 h-7 text-primary" />
                  ) : (
                    <VolumeX className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">You</p>
                  <p className="text-xs font-medium text-primary">{myPseudoName}</p>
                </div>
                {/* Voice level bar */}
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-75"
                    style={{ width: isMicOn ? `${myVoiceLevel}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Divider with connection indicator */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                <div className="w-px h-16 bg-border/50" />
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
              </div>

              {/* Right Seat - Partner */}
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="relative w-20 h-20 rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center transition-all duration-75"
                  style={{
                    boxShadow: isConnected && isSpeakerOn ? `0 0 ${partnerVoiceLevel / 2}px ${partnerVoiceLevel / 4}px hsl(var(--secondary) / ${Math.min(0.5, partnerVoiceLevel / 100)})` : 'none',
                    transform: isConnected && isSpeakerOn ? `scale(${1 + partnerVoiceLevel / 400})` : 'scale(1)'
                  }}
                >
                  {partnerVoiceLevel > 15 && isConnected && isSpeakerOn && (
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-secondary/40 animate-ping"
                      style={{ animationDuration: '0.8s' }}
                    />
                  )}
                  {isSpeakerOn ? (
                    <Volume2 className="w-7 h-7 text-secondary" />
                  ) : (
                    <VolumeX className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Stranger</p>
                  <p className="text-xs font-medium text-secondary">{partnerPseudoName}</p>
                </div>
                {/* Voice level bar */}
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all duration-75"
                    style={{ width: isConnected && isSpeakerOn ? `${partnerVoiceLevel}%` : '0%' }}
                  />
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

      {/* Quick Audio Controls */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
            isMicOn ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'
          }`}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        
        <button
          onClick={toggleSpeaker}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
            isSpeakerOn ? 'bg-secondary/20 text-secondary' : 'bg-red-500/20 text-red-500'
          }`}
        >
          {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-3 w-full max-w-sm">
        {!canSkip && (
          <p className="text-center text-xs text-muted-foreground">
            Skip available in {Math.max(0, MANDATORY_STAY_SECONDS - duration)}s
          </p>
        )}
        
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onSkip}
            variant="outline"
            disabled={!canSkip}
            className="gap-2 px-5 py-5 rounded-xl flex-1 max-w-32 transition-all hover:scale-[1.02]"
          >
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
          
          <Button
            onClick={onEnd}
            variant="destructive"
            className="gap-2 px-5 py-5 rounded-xl flex-1 max-w-32 transition-all hover:scale-[1.02]"
          >
            <PhoneOff className="w-4 h-4" />
            End
          </Button>
        </div>
      </div>
    </div>
  );
};
