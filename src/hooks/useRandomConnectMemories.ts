import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Memory } from '@/components/randomconnect/SavedMemories';

interface ReconnectRequest {
  id: string;
  session_id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export const useRandomConnectMemories = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  // Load memories from database
  const loadMemories = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch memories
      const { data: memoriesData, error: memoriesError } = await supabase
        .from('random_connect_memories')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (memoriesError) throw memoriesError;

      // Fetch reconnect requests for these memories
      const sessionIds = memoriesData?.map(m => m.session_id) || [];
      
      let reconnectRequests: ReconnectRequest[] = [];
      if (sessionIds.length > 0) {
        const { data: requestsData } = await supabase
          .from('random_connect_reconnect_requests')
          .select('*')
          .in('session_id', sessionIds)
          .gt('expires_at', new Date().toISOString());
        
        reconnectRequests = (requestsData as ReconnectRequest[]) || [];
      }

      // Fetch text messages for text memories
      const textMemorySessionIds = memoriesData?.filter(m => m.mode === 'text').map(m => m.session_id) || [];
      let messagesBySession: Record<string, { content: string; isOwn: boolean }[]> = {};
      
      if (textMemorySessionIds.length > 0) {
        const { data: messagesData } = await supabase
          .from('random_connect_messages')
          .select('*')
          .in('session_id', textMemorySessionIds)
          .order('created_at', { ascending: true });

        if (messagesData) {
          for (const msg of messagesData) {
            if (!messagesBySession[msg.session_id]) {
              messagesBySession[msg.session_id] = [];
            }
            // Find the memory to get partner pseudo name
            const memory = memoriesData?.find(m => m.session_id === msg.session_id);
            messagesBySession[msg.session_id].push({
              content: msg.content,
              isOwn: msg.sender_pseudo_name !== memory?.partner_pseudo_name
            });
          }
        }
      }

      // Transform to Memory type
      const transformedMemories: Memory[] = (memoriesData || []).map(m => {
        const request = reconnectRequests.find(r => r.session_id === m.session_id);
        let reconnectStatus: Memory['reconnectStatus'] = null;
        
        if (request) {
          if (request.requester_id === user.id) {
            reconnectStatus = request.status === 'pending' ? 'sent' : request.status as Memory['reconnectStatus'];
          } else {
            reconnectStatus = request.status === 'pending' ? 'received' : request.status as Memory['reconnectStatus'];
          }
        }

        return {
          id: m.id,
          type: m.mode as 'video' | 'audio' | 'text',
          partnerPseudoName: m.partner_pseudo_name,
          duration: m.duration_seconds || 0,
          createdAt: new Date(m.created_at),
          expiresAt: new Date(m.expires_at),
          messages: messagesBySession[m.session_id],
          reconnectStatus
        };
      });

      setMemories(transformedMemories);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save a memory after session ends
  const saveMemory = useCallback(async (
    sessionId: string,
    partnerPseudoName: string,
    mode: 'video' | 'audio' | 'text',
    durationSeconds: number
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('random_connect_memories')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          partner_pseudo_name: partnerPseudoName,
          mode,
          duration_seconds: durationSeconds
        });

