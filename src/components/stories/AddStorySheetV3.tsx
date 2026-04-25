import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, Type, Mic, Sparkles, Image as ImageIcon, 
  ArrowRight, Zap, Settings, Clock, ChevronRight,
  Check, AlertCircle, Shield
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AddStorySheetV3Props {
  open: boolean;
  onClose: () => void;
  onSelectAction: (mode: 'media' | 'text' | 'voice' | 'dang' | 'mood', mediaStream?: MediaStream, file?: File) => void;
}

interface MediaPermission {
  camera: 'prompt' | 'granted' | 'denied';
  microphone: 'prompt' | 'granted' | 'denied';
  gallery: 'prompt' | 'granted' | 'denied';
}

const actions = [
  { 
    id: 'media', 
    title: "From Gallery", 
    desc: "Choose from your photos", 
    icon: ImageIcon, 
    grad: "from-purple-500/20 to-indigo-600/20", 
    iconColor: "text-indigo-400",
    badge: null,
    needsPermission: true,
    permissionType: 'gallery'
  },
  { 
    id: 'text', 
    title: "Text Story", 
    desc: "Share your thoughts", 
    icon: Type, 
    grad: "from-blue-500/20 to-cyan-600/20", 
    iconColor: "text-cyan-400",
    badge: null,
    needsPermission: false
  },
  {
    id: 'mood',
    title: 'Mood Story',
    desc: 'Emotion-based creator',
    icon: Sparkles,
    grad: 'from-fuchsia-500/20 to-purple-600/20',
    iconColor: 'text-fuchsia-400',
    badge: 'NEW',
    needsPermission: false
  },
  { 
    id: 'dang', 
    title: "Dang Story", 
    desc: "Capture real-time moments", 
    icon: Camera, 
    grad: "from-pink-500/20 to-rose-600/20", 
    iconColor: "text-pink-400",
    badge: "NEW",
    needsPermission: true,
    permissionType: 'camera'
  },
  { 
    id: 'voice', 
    title: "Voice Story", 
    desc: "Coming soon", 
    icon: Mic, 
    grad: "from-emerald-500/20 to-teal-600/20", 
    iconColor: "text-emerald-400",
    badge: "SOON",
    needsPermission: false
  }
];

const suggestions = [
  { title: "Best of gallery", desc: "Top picks for you", icon: ImageIcon, action: 'media' as const },
  { title: "Express yourself", desc: "Text story with style", icon: Type, action: 'text' as const },
  { title: "Set your vibe", desc: "Mood-based story flow", icon: Sparkles, action: 'mood' as const }
];

