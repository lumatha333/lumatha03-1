import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, ChatConversation } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<string | null>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      // First fetch messages
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(messagesData?.flatMap(m => [m.sender_id, m.receiver_id]) || [])];
      
      // Fetch profiles for those users
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

      // Group messages by conversation
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

        // Count unread messages
        if (!msg.is_read && msg.receiver_id === user.id) {
          const conv = convMap.get(otherUserId)!;
          conv.unread_count++;
        }
      });

      setConversations(Array.from(convMap.values()));
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Fetch messages for a specific user
  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch messages
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
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

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId);

    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Send message
  const sendMessage = useCallback(async (receiverId: string, content: string, mediaUrl?: string, mediaType?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: receiverId,
        type: 'message',
        from_user_id: user.id,
        content: `${user.user_metadata?.name || 'Someone'} sent you a message`,
        link: `/chat/${user.id}`,
      });

      toast({
        title: 'Sent',
        description: 'Message sent successfully',
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast({
        title: 'Deleted',
        description: 'Message deleted',
      });
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
          if (currentChatUser) {
            fetchMessages(currentChatUser);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentChatUser, fetchConversations, fetchMessages]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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
