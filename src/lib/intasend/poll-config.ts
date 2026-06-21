export const POLL_FAST_MS = 3_000;
export const POLL_SLOW_MS = 10_000;
export const POLL_FAST_DURATION_MS = 120_000;
export const POLL_MAX_DURATION_MS = 600_000;

export function getPollIntervalMs(elapsedMs: number): number | null {
  if (elapsedMs >= POLL_MAX_DURATION_MS) return null;
  if (elapsedMs < POLL_FAST_DURATION_MS) return POLL_FAST_MS;
  return POLL_SLOW_MS;
}
