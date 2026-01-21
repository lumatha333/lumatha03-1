import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'typing' | 'read' | 'presence';
  sessionId: string;
  userId: string;
  pseudoName: string;
  payload?: any;
}

interface Participant {
  socket: WebSocket;
  pseudoName: string;
}

// Store active connections per session with participant info
const sessionConnections = new Map<string, Map<string, Participant>>();

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const upgrade = req.headers.get('upgrade') || '';

  // Handle WebSocket upgrade
  if (upgrade.toLowerCase() === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    let currentSessionId: string | null = null;
    let currentUserId: string | null = null;
    let currentPseudoName: string | null = null;

    socket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    socket.onmessage = async (event) => {
      try {
        const message: SignalingMessage = JSON.parse(event.data);
        console.log('Received message:', message.type, 'for session:', message.sessionId);

        currentSessionId = message.sessionId;
        currentUserId = message.userId;
        currentPseudoName = message.pseudoName;

        // Get or create session room
        if (!sessionConnections.has(message.sessionId)) {
          sessionConnections.set(message.sessionId, new Map());
        }
        const sessionRoom = sessionConnections.get(message.sessionId)!;
        
        // Add this connection to session with participant info
        sessionRoom.set(message.userId, {
          socket,
          pseudoName: message.pseudoName
        });

        // Broadcast to other participants in the session
        const broadcastToSession = (msg: any, excludeUserId?: string) => {
          sessionRoom.forEach((participant, odId) => {
            if (participant.socket !== socket && participant.socket.readyState === WebSocket.OPEN && odId !== excludeUserId) {
              participant.socket.send(JSON.stringify(msg));
            }
          });
        };

        switch (message.type) {
          case 'join':
            // CRITICAL FIX: First, send existing participants to the newly joined user
            // This ensures they know who is already in the room
            const existingParticipants: Array<{ userId: string; pseudoName: string }> = [];
            sessionRoom.forEach((participant, odId) => {
              if (odId !== message.userId) {
                existingParticipants.push({
                  userId: odId,
                  pseudoName: participant.pseudoName
                });
              }
            });

            // Send confirmation with existing participants list
            socket.send(JSON.stringify({
              type: 'joined',
              sessionId: message.sessionId,
              participantCount: sessionRoom.size,
              existingParticipants
            }));

            // Notify others that someone joined
            broadcastToSession({
              type: 'peer-joined',
              userId: message.userId,
              pseudoName: message.pseudoName,
              timestamp: new Date().toISOString()
            });
            break;

          case 'offer':
            // Forward WebRTC offer to peer
            console.log('Forwarding offer from', message.userId);
            broadcastToSession({
              type: 'offer',
              sdp: message.payload.sdp,
              fromUserId: message.userId,
              fromPseudoName: message.pseudoName
            });
            break;

          case 'answer':
            // Forward WebRTC answer to peer
            console.log('Forwarding answer from', message.userId);
            broadcastToSession({
              type: 'answer',
              sdp: message.payload.sdp,
              fromUserId: message.userId
            });
            break;

          case 'ice-candidate':
            // Forward ICE candidate to peer
            broadcastToSession({
              type: 'ice-candidate',
              candidate: message.payload.candidate,
              fromUserId: message.userId
            });
            break;

          case 'typing':
            // Forward typing indicator to peer
            broadcastToSession({
              type: 'typing',
              isTyping: message.payload.isTyping,
              fromPseudoName: message.pseudoName
            });
            break;

          case 'read':
            // Forward read receipt to peer
            broadcastToSession({
              type: 'read',
              messageIds: message.payload.messageIds,
              fromUserId: message.userId,
              timestamp: new Date().toISOString()
            });
            break;

          case 'presence':
            // Forward presence update
            broadcastToSession({
              type: 'presence',
              status: message.payload.status,
              fromPseudoName: message.pseudoName
            });
            break;

          case 'leave':
            // Notify others that someone left
            broadcastToSession({
              type: 'peer-left',
              userId: message.userId,
              pseudoName: message.pseudoName
            });
            sessionRoom.delete(message.userId);
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      
      // Clean up connection from session
      if (currentSessionId && currentUserId) {
        const sessionRoom = sessionConnections.get(currentSessionId);
        if (sessionRoom) {
          sessionRoom.delete(currentUserId);
          
          // Notify others
          sessionRoom.forEach((participant) => {
            if (participant.socket.readyState === WebSocket.OPEN) {
              participant.socket.send(JSON.stringify({
                type: 'peer-left',
                userId: currentUserId,
                pseudoName: currentPseudoName
              }));
            }
          });
          
          // Clean up empty sessions
          if (sessionRoom.size === 0) {
            sessionConnections.delete(currentSessionId);
          }
        }
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return response;
  }

  // Handle HTTP requests for session status
  if (req.method === 'GET') {
    const sessionId = url.searchParams.get('sessionId');
    
    if (sessionId) {
      const sessionRoom = sessionConnections.get(sessionId);
      return new Response(JSON.stringify({
        sessionId,
        participantCount: sessionRoom?.size || 0,
        active: sessionRoom ? sessionRoom.size > 0 : false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      status: 'ok',
      activeSessions: sessionConnections.size
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
