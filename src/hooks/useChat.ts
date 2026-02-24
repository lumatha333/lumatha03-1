import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, ChatConversation } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

export function useChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<string | null>(null);
  const currentChatUserRef = useRef<string | null>(null);

  // Keep ref in sync
  useEffect(() => { currentChatUserRef.current = currentChatUser; }, [currentChatUser]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(messagesData?.flatMap(m => [m.sender_id, m.receiver_id]) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const data = messagesData?.map(m => ({
        ...m,
        sender: profilesMap.get(m.sender_id) || { id: m.sender_id, name: 'Unknown', avatar_url: null },
        receiver: profilesMap.get(m.receiver_id) || { id: m.receiver_id, name: 'Unknown', avatar_url: null }
      })) || [];

      const convMap = new Map<string, ChatConversation>();
      data?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        if (!convMap.has(otherUserId)) {
          convMap.set(otherUserId, {
            user_id: otherUserId,
            user_name: otherUser?.name || 'Unknown',
            user_avatar: otherUser?.avatar_url,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0,
          });
        }
        if (!msg.is_read && msg.receiver_id === user.id) {
          const conv = convMap.get(otherUserId)!;
          conv.unread_count++;
        }
      });
      setConversations(Array.from(convMap.values()));
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
    }
  }, [user]);

  // Fetch messages for a specific user
  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', senderIds);
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const data = messagesData?.map(m => ({
        ...m,
        sender: profilesMap.get(m.sender_id) || { id: m.sender_id, name: 'Unknown', avatar_url: null }
      })) || [];

      setMessages(data as Message[]);
      setCurrentChatUser(otherUserId);

      // Mark as read silently
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('is_read', false)
        .then(() => {
          setConversations(prev => prev.map(c =>
            c.user_id === otherUserId ? { ...c, unread_count: 0 } : c
          ));
        });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send message - silent, no toasts
  const sendMessage = useCallback(async (receiverId: string, content: string, mediaUrl?: string, mediaType?: string) => {
    if (!user) return;
    try {
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: content || ' ',
          media_url: mediaUrl,
          media_type: mediaType,
        })
        .select()
        .single();
      if (error) throw error;

      // Optimistic update - add message immediately
      if (newMsg) {
        const msgWithSender = {
          ...newMsg,
          sender: { id: user.id, name: user.user_metadata?.name || 'You', avatar_url: null }
        };
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, msgWithSender as Message];
        });
      }

      // Create notification silently
      supabase.from('notifications').insert({
        user_id: receiverId,
        type: 'message',
        from_user_id: user.id,
        content: `${user.user_metadata?.name || 'Someone'} sent you a message`,
        link: `/chat/${user.id}`,
      }).then(() => {});
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  }, [user]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error: any) {
      console.error('Error deleting message:', error);
    }
  }, []);

  // Optimized real-time subscription with deduplication
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const newMsg = payload.new as any;
          // If we're in the chat with this sender, add message directly
          if (currentChatUserRef.current === newMsg.sender_id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, sender: { id: newMsg.sender_id, name: '', avatar_url: null } } as Message];
            });
            // Mark as read immediately
            supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id).then(() => {});
          }
          // Update conversation list
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const oldMsg = payload.old as any;
          setMessages(prev => prev.filter(m => m.id !== oldMsg.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    currentChatUser,
    fetchMessages,
    sendMessage,
    deleteMessage,
    setCurrentChatUser,
  };
}
