import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Professional Chat Privacy Protection System
 * - Web: watermark + blur on tab switch + disable right-click/drag + print block
 * - All: View Once support, privacy toggles
 */

export function useChatProtection() {
  const { profile } = useAuth();
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    // Visibility change → blur
    const onVisChange = () => setIsBlurred(document.hidden);
    document.addEventListener('visibilitychange', onVisChange);

    // Disable right-click on chat area
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.chat-protected')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', onContextMenu);

    // Block print
    const onBeforePrint = () => setIsBlurred(true);
    const onAfterPrint = () => setIsBlurred(false);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);

    // Block keyboard shortcuts for screenshot
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 2000);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
      }
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        setIsBlurred(true);
        setTimeout(() => setIsBlurred(false), 2000);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    // CSS protection
    const style = document.createElement('style');
    style.id = 'chat-privacy-protection';
    style.textContent = `
      .chat-protected {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      .chat-protected img, .chat-protected video {
        pointer-events: none;
        -webkit-user-drag: none;
        draggable: false;
      }
      @media print {
        .chat-protected {
          visibility: hidden !important;
        }
        body::after {
          content: 'Content protected';
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          inset: 0;
          font-size: 2rem;
          color: #666;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
      document.removeEventListener('keydown', onKeyDown);
      document.getElementById('chat-privacy-protection')?.remove();
    };
  }, []);

  return { isBlurred, username: profile?.name || 'User' };
}

interface WatermarkOverlayProps {
  username: string;
}

export function WatermarkOverlay({ username }: WatermarkOverlayProps) {
  const stamp = `${username} • ${new Date().toLocaleDateString()}`;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.04]">
      <div className="absolute inset-0 flex flex-wrap items-start justify-start gap-16 p-4 -rotate-[25deg] scale-150 origin-center">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="text-foreground text-[11px] font-medium whitespace-nowrap select-none">
            {stamp}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BlurOverlay() {
  return (
    <div className="absolute inset-0 z-50 backdrop-blur-xl bg-background/80 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.5"/>
          </svg>
        </div>
        <p className="text-sm text-muted-foreground font-medium">Content hidden for privacy</p>
        <p className="text-xs text-muted-foreground/60">Return to this tab to view</p>
      </div>
    </div>
  );
}
