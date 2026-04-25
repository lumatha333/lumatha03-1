type PerfMeta = Record<string, unknown>;

interface ActiveTrace {
  name: string;
  startMark: string;
  endMark: string;
  measureName: string;
  startedAt: number;
  meta?: PerfMeta;
}

export interface SlowPerfEvent {
  id: string;
  name: string;
  durationMs: number;
  at: string;
  meta?: PerfMeta;
}

const traces = new Map<string, ActiveTrace>();
const STORAGE_KEY = 'lumatha_perf_slow_events';
const MAX_EVENTS = 200;

const canUsePerformance = () => typeof window !== 'undefined' && typeof performance !== 'undefined';

const safePerfCall = <Args extends unknown[]>(
  methodName: keyof Performance,
  ...args: Args
) => {
  if (!canUsePerformance()) return undefined;

  const perf = performance as Performance & Record<string, unknown>;
  const maybeFn = perf[methodName];
  if (typeof maybeFn !== 'function') return undefined;

  try {
    return (maybeFn as (...fnArgs: Args) => unknown).call(perf, ...args);
  } catch {
    return undefined;
  }
};

const persistSlowEvent = (event: SlowPerfEvent) => {
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const list = Array.isArray(existing) ? existing : [];
    list.unshift(event);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_EVENTS)));
  } catch {
    // Ignore localStorage failures.
  }
};

export const beginPerfTrace = (name: string, meta?: PerfMeta): string | null => {
  if (!canUsePerformance()) return null;

  const id = `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const startMark = `${id}:start`;
  const endMark = `${id}:end`;
  const measureName = `${id}:measure`;

  safePerfCall('mark', startMark);
  traces.set(id, {
    name,
    startMark,
    endMark,
    measureName,
    startedAt: performance.now(),
    meta,
  });

  return id;
};

export const endPerfTrace = (token: string | null, options?: { slowMs?: number }) => {
  if (!token || !canUsePerformance()) return 0;

  const trace = traces.get(token);
  if (!trace) return 0;

  const slowMs = options?.slowMs ?? 180;
  traces.delete(token);

  let durationMs = 0;
  try {
    safePerfCall('mark', trace.endMark);
    safePerfCall('measure', trace.measureName, trace.startMark, trace.endMark);
    const entries = safePerfCall('getEntriesByName', trace.measureName) as PerformanceEntry[] | undefined;
    const entry = entries?.at(-1);
    durationMs = entry?.duration ?? Math.max(0, performance.now() - trace.startedAt);
  } catch {
    durationMs = Math.max(0, performance.now() - trace.startedAt);
  } finally {
    safePerfCall('clearMarks', trace.startMark);
    safePerfCall('clearMarks', trace.endMark);
    safePerfCall('clearMeasures', trace.measureName);
  }

  if (durationMs >= slowMs) {
    const payload: SlowPerfEvent = {
      id: token,
      name: trace.name,
      durationMs: Number(durationMs.toFixed(2)),
      at: new Date().toISOString(),
      meta: trace.meta,
    };

    persistSlowEvent(payload);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lumatha-perf-slow', { detail: payload }));
    }

    if (import.meta.env.DEV) {
      console.warn('[Perf][Slow]', payload);
    }
  }

  return durationMs;
};

export const getRecentSlowPerfEvents = (): SlowPerfEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const clearRecentSlowPerfEvents = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore localStorage failures.
  }
};
