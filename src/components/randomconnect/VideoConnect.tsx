import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SkipForward, Eye, EyeOff, Camera, CameraOff, Mic, MicOff, Clock, Subtitles, Flag, Video, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSecurityDetection } from '@/hooks/useSecurityDetection';
import { useSignaling } from '@/hooks/useSignaling';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ReportDialog } from './ReportDialog';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { TwoWayConnectionStatus } from './TwoWayConnectionStatus';
import { getIceServers } from '@/lib/turnServers';
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
const MANDATORY_STAY_SECONDS = 20; // 20 seconds before skip is available

// Use centralized TURN server configuration with fallback support
const iceServers = getIceServers();

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
  const { user } = useAuth();
  const [blurEnabled, setBlurEnabled] = useState(false);
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
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const partnerVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const hasCreatedOfferRef = useRef<boolean>(false);
  const isInitiatorRef = useRef<boolean>(false);
  const localStreamReadyRef = useRef<boolean>(false);
  const signalingReadyRef = useRef<boolean>(false);
  const peerPresentRef = useRef<boolean>(false);

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
    isInitiatorRef.current = true;
    
    try {
      console.log('Creating WebRTC offer as initiator...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      console.log('Sending offer to partner');
      sendOffer(offer);
    } catch (error) {
      console.error('Error creating offer:', error);
      hasCreatedOfferRef.current = false;
    }
  }, [shouldBeInitiator]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    console.log('Creating new RTCPeerConnection...');
    const pc = new RTCPeerConnection({ 
      iceServers,
      iceCandidatePoolSize: 10
    });
    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Generated ICE candidate, sending to partner');
        sendIceCandidate(event.candidate.toJSON());
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', pc.iceGatheringState);
    };

    // Handle remote stream - THIS IS WHERE WE SEE AND HEAR THE OTHER PERSON
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, event.track.readyState);
      
      const [remoteStream] = event.streams;
      if (!remoteStream) {
        console.log('No remote stream in track event');
        return;
      }
      
      remoteStreamRef.current = remoteStream;
      setHasRemoteStream(true);
      
      // Display partner's video - REAL FACE TO FACE
      if (partnerVideoRef.current) {
        console.log('Setting partner video source');
        partnerVideoRef.current.srcObject = remoteStream;
        partnerVideoRef.current.play().catch(e => console.log('Partner video play error:', e));
      }

      // Create separate audio element for clear audio playback - REAL VOICE EXCHANGE
      if (!remoteAudioRef.current) {
        console.log('Creating audio element for remote audio');
        const audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        audioElement.setAttribute('playsinline', 'true');
        audioElement.volume = 1.0;
        document.body.appendChild(audioElement);
        remoteAudioRef.current = audioElement;
      }
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(e => console.log('Remote audio play error:', e));
      
      setIsConnected(true);
      setConnectionStatus('connected');
      toast.success('Connected! You can now see and hear each other.');
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state changed:', pc.connectionState);
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
    };

    pc.onsignalingstatechange = () => {
      console.log('Signaling state:', pc.signalingState);
    };

    return pc;
  }, []);

  // Signaling handlers
  const handlePeerJoined = useCallback(async (data: { userId: string; pseudoName: string }) => {
    console.log('Peer joined video call:', data.pseudoName, 'userId:', data.userId);
    peerPresentRef.current = true;
    
    // Short delay to ensure both sides are ready
    setTimeout(() => {
      tryCreateOffer();
    }, 500);
  }, [tryCreateOffer]);

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
      sendAnswer(answer);
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
    console.log('Peer left video call - returning to lobby');
    setConnectionStatus('disconnected');
    setIsConnected(false);
    setHasRemoteStream(false);
    peerPresentRef.current = false;
    toast.info('Partner left. Returning to lobby...');
    // Partner skipped - automatically skip as well (both return to lobby)
    onSkip();
  }, [onSkip]);

  const handleSignalingConnected = useCallback(() => {
    console.log('Signaling connected, participant count received');
    signalingReadyRef.current = true;
    
    // Partner is already in session, try to create offer after a short delay
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

  // When signaling connects and participantCount > 1, partner is already there
  useEffect(() => {
    if (signalingConnected && participantCount > 1) {
      console.log('Partner already in session, participant count:', participantCount);
      peerPresentRef.current = true;
      handleSignalingConnected();
    }
  }, [signalingConnected, participantCount, handleSignalingConnected]);

  // Enable skip after mandatory stay (20 seconds)
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
      onSkip();
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

  // Initialize WebRTC and camera
  useEffect(() => {
    let mounted = true;
    hasCreatedOfferRef.current = false;
    iceCandidatesQueue.current = [];
    localStreamReadyRef.current = false;
    peerPresentRef.current = false;
    
    const initializeVideoCall = async () => {
      try {
        // Request camera and microphone with optimal settings for real-time communication
        console.log('Requesting camera and microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30, min: 15 }
          }, 
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
        console.log('Got local stream with', stream.getTracks().length, 'tracks:', 
          stream.getTracks().map(t => `${t.kind}:${t.readyState}`).join(', '));
        
        // Set local video - THIS IS YOUR OWN FACE
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
          myVideoRef.current.muted = true; // Mute local playback to prevent echo
          myVideoRef.current.play().catch(e => console.log('Local video play error:', e));
        }

        // Create RTCPeerConnection
        const pc = createPeerConnection();

        // Add local stream tracks to peer connection - CRITICAL FOR TWO-WAY COMMUNICATION
        stream.getTracks().forEach(track => {
          console.log('Adding track to peer connection:', track.kind, track.readyState);
          pc.addTrack(track, stream);
        });
        
        localStreamReadyRef.current = true;
        console.log('Local stream ready, checking if should create offer...');
        
        // If signaling is already connected and partner might be waiting, try to create offer
        if (signalingConnected) {
          setTimeout(() => {
            tryCreateOffer();
          }, 500);
        }
        
      } catch (err) {
        console.error('Failed to initialize video call:', err);
        toast.error('Camera and microphone access is required for video chat');
      }
    };
    
    initializeVideoCall();
    
    return () => {
      mounted = false;
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
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
      {/* Two-Way Connection Status - Clear confirmation that BOTH can see/hear each other */}
      <div className="w-full max-w-lg flex items-center justify-between mb-2 px-1">
        <TwoWayConnectionStatus
          mode="video"
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          hasRemoteVideo={hasRemoteStream}
          hasRemoteAudio={hasRemoteStream}
          isConnected={isConnected}
          connectionStatus={connectionStatus}
        />
        <ConnectionQualityIndicator
          peerConnection={peerConnectionRef.current}
          isConnected={isConnected}
          showDetails={false}
        />
      </div>

      {/* Connection explanation for users */}
      {connectionStatus === 'connected' && hasRemoteStream && (
        <div className="glass-card px-3 py-1.5 rounded-lg mb-2 max-w-lg">
          <p className="text-[11px] text-green-600 dark:text-green-400 text-center">
            ✓ Face-to-face active • Both of you can see and hear each other clearly
          </p>
        </div>
      )}

      {/* Main Split Screen Video Container - TRUE FACE TO FACE - BOTH REAL FACES VISIBLE */}
      <div className="relative flex-1 w-full max-w-lg rounded-2xl overflow-hidden bg-muted shadow-lg">
        {/* Partner Video - Top Half (55%) - YOU SEE THEIR REAL FACE HERE */}
        <div className="absolute top-0 left-0 right-0 h-[55%] bg-gradient-to-b from-card to-muted border-b-2 border-background">
          <video
            ref={partnerVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${blurEnabled ? 'blur-xl' : ''}`}
          />
          
          {/* Partner placeholder when waiting for connection */}
          {!hasRemoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary/20 to-secondary/5">
              <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                <Video className="w-8 h-8 text-secondary/60 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-secondary">{partnerPseudoName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {connectionStatus === 'connecting' ? 'Connecting camera...' : 'Waiting for partner\'s video...'}
              </p>
            </div>
          )}
          
          {/* Partner connected badge - confirms you CAN see them */}
          {hasRemoteStream && (
            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-green-500" />
              <p className="text-xs font-medium text-secondary">{partnerPseudoName}</p>
              <div className="flex items-center gap-0.5 ml-1">
                <Volume2 className="w-3 h-3 text-green-500" />
              </div>
            </div>
          )}

          {/* Audio wave indicator - shows partner is talking */}
          {hasRemoteStream && (
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

        {/* My Video - Bottom Half (45%) - MY REAL FACE */}
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

      {/* Skip Button Only - Available after 20 seconds */}
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
