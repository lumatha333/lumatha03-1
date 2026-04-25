import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] bg-destructive/95 text-destructive-foreground px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg shadow-lg animate-fade-in backdrop-blur-sm max-w-[180px]">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">No internet connection</span>
    </div>
  );
}
