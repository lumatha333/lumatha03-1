import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FriendRequest } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useFriends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchFriendRequests = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch friend requests
      const { data: requestsData, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sender profiles separately
      if (requestsData && requestsData.length > 0) {
        const senderIds = requestsData.map(r => r.sender_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', senderIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const requestsWithSenders = requestsData.map(request => ({
          ...request,
          sender: profilesMap.get(request.sender_id) || { id: request.sender_id, name: 'Unknown' }
        })) as FriendRequest[];

        setFriendRequests(requestsWithSenders);
        setPendingCount(requestsWithSenders.length);
      } else {
        setFriendRequests([]);
        setPendingCount(0);
      }
    } catch (error: any) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch accepted friend requests
      const { data: requestsData, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      if (requestsData && requestsData.length > 0) {
        // Get all unique user IDs that aren't the current user
        const friendIds = requestsData.map(fr => 
          fr.sender_id === user.id ? fr.receiver_id : fr.sender_id
        );

        // Fetch profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, bio')
          .in('id', friendIds);

        setFriends(profilesData || []);
      } else {
        setFriends([]);
      }
    } catch (error: any) {
      console.error('Error fetching friends:', error);
    }
  }, [user]);

  const sendFriendRequest = useCallback(async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
        });

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'friend_request',
        from_user_id: user.id,
        content: `${user.user_metadata?.name || 'Someone'} sent you a friend request`,
        link: `/friends`,
      });

      toast({
        title: 'Request Sent',
        description: 'Friend request sent successfully',
      });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Already Sent',
          description: 'Friend request already exists',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send friend request',
          variant: 'destructive',
        });
      }
    }
  }, [user, toast]);

  const acceptFriendRequest = useCallback(async (requestId: string, senderId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: senderId,
        type: 'friend_request',
        from_user_id: user!.id,
        content: `${user!.user_metadata?.name || 'Someone'} accepted your friend request`,
        link: `/friends`,
      });

      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      setPendingCount(prev => Math.max(0, prev - 1));
      fetchFriends();

      toast({
        title: 'Accepted',
        description: 'Friend request accepted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to accept request',
        variant: 'destructive',
      });
    }
  }, [user, toast, fetchFriends]);

  const rejectFriendRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      setPendingCount(prev => Math.max(0, prev - 1));

      toast({
        title: 'Rejected',
        description: 'Friend request rejected',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('friend_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchFriendRequests();
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchFriendRequests, fetchFriends]);

  useEffect(() => {
    fetchFriendRequests();
    fetchFriends();
  }, [fetchFriendRequests, fetchFriends]);

  return {
    friendRequests,
    friends,
    pendingCount,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  };
}
