export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      challenge_submissions: {
        Row: {
          challenge_id: string
          created_at: string | null
          id: string
          proof_type: string | null
          proof_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          id?: string
          proof_type?: string | null
          proof_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          id?: string
          proof_type?: string | null
          proof_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          location_required: boolean | null
          points: number | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          location_required?: boolean | null
          points?: number | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          location_required?: boolean | null
          points?: number | null
          title?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          reaction: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          document_id: string | null
          id: string
          post_id: string | null
          reference_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          post_id?: string | null
          reference_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          post_id?: string | null
          reference_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_challenges: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discover_visits: {
        Row: {
          id: string
          place_id: string
          user_id: string
          visited_at: string | null
        }
        Insert: {
          id?: string
          place_id: string
          user_id: string
          visited_at?: string | null
        }
        Update: {
          id?: string
          place_id?: string
          user_id?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discover_visits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_reactions: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reactions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_forwarded: boolean | null
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          original_message_id: string | null
          receiver_id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_forwarded?: boolean | null
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          original_message_id?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_forwarded?: boolean | null
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          original_message_id?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_original_message_id_fkey"
            columns: ["original_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
          visibility: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
          visibility?: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string | null
          from_user_id: string
          id: string
          is_read: boolean | null
          link: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          from_user_id: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          from_user_id?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          artist: string | null
          created_at: string | null
          duration: number | null
          file_url: string | null
          id: string
          playlist_id: string
          title: string
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          duration?: number | null
          file_url?: string | null
          id?: string
          playlist_id: string
          title: string
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          duration?: number | null
          file_url?: string | null
          id?: string
          playlist_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          shared_with_user_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          shared_with_user_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          shared_with_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category: string
          content: string | null
          created_at: string | null
          file_type: string | null
          file_url: string | null
          id: string
          likes_count: number | null
          media_types: string[] | null
          media_urls: string[] | null
          shares_count: number | null
          subcategory: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
          visibility: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          likes_count?: number | null
          media_types?: string[] | null
          media_urls?: string[] | null
          shares_count?: number | null
          subcategory?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
          visibility?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          likes_count?: number | null
          media_types?: string[] | null
          media_urls?: string[] | null
          shares_count?: number | null
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_group: string | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          cover_url: string | null
          created_at: string | null
          id: string
          location: string | null
          name: string
          total_followers: number | null
          total_following: number | null
          total_posts: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          age_group?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          id: string
          location?: string | null
          name: string
          total_followers?: number | null
          total_following?: number | null
          total_posts?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          age_group?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          total_followers?: number | null
          total_following?: number | null
          total_posts?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      random_connect_memories: {
        Row: {
          created_at: string
          duration_seconds: number | null
          expires_at: string
          id: string
          mode: string
          partner_pseudo_name: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string
          id?: string
          mode: string
          partner_pseudo_name: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string
          id?: string
          mode?: string
          partner_pseudo_name?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "random_connect_memories_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "random_connect_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      random_connect_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_pseudo_name: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_pseudo_name: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_pseudo_name?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "random_connect_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "random_connect_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      random_connect_queue: {
        Row: {
          created_at: string
          id: string
          language: string | null
          mode: string
          pseudo_name: string
          region: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          mode: string
          pseudo_name: string
          region?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          mode?: string
          pseudo_name?: string
          region?: string | null
          user_id?: string
        }
        Relationships: []
      }
      random_connect_reconnect_requests: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          receiver_id: string
          requester_id: string
          session_id: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          receiver_id: string
          requester_id: string
          session_id: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          receiver_id?: string
          requester_id?: string
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "random_connect_reconnect_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "random_connect_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      random_connect_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "random_connect_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "random_connect_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      random_connect_sessions: {
        Row: {
          conversation_starter: string | null
          ended_at: string | null
          id: string
          mode: string
          started_at: string
          status: string
          user1_id: string
          user1_pseudo_name: string
          user2_id: string
          user2_pseudo_name: string
        }
        Insert: {
          conversation_starter?: string | null
          ended_at?: string | null
          id?: string
          mode: string
          started_at?: string
          status?: string
          user1_id: string
          user1_pseudo_name: string
          user2_id: string
          user2_pseudo_name: string
        }
        Update: {
          conversation_starter?: string | null
          ended_at?: string | null
          id?: string
          mode?: string
          started_at?: string
          status?: string
          user1_id?: string
          user1_pseudo_name?: string
          user2_id?: string
          user2_pseudo_name?: string
        }
        Relationships: []
      }
      random_connect_text_memory: {
        Row: {
          content: string
          created_at: string
          id: string
          is_own_message: boolean
          session_index: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_own_message?: boolean
          session_index: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_own_message?: boolean
          session_index?: number
          user_id?: string
        }
        Relationships: []
      }
      random_connect_violations: {
        Row: {
          banned_until: string | null
          created_at: string
          id: string
          last_violation_at: string
          permanent_ban: boolean | null
          report_ban: boolean | null
          user_id: string
          violation_count: number
          violation_type: string
        }
        Insert: {
          banned_until?: string | null
          created_at?: string
          id?: string
          last_violation_at?: string
          permanent_ban?: boolean | null
          report_ban?: boolean | null
          user_id: string
          violation_count?: number
          violation_type: string
        }
        Update: {
          banned_until?: string | null
          created_at?: string
          id?: string
          last_violation_at?: string
          permanent_ban?: boolean | null
          report_ban?: boolean | null
          user_id?: string
          violation_count?: number
          violation_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          document_id: string
          id: string
          rating: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          rating: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      saved: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          media_type: string
          media_url: string
          user_id: string
          visibility: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type: string
          media_url: string
          user_id: string
          visibility?: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          text: string
          user_id: string
          visibility: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          text: string
          user_id: string
          visibility?: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          text?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_loves: {
        Row: {
          created_at: string | null
          id: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_loves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          total_points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          total_points?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          total_points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_friends: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      check_random_connect_ban: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_content: string
          p_link?: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_random_connect_report_count: {
        Args: { check_user_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
