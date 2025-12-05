// Analytics computations: podcasts vs music, skip behavior, and session stats.
import type { StreamRecord } from "./spotifyTypes";

export interface MusicPodcastSplit {
  musicHours: number;
  podcastHours: number;
  podcastRatio: number; // 0..1
}

export interface TopPodcastShowRow {
  show: string;
  hours: number;
  episodes: number;
}

export interface TopPodcastEpisodeRow {
  show: string;
  episode: string;
  hours: number;
  plays: number;
}

export interface SkipAnalytics {
  skipRate: number; // 0..1 over music tracks
  avgTimeBeforeSkipSec: number | null;
  neverSkippedTracks: Array<{ track: string; artist?: string }>;
  skipRateByYear: { year: number; rate: number }[];
}

export interface SessionStats {
  avgSessionMinutes: number | null;
  longestSessionMinutes: number | null;
  sessionsPerDayAvg: number | null;
}

function isPodcast(row: StreamRecord): boolean {
  return !!row.episode_name || !!row.episode_show_name;
}

export function computeMusicPodcastSplit(streams: StreamRecord[]): MusicPodcastSplit {
  let musicMs = 0;
  let podcastMs = 0;
  for (const r of streams) {
    const ms = r.ms_played ?? 0;
    if (isPodcast(r)) podcastMs += ms; else musicMs += ms;
  }
  const musicHours = musicMs / 1000 / 60 / 60;
  const podcastHours = podcastMs / 1000 / 60 / 60;
  const total = musicHours + podcastHours;
  return {
    musicHours,
    podcastHours,
    podcastRatio: total > 0 ? podcastHours / total : 0,
  };
}

export function computeTopPodcastShows(streams: StreamRecord[], limit = 10): TopPodcastShowRow[] {
  const map = new Map<string, { ms: number; episodes: number }>();
  for (const r of streams) {
    if (!isPodcast(r)) continue;
    const show = r.episode_show_name || "Unknown Show";
    const ms = r.ms_played ?? 0;
    const curr = map.get(show) ?? { ms: 0, episodes: 0 };
    curr.ms += ms;
    curr.episodes += 1;
    map.set(show, curr);
  }
  return Array.from(map.entries())
    .map(([show, { ms, episodes }]) => ({ show, hours: ms / 1000 / 60 / 60, episodes }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit);
}

export function computeTopPodcastEpisodes(streams: StreamRecord[], limit = 10): TopPodcastEpisodeRow[] {
  const map = new Map<string, { show: string; episode: string; ms: number; plays: number }>();
  for (const r of streams) {
    if (!isPodcast(r)) continue;
    const show = r.episode_show_name || "Unknown Show";
    const episode = r.episode_name || "Unknown Episode";
    const ms = r.ms_played ?? 0;
    const key = `${show}:::${episode}`;
    const curr = map.get(key) ?? { show, episode, ms: 0, plays: 0 };
    curr.ms += ms;
    curr.plays += 1;
    map.set(key, curr);
  }
  return Array.from(map.values())
    .map((v) => ({ show: v.show, episode: v.episode, hours: v.ms / 1000 / 60 / 60, plays: v.plays }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit);
}

export function computeSkipping(streams: StreamRecord[]): SkipAnalytics {
  const trackKey = (r: StreamRecord) => {
    const t = r.master_metadata_track_name || "";
    const a = r.master_metadata_album_artist_name || "";
    return `${t}:::${a}`;
  };

  let totalTracks = 0;
  let skippedTracks = 0;
  let totalSkipMs = 0;
  let skipCountMs = 0;
  const neverSkipped = new Map<string, { track: string; artist?: string; skipped: boolean }>();
  const yearCounts = new Map<number, { total: number; skipped: number }>();

  for (const r of streams) {
    if (isPodcast(r)) continue; // skip analysis focused on music tracks
    const key = trackKey(r);
    const track = r.master_metadata_track_name || "";
    const artist = r.master_metadata_album_artist_name || undefined;
    const skipped = !!r.skipped;
    const ms = r.ms_played ?? 0;
    totalTracks += 1;
    if (skipped) {
      skippedTracks += 1;
      if (ms > 0) { totalSkipMs += ms; skipCountMs += 1; }
    }
    if (!neverSkipped.has(key)) neverSkipped.set(key, { track, artist, skipped });
    else if (neverSkipped.get(key) && neverSkipped.get(key)!.skipped) {
      // once marked skipped, keep as skipped
    }
    // year
    if (r.ts) {
      const y = new Date(r.ts).getUTCFullYear();
      const curr = yearCounts.get(y) ?? { total: 0, skipped: 0 };
      curr.total += 1;
      curr.skipped += skipped ? 1 : 0;
      yearCounts.set(y, curr);
    }
  }

  const skipRate = totalTracks > 0 ? skippedTracks / totalTracks : 0;
  const avgTimeBeforeSkipSec = skipCountMs > 0 ? Math.round(totalSkipMs / skipCountMs / 1000) : null;
  const neverSkippedTracks = Array.from(neverSkipped.values()).filter((v) => !v.skipped);
  const skipRateByYear = Array.from(yearCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, { total, skipped }]) => ({ year, rate: total > 0 ? skipped / total : 0 }));

  return { skipRate, avgTimeBeforeSkipSec, neverSkippedTracks, skipRateByYear };
}

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

