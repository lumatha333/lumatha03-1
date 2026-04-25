import { useState, useEffect } from 'react';
import { 
  X, Shield, Clock, MessageCircle, Heart, Sparkles, 
  ChevronRight, Globe, Users, Lock, Eye, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StorySettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

type Visibility = 'public' | 'friends' | 'following' | 'private';
type Duration = '6h' | '12h' | '24h' | '48h';

export function StorySettingsSheet({ open, onClose }: StorySettingsSheetProps) {
  const { user } = useAuth();
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [duration, setDuration] = useState<Duration>('24h');
  const [allowReplies, setAllowReplies] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from profile/metadata if exists
  useEffect(() => {
    if (!user) return;
    // In a real app, we'd fetch actual user preferences here
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success('Story preferences updated');
    onClose();
  };

  const visibilityOptions = [
    { id: 'public', label: 'Public', icon: Globe, desc: 'Everyone can see your stories' },
    { id: 'friends', label: 'Friends', icon: Users, desc: 'Only mutual followers' },
    { id: 'following', label: 'Following', icon: Bell, desc: 'People you follow' },
    { id: 'private', label: 'Only Me', icon: Lock, desc: 'Keep it as a private diary' },
  ];

  const durationOptions: Duration[] = ['6h', '12h', '24h', '48h'];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-[#0a0f1f] rounded-t-[32px] sm:rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">Story Settings</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Privacy & Experience</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
              
              {/* Visibility Section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Privacy & Reach</h3>
                <div className="grid gap-3">
                  {visibilityOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setVisibility(opt.id as Visibility)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl transition-all border",
                        visibility === opt.id 
                          ? "bg-primary/10 border-primary/30 text-white" 
                          : "bg-white/[0.03] border-white/5 text-gray-400 hover:bg-white/[0.05]"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        visibility === opt.id ? "bg-primary text-white" : "bg-white/5"
                      )}>
                        <opt.icon size={22} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-black uppercase tracking-tight">{opt.label}</p>
                        <p className="text-[10px] font-medium opacity-60">{opt.desc}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        visibility === opt.id ? "border-primary bg-primary scale-110" : "border-white/10"
                      )}>
                        {visibility === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Duration Section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Display Duration</h3>
                <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl">
                  {durationOptions.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        duration === d 
                          ? "bg-white text-black shadow-xl scale-[1.02]" 
                          : "text-gray-500 hover:text-white"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </section>

              {/* Toggles Section */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Interactions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <MessageCircle size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">Allow Replies</p>
                        <p className="text-[10px] text-gray-600 font-bold uppercase">Enable direct messages</p>
                      </div>
                    </div>
                    <Switch checked={allowReplies} onCheckedChange={setAllowReplies} />
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <Heart size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">Show Reactions</p>
                        <p className="text-[10px] text-gray-600 font-bold uppercase">Allow emoji bursts</p>
                      </div>
                    </div>
                    <Switch checked={allowReactions} onCheckedChange={setAllowReactions} />
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 border-dashed">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">AI Assist Mode</p>
                        <p className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-black uppercase">Auto-generate aesthetic</p>
                      </div>
                    </div>
                    <Switch checked={aiSuggestions} onCheckedChange={setAiSuggestions} />
                  </div>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="p-6 bg-white/[0.02] border-t border-white/5">
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-[0.98]"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  "Apply Changes"
                )}
              </Button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
