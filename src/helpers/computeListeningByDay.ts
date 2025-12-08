import type { StreamRecord } from "../interfaces/interfaces";

export interface DayStat {
  date: string; // YYYY-MM-DD
  hours: number;
}

export function computeListeningByDay(streams: StreamRecord[]): DayStat[] {
  const map = new Map<string, number>();
  for (const r of streams) {
    if (!r.ts) continue;
    const d = new Date(String(r.ts));
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const ms = r.ms_played ?? 0;
    map.set(key, (map.get(key) ?? 0) + ms);
  }
  return Array.from(map.entries())
    .map(([date, ms]) => ({ date, hours: ms / 1000 / 60 / 60 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
