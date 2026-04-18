import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CallScreenProps {
  open: boolean;
  onClose: () => void;
  callerName: string;
  callerAvatar?: string;
  isVideo: boolean;
  isIncoming?: boolean;
}

export function CallScreen({ open, onClose, callerName, callerAvatar, isVideo, isIncoming }: CallScreenProps) {
  const [status, setStatus] = useState<'ringing' | 'connected' | 'ended'>(isIncoming ? 'ringing' : 'ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-connect after 3s for demo
  useEffect(() => {
    if (!open) return;
    setStatus('ringing');
    setDuration(0);
    const t = setTimeout(() => {
      setStatus('connected');
    }, 3000);
    return () => clearTimeout(t);
  }, [open]);

  // Duration timer
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const endCall = () => {
    setStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(onClose, 1500);
  };

  const acceptCall = () => setStatus('connected');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-gradient-to-b from-[#0a1628] to-[#0d0d2b] animate-in fade-in duration-300">
      {/* Animated background rings */}
      <div className="absolute inset-0 overflow-hidden">
        {status === 'ringing' && (
          <>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-primary/5 animate-ping" style={{ animationDuration: '2.5s' }} />
          </>
        )}
      </div>

      {/* Top status */}
      <div className="relative z-10 pt-16 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
          {isVideo ? 'Video Call' : 'Voice Call'}
        </p>
        <p className="text-sm text-primary/80">
          {status === 'ringing' && (isIncoming ? 'Incoming call...' : 'Calling...')}
          {status === 'connected' && formatTime(duration)}
          {status === 'ended' && 'Call ended'}
        </p>
      </div>

      {/* Avatar */}
      <div className="relative z-10 flex flex-col items-center">
        <Avatar className={cn("w-28 h-28 ring-4 transition-all duration-500",
          status === 'ringing' ? "ring-primary/30 animate-pulse" : "ring-primary/10"
        )}>
          <AvatarImage src={callerAvatar} />
          <AvatarFallback className="text-3xl bg-primary/20">{callerName?.charAt(0)?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold mt-4">{callerName}</h2>
      </div>

      {/* Controls */}
      <div className="relative z-10 pb-16 w-full px-8">
        {status === 'ringing' && isIncoming ? (
          <div className="flex justify-center gap-16">
            <button onClick={endCall} className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/30 active:scale-95 transition-transform">
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform animate-bounce">
              <Phone className="w-7 h-7 text-white" />
            </button>
          </div>
        ) : status === 'connected' ? (
          <div className="space-y-6">
            <div className="flex justify-center gap-6">
              <ControlBtn active={isMuted} onClick={() => setIsMuted(!isMuted)} icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />} label="Mute" />
              {isVideo && <ControlBtn active={isVideoOff} onClick={() => setIsVideoOff(!isVideoOff)} icon={isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />} label="Camera" />}
              <ControlBtn active={isSpeaker} onClick={() => setIsSpeaker(!isSpeaker)} icon={<Volume2 className="w-5 h-5" />} label="Speaker" />
            </div>
            <div className="flex justify-center">
              <button onClick={endCall} className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/30 active:scale-95 transition-transform">
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button onClick={endCall} className="w-16 h-16 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform">
              <PhoneOff className="w-7 h-7 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ControlBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5">
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors",
        active ? "bg-white/20 text-white" : "bg-white/10 text-white/60"
      )}>
        {icon}
      </div>
      <span className="text-[10px] text-white/60">{label}</span>
    </button>
  );
}
