import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Wifi, WifiOff, Check, X, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebRTCDebugPanelProps {
  signalingConnected: boolean;
  peerConnection: RTCPeerConnection | null;
  hasLocalStream: boolean;
  hasRemoteStream: boolean;
  hasRemoteAudio: boolean;
  hasRemoteVideo: boolean;
  offerSent: boolean;
  answerReceived: boolean;
  participantCount: number;
}

interface DebugState {
  signalingState: string;
  iceConnectionState: string;
  iceGatheringState: string;
  connectionState: string;
  localDescriptionType: string | null;
  remoteDescriptionType: string | null;
  audioTracksLocal: number;
  videoTracksLocal: number;
  audioTracksRemote: number;
  videoTracksRemote: number;
}

export const WebRTCDebugPanel: React.FC<WebRTCDebugPanelProps> = ({
  signalingConnected,
  peerConnection,
  hasLocalStream,
  hasRemoteStream,
  hasRemoteAudio,
  hasRemoteVideo,
  offerSent,
  answerReceived,
  participantCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugState, setDebugState] = useState<DebugState>({
    signalingState: 'new',
    iceConnectionState: 'new',
    iceGatheringState: 'new',
    connectionState: 'new',
    localDescriptionType: null,
    remoteDescriptionType: null,
    audioTracksLocal: 0,
    videoTracksLocal: 0,
    audioTracksRemote: 0,
    videoTracksRemote: 0
  });

  useEffect(() => {
    if (!peerConnection) return;

    const updateDebugState = () => {
      const senders = peerConnection.getSenders();
      const receivers = peerConnection.getReceivers();
      
      setDebugState({
        signalingState: peerConnection.signalingState,
        iceConnectionState: peerConnection.iceConnectionState,
        iceGatheringState: peerConnection.iceGatheringState,
        connectionState: peerConnection.connectionState,
        localDescriptionType: peerConnection.localDescription?.type || null,
        remoteDescriptionType: peerConnection.remoteDescription?.type || null,
        audioTracksLocal: senders.filter(s => s.track?.kind === 'audio').length,
        videoTracksLocal: senders.filter(s => s.track?.kind === 'video').length,
        audioTracksRemote: receivers.filter(r => r.track?.kind === 'audio').length,
        videoTracksRemote: receivers.filter(r => r.track?.kind === 'video').length
      });
    };

    updateDebugState();
    
    const interval = setInterval(updateDebugState, 1000);
    
    peerConnection.addEventListener('connectionstatechange', updateDebugState);
    peerConnection.addEventListener('iceconnectionstatechange', updateDebugState);
    peerConnection.addEventListener('icegatheringstatechange', updateDebugState);
    peerConnection.addEventListener('signalingstatechange', updateDebugState);

    return () => {
      clearInterval(interval);
      peerConnection.removeEventListener('connectionstatechange', updateDebugState);
      peerConnection.removeEventListener('iceconnectionstatechange', updateDebugState);
      peerConnection.removeEventListener('icegatheringstatechange', updateDebugState);
      peerConnection.removeEventListener('signalingstatechange', updateDebugState);
    };
  }, [peerConnection]);

  const getStatusIcon = (ok: boolean) => {
    if (ok) return <Check className="w-3 h-3 text-green-400" />;
    return <X className="w-3 h-3 text-red-400" />;
  };

  const getIceStatusColor = (state: string) => {
    switch (state) {
      case 'connected':
      case 'completed':
        return 'text-green-400';
      case 'checking':
      case 'new':
        return 'text-yellow-400';
      case 'disconnected':
      case 'failed':
      case 'closed':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getConnectionStateColor = (state: string) => {
    switch (state) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
      case 'new':
        return 'text-yellow-400';
      case 'disconnected':
      case 'failed':
      case 'closed':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const isIceOk = ['connected', 'completed'].includes(debugState.iceConnectionState);
  const isConnectionOk = debugState.connectionState === 'connected';

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-white/20 text-xs font-mono text-white shadow-xl">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between gap-3 hover:bg-white/10 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-semibold">WebRTC Debug</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick status indicators */}
            <div className={cn("w-2 h-2 rounded-full", signalingConnected ? "bg-green-400" : "bg-red-400")} title="Signaling" />
            <div className={cn("w-2 h-2 rounded-full", isIceOk ? "bg-green-400" : "bg-yellow-400")} title="ICE" />
            <div className={cn("w-2 h-2 rounded-full", hasRemoteStream ? "bg-green-400" : "bg-red-400")} title="Remote Stream" />
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
            {/* Signaling Status */}
            <div className="space-y-1">
              <div className="text-white/60 uppercase text-[10px] tracking-wider">Signaling</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(signalingConnected)}
                  <span>WebSocket</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">Peers:</span>
                  <span className={participantCount > 1 ? 'text-green-400' : 'text-yellow-400'}>{participantCount}</span>
                </div>
              </div>
            </div>

            {/* Offer/Answer */}
            <div className="space-y-1">
              <div className="text-white/60 uppercase text-[10px] tracking-wider">Negotiation</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(offerSent || answerReceived)}
                  <span>Offer {offerSent ? 'sent' : (debugState.remoteDescriptionType === 'offer' ? 'received' : 'pending')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(answerReceived || debugState.localDescriptionType === 'answer')}
                  <span>Answer {answerReceived ? 'received' : (debugState.localDescriptionType === 'answer' ? 'sent' : 'pending')}</span>
                </div>
              </div>
            </div>

            {/* ICE Connection */}
            <div className="space-y-1">
              <div className="text-white/60 uppercase text-[10px] tracking-wider">ICE Connection</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">State:</span>
                  <span className={getIceStatusColor(debugState.iceConnectionState)}>
                    {debugState.iceConnectionState}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">Gathering:</span>
                  <span className={debugState.iceGatheringState === 'complete' ? 'text-green-400' : 'text-yellow-400'}>
                    {debugState.iceGatheringState}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection State */}
            <div className="space-y-1">
              <div className="text-white/60 uppercase text-[10px] tracking-wider">Connection</div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/60">State:</span>
                <span className={getConnectionStateColor(debugState.connectionState)}>
                  {debugState.connectionState}
                </span>
              </div>
            </div>

            {/* Tracks */}
            <div className="space-y-1">
              <div className="text-white/60 uppercase text-[10px] tracking-wider">Tracks</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(hasLocalStream)}
                  <span>Local: {debugState.audioTracksLocal}A/{debugState.videoTracksLocal}V</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(hasRemoteStream || hasRemoteAudio || hasRemoteVideo)}
                  <span>Remote: {debugState.audioTracksRemote}A/{debugState.videoTracksRemote}V</span>
                </div>
              </div>
            </div>

            {/* Quick diagnosis */}
            {!isConnectionOk && (
              <div className="mt-2 p-2 bg-yellow-500/20 rounded border border-yellow-500/30">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-200 text-[10px] leading-relaxed">
                    {!signalingConnected && 'Signaling server not connected. '}
                    {signalingConnected && participantCount < 2 && 'Waiting for partner to join. '}
                    {participantCount >= 2 && !offerSent && !answerReceived && 'Offer/answer exchange pending. '}
                    {debugState.iceConnectionState === 'failed' && 'ICE failed - may need TURN server. '}
                    {debugState.iceConnectionState === 'disconnected' && 'ICE disconnected - attempting reconnect. '}
                    {isIceOk && !hasRemoteStream && 'ICE OK but no remote tracks received. '}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
