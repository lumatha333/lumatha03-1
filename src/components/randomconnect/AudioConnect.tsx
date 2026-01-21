import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SkipForward, Volume2, VolumeX, Mic, MicOff, Phone, Flag, Subtitles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAmbientSounds } from '@/hooks/useAmbientSounds';
import { AmbientSoundSelector } from './AmbientSoundSelector';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { useSignaling } from '@/hooks/useSignaling';
import { useAuth } from '@/contexts/AuthContext';
import { ReportDialog } from './ReportDialog';
import { toast } from 'sonner';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { TwoWayConnectionStatus } from './TwoWayConnectionStatus';
import { WebRTCDebugPanel } from './WebRTCDebugPanel';
import { getIceServers } from '@/lib/turnServers';

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

const MANDATORY_STAY_SECONDS = 20; // 20 seconds before skip is available

// Use centralized TURN server configuration with fallback support
const iceServers = getIceServers();

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
  const { user } = useAuth();
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
  const [hasRemoteAudio, setHasRemoteAudio] = useState(false);
  const [offerSent, setOfferSent] = useState(false);
  const [answerReceived, setAnswerReceived] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const hasCreatedOfferRef = useRef<boolean>(false);
  const peerPresentRef = useRef<boolean>(false);
  const localStreamReadyRef = useRef<boolean>(false);
  const iceReconnectAttemptedRef = useRef<boolean>(false);
  const iceFailedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Avoid TS2448 by using stable refs for signaling senders (they are returned later by useSignaling)
  const sendOfferRef = useRef<((sdp: RTCSessionDescriptionInit) => void) | null>(null);
  const sendAnswerRef = useRef<((sdp: RTCSessionDescriptionInit) => void) | null>(null);
  const sendIceCandidateRef = useRef<((candidate: RTCIceCandidateInit) => void) | null>(null);

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

  // Determine if this user should create the offer (based on ID comparison)
  const shouldBeInitiator = useCallback(() => {
    if (!user?.id || !partnerId) return false;
    return user.id < partnerId;
  }, [user?.id, partnerId]);

  // Try to create offer when conditions are met
  const tryCreateOffer = useCallback(async () => {
    const pc = peerConnectionRef.current;

    // Do not create an offer until we KNOW the other peer is present.
    // Otherwise the offer can be "lost" (broadcast to nobody) and both users will be stuck.
    if (!peerPresentRef.current) {
      console.log('Peer not present yet — waiting before creating offer');
      return;
    }

    if (!pc || !localStreamReadyRef.current || hasCreatedOfferRef.current) {
      console.log('Cannot create offer yet:', {
        hasPc: !!pc,
        localReady: localStreamReadyRef.current,
        alreadyCreated: hasCreatedOfferRef.current
      });
      return;
    }

    if (!shouldBeInitiator()) {
      console.log('Not initiator, waiting for offer from partner');
      return;
    }

    hasCreatedOfferRef.current = true;

    try {
      console.log('Creating WebRTC offer as initiator...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);
      console.log('Sending offer to partner');
      sendOfferRef.current?.(offer);
      setOfferSent(true);
    } catch (error) {
      console.error('Error creating offer:', error);
      hasCreatedOfferRef.current = false;
    }
  }, [shouldBeInitiator]);

  // ICE restart function for reconnection
  const attemptIceRestart = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || iceReconnectAttemptedRef.current) return;

    iceReconnectAttemptedRef.current = true;
    console.log('Attempting ICE restart...');
    toast.info('Reconnecting...');

    try {
      // Create new offer with iceRestart flag
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      sendOfferRef.current?.(offer);
      setOfferSent(true);
      console.log('ICE restart offer sent');
    } catch (error) {
      console.error('ICE restart failed:', error);
      toast.error('Reconnection failed. Returning to lobby...');
      onSkip();
    }
  }, [onSkip]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    console.log('Creating new RTCPeerConnection for audio...');
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10
    });
    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Generated ICE candidate, sending to partner');
        sendIceCandidateRef.current?.(event.candidate.toJSON());
      }
    };

    // Handle remote stream - THIS IS WHERE WE HEAR THE OTHER PERSON
    pc.ontrack = (event) => {
      console.log('Received remote audio track:', event.track.kind, event.track.readyState);

      const [remoteStream] = event.streams;
      if (!remoteStream) {
        console.log('No remote stream in track event');
        return;
      }

      remoteStreamRef.current = remoteStream;
      setHasRemoteAudio(true);

      // Create audio element for playback - REAL VOICE EXCHANGE
      if (!remoteAudioRef.current) {
        console.log('Creating audio element for remote audio playback');
        const audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        audioElement.setAttribute('playsinline', 'true');
        audioElement.volume = 1.0;
        document.body.appendChild(audioElement);
        remoteAudioRef.current = audioElement;
      }
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(e => console.log('Remote audio play error:', e));

      // Analyze remote audio for voice level visualization
      if (audioContextRef.current) {
        try {
          const remoteAnalyser = audioContextRef.current.createAnalyser();
          const remoteSource = audioContextRef.current.createMediaStreamSource(remoteStream);
          remoteSource.connect(remoteAnalyser);
          remoteAnalyser.fftSize = 256;
          remoteAnalyserRef.current = remoteAnalyser;
        } catch (e) {
          console.log('Error setting up remote audio analyser:', e);
        }
      }

      setIsConnected(true);
      setConnectionStatus('connected');
      toast.success('Connected! You can now hear each other.');
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      switch (pc.connectionState) {
        case 'connected':
          setConnectionStatus('connected');
          setIsConnected(true);
          break;
        case 'disconnected':
          setConnectionStatus('disconnected');
          setIsConnected(false);
          toast.info('Connection interrupted. Trying to reconnect...');
          break;
        case 'failed':
          setConnectionStatus('disconnected');
          setIsConnected(false);
          toast.error('Connection failed. Please try again.');
          break;
        case 'closed':
          setConnectionStatus('disconnected');
          setIsConnected(false);
          break;
        default:
          setConnectionStatus('connecting');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);

      // Clear any pending reconnect timer
      if (iceFailedTimerRef.current) {
        clearTimeout(iceFailedTimerRef.current);
        iceFailedTimerRef.current = null;
      }

      // Handle ICE failures with automatic reconnect after 5 seconds
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.log('ICE state is', pc.iceConnectionState, '- starting 5s reconnect timer');
        iceFailedTimerRef.current = setTimeout(() => {
          if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
            attemptIceRestart();
          }
        }, 5000);
      }

      // Reset reconnect flag when connection is restored
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        iceReconnectAttemptedRef.current = false;
      }
    };

    return pc;
  }, [attemptIceRestart]);

  // Signaling handlers
  const handlePeerJoined = useCallback(async (data: { userId: string; pseudoName: string }) => {
    console.log('Peer joined audio call:', data.pseudoName);
    peerPresentRef.current = true;

    const pc = peerConnectionRef.current;
    // If we already created an offer earlier, re-send it now that the peer is definitely present.
    if (pc?.localDescription?.type === 'offer' && !answerReceived) {
      console.log('Re-sending existing offer to newly joined peer');
      sendOfferRef.current?.(pc.localDescription);
      setOfferSent(true);
      return;
    }

    // Short delay to ensure both sides are ready
    setTimeout(() => {
      tryCreateOffer();
    }, 500);
  }, [tryCreateOffer, answerReceived]);

  const handleOffer = useCallback(async (data: { sdp: RTCSessionDescriptionInit; fromUserId: string; fromPseudoName: string }) => {
    console.log('Received offer from:', data.fromPseudoName);
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('No peer connection when receiving offer');
      return;
    }

    try {
      console.log('Setting remote description from offer...');
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      // Process queued ICE candidates
      console.log('Processing', iceCandidatesQueue.current.length, 'queued ICE candidates');
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      console.log('Creating answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('Sending answer to partner');
      sendAnswerRef.current?.(answer);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, []);

  const handleAnswer = useCallback(async (data: { sdp: RTCSessionDescriptionInit; fromUserId: string }) => {
    console.log('Received answer from partner');
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.error('No peer connection when receiving answer');
      return;
    }
    
    try {
      console.log('Setting remote description from answer...');
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      setAnswerReceived(true);
      
      // Process queued ICE candidates
      console.log('Processing', iceCandidatesQueue.current.length, 'queued ICE candidates');
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (data: { candidate: RTCIceCandidateInit; fromUserId: string }) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      console.log('Queuing ICE candidate - no peer connection yet');
      iceCandidatesQueue.current.push(data.candidate);
      return;
    }
    
    try {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        console.log('Adding ICE candidate');
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else {
        console.log('Queuing ICE candidate - no remote description yet');
        iceCandidatesQueue.current.push(data.candidate);
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, []);

  const handlePeerLeft = useCallback(() => {
    console.log('Peer left audio call - returning to lobby');
    setConnectionStatus('disconnected');
    setIsConnected(false);
    setHasRemoteAudio(false);
    toast.info('Partner left. Returning to lobby...');
    // Partner skipped - automatically skip as well (both return to lobby)
    onSkip();
  }, [onSkip]);

  const handleSignalingConnected = useCallback(() => {
    console.log('Signaling connected for audio call');
    
    // Partner might already be in session, try to create offer after a short delay
    setTimeout(() => {
      if (localStreamReadyRef.current && !hasCreatedOfferRef.current) {
        tryCreateOffer();
      }
    }, 1000);
  }, [tryCreateOffer]);

  // Signaling for WebRTC connection
  const { 
    isConnected: signalingConnected, 
    participantCount,
    sendOffer, 
    sendAnswer, 
    sendIceCandidate 
  } = useSignaling({
    sessionId: sessionId || null,
    userId: user?.id || '',
    pseudoName: myPseudoName,
    onPeerJoined: handlePeerJoined,
    onOffer: handleOffer,
    onAnswer: handleAnswer,
    onIceCandidate: handleIceCandidate,
    onPeerLeft: handlePeerLeft
  });

  // Keep signaling sender refs in sync
  useEffect(() => {
    sendOfferRef.current = sendOffer;
    sendAnswerRef.current = sendAnswer;
    sendIceCandidateRef.current = sendIceCandidate;
  }, [sendOffer, sendAnswer, sendIceCandidate]);

  // When signaling connects and participantCount > 1, partner is already there
  useEffect(() => {
    if (signalingConnected && participantCount > 1) {
      console.log('Partner already in session, participant count:', participantCount);
      peerPresentRef.current = true;
      handleSignalingConnected();
    }
  }, [signalingConnected, participantCount, handleSignalingConnected]);

  // Animate road movement (visual only, no sound)
  useEffect(() => {
    const roadInterval = setInterval(() => {
      setRoadPosition(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(roadInterval);
  }, []);

  // Enable skip after mandatory stay (20 seconds)
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

  // Voice level visualization loop
  useEffect(() => {
    const updateVoiceLevels = () => {
      // Local voice level
      if (localAnalyserRef.current && isMicOn) {
        const dataArray = new Uint8Array(localAnalyserRef.current.frequencyBinCount);
        localAnalyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMyVoiceLevel(Math.min(100, average * 1.5));
      } else {
        setMyVoiceLevel(0);
      }
      
      // Remote voice level
      if (remoteAnalyserRef.current && hasRemoteAudio) {
        const dataArray = new Uint8Array(remoteAnalyserRef.current.frequencyBinCount);
        remoteAnalyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setPartnerVoiceLevel(Math.min(100, average * 1.5));
      } else {
        setPartnerVoiceLevel(0);
      }
      
      animationFrameRef.current = requestAnimationFrame(updateVoiceLevels);
    };
    
    updateVoiceLevels();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMicOn, hasRemoteAudio]);

  // Initialize WebRTC audio call
  useEffect(() => {
    let mounted = true;
    hasCreatedOfferRef.current = false;
    iceCandidatesQueue.current = [];
    localStreamReadyRef.current = false;
    peerPresentRef.current = false;

    const initializeAudioCall = async () => {
      try {
        console.log('Requesting microphone access...');
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
        console.log('Got local audio stream:', stream.getAudioTracks().map(t => `${t.kind}:${t.readyState}`).join(', '));
        
        // Set up audio analysis for voice level visualization
        audioContextRef.current = new AudioContext();
        localAnalyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(localAnalyserRef.current);
        localAnalyserRef.current.fftSize = 256;

        // Create RTCPeerConnection
        const pc = createPeerConnection();

        // Add audio track to peer connection - CRITICAL FOR TWO-WAY AUDIO
        stream.getAudioTracks().forEach(track => {
          console.log('Adding audio track to peer connection:', track.kind, track.readyState);
          pc.addTrack(track, stream);
        });
        
        localStreamReadyRef.current = true;
        console.log('Local audio stream ready, checking if should create offer...');
        
        // If signaling is already connected and partner is present, try to create offer
        if (signalingConnected && peerPresentRef.current) {
          setTimeout(() => {
            tryCreateOffer();
          }, 500);
        }

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
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped audio track:', track.kind);
        });
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
  }, [createPeerConnection, signalingConnected, tryCreateOffer]);

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
      {/* Header with Two-Way Status and Quality Indicator */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <p className="text-sm font-medium text-foreground">{formatDuration(duration)}</p>
          </div>
          <ConnectionQualityIndicator
            peerConnection={peerConnectionRef.current}
            isConnected={isConnected}
          />
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

      {/* Two-Way Connection Status - Clear confirmation that BOTH can hear each other */}
      <div className="w-full max-w-md mb-2">
        <TwoWayConnectionStatus
          mode="audio"
          isMicOn={isMicOn}
          hasRemoteAudio={hasRemoteAudio}
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          className="mx-auto"
        />
      </div>

      {/* Connection explanation for users */}
      {connectionStatus === 'connected' && hasRemoteAudio && (
        <div className="glass-card px-4 py-2 rounded-xl text-center max-w-sm mb-2">
          <p className="text-xs text-green-600 dark:text-green-400">
            ✓ Voice call active • Both of you can speak and hear each other clearly in both ears
          </p>
        </div>
      )}

      {/* Conversation Starter */}
      {connectionStatus === 'connected' && (
        <div className="glass-card px-5 py-3 rounded-2xl text-center max-w-sm">
          <p className="text-xs text-muted-foreground mb-1">💬 Start with this:</p>
          <p className="text-sm text-foreground italic">"{conversationStarter}"</p>
        </div>
      )}

      {/* Car Interior UI - Two People in a Car - BOTH HEAR EACH OTHER */}
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
          {/* Two Seats Layout - REAL VOICE EXCHANGE */}
          <div className="flex justify-around items-center h-full px-6 pt-8">
            {/* Left Seat - You (Driver) - YOUR VOICE */}
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

            {/* Right Seat - Partner (Passenger) - THEIR VOICE */}
            <div className="flex flex-col items-center gap-3 relative">
              {/* Seat back */}
              <div className="absolute -top-2 w-24 h-28 bg-muted/30 rounded-t-full rounded-b-lg -z-10" />
              
              {/* Voice orb */}
              <div 
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-secondary/40 to-secondary/10 flex items-center justify-center transition-all duration-75 border-2 border-secondary/20"
                style={{
                  boxShadow: hasRemoteAudio ? `0 0 ${partnerVoiceLevel / 2}px ${partnerVoiceLevel / 3}px hsl(var(--secondary) / ${Math.min(0.6, partnerVoiceLevel / 100)})` : 'none',
                  transform: hasRemoteAudio ? `scale(${1 + partnerVoiceLevel / 300})` : 'scale(1)'
                }}
              >
                {partnerVoiceLevel > 20 && hasRemoteAudio && (
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-secondary/50 animate-ping"
                    style={{ animationDuration: '0.6s' }}
                  />
                )}
                <Volume2 className={`w-8 h-8 ${hasRemoteAudio ? 'text-secondary' : 'text-muted-foreground'}`} />
              </div>
              
              <div className="text-center">
                <p className="text-xs font-bold text-secondary">{partnerPseudoName.split('-')[0]}</p>
                <p className="text-[10px] text-muted-foreground">Partner</p>
              </div>
              
              {/* Voice level bar */}
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary rounded-full transition-all duration-75"
                  style={{ width: hasRemoteAudio ? `${partnerVoiceLevel}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Captions Overlay */}
        {captionsEnabled && currentCaption && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg mx-auto max-w-xs">
              <p className="text-white text-sm text-center leading-relaxed">{currentCaption}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg ${
            isMicOn 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-red-500 text-white'
          }`}
        >
          {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        <button
          onClick={toggleSpeaker}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg ${
            isSpeakerOn 
              ? 'bg-secondary text-secondary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
        
        <button
          onClick={() => setShowReportDialog(true)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center transition-all hover:bg-red-500/20 hover:scale-105"
        >
          <Flag className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Skip Button - Available after 20 seconds */}
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
          className="w-full gap-2 py-5 rounded-xl"
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

      {/* WebRTC Debug Panel */}
      {showDebugPanel && (
        <WebRTCDebugPanel
          signalingConnected={signalingConnected}
          peerConnection={peerConnectionRef.current}
          hasLocalStream={!!localStreamRef.current}
          hasRemoteStream={hasRemoteAudio}
          hasRemoteAudio={hasRemoteAudio}
          hasRemoteVideo={false}
          offerSent={offerSent}
          answerReceived={answerReceived}
          participantCount={participantCount}
        />
      )}
    </div>
  );
};
