import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface UseAutoSaveOptions {
  /** Debounce delay in milliseconds (default: 1000ms) */
  delay?: number;
  /** Retry interval in milliseconds when save fails (default: 5000ms) */
  retryInterval?: number;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
}

interface UseAutoSaveReturn {
  /** Current save status */
  status: SaveStatus;
  /** Human-readable status message */
  statusText: string;
  /** Last saved timestamp */
  lastSavedAt: Date | null;
  /** Trigger an immediate save (cancels debounce) */
  saveNow: () => Promise<void>;
  /** Trigger debounced save */
  triggerSave: (saveFn: () => Promise<void>) => void;
  /** Clear pending save and reset status */
  reset: () => void;
  /** Whether a save is currently pending */
  isPending: boolean;
}

/**
 * Hook for auto-saving content with debounce, retry logic, and status tracking.
 * 
 * Features:
 * - Debounced saves (default 1000ms after user stops typing)
 * - Immediate save on demand (saveNow)
 * - Automatic retry on failure
 * - Offline detection
 * - Status text for UI display
 * - Cleanup on unmount (forces pending save)
 */
export const useAutoSave = (options: UseAutoSaveOptions = {}): UseAutoSaveReturn => {
  const {
    delay = 1000,
    retryInterval = 5000,
    maxRetries = 3,
  } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isPending, setIsPending] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);
  const saveFnRef = useRef<(() => Promise<void>) | null>(null);
  const retryCountRef = useRef(0);
  const isOnlineRef = useRef(navigator.onLine);

  // Status text based on current state
  const statusText = (() => {
    switch (status) {
      case 'idle':
        return lastSavedAt 
          ? `Saved ${getTimeAgo(lastSavedAt)}` 
          : '';
      case 'saving':
        return 'Saving...';
      case 'saved':
        return `Saved ${lastSavedAt ? getTimeAgo(lastSavedAt) : 'just now'}`;
      case 'error':
        return retryCountRef.current > 0 
          ? `Save failed — retrying (${retryCountRef.current}/${maxRetries})...`
          : 'Save failed — retrying...';
      case 'offline':
        return 'Offline — will save when connected';
      default:
        return '';
    }
  })();

  // Helper to format time ago
  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
  }, []);

  // Perform the actual save
  const performSave = useCallback(async (): Promise<void> => {
    if (!saveFnRef.current) return;

    // Check online status
    if (!navigator.onLine) {
      setStatus('offline');
      isOnlineRef.current = false;
      
      // Retry when back online
      retryRef.current = setTimeout(() => {
        performSave();
      }, retryInterval);
      return;
    }

    isOnlineRef.current = true;
    setStatus('saving');
    setIsPending(true);

    try {
      await saveFnRef.current();
      
      setStatus('saved');
      setLastSavedAt(new Date());
      retryCountRef.current = 0;
      
      // Clear "saved" status after 2 seconds
      setTimeout(() => {
        setStatus((current) => current === 'saved' ? 'idle' : current);
      }, 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      
      retryCountRef.current++;
      
      if (retryCountRef.current <= maxRetries) {
        setStatus('error');
        
        // Schedule retry
        retryRef.current = setTimeout(() => {
          performSave();
        }, retryInterval);
      } else {
        setStatus('error');
        // Max retries reached, stay in error state
      }
    } finally {
      setIsPending(false);
    }
  }, [maxRetries, retryInterval]);

  // Trigger debounced save
  const triggerSave = useCallback((saveFn: () => Promise<void>) => {
    saveFnRef.current = saveFn;
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsPending(true);
    
    // Set new debounce
    debounceRef.current = setTimeout(() => {
      performSave();
    }, delay);
  }, [delay, performSave]);

  // Immediate save (cancels debounce)
  const saveNow = useCallback(async (): Promise<void> => {
    clearTimers();
    await performSave();
  }, [clearTimers, performSave]);

  // Reset state
  const reset = useCallback(() => {
    clearTimers();
    setStatus('idle');
    setIsPending(false);
    retryCountRef.current = 0;
  }, [clearTimers]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!isOnlineRef.current && status === 'offline') {
        isOnlineRef.current = true;
        performSave();
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performSave, status]);

  // Cleanup on unmount - force immediate save
  useEffect(() => {
    return () => {
      if (debounceRef.current && saveFnRef.current) {
        clearTimers();
        // Note: We can't actually await here, but the save will be attempted
        performSave();
      }
    };
  }, [clearTimers, performSave]);

  return {
    status,
    statusText,
    lastSavedAt,
    saveNow,
    triggerSave,
    reset,
    isPending,
  };
};

export default useAutoSave;
