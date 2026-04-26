import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { RATE_LIMIT_MAX } from '@/utils/rateLimiter';

interface RateLimitWarningProps {
  messageCount: number;
  remaining: number;
  isRateLimited: boolean;
  isWarning: boolean;
  secondsUntilReset: number;
  usageFraction: number;
}

export function RateLimitWarning({
  messageCount,
  remaining,
  isRateLimited,
  isWarning,
  secondsUntilReset,
  usageFraction,
}: RateLimitWarningProps) {
  if (!isWarning && !isRateLimited) return null;

  return (
    <div
      className="shrink-0 px-3 py-2 flex flex-col gap-1.5"
      style={{
        background: isRateLimited ? '#1a0a0a' : '#120d00',
        borderTop: `1px solid ${isRateLimited ? '#7f1d1d' : '#78350f'}`,
      }}
    >
      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(usageFraction * 100, 100)}%`,
            background: isRateLimited
              ? '#ef4444'
              : usageFraction >= 0.9
              ? '#f97316'
              : '#f59e0b',
          }}
        />
      </div>

      {/* Status row */}
      <div className="flex items-center gap-1.5">
        {isRateLimited ? (
          <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: '#ef4444' }} />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
        )}
        <span
          className="text-xs font-medium"
          style={{ color: isRateLimited ? '#ef4444' : '#f59e0b' }}
        >
          {isRateLimited
            ? `Slow down! Limit reached (${RATE_LIMIT_MAX}/${RATE_LIMIT_MAX}). Resume in ${secondsUntilReset}s`
            : `${messageCount}/${RATE_LIMIT_MAX} messages — ${remaining} remaining this minute`}
        </span>
      </div>
    </div>
  );
}
