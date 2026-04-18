import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 
  | 'follow' 
  | 'like' 
  | 'comment' 
  | 'share' 
  | 'friend_request' 
  | 'mention' 
  | 'message' 
  | 'system';

/**
 * Create a notification using the secure SECURITY DEFINER function
 * This prevents fake notification injection attacks
 */
export const createNotification = async (
  userId: string,
  type: NotificationType,
  content: string,
  link?: string
): Promise<{ success: boolean; notificationId?: string; error?: string }> => {
  try {
    // Use type assertion since the RPC function was just created and types may not be regenerated yet
    const { data, error } = await (supabase.rpc as any)('create_notification', {
      p_user_id: userId,
      p_type: type,
      p_content: content,
      p_link: link || null,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data as string };
  } catch (error) {
    console.error('Unexpected error creating notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Helper to create follow notification
 */
export const notifyFollow = async (followedUserId: string) => {
  return createNotification(
    followedUserId,
    'follow',
    'started following you',
    `/profile/${followedUserId}`
  );
};

/**
 * Helper to create like notification
 */
export const notifyLike = async (postOwnerId: string, postId: string) => {
  return createNotification(
    postOwnerId,
    'like',
    'liked your post',
    `/post/${postId}`
  );
};

/**
 * Helper to create comment notification
 */
export const notifyComment = async (postOwnerId: string, postId: string) => {
  return createNotification(
    postOwnerId,
    'comment',
    'commented on your post',
    `/post/${postId}`
  );
};

/**
 * Helper to create friend request notification
 */
export const notifyFriendRequest = async (receiverId: string) => {
  return createNotification(
    receiverId,
    'friend_request',
    'sent you a friend request'
  );
};

/**
 * Helper to create message notification
 */
export const notifyMessage = async (receiverId: string) => {
  return createNotification(
    receiverId,
    'message',
    'sent you a message',
    '/chat'
  );
};

/**
 * Helper to create mention notification
 */
export const notifyMention = async (mentionedUserId: string, postId: string) => {
  return createNotification(
    mentionedUserId,
    'mention',
    'mentioned you in a post',
    `/post/${postId}`
  );
};

/**
 * Helper to create share notification
 */
export const notifyShare = async (postOwnerId: string, postId: string) => {
  return createNotification(
    postOwnerId,
    'share',
    'shared your post',
    `/post/${postId}`
  );
};
