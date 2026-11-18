export const PLAYBACK_SPEEDS = [
  { value: 0.5, label: '0.5×', delay: 1400 },
  { value: 1, label: '1×', delay: 800 },
  { value: 2, label: '2×', delay: 400 },
  { value: 4, label: '4×', delay: 180 },
  { value: 8, label: '8×', delay: 80 },
];

export function getPlaybackDelay(speed) {
  return PLAYBACK_SPEEDS.find((item) => item.value === speed)?.delay ?? 800;
}

export function clampEventCursor(cursor, eventCount) {
  if (!Number.isInteger(eventCount) || eventCount <= 0) return -1;
  return Math.max(-1, Math.min(Number.isInteger(cursor) ? cursor : -1, eventCount - 1));
}

export function getPlaybackProgress(cursor, eventCount) {
  if (!Number.isInteger(eventCount) || eventCount <= 0 || cursor < 0) return 0;
  return Math.min(100, ((cursor + 1) / eventCount) * 100);
}
