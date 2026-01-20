import React from 'react';
import { Video, VideoOff, Mic, MicOff, Volume2, VolumeX, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TwoWayConnectionStatusProps {
  mode: 'video' | 'audio';
  // Your outgoing
  isCameraOn?: boolean;
  isMicOn: boolean;
  // Incoming from partner
  hasRemoteVideo?: boolean;
  hasRemoteAudio: boolean;
  // Connection
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  className?: string;
}

export const TwoWayConnectionStatus: React.FC<TwoWayConnectionStatusProps> = ({
  mode,
  isCameraOn = true,
  isMicOn,
  hasRemoteVideo = false,
  hasRemoteAudio,
  isConnected,
  connectionStatus,
  className
}) => {
  const StatusDot = ({ active, connecting }: { active: boolean; connecting?: boolean }) => (
    <span className={cn(
      'w-2 h-2 rounded-full',
      connecting && 'bg-yellow-500 animate-pulse',
      !connecting && active && 'bg-green-500',
      !connecting && !active && 'bg-red-500'
    )} />
  );

  const StatusIcon = ({ Icon, active }: { Icon: React.ElementType; active: boolean }) => (
    <Icon className={cn('w-3.5 h-3.5', active ? 'text-green-500' : 'text-muted-foreground')} />
  );

  if (connectionStatus === 'connecting') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30',
        className
      )}>
        <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
        <span className="text-xs text-yellow-500 font-medium">Connecting...</span>
      </div>
    );
  }

  if (connectionStatus === 'disconnected' || !isConnected) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30',
        className
      )}>
        <X className="w-4 h-4 text-red-500" />
        <span className="text-xs text-red-500 font-medium">Not Connected</span>
      </div>
    );
  }

  // Connected - show two-way status
  const isVideoMode = mode === 'video';
  const allGood = isVideoMode 
    ? (isCameraOn && isMicOn && hasRemoteVideo && hasRemoteAudio)
    : (isMicOn && hasRemoteAudio);

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-1.5 rounded-full transition-all duration-300',
      allGood ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/50 border border-border',
      className
    )}>
      {/* Two-way indicator label */}
      <div className="flex items-center gap-1.5">
        {allGood ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/30 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          </div>
        )}
        <span className={cn(
          'text-xs font-medium',
          allGood ? 'text-green-500' : 'text-muted-foreground'
        )}>
          Two-Way
        </span>
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Your outgoing stream */}
      <div className="flex items-center gap-1.5" title="You're sending">
        <span className="text-[10px] text-muted-foreground uppercase">You:</span>
        {isVideoMode && (
          <StatusIcon Icon={isCameraOn ? Video : VideoOff} active={isCameraOn} />
        )}
        <StatusIcon Icon={isMicOn ? Mic : MicOff} active={isMicOn} />
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Incoming from partner */}
      <div className="flex items-center gap-1.5" title="Partner is sending">
        <span className="text-[10px] text-muted-foreground uppercase">Partner:</span>
        {isVideoMode && (
          <StatusIcon Icon={hasRemoteVideo ? Video : VideoOff} active={hasRemoteVideo} />
        )}
        <StatusIcon Icon={hasRemoteAudio ? Volume2 : VolumeX} active={hasRemoteAudio} />
      </div>
    </div>
  );
};

export default TwoWayConnectionStatus;
