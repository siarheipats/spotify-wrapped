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
