import { useState, useEffect } from 'react';
import { Play, Image as ImageIcon, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PostData {
  id: string;
  title: string;
  content?: string | null;
  media_urls?: string[] | null;
  media_types?: string[] | null;
  file_url?: string | null;
  file_type?: string | null;
  user_id: string;
  profile?: { name: string; avatar_url?: string | null };
}

interface SharedPostPreviewProps {
  postId: string;
  className?: string;
}

const postCache = new Map<string, PostData | null>();

export function SharedPostPreview({ postId, className }: SharedPostPreviewProps) {
  const [post, setPost] = useState<PostData | null>(postCache.get(postId) || null);
  const [loading, setLoading] = useState(!postCache.has(postId));

  useEffect(() => {
    if (postCache.has(postId)) {
      setPost(postCache.get(postId) || null);
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, title, content, media_urls, media_types, file_url, file_type, user_id')
          .eq('id', postId)
          .single();

        if (error || !data) {
          postCache.set(postId, null);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', data.user_id)
          .single();

        const postData: PostData = { ...data, profile: profile || undefined };
        postCache.set(postId, postData);
        setPost(postData);
      } catch {
        postCache.set(postId, null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className={cn('rounded-2xl overflow-hidden border border-border/30 bg-muted/20', className)}>
        <div className="h-36 bg-muted animate-pulse" />
        <div className="p-3 space-y-2">
          <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-2.5 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={cn('rounded-2xl border border-border/30 bg-muted/20 p-3', className)}>
        <p className="text-xs text-muted-foreground">Post unavailable</p>
      </div>
    );
  }

  // Get thumbnail
  const thumbnail = post.media_urls?.[0] || post.file_url;
  const mediaType = post.media_types?.[0] || post.file_type;
  const isVideo = mediaType?.startsWith('video');
  const isImage = mediaType?.startsWith('image');

  const handleClick = () => {
    window.open(`/?post=${post.id}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'block w-full rounded-2xl overflow-hidden border border-border/30 bg-card/60 hover:bg-card/90 transition-all text-left',
        'shadow-sm hover:shadow-md',
        className
      )}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative w-full h-40 overflow-hidden bg-muted">
          {isVideo ? (
            <>
              <video
                src={thumbnail}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            </>
          ) : isImage ? (
            <img
              src={thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-3 space-y-1">
        {post.profile && (
          <p className="text-[10px] text-muted-foreground font-medium">
            {post.profile.name}
          </p>
        )}
        <p className="text-sm font-semibold leading-snug line-clamp-2 text-foreground">
          {post.title}
        </p>
        {post.content && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {post.content}
          </p>
        )}
      </div>
    </button>
  );
}

/** Extract post ID from internal URLs */
export function extractInternalPostId(text: string): string | null {
  // Match ?post=UUID pattern
  const match = text.match(/[?&]post=([a-f0-9-]{36})/i);
  return match?.[1] || null;
}

/** Check if text is a shared post message */
export function isSharedPostMessage(content: string): boolean {
  return content.startsWith('📤 Shared a post:') || 
         (content.includes('lovableproject.com') && content.includes('post='));
}
