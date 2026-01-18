import React from 'react';
import { Mic, Video, MessageCircle, Globe, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConnectionMode } from '@/hooks/useRandomConnect';

interface ModeSelectorProps {
  mode: ConnectionMode;
  setMode: (mode: ConnectionMode) => void;
  language: string;
  setLanguage: (language: string) => void;
  region: string;
  setRegion: (region: string) => void;
  onStart: () => void;
  isBanned: boolean;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ne', name: 'Nepali' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
];

const regions = [
  { code: 'international', name: 'International' },
  { code: 'local', name: 'Local / Nearby' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  setMode,
  language,
  setLanguage,
  region,
  setRegion,
  onStart,
  isBanned
}) => {
  const modes = [
    { id: 'audio' as ConnectionMode, icon: Mic, label: 'Audio', desc: 'Voice only, like two people in a car', color: 'from-blue-500 to-cyan-500' },
    { id: 'video' as ConnectionMode, icon: Video, label: 'Video', desc: 'Face to face with blur option', color: 'from-purple-500 to-pink-500' },
    { id: 'text' as ConnectionMode, icon: MessageCircle, label: 'Text', desc: 'Write thoughts, not scores', color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="flex flex-col items-center gap-8 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold gradient-text">Random Connect</h2>
        <p className="text-muted-foreground text-sm">
          Share a moment, not a profile
        </p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
              mode === m.id
                ? `border-primary bg-gradient-to-br ${m.color} text-white shadow-lg scale-105`
                : 'border-border bg-card hover:border-muted-foreground/50'
            }`}
          >
            <m.icon className={`w-8 h-8 ${mode === m.id ? 'text-white' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-medium ${mode === m.id ? 'text-white' : 'text-foreground'}`}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Mode Description */}
      <p className="text-center text-sm text-muted-foreground">
        {modes.find(m => m.id === mode)?.desc}
      </p>

      {/* Optional Filters */}
      <div className="w-full space-y-4">
        <div className="flex items-center gap-3">
          <Languages className="w-5 h-5 text-muted-foreground" />
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-muted-foreground" />
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((reg) => (
                <SelectItem key={reg.code} value={reg.code}>
                  {reg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={onStart}
        disabled={isBanned}
        className="w-full py-6 text-lg font-semibold btn-cosmic rounded-2xl"
      >
        {isBanned ? 'You are temporarily banned' : '💙 Start Connecting'}
      </Button>

      {/* Privacy Note */}
      <p className="text-xs text-center text-muted-foreground max-w-xs">
        Your identity is protected. A new random name is generated each session.
        No following, no reconnecting, just genuine moments.
      </p>
    </div>
  );
};
