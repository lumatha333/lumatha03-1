import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, Type, Mic, Sparkles, Image as ImageIcon, 
  ArrowRight, Zap, Settings, Clock, ChevronRight
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { StorySettingsSheet } from './StorySettingsSheet';

interface AddStorySheetV2Props {
  open: boolean;
  onClose: () => void;
  onSelectAction: (mode: 'media' | 'text' | 'voice' | 'dang') => void;
}

const actions = [
  { 
    id: 'text', 
    title: "Text Story", 
    desc: "No description needed", 
    icon: Type, 
    grad: "from-blue-500/20 to-cyan-600/20", 
    iconColor: "text-cyan-400",
    badge: null
  },
  { 
    id: 'dang', 
    title: "Dang Story", 
    desc: "Real-time camera capture", 
    icon: Camera, 
    grad: "from-pink-500/20 to-rose-600/20", 
    iconColor: "text-pink-400",
    badge: "NEW"
  },
  { 
    id: 'voice', 
    title: "Voice Story", 
    desc: "Coming soon", 
    icon: Mic, 
    grad: "from-emerald-500/20 to-teal-600/20", 
    iconColor: "text-emerald-400",
    badge: "SOON"
  },
  { 
    id: 'media', 
    title: "From Gallery", 
    desc: "Choose from device", 
    icon: ImageIcon, 
    grad: "from-purple-500/20 to-indigo-600/20", 
    iconColor: "text-indigo-400",
    badge: null
  }
];

const suggestions = [
  { title: "Share a moment", desc: "Capture something special", icon: Camera, action: 'dang' as const },
  { title: "Express yourself", desc: "Text story with style", icon: Type, action: 'text' as const },
  { title: "Best of gallery", desc: "Top picks for you", icon: ImageIcon, action: 'media' as const }
];

export function AddStorySheetV2({ open, onClose, onSelectAction }: AddStorySheetV2Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recentMedia, setRecentMedia] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recent media when permission granted
  useEffect(() => {
    if (permissionStatus === 'granted' && open) {
      loadRecentMedia();
    }
  }, [permissionStatus, open]);

  const loadRecentMedia = async () => {
    try {
      // In a real mobile app, this would use native APIs
      // For web, we'll show a placeholder since direct file system access requires
      // specific permissions and APIs
      
      // Check if File System Access API is supported
      if ('showOpenFilePicker' in window) {
        // We could use this for a more native-like experience
        // But for now, we'll just show the standard file picker
      }
    } catch (err) {
      console.error('Failed to load recent media:', err);
    }
  };

  const handleAction = (mode: 'media' | 'text' | 'voice' | 'dang') => {
    if (mode === 'voice') {
      // Show coming soon toast
      return;
    }
    onSelectAction(mode);
  };

  const handleMediaSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file selection
      onSelectAction('media');
    }
  };

  const requestGalleryPermission = () => {
    // In a real mobile app, this would request gallery/photos permission
    // For web, the file input is the standard way
    setPermissionStatus('granted');
    handleMediaSelect();
  };

  if (!open) return null;

  return createPortal(
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="fixed inset-0 z-[10000] flex items-end justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-xl bg-[#050814]/95 rounded-t-[32px] sm:rounded-[32px] overflow-hidden border-t border-x border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
        >
          {/* Handle */}
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0" />

          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Create Story</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSettingsOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                title="Story Settings"
              >
                <Settings size={18} className="text-gray-400" />
              </button>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-12 space-y-8">
            
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              {actions.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAction(item.id as any)}
                  className={cn(
                    "relative group p-5 rounded-[24px] bg-white/[0.03] border border-white/5 text-left overflow-hidden",
                    "hover:border-white/20 transition-all duration-300",
                    item.badge === 'SOON' && "opacity-60 cursor-not-allowed"
                  )}
                  disabled={item.badge === 'SOON'}
                >
                  {/* Badge */}
                  {item.badge && (
                    <span className={cn(
                      "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                      item.badge === 'NEW' ? "bg-pink-500/20 text-pink-400" : "bg-gray-500/20 text-gray-400"
                    )}>
                      {item.badge}
                    </span>
                  )}

                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", item.grad)} />
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 relative z-10 transition-transform duration-500 group-hover:scale-110",
                    item.iconColor
                  )}>
                    <item.icon size={24} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">{item.title}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Recent Media Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} /> Recent Media
                </h4>
                {permissionStatus === 'granted' ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <Sparkles size={12} className="text-primary" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Best moments</span>
                  </div>
                ) : (
                  <button 
                    onClick={requestGalleryPermission}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-white/70">Allow Access</span>
                    <ChevronRight size={12} className="text-white/50" />
                  </button>
                )}
              </div>

              {/* Media Grid / Placeholder */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
                {permissionStatus === 'granted' ? (
                  // Show placeholder recent media slots
                  <>
                    {[1,2,3,4,5].map((i) => (
                      <motion.div
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleMediaSelect}
                        className="relative w-28 h-36 rounded-2xl bg-white/[0.03] border border-white/5 shrink-0 overflow-hidden cursor-pointer group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Select</span>
                        </div>
                        <div className="w-full h-full flex items-center justify-center opacity-20 text-white/50">
                          <ImageIcon size={28} strokeWidth={1} />
                        </div>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  // Permission prompt state
                  <div 
                    onClick={requestGalleryPermission}
                    className="w-full h-28 rounded-2xl bg-white/[0.03] border border-white/5 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/[0.05] transition-colors"
                  >
                    <ImageIcon size={24} className="text-white/30" />
                    <p className="text-[11px] text-white/50 font-medium">Tap to access your photos</p>
                    <p className="text-[9px] text-white/30">Allow once • Allow always • Deny</p>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Suggestions */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Suggestions</h4>
              <div className="space-y-2">
                {suggestions.map((item, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(item.action)}
                    className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-white uppercase tracking-widest mb-0.5">{item.title}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-700 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300" />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white mb-1">Pro Tips</p>
                  <ul className="text-[10px] text-gray-500 space-y-1">
                    <li>• Text stories don't need descriptions</li>
                    <li>• Dang stories capture the moment instantly</li>
                    <li>• Voice stories coming in next update</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <StorySettingsSheet 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </>,
    document.body
  );
}

export default AddStorySheetV2;
