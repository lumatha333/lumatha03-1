// Rate limiter using a sliding window algorithm.
// Tracks message timestamps to enforce a maximum of RATE_LIMIT_MAX messages
// per RATE_LIMIT_WINDOW_MS milliseconds per user session.

export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
export const RATE_LIMIT_WARN_THRESHOLD = 7; // Warn when >= 7 messages sent

interface RateLimitState {
  timestamps: number[];
}

const stateMap = new Map<string, RateLimitState>();

function getState(userId: string): RateLimitState {
  if (!stateMap.has(userId)) {
    stateMap.set(userId, { timestamps: [] });
  }
  return stateMap.get(userId)!;
}

/** Remove timestamps older than the sliding window. */
function prune(state: RateLimitState): void {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  state.timestamps = state.timestamps.filter(t => t > cutoff);
}

/** Returns the number of messages sent in the current window. */
export function getMessageCount(userId: string): number {
  const state = getState(userId);
  prune(state);
  return state.timestamps.length;
}

/** Returns true if the user is allowed to send another message. */
export function canSend(userId: string): boolean {
  return getMessageCount(userId) < RATE_LIMIT_MAX;
}

/** Records a message send attempt. Returns false if rate limited. */
export function recordSend(userId: string): boolean {
  const state = getState(userId);
  prune(state);
  if (state.timestamps.length >= RATE_LIMIT_MAX) {
    logRateLimitViolation(userId, state.timestamps.length);
    return false;
  }
  state.timestamps.push(Date.now());
  return true;
}

/** Milliseconds until the rate limit window resets (oldest message expires). */
export function getTimeUntilReset(userId: string): number {
  const state = getState(userId);
  prune(state);
  if (state.timestamps.length === 0) return 0;
  const oldest = Math.min(...state.timestamps);
  const remaining = oldest + RATE_LIMIT_WINDOW_MS - Date.now();
  return Math.max(0, remaining);
}

/** Returns remaining allowed messages in the current window. */
export function getRemainingMessages(userId: string): number {
  return Math.max(0, RATE_LIMIT_MAX - getMessageCount(userId));
}

/** Returns usage as a 0–1 fraction for progress indicators. */
export function getUsageFraction(userId: string): number {
  return getMessageCount(userId) / RATE_LIMIT_MAX;
}

/** Logs a rate limit violation to the console for analytics/abuse detection. */
function logRateLimitViolation(userId: string, count: number): void {
  console.warn(
    `[RateLimit] User "${userId}" exceeded message limit: ${count}/${RATE_LIMIT_MAX} in the last minute.`,
    { userId, count, limit: RATE_LIMIT_MAX, timestamp: new Date().toISOString() }
  );
}

/** Clears the stored state for a user (e.g. on reconnect). */
export function resetUserState(userId: string): void {
  stateMap.delete(userId);
}
