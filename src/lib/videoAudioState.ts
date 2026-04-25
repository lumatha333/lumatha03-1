const ACTIVE_VIDEO_KEY = 'lumatha_active_video_id';
const GLOBAL_MUTE_KEY = 'lumatha_global_video_mute';
export const VIDEO_AUDIO_STATE_EVENT = 'lumatha:video-audio-state-changed';
export const PAUSE_ALL_VIDEOS_EVENT = 'lumatha:pause-all-videos';

export interface VideoAudioState {
  activeVideoId: string | null;
  isGlobalMuted: boolean;
}

const read = (): VideoAudioState => ({
  activeVideoId: localStorage.getItem(ACTIVE_VIDEO_KEY),
  isGlobalMuted: localStorage.getItem(GLOBAL_MUTE_KEY) === 'true',
});

const emit = () => {
  window.dispatchEvent(new CustomEvent<VideoAudioState>(VIDEO_AUDIO_STATE_EVENT, { detail: read() }));
};

export const getVideoAudioState = (): VideoAudioState => read();

export const setGlobalVideoMuted = (isMuted: boolean): void => {
  if (isMuted) {
    localStorage.setItem(GLOBAL_MUTE_KEY, 'true');
  } else {
    localStorage.removeItem(GLOBAL_MUTE_KEY);
  }
  emit();
};

export const setActiveVideoId = (videoId: string | null): void => {
  if (videoId) {
    localStorage.setItem(ACTIVE_VIDEO_KEY, videoId);
  } else {
    localStorage.removeItem(ACTIVE_VIDEO_KEY);
  }
  emit();
};

export const enableAudioForVideo = (videoId: string): void => {
  setGlobalVideoMuted(false);
  setActiveVideoId(videoId);
};

export const muteAllVideosGlobally = (): void => {
  setGlobalVideoMuted(true);
};

export const pauseAllVideosGlobally = (): void => {
  window.dispatchEvent(new CustomEvent(PAUSE_ALL_VIDEOS_EVENT));
};

export const shouldVideoBeMuted = (videoId: string, state?: VideoAudioState): boolean => {
  const current = state || read();
  if (current.isGlobalMuted) return true;
  return current.activeVideoId !== videoId;
};

export const subscribeVideoAudioState = (listener: (state: VideoAudioState) => void): (() => void) => {
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === ACTIVE_VIDEO_KEY || event.key === GLOBAL_MUTE_KEY) {
      listener(read());
    }
  };

  const onCustom = (event: Event) => {
    const custom = event as CustomEvent<VideoAudioState>;
    if (custom.detail) {
      listener(custom.detail);
      return;
    }
    listener(read());
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(VIDEO_AUDIO_STATE_EVENT, onCustom as EventListener);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(VIDEO_AUDIO_STATE_EVENT, onCustom as EventListener);
  };
};
