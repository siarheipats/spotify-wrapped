import type { BasicStats, StreamRecord, Milestone } from "../interfaces/interfaces";

export function computeMilestones(stats: BasicStats, streams: StreamRecord[]): Milestone[] {
  const milestones: Milestone[] = [];
  if (stats.totalStreams <= 0) return milestones;

  // First ever stream
  if (stats.firstTs) {
    milestones.push({ id: "first-stream", label: "First stream", value: "Started listening", ts: stats.firstTs });
  }

  // Year hit cumulative 10k hours
  let cumulativeHours = 0;
  for (const y of stats.listeningByYear) {
    cumulativeHours += y.hours;
    if (cumulativeHours >= 10000) {
      milestones.push({ id: "10k-hours", label: "10k hours reached", value: `${y.year}`, });
      break;
    }
  }

  // Most intense day and longest streak
  // Build day map and presence map
  const dayMs = new Map<string, number>();
  const dayPresence = new Set<string>();
  for (const r of streams) {
    if (!r.ts) continue;
    const d = new Date(r.ts);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const ms = r.ms_played ?? 0;
    dayMs.set(key, (dayMs.get(key) ?? 0) + ms);
    if (ms > 0) dayPresence.add(key);
  }

  // Most intense day
  let bestDay = "";
  let bestHours = -1;
  for (const [day, ms] of dayMs.entries()) {
    const hrs = ms / 1000 / 60 / 60;
    if (hrs > bestHours) {
      bestHours = hrs;
      bestDay = day;
    }
  }
  if (bestDay) {
    milestones.push({ id: "most-intense-day", label: "Most intense day", value: `${bestHours.toFixed(1)} h`, ts: bestDay });
  }

  // Longest streak (consecutive days with any listening)
  const sortedDays = Array.from(dayPresence.values()).sort();
  let longest = 0;
  let current = 0;
  let prevDate: Date | null = null;
  for (const day of sortedDays) {
    const [y, m, d] = day.split("-").map(Number);
    const currDate = new Date(Date.UTC(y, m - 1, d));
    if (!prevDate) {
      current = 1;
    } else {
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) current += 1;
      else current = 1;
    }
    if (current > longest) longest = current;
    prevDate = currDate;
  }
  if (longest > 0) {
    milestones.push({ id: "longest-streak", label: "Longest streak", value: `${longest} days` });
  }

  return milestones;
}