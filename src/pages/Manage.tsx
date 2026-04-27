import { useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { ArrowLeft, BarChart3, ChevronRight, ExternalLink, Flag, GripVertical, Menu, RefreshCw, RotateCcw, Settings2, Timer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ManageView = 'menu' | 'screen-time' | 'section-order' | 'auto-close' | 'deactivations' | 'moderation';
type AnalyticsView = 'daily' | 'weekly' | 'monthly';
type TimerPreset = '30' | '60' | '120' | '240' | 'custom';
type DeactivationDuration = '5h' | '12h' | '1d' | '3d' | '7d';

type TrackerSectionKey = 'home' | 'videos' | 'learn' | 'adventure' | 'messages' | 'marketplace' | 'randomConnect';
type ManagedSectionKey = 'home' | 'learn' | 'adventure' | 'messages' | 'randomConnect' | 'marketplace';

interface TrackerSectionDef {
  key: TrackerSectionKey;
  label: string;
}

interface ManagedSectionDef {
  key: ManagedSectionKey;
  label: string;
}

interface ScreenTimeStore {
  byDate: Record<string, Record<TrackerSectionKey, number>>;
}

interface TimerSetting {
  enabled: boolean;
  preset: TimerPreset;
  customMinutes: number;
  notified: boolean;
}

interface DeactivationSetting {
  active: boolean;
  duration: DeactivationDuration;
  endsAt: number | null;
}

interface ChartPoint {
  label: string;
  totalMinutes: number;
}

interface ModerationStoryItem {
  postId: string;
  title: string;
  content: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  reportsCount: number;
  createdAt: string;
  lastReportedAt: string;
}

const STORAGE_KEYS = {
  screenTime: 'lumatha_screen_time',
  sectionOrder: 'lumatha_section_order',
  timers: 'lumatha_timers',
  deactivations: 'lumatha_deactivations',
} as const;

const scopedStorageKey = (baseKey: string, userId?: string | null): string =>
  userId ? `${baseKey}:${userId}` : baseKey;

const TRACKER_SECTIONS: TrackerSectionDef[] = [
  { key: 'home', label: 'Home' },
  { key: 'videos', label: 'Videos' },
  { key: 'learn', label: 'Learn' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'messages', label: 'Messages' },
  { key: 'randomConnect', label: 'Random Connect' },
  { key: 'marketplace', label: 'Marketplace' },
];

const MANAGED_SECTIONS: ManagedSectionDef[] = [
  { key: 'home', label: 'Home' },
  { key: 'learn', label: 'Learn' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'messages', label: 'Messages' },
  { key: 'randomConnect', label: 'Random Connect' },
  { key: 'marketplace', label: 'Marketplace' },
];

const TRACKER_KEYS: TrackerSectionKey[] = TRACKER_SECTIONS.map((section) => section.key);
const MANAGED_KEYS: ManagedSectionKey[] = MANAGED_SECTIONS.map((section) => section.key);

const TIMER_PRESET_MINUTES: Record<Exclude<TimerPreset, 'custom'>, number> = {
  '30': 30,
  '60': 60,
  '120': 120,
  '240': 240,
};

const DEACTIVATION_HOURS: Record<DeactivationDuration, number> = {
  '5h': 5,
  '12h': 12,
  '1d': 24,
  '3d': 72,
  '7d': 168,
};

const createEmptyTrackerMap = (): Record<TrackerSectionKey, number> => ({
  home: 0,
  videos: 0,
  learn: 0,
  adventure: 0,
  messages: 0,
  randomConnect: 0,
  marketplace: 0,
});

const createDefaultTimers = (): Record<ManagedSectionKey, TimerSetting> => ({
  home: { enabled: false, preset: '60', customMinutes: 90, notified: false },
  learn: { enabled: false, preset: '60', customMinutes: 90, notified: false },
  adventure: { enabled: false, preset: '60', customMinutes: 90, notified: false },
  messages: { enabled: false, preset: '60', customMinutes: 90, notified: false },
  randomConnect: { enabled: false, preset: '60', customMinutes: 90, notified: false },
  marketplace: { enabled: false, preset: '60', customMinutes: 90, notified: false },
});

const createDefaultDeactivations = (): Record<ManagedSectionKey, DeactivationSetting> => ({
  home: { active: false, duration: '12h', endsAt: null },
  learn: { active: false, duration: '12h', endsAt: null },
  adventure: { active: false, duration: '12h', endsAt: null },
  messages: { active: false, duration: '12h', endsAt: null },
  randomConnect: { active: false, duration: '12h', endsAt: null },
  marketplace: { active: false, duration: '12h', endsAt: null },
});

const isClient = (): boolean => typeof window !== 'undefined';

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatSeconds = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatCountdown = (ms: number): string => {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / (1000 * 60 * 60 * 24));
  const hours = Math.floor((safe % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((safe % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((safe % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const sumTrackerSeconds = (values: Record<TrackerSectionKey, number>): number =>
  TRACKER_KEYS.reduce((total, key) => total + values[key], 0);

const normalizeManagedKey = (value: string): ManagedSectionKey | null => {
  if (value === 'home') return 'home';
  if (value === 'learn') return 'learn';
  if (value === 'adventure') return 'adventure';
  if (value === 'messages') return 'messages';
  if (value === 'randomConnect' || value === 'random-connect') return 'randomConnect';
  if (value === 'marketplace' || value === 'market') return 'marketplace';
  return null;
};

const trackerFromManaged = (key: ManagedSectionKey): TrackerSectionKey => {
  if (key === 'marketplace') return 'marketplace';
  if (key === 'randomConnect') return 'randomConnect';
  return key;
};

const readScreenTime = (): ScreenTimeStore => {
  if (!isClient()) {
    return { byDate: {} };
  }

  const raw = window.localStorage.getItem(STORAGE_KEYS.screenTime);
  if (!raw) {
    return { byDate: {} };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ScreenTimeStore>;
    const safeStore: ScreenTimeStore = { byDate: {} };

    if (!parsed.byDate || typeof parsed.byDate !== 'object') {
      return safeStore;
    }

    for (const [dateKey, sectionMap] of Object.entries(parsed.byDate)) {
      const safeMap = createEmptyTrackerMap();
      if (sectionMap && typeof sectionMap === 'object') {
        for (const tracker of TRACKER_KEYS) {
          const value = (sectionMap as Record<string, unknown>)[tracker];
          safeMap[tracker] = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
        }

        const oldMarket = (sectionMap as Record<string, unknown>).market;
        if (typeof oldMarket === 'number' && Number.isFinite(oldMarket)) {
          safeMap.marketplace += Math.max(0, oldMarket);
        }
      }
      safeStore.byDate[dateKey] = safeMap;
    }

    return safeStore;
  } catch {
    return { byDate: {} };
  }
};

const readSectionOrder = (userId?: string | null): ManagedSectionKey[] => {
  if (!isClient()) {
    return [...MANAGED_KEYS];
  }

  const raw = window.localStorage.getItem(scopedStorageKey(STORAGE_KEYS.sectionOrder, userId));
  if (!raw) {
    return [...MANAGED_KEYS];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [...MANAGED_KEYS];
    }

    const normalized: ManagedSectionKey[] = [];
    for (const item of parsed) {
      if (typeof item !== 'string') continue;
      const mapped = normalizeManagedKey(item);
      if (mapped && !normalized.includes(mapped)) {
        normalized.push(mapped);
      }
    }

    const missing = MANAGED_KEYS.filter((section) => !normalized.includes(section));
    return [...normalized, ...missing];
  } catch {
    return [...MANAGED_KEYS];
  }
};

const readTimers = (userId?: string | null): Record<ManagedSectionKey, TimerSetting> => {
  const defaults = createDefaultTimers();
  if (!isClient()) {
    return defaults;
  }

  const raw = window.localStorage.getItem(scopedStorageKey(STORAGE_KEYS.timers, userId));
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<TimerSetting>>;
    const next = { ...defaults };

    for (const [rawKey, candidate] of Object.entries(parsed)) {
      const key = normalizeManagedKey(rawKey);
      if (!key || !candidate || typeof candidate !== 'object') continue;

      const preset: TimerPreset =
        candidate.preset === '30' ||
        candidate.preset === '60' ||
        candidate.preset === '120' ||
        candidate.preset === '240' ||
        candidate.preset === 'custom'
          ? candidate.preset
          : defaults[key].preset;

      const customMinutes =
        typeof candidate.customMinutes === 'number' && Number.isFinite(candidate.customMinutes)
          ? Math.max(1, Math.round(candidate.customMinutes))
          : defaults[key].customMinutes;

      next[key] = {
        enabled: Boolean(candidate.enabled),
        preset,
        customMinutes,
        notified: Boolean(candidate.notified),
      };
    }

    return next;
  } catch {
    return defaults;
  }
};

const readDeactivations = (userId?: string | null): Record<ManagedSectionKey, DeactivationSetting> => {
  const defaults = createDefaultDeactivations();
  if (!isClient()) {
    return defaults;
  }

  const raw = window.localStorage.getItem(scopedStorageKey(STORAGE_KEYS.deactivations, userId));
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<DeactivationSetting>>;
    const next = { ...defaults };

    for (const [rawKey, candidate] of Object.entries(parsed)) {
      const key = normalizeManagedKey(rawKey);
      if (!key || !candidate || typeof candidate !== 'object') continue;

      const duration: DeactivationDuration =
        candidate.duration === '5h' ||
        candidate.duration === '12h' ||
        candidate.duration === '1d' ||
        candidate.duration === '3d' ||
        candidate.duration === '7d'
          ? candidate.duration
          : defaults[key].duration;

      const endsAt = typeof candidate.endsAt === 'number' && Number.isFinite(candidate.endsAt) ? candidate.endsAt : null;
      const active = Boolean(candidate.active) && endsAt !== null && endsAt > Date.now();

      next[key] = {
        active,
        duration,
        endsAt: active ? endsAt : null,
      };
    }

    return next;
  } catch {
    return defaults;
  }
};

const saveToLocalStorage = (key: string, value: unknown, userId?: string | null): void => {
  if (!isClient()) return;
  window.localStorage.setItem(scopedStorageKey(key, userId), JSON.stringify(value));
};

const reorderSections = (items: ManagedSectionKey[], from: ManagedSectionKey, to: ManagedSectionKey): ManagedSectionKey[] => {
  const fromIndex = items.indexOf(from);
  const toIndex = items.indexOf(to);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const subtractDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
};

const getDailyChart = (store: ScreenTimeStore): ChartPoint[] =>
  Array.from({ length: 7 }).map((_, index) => {
    const date = subtractDays(new Date(), 6 - index);
    const key = formatDateKey(date);
    const totals = store.byDate[key] ?? createEmptyTrackerMap();
    return {
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      totalMinutes: Math.round(sumTrackerSeconds(totals) / 60),
    };
  });

const getWeeklyChart = (store: ScreenTimeStore): ChartPoint[] => {
  const today = new Date();
  const points: ChartPoint[] = [];

  for (let week = 7; week >= 0; week -= 1) {
    const weekEnd = subtractDays(today, week * 7);
    let totalSeconds = 0;

    for (let day = 0; day < 7; day += 1) {
      const key = formatDateKey(subtractDays(weekEnd, day));
      totalSeconds += sumTrackerSeconds(store.byDate[key] ?? createEmptyTrackerMap());
    }

    points.push({ label: `W${8 - week}`, totalMinutes: Math.round(totalSeconds / 60) });
  }

  return points;
};

const getMonthlyChart = (store: ScreenTimeStore): ChartPoint[] => {
  const now = new Date();
  const points: ChartPoint[] = [];

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let totalSeconds = 0;
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = formatDateKey(new Date(year, month, day));
      totalSeconds += sumTrackerSeconds(store.byDate[key] ?? createEmptyTrackerMap());
    }

    points.push({
      label: monthDate.toLocaleDateString(undefined, { month: 'short' }),
      totalMinutes: Math.round(totalSeconds / 60),
    });
  }

  return points;
};

const getBreakdownForView = (store: ScreenTimeStore, view: AnalyticsView): Record<TrackerSectionKey, number> => {
  const next = createEmptyTrackerMap();

  if (view === 'daily') {
    return store.byDate[formatDateKey(new Date())] ?? next;
  }

  if (view === 'weekly') {
    for (let offset = 0; offset < 7; offset += 1) {
      const entry = store.byDate[formatDateKey(subtractDays(new Date(), offset))] ?? createEmptyTrackerMap();
      for (const key of TRACKER_KEYS) next[key] += entry[key];
    }
    return next;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const entry = store.byDate[formatDateKey(new Date(year, month, day))] ?? createEmptyTrackerMap();
    for (const key of TRACKER_KEYS) next[key] += entry[key];
  }

  return next;
};

function DraggableSectionRow({ section, index }: { section: ManagedSectionDef; index: number }) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id: section.key });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: section.key });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef],
  );

  const style = transform
    ? { transform: `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` }
    : undefined;

  return (
    <div
      ref={setRefs}
      style={{ ...style, marginTop: index === 0 ? 0 : -1 }}
      className={`rounded-lg border bg-card px-4 py-3 transition-all ${
        isDragging ? 'opacity-70 shadow-lg' : ''
      } ${isOver ? 'border-primary' : 'border-border/60'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{section.label}</p>
        <button
          type="button"
          aria-label={`Drag ${section.label}`}
          className="h-8 w-8 rounded-md border border-border/60 bg-background/80 flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

export default function Manage() {
  const { user } = useAuth();
  const [view, setView] = useState<ManageView>('menu');
  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>('daily');
  const [screenTime, setScreenTime] = useState<ScreenTimeStore>(() => readScreenTime());
  const [sectionOrder, setSectionOrder] = useState<ManagedSectionKey[]>(() => readSectionOrder());
  const [timers, setTimers] = useState<Record<ManagedSectionKey, TimerSetting>>(() => readTimers());
  const [deactivations, setDeactivations] = useState<Record<ManagedSectionKey, DeactivationSetting>>(() => readDeactivations());
  const [now, setNow] = useState<number>(Date.now());
  const [moderationQueue, setModerationQueue] = useState<ModerationStoryItem[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationBusyPostId, setModerationBusyPostId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!user?.id) {
      setSectionOrder([...MANAGED_KEYS]);
      setTimers(createDefaultTimers());
      setDeactivations(createDefaultDeactivations());
      return;
    }

    setSectionOrder(readSectionOrder(user.id));
    setTimers(readTimers(user.id));
    setDeactivations(readDeactivations(user.id));

    const loadSupabaseOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('section_order')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading section order from profile:', error);
          return;
        }

        if (data && Array.isArray(data.section_order)) {
          const normalized = (data.section_order as unknown[])
            .filter((entry): entry is ManagedSectionKey => 
              typeof entry === 'string' && MANAGED_KEYS.includes(entry as ManagedSectionKey)
            );

          if (normalized.length > 0) {
            const unique = Array.from(new Set(normalized));
            const missing = MANAGED_KEYS.filter((section) => !unique.includes(section));
            const nextOrder = [...unique, ...missing];

            setSectionOrder(nextOrder);
            saveToLocalStorage(STORAGE_KEYS.sectionOrder, nextOrder, user.id);
          }
        }
      } catch (err) {
        console.error('Failed to load profile section order:', err);
      }
    };

    void loadSupabaseOrder();
  }, [user?.id]);

  useEffect(() => {
    const sync = () => setScreenTime(readScreenTime());
    sync();

    const interval = window.setInterval(sync, 15000);
    window.addEventListener('storage', sync);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    
    saveToLocalStorage(STORAGE_KEYS.sectionOrder, sectionOrder, user.id);
    
    // Scoped sync to prevent 400 errors if columns are missing or restricted
    const syncToRemote = async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ section_order: sectionOrder } as any)
          .eq('id', user.id);
          
        if (error) {
          console.warn('Profile sync warning (section_order):', error.message);
        }
      } catch (err) {
        // Silent fail - localStorage is primary for this feature
      }
    };
    
    void syncToRemote();
    window.dispatchEvent(new CustomEvent('lumatha-manage-order-changed'));
  }, [sectionOrder, user?.id]);
  useEffect(() => saveToLocalStorage(STORAGE_KEYS.timers, timers, user?.id), [timers, user?.id]);
  useEffect(() => saveToLocalStorage(STORAGE_KEYS.deactivations, deactivations, user?.id), [deactivations, user?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = readScreenTime();
      const today = current.byDate[formatDateKey(new Date())] ?? createEmptyTrackerMap();

      setTimers((previous) => {
        let changed = false;
        const next = { ...previous };

        for (const key of MANAGED_KEYS) {
          const setting = previous[key];
          const spentMinutes = today[trackerFromManaged(key)] / 60;
          const threshold = setting.preset === 'custom' ? Math.max(1, setting.customMinutes) : TIMER_PRESET_MINUTES[setting.preset];

          if (!setting.enabled) {
            if (setting.notified) {
              next[key] = { ...setting, notified: false };
              changed = true;
            }
            continue;
          }

          if (spentMinutes >= threshold && !setting.notified) {
            toast("You've been here a while - explore something new!");
            next[key] = { ...setting, notified: true };
            changed = true;
          }

          if (spentMinutes < threshold && setting.notified) {
            next[key] = { ...setting, notified: false };
            changed = true;
          }
        }

        return changed ? next : previous;
      });
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setDeactivations((previous) => {
      let changed = false;
      const next = { ...previous };

      for (const key of MANAGED_KEYS) {
        const setting = previous[key];
        if (setting.active && setting.endsAt !== null && setting.endsAt <= now) {
          next[key] = { ...setting, active: false, endsAt: null };
          changed = true;
        }
      }

      return changed ? next : previous;
    });
  }, [now]);

  const todayTotals = useMemo(
    () => screenTime.byDate[formatDateKey(new Date())] ?? createEmptyTrackerMap(),
    [screenTime.byDate],
  );

  const todayTotalSeconds = useMemo(() => sumTrackerSeconds(todayTotals), [todayTotals]);

  const chartData = useMemo(() => {
    if (analyticsView === 'daily') return getDailyChart(screenTime);
    if (analyticsView === 'weekly') return getWeeklyChart(screenTime);
    return getMonthlyChart(screenTime);
  }, [analyticsView, screenTime]);

  const breakdown = useMemo(() => getBreakdownForView(screenTime, analyticsView), [analyticsView, screenTime]);

  const orderedSections = useMemo(
    () => sectionOrder.map((key) => MANAGED_SECTIONS.find((section) => section.key === key) ?? MANAGED_SECTIONS[0]),
    [sectionOrder],
  );

  const loadModerationQueue = useCallback(async () => {
    if (!user?.id) {
      setModerationQueue([]);
      return;
    }

    setModerationLoading(true);
    try {
      const { data: reportCounts, error: reportCountsError } = await (supabase as any)
        .from('post_report_counts')
        .select('post_id,reports_count,last_reported_at')
        .order('reports_count', { ascending: false })
        .limit(100);

      if (reportCountsError) {
        throw reportCountsError;
      }

      const reportRows = Array.isArray(reportCounts) ? reportCounts : [];
      const postIds = reportRows.map((row: any) => row.post_id).filter(Boolean);

      if (postIds.length === 0) {
        setModerationQueue([]);
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id,user_id,title,content,created_at')
        .in('id', postIds)
        .order('created_at', { ascending: false });

      if (postsError) {
        throw postsError;
      }

      const posts = Array.isArray(postsData) ? postsData : [];
      const userIds = Array.from(new Set(posts.map((post: any) => post.user_id).filter(Boolean)));

      const { data: profileRows } = userIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id,name,username')
            .in('id', userIds)
        : { data: [] as Array<{ id: string; name: string; username: string | null }> };

      const profilesById = new Map<string, { name: string; username: string | null }>();
      (profileRows || []).forEach((profile: any) => {
        profilesById.set(profile.id, { name: profile.name, username: profile.username });
      });

      const reportsByPostId = new Map<string, { reportsCount: number; lastReportedAt: string }>();
      reportRows.forEach((row: any) => {
        reportsByPostId.set(row.post_id, {
          reportsCount: typeof row.reports_count === 'number' && Number.isFinite(row.reports_count) ? row.reports_count : 0,
          lastReportedAt: row.last_reported_at || '',
        });
      });

      const queue = posts
        .map((post: any) => {
          const reportMeta = reportsByPostId.get(post.id);
          if (!reportMeta) return null;

          const author = profilesById.get(post.user_id);
          return {
            postId: post.id,
            title: post.title || 'Untitled Story',
            content: post.content || '',
            creatorId: post.user_id,
            creatorName: author?.name || 'Unknown',
            creatorUsername: author?.username || '',
            reportsCount: reportMeta.reportsCount,
            createdAt: post.created_at || '',
            lastReportedAt: reportMeta.lastReportedAt,
          } as ModerationStoryItem;
        })
        .filter(Boolean) as ModerationStoryItem[];

      queue.sort((a, b) => b.reportsCount - a.reportsCount || (b.lastReportedAt || '').localeCompare(a.lastReportedAt || ''));
      setModerationQueue(queue);
    } catch (error) {
      console.error('Failed to load moderation queue:', error);
      toast.error('Failed to load moderation queue. Ensure moderator policy is applied.');
    } finally {
      setModerationLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (view === 'moderation') {
      void loadModerationQueue();
    }
  }, [loadModerationQueue, view]);

  const markReportStatus = useCallback(async (postId: string, status: 'reviewed' | 'dismissed') => {
    setModerationBusyPostId(postId);
    try {
      const { error } = await (supabase as any)
        .from('post_reports')
        .update({ status })
        .eq('post_id', postId)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      toast.success(status === 'reviewed' ? 'Report marked as reviewed' : 'Report dismissed');
      await loadModerationQueue();
    } catch (error) {
      console.error('Failed to update report status:', error);
      toast.error('Failed to update report status. You may need moderator permissions.');
    } finally {
      setModerationBusyPostId(null);
    }
  }, [loadModerationQueue]);

  const currentTitle =
    view === 'screen-time'
      ? 'Screen Time Tracker'
      : view === 'section-order'
        ? 'Set Placement of Sections'
        : view === 'auto-close'
          ? 'Auto-Close Timer'
          : view === 'deactivations'
            ? 'Temporary Deactivations'
            : view === 'moderation'
              ? 'Moderator Review'
            : 'Manage';

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id) as ManagedSectionKey;
    const overId = event.over ? (String(event.over.id) as ManagedSectionKey) : null;
    if (!overId || activeId === overId) return;
    setSectionOrder((previous) => reorderSections(previous, activeId, overId));
  };

  const menuItemClass =
    'w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-left flex items-center justify-between hover:bg-accent/30 transition-colors';

  return (
    <div className="pb-24 pt-4 md:pt-6 space-y-4">
      {view === 'menu' ? (
        <>
          <div className="px-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-primary" />
              Manage
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Open one section at a time, like Instagram settings.</p>
          </div>

          <Card className="bg-card/90 border-border/60">
            <CardContent className="p-3 space-y-2">
              <button className={menuItemClass} onClick={() => setView('screen-time')}>
                <span className="text-sm font-medium">Screen Time Tracker</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className={menuItemClass} onClick={() => setView('section-order')}>
                <span className="text-sm font-medium">Set Placement of Sections</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className={menuItemClass} onClick={() => setView('auto-close')}>
                <span className="text-sm font-medium">Auto-Close Timer</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className={menuItemClass} onClick={() => setView('deactivations')}>
                <span className="text-sm font-medium">Temporary Deactivations</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button className={menuItemClass} onClick={() => setView('moderation')}>
                <span className="text-sm font-medium">Moderator Review</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="px-1 flex items-center gap-2">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('lumatha_mobile_sidebar_toggle'))} 
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-transform active:scale-90 hover:bg-white/5"
            >
              <Menu className="w-6 h-6 text-blue-500" strokeWidth={2} />
            </button>
            <div className="flex flex-col">
              <p className="text-xs font-black tracking-wide text-blue-600 leading-none">LUMATHA</p>
              <h2 className="text-sm font-bold text-foreground mt-1">{currentTitle}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setView('menu')} className="ml-auto text-xs text-muted-foreground">
              Back
            </Button>
          </div>

          {view === 'screen-time' && (
            <Card className="bg-card/90 border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Screen Time
                </CardTitle>
                <CardDescription>Daily, weekly and monthly usage summary.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Today Total</p>
                  <p className="text-2xl font-semibold text-foreground mt-1">{formatSeconds(todayTotalSeconds)}</p>
                </div>

                <Tabs value={analyticsView} onValueChange={(value) => setAnalyticsView(value as AnalyticsView)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="h-64 rounded-xl border border-border/60 bg-background/30 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity="0.3" />
                      <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value: number) => `${value}m`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value: number | string) => [`${Math.round(Number(value))} min`, 'Total']}
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '10px',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                      <Bar dataKey="totalMinutes" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {TRACKER_SECTIONS.map((section) => (
                    <div key={section.key} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground font-medium">{section.label}</p>
                      <p className="text-sm text-muted-foreground">{formatSeconds(breakdown[section.key])}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {view === 'section-order' && (
            <Card className="bg-card/90 border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Section Reorder</CardTitle>
                <CardDescription>Move only Home, Learn, Adventure, Messages, Random Connect, Marketplace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <div className="space-y-0">
                    {orderedSections.map((section, index) => (
                      <DraggableSectionRow key={section.key} section={section} index={index} />
                    ))}
                  </div>
                </DndContext>

                <Button variant="outline" onClick={() => setSectionOrder([...MANAGED_KEYS])} className="w-full sm:w-auto">
                  <RotateCcw className="h-4 w-4" />
                  Reset To Default
                </Button>
              </CardContent>
            </Card>
          )}

          {view === 'auto-close' && (
            <Card className="bg-card/90 border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  Auto-Close Timer
                </CardTitle>
                <CardDescription>Toggle each section and set timer limits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MANAGED_SECTIONS.map((section) => {
                  const setting = timers[section.key];
                  const target = setting.preset === 'custom' ? Math.max(1, setting.customMinutes) : TIMER_PRESET_MINUTES[setting.preset];

                  return (
                    <div key={section.key} className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{section.label}</p>
                          <p className="text-xs text-muted-foreground">Active limit: {target} minutes</p>
                        </div>
                        <Switch
                          checked={setting.enabled}
                          onCheckedChange={(checked) => {
                            setTimers((previous) => ({
                              ...previous,
                              [section.key]: {
                                ...previous[section.key],
                                enabled: checked,
                                notified: false,
                              },
                            }));
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2">
                        <Select
                          value={setting.preset}
                          disabled={!setting.enabled}
                          onValueChange={(value) => {
                            setTimers((previous) => ({
                              ...previous,
                              [section.key]: {
                                ...previous[section.key],
                                preset: value as TimerPreset,
                                notified: false,
                              },
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30min</SelectItem>
                            <SelectItem value="60">1hr</SelectItem>
                            <SelectItem value="120">2hrs</SelectItem>
                            <SelectItem value="240">4hrs</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>

                        {setting.preset === 'custom' ? (
                          <Input
                            type="number"
                            min={1}
                            max={1440}
                            value={setting.customMinutes}
                            disabled={!setting.enabled}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setTimers((previous) => ({
                                ...previous,
                                [section.key]: {
                                  ...previous[section.key],
                                  customMinutes: Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1,
                                  notified: false,
                                },
                              }));
                            }}
                            placeholder="Custom minutes"
                          />
                        ) : (
                          <div className="h-10 rounded-md border border-border/60 bg-background/40 px-3 flex items-center text-sm text-muted-foreground">
                            Tracking against today's usage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {view === 'deactivations' && (
            <Card className="bg-card/90 border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Temporary Deactivations</CardTitle>
                <CardDescription>Pick a duration and reactivate early anytime.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MANAGED_SECTIONS.map((section) => {
                  const setting = deactivations[section.key];
                  const remaining = setting.endsAt ? setting.endsAt - now : 0;

                  return (
                    <div key={section.key} className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{section.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {setting.active && setting.endsAt ? `Reactivates in ${formatCountdown(remaining)}` : 'Section is active'}
                          </p>
                        </div>
                        <Switch
                          checked={setting.active}
                          onCheckedChange={(checked) => {
                            setDeactivations((previous) => {
                              const current = previous[section.key];
                              if (!checked) {
                                return {
                                  ...previous,
                                  [section.key]: { ...current, active: false, endsAt: null },
                                };
                              }

                              const hours = DEACTIVATION_HOURS[current.duration];
                              return {
                                ...previous,
                                [section.key]: { ...current, active: true, endsAt: Date.now() + hours * 60 * 60 * 1000 },
                              };
                            });
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2">
                        <Select
                          value={setting.duration}
                          disabled={setting.active}
                          onValueChange={(value) => {
                            const duration = value as DeactivationDuration;
                            const hours = DEACTIVATION_HOURS[duration];

                            setDeactivations((previous) => {
                              const current = previous[section.key];
                              return {
                                ...previous,
                                [section.key]: {
                                  ...current,
                                  duration,
                                  endsAt: current.active ? Date.now() + hours * 60 * 60 * 1000 : null,
                                },
                              };
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5h">5hrs</SelectItem>
                            <SelectItem value="12h">12hrs</SelectItem>
                            <SelectItem value="1d">1day</SelectItem>
                            <SelectItem value="3d">3days</SelectItem>
                            <SelectItem value="7d">7days</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          disabled={!setting.active}
                          onClick={() => {
                            setDeactivations((previous) => ({
                              ...previous,
                              [section.key]: { ...previous[section.key], active: false, endsAt: null },
                            }));
                          }}
                        >
                          Reactivate Early
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {view === 'moderation' && (
            <Card className="bg-card/90 border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flag className="h-5 w-5 text-primary" />
                  Reported Stories Queue
                </CardTitle>
                <CardDescription>Powered by post_report_counts. High-count items should be reviewed first.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Total flagged stories: {moderationQueue.length}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadModerationQueue()}
                    disabled={moderationLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${moderationLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {moderationQueue.length === 0 ? (
                  <div className="rounded-xl border border-border/60 bg-background/30 px-4 py-5 text-sm text-muted-foreground">
                    {moderationLoading ? 'Loading queue...' : 'No reported stories in queue.'}
                  </div>
                ) : (
                  moderationQueue.map((item) => (
                    <div key={item.postId} className="rounded-xl border border-border/60 bg-background/30 p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            by {item.creatorUsername ? `@${item.creatorUsername}` : item.creatorName}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full border border-rose-300/40 bg-rose-500/10 text-rose-300">
                          {item.reportsCount} reports
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-3">{item.content || 'No story body provided.'}</p>

                      <div className="text-[11px] text-muted-foreground flex items-center justify-between gap-2">
                        <span>{item.createdAt ? `Posted ${new Date(item.createdAt).toLocaleString()}` : 'Unknown publish date'}</span>
                        <span>{item.lastReportedAt ? `Last report ${new Date(item.lastReportedAt).toLocaleString()}` : 'No report timestamp'}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`/public?post=${item.postId}`, '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Post
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={moderationBusyPostId === item.postId}
                          onClick={() => void markReportStatus(item.postId, 'reviewed')}
                        >
                          Mark Reviewed
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={moderationBusyPostId === item.postId}
                          onClick={() => void markReportStatus(item.postId, 'dismissed')}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
