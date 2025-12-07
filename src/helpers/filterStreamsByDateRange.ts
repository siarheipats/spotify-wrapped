import type { StreamRecord } from "../interfaces/interfaces";

export function filterStreamsByDateRange(
  streams: StreamRecord[],
  start: Date | null,
  end: Date | null,
): StreamRecord[] {
  if (!start && !end) return streams;
  const startMs = start ? start.getTime() : -Infinity;
  const endMs = end ? end.getTime() : Infinity;
  return streams.filter((s) => {
    if (!s.ts) return false;
    const t = new Date(s.ts).getTime();
    if (isNaN(t)) return false;
    return t >= startMs && t <= endMs;
  });
}
