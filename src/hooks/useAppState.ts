import { useState, useEffect } from 'react';
import { AppState } from '@/types';
import { loadState, saveState } from '@/lib/storage';

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const toggleSave = (postId: string) => {
    setState((prev) => ({
      ...prev,
      saved: prev.saved.includes(postId)
        ? prev.saved.filter((id) => id !== postId)
        : [...prev.saved, postId],
    }));
  };

  const addPost = (post: any) => {
    setState((prev) => ({
      ...prev,
      posts: [post, ...prev.posts],
    }));
  };

  const deletePost = (postId: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.filter(p => p.id !== postId),
      saved: prev.saved.filter(id => id !== postId)
    }));
  };

  const updatePost = (postId: string, updates: Partial<any>) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? { ...p, ...updates } : p)
    }));
  };

  return { state, setState, toggleSave, addPost, deletePost, updatePost };
}
