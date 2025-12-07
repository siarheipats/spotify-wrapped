import type { StreamRecord, SessionStats} from "../interfaces/interfaces";

export function computeSessions(streams: StreamRecord[], gapMinutes = 30): SessionStats {
  const sorted = streams
    .filter((r) => r.ts)
    .sort((a, b) => String(a.ts).localeCompare(String(b.ts)));

  const sessions: { start: Date; end: Date }[] = [];
  let currentStart: Date | null = null;
  let currentEnd: Date | null = null;
  const gapMs = gapMinutes * 60 * 1000;

  for (const r of sorted) {
    const ts = new Date(String(r.ts));
    if (isNaN(ts.getTime())) continue;
    if (!currentStart) {
      currentStart = ts;
      currentEnd = ts;
      continue;
    }
    const diff = ts.getTime() - (currentEnd as Date).getTime();
    if (diff <= gapMs) {
      currentEnd = ts;
    } else {
      sessions.push({ start: currentStart, end: currentEnd as Date });
      currentStart = ts;
      currentEnd = ts;
    }
  }
  if (currentStart) sessions.push({ start: currentStart, end: currentEnd as Date });

  if (sessions.length === 0) return { avgSessionMinutes: null, longestSessionMinutes: null, sessionsPerDayAvg: null };

  const durationsMin = sessions.map((s) => (s.end.getTime() - s.start.getTime()) / 1000 / 60);
  const avgSessionMinutes = Math.round(durationsMin.reduce((a, b) => a + b, 0) / durationsMin.length);
  const longestSessionMinutes = Math.round(Math.max(...durationsMin));

  const daySessions = new Map<string, number>();
  for (const s of sessions) {
    const d = s.start;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    daySessions.set(key, (daySessions.get(key) ?? 0) + 1);
  }
  const sessionsPerDayAvg = Math.round(Array.from(daySessions.values()).reduce((a, b) => a + b, 0) / daySessions.size * 100) / 100;

  return { avgSessionMinutes, longestSessionMinutes, sessionsPerDayAvg };
}