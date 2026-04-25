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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasJoinedRef = useRef(false);

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
      const baseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
      const wsBase = baseUrl.replace(/^http(s?):\/\//, 'wss://');
      const apikey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? '';
      const wsUrl = `${wsBase}/functions/v1/random-connect-signaling?apikey=${encodeURIComponent(apikey)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
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

          switch (message.type) {
            case 'joined':
              setParticipantCount(message.participantCount);
              hasJoinedRef.current = true;
              onSignalingConnectedRef.current?.(message.existingParticipants || []);
              break;
            case 'peer-joined':
              setParticipantCount(prev => prev + 1);
              onPeerJoinedRef.current?.(message);
              break;
            case 'peer-left':
              setParticipantCount(prev => Math.max(0, prev - 1));
              onPeerLeftRef.current?.(message);
              if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
              }
              break;
            case 'offer':
              onOfferRef.current?.(message);
              break;
            case 'answer':
              onAnswerRef.current?.(message);
              break;
            case 'ice-candidate':
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
              onErrorRef.current?.(new Error(message.message));
              break;
          }
        } catch {
          // Silent parse error
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        hasJoinedRef.current = false;

        if (config.sessionId) {
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        onErrorRef.current?.(new Error('WebSocket connection error'));
      };
    } catch (error) {
      onErrorRef.current?.(error as Error);
    }
  }, [config.sessionId, config.userId, config.pseudoName]);

  useEffect(() => {
    if (config.sessionId && config.userId) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [config.sessionId, connect]);

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
    }
  }, [config.sessionId, config.userId, config.pseudoName]);

  const sendOffer = useCallback((sdp: RTCSessionDescriptionInit) => {
    send('offer', { sdp });
  }, [send]);

  const sendAnswer = useCallback((sdp: RTCSessionDescriptionInit) => {
    send('answer', { sdp });
  }, [send]);

  const sendIceCandidate = useCallback((candidate: RTCIceCandidateInit) => {
    send('ice-candidate', { candidate });
  }, [send]);

  const sendTyping = useCallback((isTyping: boolean) => {
    send('typing', { isTyping });
  }, [send]);

  const sendRead = useCallback((messageIds: string[]) => {
    send('read', { messageIds });
  }, [send]);

  const sendPresence = useCallback((status: 'online' | 'away' | 'busy') => {
    send('presence', { status });
  }, [send]);

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
