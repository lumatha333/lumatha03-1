import { useState, useEffect, useRef, useCallback } from 'react';

interface SignalingConfig {
  sessionId: string | null;
  userId: string;
  pseudoName: string;
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

  const connect = useCallback(() => {
    if (!config.sessionId || !config.userId || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Build WebSocket URL from environment to work in all Lovable Cloud environments.
      // IMPORTANT: WebSockets cannot send custom headers, so we pass the publishable key as a query param.
      const baseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
      const wsBase = baseUrl.replace(/^http(s?):\/\//, 'wss://');
      const apikey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? '';
      const wsUrl = `${wsBase}/functions/v1/random-connect-signaling?apikey=${encodeURIComponent(apikey)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Signaling WebSocket connected');
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
          console.log('Signaling message received:', message.type);

          switch (message.type) {
            case 'joined':
              setParticipantCount(message.participantCount);
              break;
            case 'peer-joined':
              setParticipantCount(prev => prev + 1);
              config.onPeerJoined?.(message);
              break;
            case 'peer-left':
              setParticipantCount(prev => Math.max(0, prev - 1));
              config.onPeerLeft?.(message);
              // Close the WebSocket when peer leaves - session ended
              if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
              }
              break;
            case 'offer':
              config.onOffer?.(message);
              break;
            case 'answer':
              config.onAnswer?.(message);
              break;
            case 'ice-candidate':
              config.onIceCandidate?.(message);
              break;
            case 'typing':
              config.onTyping?.(message);
              break;
            case 'read':
              config.onRead?.(message);
              break;
            case 'presence':
              config.onPresence?.(message);
              break;
            case 'error':
              console.error('Signaling error:', message.message);
              config.onError?.(new Error(message.message));
              break;
          }
        } catch (error) {
          console.error('Failed to parse signaling message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Signaling WebSocket closed');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection after 2 seconds if still in session
        if (config.sessionId) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 2000);
        }
      };

      ws.onerror = (error) => {
        console.error('Signaling WebSocket error:', error);
        config.onError?.(new Error('WebSocket connection error'));
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      config.onError?.(error as Error);
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
    }
  }, [config.sessionId, config.userId, config.pseudoName]);

  // Send WebRTC offer
  const sendOffer = useCallback((sdp: RTCSessionDescriptionInit) => {
    send('offer', { sdp });
  }, [send]);

  // Send WebRTC answer
  const sendAnswer = useCallback((sdp: RTCSessionDescriptionInit) => {
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
