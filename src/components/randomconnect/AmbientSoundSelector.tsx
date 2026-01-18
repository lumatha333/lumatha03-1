import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AmbientSound, ambientSounds } from '@/hooks/useAmbientSounds';

interface AmbientSoundSelectorProps {
  currentSound: AmbientSound;
  volume: number;
  isPlaying: boolean;
  onSelectSound: (sound: AmbientSound) => void;
  onVolumeChange: (volume: number) => void;
  compact?: boolean;
}

export const AmbientSoundSelector: React.FC<AmbientSoundSelectorProps> = ({
  currentSound,
  volume,
  isPlaying,
  onSelectSound,
  onVolumeChange,
  compact = false
}) => {
  const currentSoundData = ambientSounds.find(s => s.id === currentSound);

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 h-8 px-2 rounded-full bg-background/60 backdrop-blur-sm"
          >
            <span className="text-sm">{currentSoundData?.emoji || '🔇'}</span>
            {isPlaying && currentSound !== 'none' && (
              <Volume2 className="w-3 h-3 text-primary animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Ambient Sound</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ambientSounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => onSelectSound(sound.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    currentSound === sound.id
                      ? 'bg-primary/20 ring-1 ring-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-lg">{sound.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{sound.label}</span>
                </button>
              ))}
            </div>
            {currentSound !== 'none' && (
              <div className="flex items-center gap-2 pt-2">
                <VolumeX className="w-3 h-3 text-muted-foreground" />
                <Slider
                  value={[volume * 100]}
                  onValueChange={(v) => onVolumeChange(v[0] / 100)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Volume2 className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Ambient Sound</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ambientSounds.map((sound) => (
          <button
            key={sound.id}
            onClick={() => onSelectSound(sound.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
              currentSound === sound.id
                ? 'bg-primary/20 ring-2 ring-primary shadow-lg'
                : 'bg-muted/50 hover:bg-muted'
            }`}
          >
            <span className="text-2xl">{sound.emoji}</span>
            <span className="text-xs font-medium">{sound.label}</span>
          </button>
        ))}
      </div>
      {currentSound !== 'none' && (
        <div className="flex items-center gap-3 px-2">
          <VolumeX className="w-4 h-4 text-muted-foreground" />
          <Slider
            value={[volume * 100]}
            onValueChange={(v) => onVolumeChange(v[0] / 100)}
            max={100}
            step={5}
            className="flex-1"
          />
          <Volume2 className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
