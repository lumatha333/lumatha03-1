import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Story {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  media_urls: string[] | null;
  media_types: string[] | null;
  category: string | null;
  created_at: string | null;
  profiles?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface StoryGroup {
  user_id: string;
  name: string;
  avatar_url: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}

export function useStories() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('category', 'story')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      if (!data) { setStoryGroups([]); return; }

      // Group by user
      const grouped: Record<string, StoryGroup> = {};
      const viewedKey = `lumatha_viewed_stories_${user.id}`;
      const viewed: string[] = JSON.parse(localStorage.getItem(viewedKey) || '[]');

      data.forEach((story: any) => {
        const uid = story.user_id;
        if (!grouped[uid]) {
          grouped[uid] = {
            user_id: uid,
            name: story.profiles?.name || 'Anonymous',
            avatar_url: story.profiles?.avatar_url || null,
            stories: [],
            hasUnviewed: false,
          };
        }
        grouped[uid].stories.push(story);
        if (!viewed.includes(story.id)) grouped[uid].hasUnviewed = true;
      });

      // Current user first
      const groups = Object.values(grouped);
      const myIndex = groups.findIndex(g => g.user_id === user.id);
      if (myIndex > 0) {
        const [mine] = groups.splice(myIndex, 1);
        groups.unshift(mine);
      }

      setStoryGroups(groups);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const markViewed = useCallback((storyId: string) => {
    if (!user) return;
    const viewedKey = `lumatha_viewed_stories_${user.id}`;
    const viewed: string[] = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    if (!viewed.includes(storyId)) {
      viewed.push(storyId);
      localStorage.setItem(viewedKey, JSON.stringify(viewed));
    }
  }, [user]);

  const createStory = useCallback(async (opts: {
    content?: string;
    file_url?: string;
    file_type?: string;
    media_urls?: string[];
    media_types?: string[];
    title?: string;
  }) => {
    if (!user) return null;
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id,
      category: 'story',
      visibility: 'public',
      title: opts.title || 'Story',
      content: opts.content || '',
      file_url: opts.file_url || null,
      file_type: opts.file_type || null,
      media_urls: opts.media_urls || [],
      media_types: opts.media_types || [],
    }).select().single();
    if (error) throw error;
    await fetchStories();
    return data;
  }, [user, fetchStories]);

  return { storyGroups, loading, fetchStories, markViewed, createStory };
}
