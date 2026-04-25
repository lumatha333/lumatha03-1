import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { beginPerfTrace, endPerfTrace } from '@/lib/perfMarkers';

/**
 * Hook to automatically trace route load performance.
 * Marks the time from route navigation to when the component finishes rendering.
 * Helps measure the impact of lazy loading and viewport-gated optimizations.
 */
export function useRouteLoadTrace(pageName: string, slowMs: number = 200) {
  const location = useLocation();
  const traceTokenRef = useRef<string | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Start trace on route change or first mount
    if (!hasStartedRef.current) {
      traceTokenRef.current = beginPerfTrace(`route:${pageName}`, {
        pathname: location.pathname,
        timestamp: new Date().toISOString(),
      });
      hasStartedRef.current = true;
    }

    return () => {
      // End trace when component unmounts
      if (traceTokenRef.current) {
        endPerfTrace(traceTokenRef.current, { slowMs });
      }
    };
  }, [pageName, location.pathname, slowMs]);

  // Allow manual trace end for fine-grained control
  return {
    endTrace: () => {
      if (traceTokenRef.current) {
        const duration = endPerfTrace(traceTokenRef.current, { slowMs });
        traceTokenRef.current = null;
        return duration;
      }
      return 0;
    },
  };
}
