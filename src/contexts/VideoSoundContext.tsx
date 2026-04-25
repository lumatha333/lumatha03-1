import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

const VIDEO_SOUND_PREFERENCE_KEY = 'video_sound_preference';

interface VideoSoundContextType {
  globalMuted: boolean;
  setGlobalMuted: (muted: boolean) => void;
  activeVideoId: string | null;
  setActiveVideoId: (id: string | null) => void;
  toggleGlobalMute: () => void;
}

const VideoSoundContext = createContext<VideoSoundContextType>({
  globalMuted: true,
  setGlobalMuted: () => {},
  activeVideoId: null,
  setActiveVideoId: () => {},
  toggleGlobalMute: () => {},
});

export function VideoSoundProvider({ children }: { children: ReactNode }) {
  const [globalMuted, setGlobalMuted] = useState(() => {
    const stored = localStorage.getItem(VIDEO_SOUND_PREFERENCE_KEY);
    if (stored === 'unmuted') return false;
    return true;
  });
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const toggleGlobalMute = useCallback(() => {
    setGlobalMuted(prev => {
      const next = !prev;
      localStorage.setItem(VIDEO_SOUND_PREFERENCE_KEY, next ? 'muted' : 'unmuted');
      return next;
    });
  }, []);

  const handleSetGlobalMuted = useCallback((muted: boolean) => {
    setGlobalMuted(muted);
    localStorage.setItem(VIDEO_SOUND_PREFERENCE_KEY, muted ? 'muted' : 'unmuted');
  }, []);

  return (
    <VideoSoundContext.Provider value={{ 
      globalMuted, 
      setGlobalMuted: handleSetGlobalMuted,
      activeVideoId, 
      setActiveVideoId,
      toggleGlobalMute 
    }}>
      {children}
    </VideoSoundContext.Provider>
  );
}

export const useVideoSound = () => useContext(VideoSoundContext);
