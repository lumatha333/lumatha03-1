import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Global Content Protection System
 * - Dynamic watermark overlay (username + session)
 * - Blur content on tab switch / window hide
 * - Block right-click on protected areas
 * - Block PrintScreen / Mac screenshot shortcuts
 * - Block printing
 */

export function useGlobalProtection() {
  const { profile } = useAuth();

  useEffect(() => {
    // --- Blur on visibility change ---
    const onVisChange = () => {
      const overlay = document.getElementById('global-blur-overlay');
      if (overlay) {
        overlay.style.display = document.hidden ? 'flex' : 'none';
      }
    };
    document.addEventListener('visibilitychange', onVisChange);

    // --- Block context menu on media ---
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('img') || target.closest('video') || target.closest('.content-protected')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', onContextMenu);

    // --- Block print ---
    const onBeforePrint = () => {
      const overlay = document.getElementById('global-blur-overlay');
      if (overlay) overlay.style.display = 'flex';
    };
    const onAfterPrint = () => {
      const overlay = document.getElementById('global-blur-overlay');
      if (overlay) overlay.style.display = 'none';
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);

    // --- Block screenshot shortcuts ---
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        const overlay = document.getElementById('global-blur-overlay');
        if (overlay) {
          overlay.style.display = 'flex';
          setTimeout(() => { overlay.style.display = 'none'; }, 2000);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
      }
      // Mac screenshot keys
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        const overlay = document.getElementById('global-blur-overlay');
        if (overlay) {
          overlay.style.display = 'flex';
          setTimeout(() => { overlay.style.display = 'none'; }, 2000);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);

    // --- CSS protection ---
    const style = document.createElement('style');
    style.id = 'global-content-protection';
    style.textContent = `
      img, video {
        -webkit-user-drag: none !important;
      }
      @media print {
        body * { visibility: hidden !important; }
        body::after {
          content: 'Content protected';
          visibility: visible;
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          inset: 0;
          font-size: 2rem;
          color: #666;
          background: #fff;
        }
      }
    `;
    if (!document.getElementById('global-content-protection')) {
      document.head.appendChild(style);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
      document.removeEventListener('keydown', onKeyDown);
      document.getElementById('global-content-protection')?.remove();
    };
  }, []);

  return { username: profile?.name || 'User' };
}

/** Watermark removed — was too intrusive and boring for users */
export function GlobalWatermark({ username }: { username: string }) {
  // Watermark disabled per user feedback - protection is handled by blur + anti-copy instead
  return null;
}

/** Blur overlay shown when tab is hidden or screenshot detected */
export function GlobalBlurOverlay() {
  return (
    <div
      id="global-blur-overlay"
      className="fixed inset-0 z-[9991] backdrop-blur-2xl bg-background/90 items-center justify-center"
      style={{ display: 'none' }}
    >
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.5"/>
          </svg>
        </div>
        <p className="text-sm text-muted-foreground font-semibold">Content hidden for privacy</p>
        <p className="text-xs text-muted-foreground/60">Return to this tab to continue</p>
      </div>
    </div>
  );
}
