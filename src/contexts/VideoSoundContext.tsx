import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

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
  const [globalMuted, setGlobalMuted] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const toggleGlobalMute = useCallback(() => {
    setGlobalMuted(prev => !prev);
  }, []);

  return (
    <VideoSoundContext.Provider value={{ 
      globalMuted, 
      setGlobalMuted, 
      activeVideoId, 
      setActiveVideoId,
      toggleGlobalMute 
    }}>
      {children}
    </VideoSoundContext.Provider>
  );
}

export const useVideoSound = () => useContext(VideoSoundContext);