export function AddStorySheetV3({ open, onClose, onSelectAction }: AddStorySheetV3Props) {
  const [permissions, setPermissions] = useState<MediaPermission>({
    camera: 'prompt',
    microphone: 'prompt',
    gallery: 'prompt'
  });
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check permissions on mount
  useEffect(() => {
    if (open) {
      checkPermissions();
    }
  }, [open]);

  const checkPermissions = async () => {
    try {
      // Check camera permission
      if ('permissions' in navigator) {
        const cameraPerm = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const micPerm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        setPermissions(prev => ({
          ...prev,
          camera: cameraPerm.state as any,
          microphone: micPerm.state as any
        }));
      }
    } catch {
      // Fallback - permissions API not supported
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      setCameraStream(stream);
      
      // Proceed to Dang story with stream
      onSelectAction('dang', stream);
      return true;
    } catch (err) {
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      toast.error('Camera permission denied. Please allow camera access in your browser settings.');
      return false;
    }
  };

  const requestGalleryAccess = () => {
    // For web, we use file input which is the standard way
    setPermissions(prev => ({ ...prev, gallery: 'granted' }));
    fileInputRef.current?.click();
  };

  const handleAction = async (actionId: string, needsPermission: boolean, permissionType?: string) => {
    if (actionId === 'voice') {
      toast.info('Voice stories coming soon!');
      return;
    }

    if (actionId === 'text' || actionId === 'mood') {
      // Text doesn't need permission
      onSelectAction(actionId as 'text' | 'mood');
      return;
    }

    if (needsPermission && permissionType) {
      if (permissionType === 'camera') {
        if (permissions.camera === 'granted') {
          // Already have permission, proceed
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' },
            audio: false 
          });
          onSelectAction('dang', stream);
        } else if (permissions.camera === 'denied') {
          // Show permission denied message with instructions
          toast.error('Camera access denied. Please enable it in your browser settings.');
        } else {
          // Show permission prompt
          setPendingAction(actionId);
          setShowPermissionPrompt(true);
        }
      } else if (permissionType === 'gallery') {
        requestGalleryAccess();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file - will be processed by parent
      onSelectAction('media', undefined, file);
    }
  };

  const handleAllowPermission = async () => {
    if (pendingAction === 'dang') {
      await requestCameraPermission();
    }
    setShowPermissionPrompt(false);
    setPendingAction(null);
  };

  const handleDenyPermission = () => {
    setShowPermissionPrompt(false);
    setPendingAction(null);
    toast.info('You can enable permissions later from settings.');
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

      {/* Permission Prompt Modal */}
      <AnimatePresence>
        {showPermissionPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[90%] max-w-sm bg-[#0a0f1e] rounded-3xl p-6 border border-white/10"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-white font-bold text-xl text-center mb-2">
                Allow Camera Access?
              </h3>
              <p className="text-white/60 text-sm text-center mb-6">
                To capture amazing moments with Dang Story, we need access to your camera. Your privacy is important - we only use it when you create stories.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDenyPermission}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 font-medium"
                >
                  Deny
                </button>
                <button
                  onClick={handleAllowPermission}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold"
                >
                  Allow
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sheet */}
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
          <div className="px-6 py-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Create Story</h2>
                <p className="text-white/50 text-sm">Share your moments with the world</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="px-6 py-4">
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">Suggestions</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.title}
                  onClick={() => handleAction(suggestion.action, suggestion.action === 'dang', 'camera')}
                  className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all shrink-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <suggestion.icon size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{suggestion.title}</p>
                    <p className="text-white/40 text-xs">{suggestion.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions Grid */}
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-3">Create</p>
            <div className="grid grid-cols-2 gap-3">
              {actions.map((action) => {
                const Icon = action.icon;
                const isPermissionGranted = action.permissionType && permissions[action.permissionType as keyof MediaPermission] === 'granted';
                const isPermissionDenied = action.permissionType && permissions[action.permissionType as keyof MediaPermission] === 'denied';
                
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id, action.needsPermission || false, action.permissionType)}
                    disabled={action.badge === 'SOON'}
                    className={cn(
                      "relative p-4 rounded-2xl border transition-all text-left overflow-hidden",
                      action.badge === 'SOON' 
                        ? "opacity-50 cursor-not-allowed border-white/5 bg-white/[0.02]"
                        : isPermissionDenied
                          ? "border-red-500/30 bg-red-500/10"
                          : "border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Gradient Background */}
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", action.grad)} />
                    
                    {/* Badge */}
                    {action.badge && (
                      <span className={cn(
                        "absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold",
                        action.badge === 'SOON' ? "bg-white/10 text-white/50" : "bg-primary text-white"
                      )}>
                        {action.badge}
                      </span>
                    )}

                    {/* Permission Status */}
                    {action.needsPermission && isPermissionGranted && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check size={12} className="text-green-400" />
                      </div>
                    )}
                    {action.needsPermission && isPermissionDenied && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertCircle size={12} className="text-red-400" />
                      </div>
                    )}

                    <div className="relative">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3", action.iconColor)}>
                        <Icon size={24} />
                      </div>
                      <p className="text-white font-bold text-sm">{action.title}</p>
                      <p className="text-white/50 text-xs mt-1">{action.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Note */}
          <div className="px-6 py-4 border-t border-white/5">
            <p className="text-white/30 text-xs text-center">
              Your stories disappear after 24 hours. Be yourself!
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>,
    document.body
  );
}

export default AddStorySheetV3;