      await loadMemories();
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  }, [user, loadMemories]);

  // Clear a specific memory
  const clearMemory = useCallback(async (memoryId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('random_connect_memories')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', user.id);

      setMemories(prev => prev.filter(m => m.id !== memoryId));
      toast.success('Memory cleared');
    } catch (error) {
      console.error('Error clearing memory:', error);
    }
  }, [user]);

  // Clear all memories
  const clearAllMemories = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('random_connect_memories')
        .delete()
        .eq('user_id', user.id);

      // Also clear text memory
      await supabase
        .from('random_connect_text_memory')
        .delete()
        .eq('user_id', user.id);

      setMemories([]);
      toast.success('All memories cleared');
    } catch (error) {
      console.error('Error clearing all memories:', error);
    }
  }, [user]);

  // Send reconnect request
  const sendReconnectRequest = useCallback(async (memoryId: string) => {
    if (!user) return;

    const memory = memories.find(m => m.id === memoryId);
    if (!memory) return;

    try {
      // Get the session to find the other user
      const { data: memoryData } = await supabase
        .from('random_connect_memories')
        .select('session_id')
        .eq('id', memoryId)
        .single();

      if (!memoryData) return;

      const { data: sessionData } = await supabase
        .from('random_connect_sessions')
        .select('user1_id, user2_id')
        .eq('id', memoryData.session_id)
        .single();

      if (!sessionData) return;

      const receiverId = sessionData.user1_id === user.id ? sessionData.user2_id : sessionData.user1_id;

      await supabase
        .from('random_connect_reconnect_requests')
        .insert({
          session_id: memoryData.session_id,
          requester_id: user.id,
          receiver_id: receiverId
        });

      toast.success('Reconnect request sent!');
      await loadMemories();
    } catch (error) {
      console.error('Error sending reconnect request:', error);
      toast.error('Failed to send reconnect request');
    }
  }, [user, memories, loadMemories]);

  // Respond to reconnect request - PUBG style accept/decline
  const respondToReconnect = useCallback(async (memoryId: string, accept: boolean) => {
    if (!user) return;

    const memory = memories.find(m => m.id === memoryId);
    if (!memory) return;

    try {
      const { data: memoryData } = await supabase
        .from('random_connect_memories')
        .select('session_id, mode, partner_pseudo_name')
        .eq('id', memoryId)
        .single();

      if (!memoryData) return;

      // Get the original session to find the other user
      const { data: originalSession } = await supabase
        .from('random_connect_sessions')
        .select('user1_id, user2_id, user1_pseudo_name, user2_pseudo_name, mode')
        .eq('id', memoryData.session_id)
        .single();

      if (!originalSession) return;

      await supabase
        .from('random_connect_reconnect_requests')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('session_id', memoryData.session_id)
        .eq('receiver_id', user.id);

      if (accept) {
        // Both accepted! Create a new session between the two users
        const requesterId = originalSession.user1_id === user.id 
          ? originalSession.user2_id 
          : originalSession.user1_id;
        
        const myPseudoName = originalSession.user1_id === user.id 
          ? originalSession.user1_pseudo_name 
          : originalSession.user2_pseudo_name;
        
        const partnerPseudoName = originalSession.user1_id === user.id 
          ? originalSession.user2_pseudo_name 
          : originalSession.user1_pseudo_name;

        // Create new reconnection session
        await supabase
          .from('random_connect_sessions')
          .insert({
            user1_id: requesterId, // requester becomes user1
            user2_id: user.id, // acceptor becomes user2
            user1_pseudo_name: partnerPseudoName,
            user2_pseudo_name: myPseudoName,
            mode: originalSession.mode,
            conversation_starter: 'Welcome back! You both chose to reconnect. 💫'
          });

        toast.success('Reconnect accepted! New session starting...', {
          description: 'Navigate to Connect tab to join the session'
        });
      } else {
        toast.info('Reconnect declined');
      }

      await loadMemories();
    } catch (error) {
      console.error('Error responding to reconnect:', error);
      toast.error('Failed to respond to reconnect request');
    }
  }, [user, memories, loadMemories]);

  // Subscribe to reconnect request updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('reconnect-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'random_connect_reconnect_requests',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        loadMemories();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'random_connect_reconnect_requests',
        filter: `requester_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.status === 'accepted') {
          toast.success('Your reconnect request was accepted!');
        } else if (payload.new.status === 'declined') {
          toast.info('Your reconnect request was declined');
        }
        loadMemories();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, loadMemories]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  return {
    memories,
    loading,
    saveMemory,
    clearMemory,
    clearAllMemories,
    sendReconnectRequest,
    respondToReconnect,
    refreshMemories: loadMemories
  };
};