// ---- Artist / Track Insights ----
export interface ForeverTop10 {
  topArtists: Array<{ artist: string; hours: number; streams: number }>;
  topTracks: Array<{ track: string; artist: string; hours: number; streams: number }>;
}

export function computeForeverTop10(streams: StreamRecord[], limit = 10): ForeverTop10 {
  const artistMap = new Map<string, { ms: number; streams: number }>();
  const trackMap = new Map<string, { track: string; artist: string; ms: number; streams: number }>();

  for (const r of streams) {
    const artist = r.master_metadata_album_artist_name;
    const track = r.master_metadata_track_name;
    const ms = r.ms_played ?? 0;
    if (artist) {
      const a = artistMap.get(artist) ?? { ms: 0, streams: 0 };
      a.ms += ms; a.streams += 1; artistMap.set(artist, a);
    }
    if (artist && track) {
      const key = `${track}:::${artist}`;
      const t = trackMap.get(key) ?? { track, artist, ms: 0, streams: 0 };
      t.ms += ms; t.streams += 1; trackMap.set(key, t);
    }
  }

  const topArtists = Array.from(artistMap.entries())
    .map(([artist, { ms, streams }]) => ({ artist, hours: ms / 1000 / 60 / 60, streams }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit);

  const topTracks = Array.from(trackMap.values())
    .map((v) => ({ track: v.track, artist: v.artist, hours: v.ms / 1000 / 60 / 60, streams: v.streams }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit);

  return { topArtists, topTracks };
}

export interface RepeatChampions {
  highestHoursTracks: Array<{ track: string; artist: string; hours: number }>;
  mostPlaysInOneDay: Array<{ track: string; artist: string; day: string; plays: number }>;
  played100Plus: Array<{ track: string; artist: string; plays: number }>;
}

export function computeRepeatChampions(streams: StreamRecord[]): RepeatChampions {
  const trackAgg = new Map<string, { track: string; artist: string; ms: number; plays: number }>();
  const trackDayPlays = new Map<string, number>(); // key: track:::artist:::YYYY-MM-DD

  for (const r of streams) {
    const track = r.master_metadata_track_name;
    const artist = r.master_metadata_album_artist_name;
    if (!track || !artist) continue;
    const ms = r.ms_played ?? 0;
    const key = `${track}:::${artist}`;
    const agg = trackAgg.get(key) ?? { track, artist, ms: 0, plays: 0 };
    agg.ms += ms; agg.plays += 1; trackAgg.set(key, agg);
    if (r.ts) {
      const d = new Date(r.ts);
      if (!isNaN(d.getTime())) {
        const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        const dayKey = `${key}:::${day}`;
        trackDayPlays.set(dayKey, (trackDayPlays.get(dayKey) ?? 0) + 1);
      }
    }
  }

  const highestHoursTracks = Array.from(trackAgg.values())
    .map((t) => ({ track: t.track, artist: t.artist, hours: t.ms / 1000 / 60 / 60 }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  let maxDayPlays = 0;
  const mostPlaysInOneDayRaw: Array<{ track: string; artist: string; day: string; plays: number }> = [];
  for (const [k, plays] of trackDayPlays.entries()) {
    if (plays > maxDayPlays) maxDayPlays = plays;
  }
  for (const [k, plays] of trackDayPlays.entries()) {
    if (plays === maxDayPlays) {
      const parts = k.split(":::");
      const track = parts[0]; const artist = parts[1]; const day = parts[2];
      mostPlaysInOneDayRaw.push({ track, artist, day, plays });
    }
  }

  const played100Plus = Array.from(trackAgg.values())
    .filter((t) => t.plays >= 100)
    .map((t) => ({ track: t.track, artist: t.artist, plays: t.plays }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  return { highestHoursTracks, mostPlaysInOneDay: mostPlaysInOneDayRaw, played100Plus };
}

export interface GhostedArtistRow { artist: string; lastYear: number; yearsActive: number }

export function computeGhostedArtists(streams: StreamRecord[], cutoffYears = 2): GhostedArtistRow[] {
  // Artists listened historically but not in the last `cutoffYears` years.
  const byArtistYears = new Map<string, Set<number>>();
  let maxYear = -Infinity;
  for (const r of streams) {
    const artist = r.master_metadata_album_artist_name;
    if (!artist || !r.ts) continue;
    const year = new Date(r.ts).getUTCFullYear();
    if (!Number.isFinite(year)) continue;
    maxYear = Math.max(maxYear, year);
    const set = byArtistYears.get(artist) ?? new Set<number>();
    set.add(year); byArtistYears.set(artist, set);
  }
  const threshold = maxYear - cutoffYears;
  const result: GhostedArtistRow[] = [];
  for (const [artist, years] of byArtistYears.entries()) {
    const lastYear = Math.max(...Array.from(years));
    if (lastYear <= threshold && years.size >= cutoffYears) {
      result.push({ artist, lastYear, yearsActive: years.size });
    }
  }
  return result.sort((a, b) => a.lastYear - b.lastYear).slice(0, 20);
}

export interface ClimbersRow { artist: string; year: number; deltaHours: number }

export function computeClimbers(streams: StreamRecord[]): ClimbersRow[] {
  // Artists that suddenly spiked one year: large positive YoY delta
  const byArtistYearMs = new Map<string, Map<number, number>>();
  for (const r of streams) {
    const artist = r.master_metadata_album_artist_name;
    const ms = r.ms_played ?? 0;
    if (!artist || !r.ts) continue;
    const year = new Date(r.ts).getUTCFullYear();
    if (!Number.isFinite(year)) continue;
    const inner = byArtistYearMs.get(artist) ?? new Map<number, number>();
    inner.set(year, (inner.get(year) ?? 0) + ms);
    byArtistYearMs.set(artist, inner);
  }
  const climbers: ClimbersRow[] = [];
  for (const [artist, inner] of byArtistYearMs.entries()) {
    const years = Array.from(inner.keys()).sort((a, b) => a - b);
    for (let i = 1; i < years.length; i++) {
      const y = years[i]; const prev = years[i - 1];
      const deltaMs = (inner.get(y) ?? 0) - (inner.get(prev) ?? 0);
      const deltaHours = deltaMs / 1000 / 60 / 60;
      if (deltaHours >= 50) { // heuristic threshold for "sudden spike"
        climbers.push({ artist, year: y, deltaHours });
      }
    }
  }
  return climbers.sort((a, b) => b.deltaHours - a.deltaHours).slice(0, 20);
}

export interface FrozenTrackRow { track: string; artist: string }

export function computeFrozenTracks(streams: StreamRecord[]): FrozenTrackRow[] {
  // Songs never finished: skipped before 30s every time they appear.
  const appear = new Map<string, number>();
  const earlySkips = new Map<string, number>();
  for (const r of streams) {
    const track = r.master_metadata_track_name;
    const artist = r.master_metadata_album_artist_name;
    if (!track || !artist) continue;
    const key = `${track}:::${artist}`;
    appear.set(key, (appear.get(key) ?? 0) + 1);
    const ms = r.ms_played ?? 0;
    const skipped = !!r.skipped;
    if (skipped && ms < 30000) {
      earlySkips.set(key, (earlySkips.get(key) ?? 0) + 1);
    }
  }
  const result: FrozenTrackRow[] = [];
  for (const [key, count] of appear.entries()) {
    if ((earlySkips.get(key) ?? 0) === count) {
      const [track, artist] = key.split(":::");
      result.push({ track, artist });
    }
  }
  return result.slice(0, 50);
}
