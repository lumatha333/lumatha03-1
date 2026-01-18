import { useState, useRef, useCallback, useEffect } from 'react';

export type AmbientSound = 'none' | 'rain' | 'cafe' | 'fireplace' | 'road' | 'nature';

interface AmbientSoundOption {
  id: AmbientSound;
  label: string;
  emoji: string;
  description: string;
}

export const ambientSounds: AmbientSoundOption[] = [
  { id: 'none', label: 'None', emoji: '🔇', description: 'No ambient sound' },
  { id: 'rain', label: 'Rain', emoji: '🌧️', description: 'Gentle rain sounds' },
  { id: 'cafe', label: 'Café', emoji: '☕', description: 'Cozy café ambiance' },
  { id: 'fireplace', label: 'Fireplace', emoji: '🔥', description: 'Crackling fire' },
  { id: 'road', label: 'Road', emoji: '🚗', description: 'Car journey vibes' },
  { id: 'nature', label: 'Nature', emoji: '🌲', description: 'Forest sounds' },
];

// Audio URLs for ambient sounds (using free sound sources)
const soundUrls: Record<AmbientSound, string | null> = {
  none: null,
  rain: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2d4f4f8d0f.mp3',
  cafe: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_a0ed0c0c2e.mp3',
  fireplace: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13c8c41.mp3',
  road: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39bde808.mp3',
  nature: 'https://cdn.pixabay.com/download/audio/2022/02/23/audio_ffc0c23ad8.mp3',
};

export const useAmbientSounds = () => {
  const [currentSound, setCurrentSound] = useState<AmbientSound>('none');
  const [volume, setVolume] = useState(0.3);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((sound: AmbientSound) => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (sound === 'none') {
      setCurrentSound('none');
      setIsPlaying(false);
      return;
    }

    const url = soundUrls[sound];
    if (!url) return;

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume;
    
    audio.play().then(() => {
      setIsPlaying(true);
      setCurrentSound(sound);
    }).catch((err) => {
      console.log('Audio playback failed:', err);
      // Fallback: generate synthetic ambient sounds
      generateSyntheticSound(sound);
    });
    
    audioRef.current = audio;
  }, [volume]);

  // Generate synthetic ambient sounds using Web Audio API as fallback
  const generateSyntheticSound = useCallback((sound: AmbientSound) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create noise generator
    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      // Different noise patterns for different sounds
      if (sound === 'rain') {
        output[i] = (Math.random() * 2 - 1) * 0.05;
      } else if (sound === 'cafe') {
        output[i] = (Math.random() * 2 - 1) * 0.02;
      } else if (sound === 'fireplace') {
        output[i] = (Math.random() * 2 - 1) * 0.03 * (1 + Math.sin(i / 10000));
      } else if (sound === 'road') {
        output[i] = (Math.random() * 2 - 1) * 0.01;
      } else {
        output[i] = (Math.random() * 2 - 1) * 0.02;
      }
    }
    
    const whiteNoise = audioContext.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    
    // Apply filter based on sound type
    const filter = audioContext.createBiquadFilter();
    filter.type = sound === 'rain' ? 'highpass' : 'lowpass';
    filter.frequency.value = sound === 'rain' ? 500 : 800;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    
    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    whiteNoise.start();
    setIsPlaying(true);
    setCurrentSound(sound);
  }, [volume]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentSound('none');
  }, []);

  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    currentSound,
    volume,
    isPlaying,
    ambientSounds,
    playSound,
    stopSound,
    updateVolume
  };
};
