import type { StreamRecord } from "../interfaces/interfaces";

export interface Obsession {
  track: string;
  artist: string;
  daysOver50: Array<{ date: string; plays: number }>;
  monthsOver100: Array<{ month: string; plays: number }>;
  weekStreaks: Array<{ start: string; end: string; weeks: number; totalPlays: number }>; // consecutive weeks with plays every week
  score: number; // heuristic to rank overall obsession
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function weekKey(d: Date) {
  // ISO week starting Monday; derive by shifting to Thursday of current week
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7; // Mon=0
  dt.setDate(dt.getDate() - day + 3);
  const thursday = new Date(dt);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNumber = Math.floor((thursday.getTime() - yearStart.getTime()) / (7 * 24 * 3600 * 1000));
  return `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export interface LoopOptions {
  minDailyPlays?: number; // default 50
  minMonthlyPlays?: number; // default 100
  minStreakWeeks?: number; // default 3
}

export function computeObsessiveLoops(streams: StreamRecord[], options?: LoopOptions): Obsession[] {
  const minDaily = options?.minDailyPlays ?? 50;
  const minMonthly = options?.minMonthlyPlays ?? 100;
  const minStreakWeeks = options?.minStreakWeeks ?? 3;

  // Aggregate per track
  const perTrack = new Map<string, { track: string; artist: string; days: Map<string, number>; months: Map<string, number>; weeks: Map<string, number> }>();

  for (const s of streams) {
    const t = s.trackName ?? s.track ?? s.master_metadata_track_name;
    const a = s.artistName ?? s.artist ?? s.master_metadata_album_artist_name;
    if (!t) continue;
    const time = s.ts ?? s.endTime ?? s.startTime ?? s.timestamp;
    const d = new Date(time);
    if (Number.isNaN(d.getTime())) continue;

    const key = `${t}|||${a ?? ""}`;
    let agg = perTrack.get(key);
    if (!agg) {
      agg = { track: t, artist: a ?? "Unknown Artist", days: new Map(), months: new Map(), weeks: new Map() };
      perTrack.set(key, agg);
    }
    const dk = dateKey(d);
    agg.days.set(dk, (agg.days.get(dk) ?? 0) + 1);
    const mk = monthKey(d);
    agg.months.set(mk, (agg.months.get(mk) ?? 0) + 1);
    const wk = weekKey(d);
    agg.weeks.set(wk, (agg.weeks.get(wk) ?? 0) + 1);
  }

  const results: Obsession[] = [];
  for (const agg of perTrack.values()) {
    const daysOver50: Array<{ date: string; plays: number }> = [];
    for (const [d, c] of agg.days.entries()) if (c >= minDaily) daysOver50.push({ date: d, plays: c });
    const monthsOver100: Array<{ month: string; plays: number }> = [];
    for (const [m, c] of agg.months.entries()) if (c >= minMonthly) monthsOver100.push({ month: m, plays: c });

    // Compute consecutive week streaks where there was at least one play each week
    const weekKeys = Array.from(agg.weeks.keys()).sort();
    const streaks: Array<{ start: string; end: string; weeks: number; totalPlays: number }> = [];
    let curStart: string | null = null;
    let prevYearWeek: { year: number; week: number } | null = null;
    let total = 0;
    for (const wk of weekKeys) {
      const [y, wStr] = wk.split("-W");
      const yr = Number(y);
      const w = Number(wStr);
      const plays = agg.weeks.get(wk) ?? 0;
      if (!curStart) {
        curStart = wk;
        prevYearWeek = { year: yr, week: w };
        total = plays;
      } else {
        const expectedWeek = (prevYearWeek!.week + 1);
        const advancesYear = expectedWeek > 52;
        const nextYear = advancesYear ? prevYearWeek!.year + 1 : prevYearWeek!.year;
        const nextWeek = advancesYear ? 0 : expectedWeek;
        if (yr === nextYear && w === nextWeek) {
          prevYearWeek = { year: yr, week: w };
          total += plays;
        } else {
          // finalize previous streak
          const [sy, sw] = curStart.split("-W");
          const length = (prevYearWeek!.year - Number(sy)) * 53 + (prevYearWeek!.week - Number(sw)) + 1; // approximate
          streaks.push({ start: curStart, end: `${prevYearWeek!.year}-W${String(prevYearWeek!.week).padStart(2, "0")}`, weeks: length, totalPlays: total });
          curStart = wk;
          prevYearWeek = { year: yr, week: w };
          total = plays;
        }
      }
    }
    if (curStart && prevYearWeek) {
      const [sy, sw] = curStart.split("-W");
      const length = (prevYearWeek.year - Number(sy)) * 53 + (prevYearWeek.week - Number(sw)) + 1;
      streaks.push({ start: curStart, end: `${prevYearWeek.year}-W${String(prevYearWeek.week).padStart(2, "0")}`, weeks: length, totalPlays: total });
    }
    const longStreaks = streaks.filter((s) => s.weeks >= minStreakWeeks);

    const score = daysOver50.length * 3 + monthsOver100.length * 5 + (longStreaks.reduce((a, s) => a + s.weeks, 0));
    if (daysOver50.length || monthsOver100.length || longStreaks.length) {
      results.push({ track: agg.track, artist: agg.artist, daysOver50, monthsOver100, weekStreaks: longStreaks, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}
