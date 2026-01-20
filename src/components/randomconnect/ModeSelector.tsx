import React from 'react';
import { Mic, Video, MessageCircle, Globe, Languages, Info, Shield, Clock, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConnectionMode } from '@/hooks/useRandomConnect';
import { SecurityTips } from './SecurityTips';

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

interface ModeInfo {
  id: ConnectionMode;
  icon: typeof Mic;
  label: string;
  desc: string;
  details: string;
  color: string;
  gradient: string;
  features: string[];
}

const modes: ModeInfo[] = [
  { 
    id: 'audio', 
    icon: Mic, 
    label: 'Audio', 
    desc: 'Voice only', 
    details: 'Like two people in a car - comfortable, no pressure',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Pure voice connection', 'Ambient sounds', 'No video pressure']
  },
  { 
    id: 'video', 
    icon: Video, 
    label: 'Video', 
    desc: 'Face to face', 
    details: 'Split screen with optional blur for comfort',
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-pink-500',
    features: ['Blur option', '15 min limit', 'Camera toggle']
  },
  { 
    id: 'text', 
    icon: MessageCircle, 
    label: 'Text', 
    desc: 'Thoughtful chat', 
    details: 'Write thoughts freely with memory feature',
    color: 'text-green-500',
    gradient: 'from-green-500 to-emerald-500',
    features: ['No timestamps', 'Memory feature', 'Pressure-free']
  },
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
  const selectedMode = modes.find(m => m.id === mode);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Heart className="w-6 h-6 text-primary fill-primary/30" />
          <h2 className="text-2xl font-bold gradient-text">Random Connect</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Share a moment, not a profile
        </p>
      </div>

      {/* Mode Selection with Icons */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Choose Connection Type</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`relative p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1.5 ${
                mode === m.id
                  ? `border-primary bg-gradient-to-br ${m.gradient} text-white shadow-lg scale-[1.02]`
                  : 'border-border bg-card hover:border-muted-foreground/50 hover:bg-muted/50'
              }`}
            >
              <m.icon className={`w-5 h-5 ${mode === m.id ? 'text-white' : m.color}`} />
              <span className={`text-xs font-medium ${mode === m.id ? 'text-white' : 'text-foreground'}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Mode Details */}
      {selectedMode && (
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedMode.gradient} flex items-center justify-center`}>
              <selectedMode.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{selectedMode.label} Connect</h3>
              <p className="text-xs text-muted-foreground">{selectedMode.details}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {selectedMode.features.map((feature, i) => (
              <span 
                key={i}
                className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="flex-1 h-10 rounded-xl">
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
          <Globe className="w-4 h-4 text-muted-foreground" />
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="flex-1 h-10 rounded-xl">
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

      {/* Start Button - FIRST, above security tips */}
      <Button
        onClick={onStart}
        disabled={isBanned}
        className="w-full py-6 text-lg font-semibold btn-cosmic rounded-2xl"
      >
        {isBanned ? '🔒 You are temporarily banned' : '💙 Start Connecting'}
      </Button>

      {/* Privacy & Security Explanation */}
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30">
          <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your identity is protected with a new random name each session. 
            No following, no reconnecting, just genuine moments. 
            20 seconds minimum stay before skip.
          </p>
        </div>
        
        {/* Security Tips */}
        <SecurityTips />
      </div>
    </div>
  );
};
