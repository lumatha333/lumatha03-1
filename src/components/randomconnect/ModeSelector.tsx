import React, { useState } from 'react';
import { MessageCircle, Mic, Video, Shield, ArrowRight, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { ConnectionMode } from '@/hooks/useRandomConnect';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ModeSelectorProps {
  mode: ConnectionMode;
  setMode: (mode: ConnectionMode) => void;
  language: string;
  setLanguage: (language: string) => void;
  region: string;
  setRegion: (region: string) => void;
  interests: string[];
  setInterests: (interests: string[]) => void;
  onStart: () => void;
  isBanned: boolean;
  onOpenMemories: () => void;
}

const languages = [
  { code: 'any', label: 'All', emoji: '🌐' },
  { code: 'ne', label: 'Nepali', emoji: '🇳🇵' },
  { code: 'en', label: 'English', emoji: '🇬🇧' },
  { code: 'hi', label: 'Hindi', emoji: '🇮🇳' },
  { code: 'ne+en', label: 'NP + EN', emoji: '🇳🇵' },
  { code: 'ne+hi', label: 'NP + HI', emoji: '🇳🇵' },
  { code: 'en+hi', label: 'EN + HI', emoji: '🌐' },
];

const regionGroups = [
  {
    label: '🌍 Global',
    items: [
      { code: 'any', label: 'All' },
      { code: 'international', label: 'International' },
    ],
  },
  {
    label: '🇳🇵 Nepal',
    items: [
      { code: 'nepal', label: 'All Nepal' },
      { code: 'lumbini', label: 'Lumbini' },
      { code: 'bagmati', label: 'Bagmati' },
      { code: 'gandaki', label: 'Gandaki' },
      { code: 'province1', label: 'Koshi' },
      { code: 'madhesh', label: 'Madhesh' },
      { code: 'karnali', label: 'Karnali' },
      { code: 'sudurpashchim', label: 'Sudurpashchim' },
    ],
  },
  {
    label: '🇮🇳 India',
    items: [
      { code: 'india', label: 'All India' },
      { code: 'delhi', label: 'Delhi' },
      { code: 'mumbai', label: 'Mumbai' },
      { code: 'kolkata', label: 'Kolkata' },
      { code: 'bangalore', label: 'Bangalore' },
      { code: 'chennai', label: 'Chennai' },
    ],
  },
];

const interestTags = [
  { id: 'all', emoji: '✨', label: 'All' },
  { id: 'gaming', emoji: '🎮', label: 'Gaming' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'travel', emoji: '🏔️', label: 'Travel' },
  { id: 'study', emoji: '📚', label: 'Study' },
  { id: 'work', emoji: '💼', label: 'Work' },
  { id: 'food', emoji: '🍕', label: 'Food' },
  { id: 'dating', emoji: '❤️', label: 'Dating' },
  { id: 'art', emoji: '🎨', label: 'Art' },
  { id: 'sports', emoji: '⚽', label: 'Sports' },
  { id: 'fun', emoji: '😂', label: 'Fun' },
  { id: 'deep-talk', emoji: '💭', label: 'Deep Talk' },
  { id: 'nepal', emoji: '🇳🇵', label: 'Nepal' },
  { id: 'tech', emoji: '💻', label: 'Tech' },
  { id: 'movies', emoji: '🎬', label: 'Movies' },
];

const modes = [
  { id: 'text' as ConnectionMode, icon: MessageCircle, label: 'Text', desc: 'Anonymous chat', gradient: 'from-[hsl(270,70%,50%)] to-[hsl(280,80%,60%)]' },
  { id: 'audio' as ConnectionMode, icon: Mic, label: 'Audio', desc: 'Voice connect', gradient: 'from-[hsl(210,100%,55%)] to-[hsl(200,90%,60%)]' },
  { id: 'video' as ConnectionMode, icon: Video, label: 'Video', desc: 'Face to face', gradient: 'from-[hsl(330,80%,55%)] to-[hsl(340,90%,60%)]' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode, setMode, language, setLanguage, region, setRegion,
  interests, setInterests, onStart, isBanned, onOpenMemories
}) => {
  const [buttonPulsing, setButtonPulsing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const toggleInterest = (id: string) => {
    if (id === 'all') { setInterests(['all']); return; }
    const without = interests.filter(i => i !== 'all');
    if (without.includes(id)) {
      const result = without.filter(i => i !== id);
      setInterests(result.length === 0 ? ['all'] : result);
    } else {
      if (without.length >= 3) { toast('Max 3 interests', { description: 'Deselect one first' }); return; }
      setInterests([...without, id]);
    }
  };

  const handleStart = () => {
    setButtonPulsing(true);
    setTimeout(() => { setButtonPulsing(false); onStart(); }, 300);
  };

  const selectedLangLabel = languages.find(l => l.code === language)?.label || 'All';
  const selectedRegionLabel = regionGroups.flatMap(g => g.items).find(r => r.code === region)?.label || 'All';
  const selectedInterestLabels = interests.includes('all') ? 'All' : interests.map(i => interestTags.find(t => t.id === i)?.label).filter(Boolean).join(', ');

  return (
    <div className="relative min-h-screen pb-8" style={{ background: 'hsl(220, 60%, 8%)' }}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-72 h-72 rounded-full opacity-30 blur-[80px] animate-[orbFloat1_8s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, hsl(270,70%,50%), transparent)' }} />
        <div className="absolute top-[30%] right-[10%] w-60 h-60 rounded-full opacity-20 blur-[80px] animate-[orbFloat2_10s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, hsl(210,100%,55%), transparent)' }} />
      </div>

      <div className="relative z-10 px-4 pt-4">
        {/* Hero */}
        <div className="text-center pt-1 pb-3 relative">
          <button onClick={onOpenMemories} className="absolute top-1 right-0 p-2 rounded-full hover:bg-white/5 transition-colors" title="Memories">
            <Clock className="w-5 h-5 text-foreground" />
          </button>
          <div className="relative w-14 h-14 mx-auto mb-3">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(270,70%,50%)] to-[hsl(210,100%,55%)] opacity-20 blur-xl animate-pulse" />
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg viewBox="0 0 80 80" className="w-14 h-14">
                <defs><linearGradient id="rcGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="hsl(270,70%,50%)" /><stop offset="100%" stopColor="hsl(210,100%,55%)" /></linearGradient></defs>
                <g className="animate-[spin_12s_linear_infinite]" style={{ transformOrigin: '40px 40px' }}><circle cx="28" cy="40" r="10" fill="url(#rcGrad)" opacity="0.9" /></g>
                <g className="animate-[spin_12s_linear_infinite_reverse]" style={{ transformOrigin: '40px 40px', animationDirection: 'reverse' }}><circle cx="52" cy="40" r="10" fill="url(#rcGrad)" opacity="0.9" /></g>
                <line x1="32" y1="40" x2="48" y2="40" stroke="url(#rcGrad)" strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
              </svg>
            </div>
          </div>
          <h1 className="text-[26px] font-black tracking-[-0.5px] text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Random Connect</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'hsl(215, 20%, 65%)' }}>Share a moment, not a profile</p>
        </div>

        {/* Connection Mode */}
        <div className="mt-2">
          <p className="text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: 'hsl(215, 20%, 45%)' }}>Connect via</p>
          <div className="grid grid-cols-3 gap-2">
            {modes.map((m) => {
              const isSelected = mode === m.id;
              return (
                <motion.button key={m.id} whileTap={{ scale: 0.97 }} onClick={() => setMode(m.id)}
                  className={`relative flex flex-col items-center gap-1 py-3.5 px-2 rounded-2xl border-2 transition-all duration-200 ${isSelected ? 'border-[hsl(270,70%,50%)]' : 'border-transparent'}`}
                  style={{ background: isSelected ? 'hsla(270, 70%, 50%, 0.1)' : 'hsl(220, 45%, 14%)', boxShadow: isSelected ? '0 0 20px hsla(270, 70%, 50%, 0.2)' : 'none' }}>
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center`}>
                    <m.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[13px] font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.label}</span>
                  <span className="text-[9px]" style={{ color: isSelected ? 'hsl(160,84%,39%)' : 'hsl(215,20%,50%)' }}>{m.desc}</span>
                </motion.button>
              );
            })}
          </div>
          
          {/* Audio/Video Development Notice */}
          {(mode === 'audio' || mode === 'video') && (
            <div className="mt-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <p className="text-[12px] font-medium text-emerald-400 text-center">
                🎧 Listen: 99% complete, we will try to take this into live action soon
              </p>
            </div>
          )}
        </div>

        {/* Preferences - Collapsible Sections */}
        <div className="mt-4 space-y-1.5">
          <p className="text-[11px] font-medium mb-1 uppercase tracking-wider" style={{ color: 'hsl(215, 20%, 45%)' }}>Preferences</p>

          {/* Language Section */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 20%)' }}>
            <button onClick={() => toggleSection('language')} className="w-full flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px]">🌐</span>
                <span className="text-[12px] font-medium text-foreground">Language</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'hsla(270,70%,50%,0.15)', color: 'hsl(260,80%,75%)' }}>{selectedLangLabel}</span>
                {expandedSection === 'language' ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
            </button>
            <AnimatePresence>
              {expandedSection === 'language' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 flex gap-1.5 flex-wrap">
                    {languages.map((l) => (
                      <button key={l.code} onClick={() => setLanguage(l.code)}
                        className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all border ${language === l.code ? 'bg-[hsl(270,70%,50%)] text-white border-[hsl(270,70%,50%)]' : 'border-[hsl(220,30%,20%)] text-[hsl(215,20%,65%)]'}`}
                        style={{ background: language === l.code ? undefined : 'hsl(220, 35%, 18%)' }}>
                        {l.emoji} {l.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Region Section */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 20%)' }}>
            <button onClick={() => toggleSection('region')} className="w-full flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px]">📍</span>
                <span className="text-[12px] font-medium text-foreground">Region</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'hsla(270,70%,50%,0.15)', color: 'hsl(260,80%,75%)' }}>{selectedRegionLabel}</span>
                {expandedSection === 'region' ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
            </button>
            <AnimatePresence>
              {expandedSection === 'region' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3 space-y-2">
                    {regionGroups.map((group) => (
                      <div key={group.label}>
                        <p className="text-[10px] font-medium mb-1" style={{ color: 'hsl(215, 20%, 45%)' }}>{group.label}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {group.items.map((r) => (
                            <button key={r.code} onClick={() => setRegion(r.code)}
                              className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all border ${region === r.code ? 'bg-[hsl(270,70%,50%)] text-white border-[hsl(270,70%,50%)]' : 'border-[hsl(220,30%,20%)] text-[hsl(215,20%,65%)]'}`}
                              style={{ background: region === r.code ? undefined : 'hsl(220, 35%, 18%)' }}>
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interests Section */}
          <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(220, 45%, 14%)', border: '1px solid hsl(220, 30%, 20%)' }}>
            <button onClick={() => toggleSection('interests')} className="w-full flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px]">🎯</span>
                <span className="text-[12px] font-medium text-foreground">Match by Interest</span>
                <span className="text-[9px]" style={{ color: 'hsl(220, 15%, 40%)' }}>(optional)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full max-w-[100px] truncate" style={{ background: 'hsla(270,70%,50%,0.15)', color: 'hsl(260,80%,75%)' }}>{selectedInterestLabels}</span>
                {expandedSection === 'interests' ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
            </button>
            <AnimatePresence>
              {expandedSection === 'interests' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-3 pb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px]" style={{ color: 'hsl(220, 15%, 40%)' }}>Select up to 3</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {interestTags.map((tag) => {
                        const selected = interests.includes(tag.id);
                        return (
                          <button key={tag.id} onClick={() => toggleInterest(tag.id)}
                            className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all border ${selected ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(220,30%,20%)]'}`}
                            style={{ background: selected ? 'hsla(270, 70%, 50%, 0.15)' : 'hsl(220, 35%, 18%)', color: selected ? 'hsl(260, 80%, 75%)' : 'hsl(215, 20%, 65%)' }}>
                            {tag.emoji} {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Start Button */}
        <motion.div className="mt-5 mb-2">
          <motion.button whileTap={{ scale: 0.97 }} animate={buttonPulsing ? { scale: [1, 1.03, 1] } : {}} onClick={handleStart} disabled={isBanned}
            className="w-full h-[54px] rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-shadow hover:shadow-[0_0_30px_hsla(270,70%,50%,0.3)]"
            style={{ background: isBanned ? 'hsl(220, 30%, 25%)' : 'linear-gradient(135deg, hsl(270,70%,50%), hsl(210,100%,55%))', fontFamily: "'Space Grotesk', sans-serif" }}>
            {isBanned ? '🔒 Temporarily Banned' : <><span className="text-xl">💜</span>Start Connecting<ArrowRight className="w-5 h-5" /></>}
          </motion.button>
        </motion.div>

        {/* Privacy note */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Shield className="w-3 h-3" style={{ color: 'hsl(215, 20%, 55%)' }} />
          <p className="text-[10px] text-center" style={{ color: 'hsl(215, 20%, 55%)' }}>Anonymous • Auto-deletes in 24h • No screenshots</p>
        </div>
      </div>

      <style>{`
        @keyframes orbFloat1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -20px); } }
        @keyframes orbFloat2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-25px, 15px); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
