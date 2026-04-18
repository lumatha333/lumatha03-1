import { useState, useEffect, useRef, useCallback } from 'react';

interface SignalingConfig {
  sessionId: string | null;
  userId: string;
  pseudoName: string;
  onSignalingConnected?: (existingParticipants: Array<{ userId: string; pseudoName: string }>) => void;
  onPeerJoined?: (data: { userId: string; pseudoName: string }) => void;
  onPeerLeft?: (data: { userId: string; pseudoName: string }) => void;
  onOffer?: (data: { sdp: RTCSessionDescriptionInit; fromUserId: string; fromPseudoName: string }) => void;
  onAnswer?: (data: { sdp: RTCSessionDescriptionInit; fromUserId: string }) => void;
  onIceCandidate?: (data: { candidate: RTCIceCandidateInit; fromUserId: string }) => void;
  onTyping?: (data: { isTyping: boolean; fromPseudoName: string }) => void;
  onRead?: (data: { messageIds: string[]; fromUserId: string; timestamp: string }) => void;
  onPresence?: (data: { status: string; fromPseudoName: string }) => void;
  onError?: (error: Error) => void;
}

export const useSignaling = (config: SignalingConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRef = useRef(false);

  // CRITICAL FIX: Use refs for all callbacks to avoid stale closures
  const onSignalingConnectedRef = useRef(config.onSignalingConnected);
  const onPeerJoinedRef = useRef(config.onPeerJoined);
  const onPeerLeftRef = useRef(config.onPeerLeft);
  const onOfferRef = useRef(config.onOffer);
  const onAnswerRef = useRef(config.onAnswer);
  const onIceCandidateRef = useRef(config.onIceCandidate);
  const onTypingRef = useRef(config.onTyping);
  const onReadRef = useRef(config.onRead);
  const onPresenceRef = useRef(config.onPresence);
  const onErrorRef = useRef(config.onError);

  // Keep refs in sync with latest config
  useEffect(() => {
    onSignalingConnectedRef.current = config.onSignalingConnected;
    onPeerJoinedRef.current = config.onPeerJoined;
    onPeerLeftRef.current = config.onPeerLeft;
    onOfferRef.current = config.onOffer;
    onAnswerRef.current = config.onAnswer;
    onIceCandidateRef.current = config.onIceCandidate;
    onTypingRef.current = config.onTyping;
    onReadRef.current = config.onRead;
    onPresenceRef.current = config.onPresence;
    onErrorRef.current = config.onError;
  });

  const connect = useCallback(() => {
    if (!config.sessionId || !config.userId || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Build WebSocket URL from environment to work in all Lovable Cloud environments.
      // IMPORTANT: WebSockets cannot send custom headers, so we pass the publishable key as a query param.
      const baseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
      const wsBase = baseUrl.replace(/^http(s?):\/\//, 'wss://');
      const apikey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? '';
      const wsUrl = `${wsBase}/functions/v1/random-connect-signaling?apikey=${encodeURIComponent(apikey)}`;
      console.log('[useSignaling] Connecting to signaling server...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[useSignaling] WebSocket connected, sending join message');
        setIsConnected(true);
        
        // Join the session
        ws.send(JSON.stringify({
          type: 'join',
          sessionId: config.sessionId,
          userId: config.userId,
          pseudoName: config.pseudoName
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[useSignaling] Message received:', message.type);

          switch (message.type) {
            case 'joined':
              setParticipantCount(message.participantCount);
              hasJoinedRef.current = true;
              console.log('[useSignaling] Joined session, participants:', message.participantCount, 'existing:', message.existingParticipants?.length || 0);
              // CRITICAL: Use ref to ensure we call the latest handler
              onSignalingConnectedRef.current?.(message.existingParticipants || []);
              break;
            case 'peer-joined':
              setParticipantCount(prev => prev + 1);
              console.log('[useSignaling] Peer joined:', message.pseudoName);
              onPeerJoinedRef.current?.(message);
              break;
            case 'peer-left':
              setParticipantCount(prev => Math.max(0, prev - 1));
              console.log('[useSignaling] Peer left:', message.pseudoName);
              onPeerLeftRef.current?.(message);
              // Close the WebSocket when peer leaves - session ended
              if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
              }
              break;
            case 'offer':
              console.log('[useSignaling] Received offer from:', message.fromPseudoName);
              onOfferRef.current?.(message);
              break;
            case 'answer':
              console.log('[useSignaling] Received answer from:', message.fromUserId);
              onAnswerRef.current?.(message);
              break;
            case 'ice-candidate':
              console.log('[useSignaling] Received ICE candidate');
              onIceCandidateRef.current?.(message);
              break;
            case 'typing':
              onTypingRef.current?.(message);
              break;
            case 'read':
              onReadRef.current?.(message);
              break;
            case 'presence':
              onPresenceRef.current?.(message);
              break;
            case 'error':
              console.error('[useSignaling] Server error:', message.message);
              onErrorRef.current?.(new Error(message.message));
              break;
          }
        } catch (error) {
          console.error('[useSignaling] Failed to parse message:', error);
        }
      };

      ws.onclose = () => {
        console.log('[useSignaling] WebSocket closed');
        setIsConnected(false);
        wsRef.current = null;
        hasJoinedRef.current = false;

        // Attempt reconnection after 2 seconds if still in session
        if (config.sessionId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 2000);
        }
      };

      ws.onerror = (error) => {
        console.error('[useSignaling] WebSocket error:', error);
        onErrorRef.current?.(new Error('WebSocket connection error'));
      };
    } catch (error) {
      console.error('[useSignaling] Failed to create WebSocket:', error);
      onErrorRef.current?.(error as Error);
    }
  }, [config.sessionId, config.userId, config.pseudoName]);

  // Connect when session is available
  useEffect(() => {
    if (config.sessionId && config.userId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [config.sessionId, connect]);

  // Send signaling message
  const send = useCallback((type: string, payload?: any) => {
    if (!config.sessionId || !config.userId) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        sessionId: config.sessionId,
        userId: config.userId,
        pseudoName: config.pseudoName,
        payload
      }));
    } else {
      console.warn('[useSignaling] Cannot send - WebSocket not open');
    }
  }, [config.sessionId, config.userId, config.pseudoName]);

  // Send WebRTC offer
  const sendOffer = useCallback((sdp: RTCSessionDescriptionInit) => {
    console.log('[useSignaling] Sending offer');
    send('offer', { sdp });
  }, [send]);

  // Send WebRTC answer
  const sendAnswer = useCallback((sdp: RTCSessionDescriptionInit) => {
    console.log('[useSignaling] Sending answer');
    send('answer', { sdp });
  }, [send]);

  // Send ICE candidate
  const sendIceCandidate = useCallback((candidate: RTCIceCandidateInit) => {
    send('ice-candidate', { candidate });
  }, [send]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    send('typing', { isTyping });
  }, [send]);

  // Send read receipt
  const sendRead = useCallback((messageIds: string[]) => {
    send('read', { messageIds });
  }, [send]);

  // Send presence update
  const sendPresence = useCallback((status: 'online' | 'away' | 'busy') => {
    send('presence', { status });
  }, [send]);

  // Leave session
  const leave = useCallback(() => {
    send('leave');
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [send]);

  return {
    isConnected,
    participantCount,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendTyping,
    sendRead,
    sendPresence,
    leave
  };
};
