import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Signal, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStats {
  bitrate: number;
  packetLoss: number;
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
}

interface ConnectionQualityIndicatorProps {
  peerConnection: RTCPeerConnection | null;
  isConnected: boolean;
  showDetails?: boolean;
  className?: string;
}

const getQualityFromStats = (bitrate: number, packetLoss: number, latency: number): ConnectionStats['quality'] => {
  if (bitrate === 0) return 'disconnected';
  if (packetLoss > 10 || latency > 500) return 'poor';
  if (packetLoss > 5 || latency > 300) return 'fair';
  if (packetLoss > 2 || latency > 150) return 'good';
  return 'excellent';
};

const qualityConfig = {
  excellent: {
    icon: SignalHigh,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    label: 'Excellent',
    description: 'Crystal clear connection'
  },
  good: {
    icon: SignalMedium,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/20',
    label: 'Good',
    description: 'Stable connection'
  },
  fair: {
    icon: SignalLow,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    label: 'Fair',
    description: 'Some lag expected'
  },
  poor: {
    icon: Signal,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    label: 'Poor',
    description: 'Connection unstable'
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    label: 'Disconnected',
    description: 'No connection'
  }
};

export const ConnectionQualityIndicator: React.FC<ConnectionQualityIndicatorProps> = ({
  peerConnection,
  isConnected,
  showDetails = false,
  className
}) => {
  const [stats, setStats] = useState<ConnectionStats>({
    bitrate: 0,
    packetLoss: 0,
    latency: 0,
    quality: 'disconnected'
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const previousBytesRef = useRef<{ received: number; sent: number; timestamp: number } | null>(null);

  useEffect(() => {
    if (!peerConnection || !isConnected) {
      setStats({
        bitrate: 0,
        packetLoss: 0,
        latency: 0,
        quality: 'disconnected'
      });
      return;
    }

    const getStats = async () => {
      try {
        const statsReport = await peerConnection.getStats();
        let totalBytesReceived = 0;
        let totalBytesSent = 0;
        let totalPacketsLost = 0;
        let totalPackets = 0;
        let roundTripTime = 0;
        let hasRTT = false;

        statsReport.forEach((report) => {
          // Get bytes for bitrate calculation
          if (report.type === 'inbound-rtp') {
            totalBytesReceived += report.bytesReceived || 0;
            totalPacketsLost += report.packetsLost || 0;
            totalPackets += (report.packetsReceived || 0) + (report.packetsLost || 0);
          }
          if (report.type === 'outbound-rtp') {
            totalBytesSent += report.bytesSent || 0;
          }
          // Get round trip time for latency
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime) {
              roundTripTime = report.currentRoundTripTime * 1000; // Convert to ms
              hasRTT = true;
            }
          }
        });

        const now = Date.now();
        let bitrate = 0;

        if (previousBytesRef.current) {
          const timeDiff = (now - previousBytesRef.current.timestamp) / 1000;
          const bytesReceived = totalBytesReceived - previousBytesRef.current.received;
          const bytesSent = totalBytesSent - previousBytesRef.current.sent;
          bitrate = Math.round(((bytesReceived + bytesSent) * 8) / timeDiff / 1000); // kbps
        }

        previousBytesRef.current = {
          received: totalBytesReceived,
          sent: totalBytesSent,
          timestamp: now
        };

        const packetLoss = totalPackets > 0 ? (totalPacketsLost / totalPackets) * 100 : 0;
        const latency = hasRTT ? roundTripTime : 0;
        const quality = getQualityFromStats(bitrate, packetLoss, latency);

        setStats({
          bitrate,
          packetLoss: Math.round(packetLoss * 10) / 10,
          latency: Math.round(latency),
          quality
        });
      } catch (error) {
        console.log('Error getting WebRTC stats:', error);
      }
    };

    // Get stats every 2 seconds
    const interval = setInterval(getStats, 2000);
    getStats(); // Initial call

    return () => clearInterval(interval);
  }, [peerConnection, isConnected]);

  const config = qualityConfig[stats.quality];
  const IconComponent = config.icon;

  return (
    <div 
      className={cn('relative', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Main Indicator */}
      <div className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-300',
        config.bgColor
      )}>
        <IconComponent className={cn('w-4 h-4', config.color)} />
        {showDetails && (
          <span className={cn('text-xs font-medium', config.color)}>
            {config.label}
          </span>
        )}
      </div>

      {/* Tooltip with details */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 
                        bg-background border border-border rounded-lg shadow-lg p-3 
                        min-w-[180px] animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconComponent className={cn('w-5 h-5', config.color)} />
              <div>
                <p className={cn('text-sm font-semibold', config.color)}>{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </div>
            
            {isConnected && stats.quality !== 'disconnected' && (
              <div className="pt-2 border-t border-border space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Bitrate</span>
                  <span className="font-medium">{stats.bitrate} kbps</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-medium">{stats.latency > 0 ? `${stats.latency} ms` : 'Measuring...'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Packet Loss</span>
                  <span className="font-medium">{stats.packetLoss}%</span>
                </div>
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 
                          bg-background border-l border-t border-border rotate-45" />
        </div>
      )}
    </div>
  );
};

export default ConnectionQualityIndicator;
