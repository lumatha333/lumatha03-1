import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Clock3, RefreshCcw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  clearRecentSlowPerfEvents,
  getRecentSlowPerfEvents,
  type SlowPerfEvent,
} from '@/lib/perfMarkers';

const LIVE_REFRESH_MS = 4000;

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms)) return '--';
  return `${ms.toFixed(2)} ms`;
}

function getPercentile(values: number[], percentile: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((percentile / 100) * sorted.length)));
  return sorted[index];
}

export default function PerformanceDebug() {
  const [events, setEvents] = useState<SlowPerfEvent[]>(() => getRecentSlowPerfEvents());

  const refresh = useCallback(() => {
    setEvents(getRecentSlowPerfEvents());
  }, []);

  const clearAll = useCallback(() => {
    clearRecentSlowPerfEvents();
    setEvents([]);
  }, []);

  useEffect(() => {
    const onSlowEvent = (event: Event) => {
      const detail = (event as CustomEvent<SlowPerfEvent>).detail;
      if (!detail) return;
      setEvents((prev) => [detail, ...prev].slice(0, 200));
    };

    window.addEventListener('lumatha-perf-slow', onSlowEvent);
    const intervalId = window.setInterval(refresh, LIVE_REFRESH_MS);

    return () => {
      window.removeEventListener('lumatha-perf-slow', onSlowEvent);
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const stats = useMemo(() => {
    const durations = events.map((e) => e.durationMs).filter((n) => Number.isFinite(n));
    const total = durations.length;
    const average = total > 0 ? durations.reduce((sum, value) => sum + value, 0) / total : 0;
    const p95 = getPercentile(durations, 95);
    const recentWindowStart = Date.now() - 5 * 60 * 1000;
    const recentCount = events.filter((e) => new Date(e.at).getTime() >= recentWindowStart).length;

    return {
      total,
      average,
      p95,
      recentCount,
    };
  }, [events]);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0f1e', color: '#e2e8f0' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        <Card className="border-0 rounded-3xl shadow-2xl" style={{ background: '#0f172a' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#f8fafc' }}>
              <BarChart3 className="h-5 w-5" />
              Runtime Performance Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Live view of slow interactions captured by perf traces. Auto-refresh runs every {LIVE_REFRESH_MS / 1000} seconds.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={refresh} className="gap-2" style={{ background: '#1d4ed8' }}>
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearAll}
                className="gap-2"
                style={{ borderColor: '#334155', color: '#fca5a5' }}
              >
                <Trash2 className="h-4 w-4" />
                Clear Stored Events
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-0" style={{ background: '#111827' }}>
                <CardContent className="pt-4">
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: '#64748b' }}>Events</div>
                  <div className="text-xl font-bold" style={{ color: '#f8fafc' }}>{stats.total}</div>
                </CardContent>
              </Card>
              <Card className="border-0" style={{ background: '#111827' }}>
                <CardContent className="pt-4">
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: '#64748b' }}>Last 5 Min</div>
                  <div className="text-xl font-bold" style={{ color: '#f8fafc' }}>{stats.recentCount}</div>
                </CardContent>
              </Card>
              <Card className="border-0" style={{ background: '#111827' }}>
                <CardContent className="pt-4">
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: '#64748b' }}>Avg Duration</div>
                  <div className="text-xl font-bold" style={{ color: '#f8fafc' }}>{formatDuration(stats.average)}</div>
                </CardContent>
              </Card>
              <Card className="border-0" style={{ background: '#111827' }}>
                <CardContent className="pt-4">
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: '#64748b' }}>P95</div>
                  <div className="text-xl font-bold" style={{ color: '#f8fafc' }}>{formatDuration(stats.p95)}</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-3xl shadow-2xl" style={{ background: '#0f172a' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: '#f8fafc' }}>
              <Clock3 className="h-4 w-4" />
              Recent Slow Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="py-8 text-sm text-center" style={{ color: '#94a3b8' }}>
                No slow events captured yet. Use the app normally and this list will populate.
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl p-3 border"
                    style={{ background: '#111827', borderColor: '#1f2937' }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{event.name}</div>
                      <div className="text-sm font-semibold" style={{ color: '#fca5a5' }}>
                        {formatDuration(event.durationMs)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs" style={{ color: '#94a3b8' }}>
                      {formatTimestamp(event.at)}
                    </div>
                    {event.meta && (
                      <pre
                        className="mt-2 text-[11px] rounded-lg p-2 overflow-auto"
                        style={{ background: '#0b1220', color: '#93c5fd' }}
                      >
                        {JSON.stringify(event.meta, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
