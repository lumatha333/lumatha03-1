import { supabase } from '@/integrations/supabase/client';

/**
 * Get a signed URL for accessing private chat media
 * Signed URLs expire after the specified duration (default: 1 hour)
 */
export const getChatMediaSignedUrl = async (
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('chat-media')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
};

/**
 * Get multiple signed URLs at once for efficiency
 */
export const getChatMediaSignedUrls = async (
  filePaths: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> => {
  const urlMap = new Map<string, string>();

  try {
    const { data, error } = await supabase.storage
      .from('chat-media')
      .createSignedUrls(filePaths, expiresIn);

    if (error) {
      console.error('Error creating signed URLs:', error);
      return urlMap;
    }

    if (data) {
      data.forEach((item) => {
        if (item.signedUrl && item.path) {
          urlMap.set(item.path, item.signedUrl);
        }
      });
    }

    return urlMap;
  } catch (error) {
    console.error('Error getting signed URLs:', error);
    return urlMap;
  }
};

/**
 * Extract file path from a Supabase storage URL
 */
export const extractFilePathFromUrl = (url: string): string | null => {
  try {
    // Match pattern: /storage/v1/object/public/bucket-name/path
    const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    
    // Try alternative pattern for signed URLs
    const signedMatch = url.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+?)\?/);
    if (signedMatch && signedMatch[1]) {
      return decodeURIComponent(signedMatch[1]);
    }

    return null;
  } catch (error) {
    console.error('Error extracting file path:', error);
    return null;
  }
};

/**
 * Check if a URL is from chat-media bucket
 */
export const isChatMediaUrl = (url: string): boolean => {
  return url.includes('/chat-media/');
};

/**
 * Replace public URL with signed URL for chat media
 */
export const getSecureMediaUrl = async (url: string): Promise<string> => {
  if (!isChatMediaUrl(url)) {
    return url; // Not a chat media URL, return as-is
  }

  const filePath = extractFilePathFromUrl(url);
  if (!filePath) {
    return url; // Couldn't extract path, return original
  }

  const signedUrl = await getChatMediaSignedUrl(filePath);
  return signedUrl || url;
};
