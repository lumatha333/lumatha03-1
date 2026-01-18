import { useEffect, useCallback, useRef } from 'react';

interface SecurityDetectionConfig {
  onScreenshotDetected?: () => void;
  onRecordingDetected?: () => void;
  enabled?: boolean;
}

export const useSecurityDetection = (config: SecurityDetectionConfig = {}) => {
  const { onScreenshotDetected, onRecordingDetected, enabled = true } = config;
  const lastVisibilityChange = useRef<number>(Date.now());

  // Detect PrintScreen key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    if (event.key === 'PrintScreen' || 
        (event.ctrlKey && event.key === 'p') ||
        (event.metaKey && event.shiftKey && event.key === '3') ||
        (event.metaKey && event.shiftKey && event.key === '4') ||
        (event.metaKey && event.shiftKey && event.key === '5')) {
      event.preventDefault();
      onScreenshotDetected?.();
    }
  }, [enabled, onScreenshotDetected]);

  // Detect visibility changes (potential screenshot on mobile)
  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;
    
    const now = Date.now();
    const timeDiff = now - lastVisibilityChange.current;
    
    // If visibility changed very quickly (< 500ms), might be screenshot
    if (timeDiff < 500 && document.hidden) {
      onScreenshotDetected?.();
    }
    
    lastVisibilityChange.current = now;
  }, [enabled, onScreenshotDetected]);

  // Detect screen recording (when display is captured)
  const handleDisplayMediaChange = useCallback(async () => {
    if (!enabled) return;
    
    try {
      // Check if screen is being captured (limited browser support)
      if ('getDisplayMedia' in navigator.mediaDevices) {
        // This is a heuristic - we can't directly detect, but we can monitor
        const displays = await navigator.mediaDevices.enumerateDevices();
        const hasCapture = displays.some(d => d.kind === 'videoinput' && d.label.includes('screen'));
        if (hasCapture) {
          onRecordingDetected?.();
        }
      }
    } catch (error) {
      // Silent fail - detection not available
    }
  }, [enabled, onRecordingDetected]);

  // Prevent right-click context menu
  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (!enabled) return;
    
    // Optionally prevent right-click
    // event.preventDefault();
  }, [enabled]);

  // Apply CSS-based protection
  const applyVisualProtection = useCallback(() => {
    // Add CSS to make screenshots less useful
    const style = document.createElement('style');
    style.id = 'security-protection-styles';
    style.textContent = `
      .random-connect-protected {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      @media print {
        .random-connect-protected {
          display: none !important;
        }
      }
    `;
    
    if (!document.getElementById('security-protection-styles')) {
      document.head.appendChild(style);
    }
  }, []);

  // Remove CSS protection
  const removeVisualProtection = useCallback(() => {
    const style = document.getElementById('security-protection-styles');
    if (style) {
      style.remove();
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    applyVisualProtection();
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Periodic check for recording (every 30 seconds)
    const recordingCheck = setInterval(handleDisplayMediaChange, 30000);

    return () => {
      removeVisualProtection();
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(recordingCheck);
    };
  }, [enabled, handleKeyDown, handleVisibilityChange, handleContextMenu, handleDisplayMediaChange, applyVisualProtection, removeVisualProtection]);

  return {
    applyVisualProtection,
    removeVisualProtection
  };
};
