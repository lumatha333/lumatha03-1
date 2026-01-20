import { useState, useRef, useCallback, useEffect } from 'react';
import { getIceServers } from '@/lib/turnServers';

interface WebRTCConfig {
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onDataChannelMessage?: (message: string) => void;
}

// Use centralized TURN server configuration
const iceServers = getIceServers();

export const useWebRTC = (config: WebRTCConfig = {}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize local media stream
  const initializeMedia = useCallback(async (options: { video: boolean; audio: boolean }) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: options.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
        video: options.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Failed to get media devices:', error);
      throw error;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers });
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // In production, send this to signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      
      config.onRemoteStream?.(remoteStream);
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      config.onConnectionStateChange?.(pc.connectionState);
    };

    // Create data channel for signaling
    const dataChannel = pc.createDataChannel('messaging');
    dataChannel.onmessage = (event) => {
      config.onDataChannelMessage?.(event.data);
    };
    dataChannelRef.current = dataChannel;

    peerConnectionRef.current = pc;
    return pc;
  }, [config]);

  // Add local stream to peer connection
  const addStreamToPeerConnection = useCallback((stream: MediaStream) => {
    if (!peerConnectionRef.current) return;
    
    stream.getTracks().forEach((track) => {
      peerConnectionRef.current?.addTrack(track, stream);
    });
  }, []);

  // Create offer (for caller)
  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current) return null;
    
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    
    return offer;
  }, []);

  // Create answer (for callee)
  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return null;
    
    await peerConnectionRef.current.setRemoteDescription(offer);
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    
    return answer;
  }, []);

  // Set remote answer
  const setRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    
    await peerConnectionRef.current.setRemoteDescription(answer);
  }, []);

  // Add ICE candidate
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;
    
    await peerConnectionRef.current.addIceCandidate(candidate);
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Send message via data channel
  const sendDataMessage = useCallback((message: string) => {
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(message);
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    setRemoteStream(null);
    setConnectionState('closed');
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    localStream,
    remoteStream,
    connectionState,
    isAudioEnabled,
    isVideoEnabled,
    localVideoRef,
    remoteVideoRef,
    initializeMedia,
    createPeerConnection,
    addStreamToPeerConnection,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    toggleAudio,
    toggleVideo,
    sendDataMessage,
    cleanup
  };
};
