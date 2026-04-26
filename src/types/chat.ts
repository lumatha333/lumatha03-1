export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  is_read: boolean;
  is_forwarded: boolean;
  original_message_id?: string;
  reply_to_id?: string;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  sender?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ChatSettings {
  user_id: string;
  chat_user_id: string;
  theme_color?: string;
  nickname?: string;
  is_muted?: boolean;
  is_archived?: boolean;
  is_private?: boolean;
  disappear_timer?: number;
  updated_at: string;
}

export interface ChatConversation {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id?: string;
  document_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption?: string;
  visibility: 'public' | 'friends' | 'private';
  created_at: string;
  expires_at: string;
  user_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'comment' | 'like' | 'share' | 'message' | 'follow';
  from_user_id: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  from_user_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface Review {
  id: string;
  user_id: string;
  document_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}
