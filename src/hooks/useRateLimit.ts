import { useState, useEffect, useCallback, useRef } from 'react';
import {
  canSend,
  recordSend,
  getMessageCount,
  getRemainingMessages,
  getTimeUntilReset,
  getUsageFraction,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WARN_THRESHOLD,
  resetUserState,
} from '@/utils/rateLimiter';

export interface RateLimitStatus {
  /** Number of messages sent in the current window. */
  messageCount: number;
  /** Messages remaining before hitting the limit. */
  remaining: number;
  /** True when the user has hit the rate limit. */
  isRateLimited: boolean;
  /** True when the user is approaching the limit (>= RATE_LIMIT_WARN_THRESHOLD). */
  isWarning: boolean;
  /** Seconds until the rate limit window resets. */
  secondsUntilReset: number;
  /** 0–1 fraction for progress bars. */
  usageFraction: number;
}

export interface UseRateLimitReturn extends RateLimitStatus {
  /** Check and record a send attempt. Returns false if rate limited. */
  trySend: () => boolean;
  /** Reset state for the current user (call on reconnect). */
  reset: () => void;
}

export function useRateLimit(userId: string | undefined): UseRateLimitReturn {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drive a 1-second ticker while rate-limited so the countdown stays live.
  useEffect(() => {
    if (!userId) return;

    const update = () => {
      const limited = !canSend(userId);
      setTick(t => t + 1);
      if (!limited && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const limited = !canSend(userId);
    if (limited && !intervalRef.current) {
      intervalRef.current = setInterval(update, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, tick]);

  const trySend = useCallback((): boolean => {
    if (!userId) return true; // no-op when unauthenticated
    const allowed = recordSend(userId);
    // After recording, force a re-render so status reflects latest state.
    setTick(t => t + 1);

    // Start the countdown ticker if we just hit the limit.
    if (!canSend(userId) && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTick(t => t + 1);
        if (canSend(userId) && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 1000);
    }

    return allowed;
  }, [userId]);

  const reset = useCallback(() => {
    if (!userId) return;
    resetUserState(userId);
    setTick(t => t + 1);
  }, [userId]);

  if (!userId) {
    return {
      messageCount: 0,
      remaining: RATE_LIMIT_MAX,
      isRateLimited: false,
      isWarning: false,
      secondsUntilReset: 0,
      usageFraction: 0,
      trySend: () => true,
      reset: () => {},
    };
  }

  const messageCount = getMessageCount(userId);
  const remaining = getRemainingMessages(userId);
  const isRateLimited = remaining === 0;
  const isWarning = messageCount >= RATE_LIMIT_WARN_THRESHOLD;
  const secondsUntilReset = Math.ceil(getTimeUntilReset(userId) / 1000);
  const usageFraction = getUsageFraction(userId);

  return {
    messageCount,
    remaining,
    isRateLimited,
    isWarning,
    secondsUntilReset,
    usageFraction,
    trySend,
    reset,
  };
}
