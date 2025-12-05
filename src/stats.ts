// src/stats.ts
import type { StreamRecord } from "./spotifyTypes";

export interface BasicStats {
  totalStreams: number;
  totalMs: number;
  totalHours: number;
  totalDays: number;
  firstTs: string | null;
  lastTs: string | null;
  distinctArtists: number;
  distinctTracks: number;
  listeningByYear: { year: number; hours: number; streams: number }[];
}

export interface TopArtistRow {
  artist: string;
  hours: number;
  streams: number;
}

export interface ListeningByHourRow {
  hour: number;    // 0–23
  hours: number;
}

export interface ListeningByWeekdayRow {
  weekday: string; // "Monday", ...
  hours: number;
}

export interface ListeningHabits {
  byHour: ListeningByHourRow[];
  byWeekday: ListeningByWeekdayRow[];
}

export interface TopTrackRow {
  track: string;
  artist: string;
  hours: number;
  streams: number;
}

export interface PersonalityTrait {
  id: string;
  label: string;
  description: string;
}

export interface PersonalitySummary {
  title: string;
  tagline: string;
  traits: PersonalityTrait[];
}

// ---- Storytelling types ----
export interface EraChapter {
  year: number;
  label: string;
  description: string;
}

export interface Milestone {
  id: string;
  label: string;
  value: string;
  ts?: string;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
}

export function computeBasicStats(streams: StreamRecord[]): BasicStats {
  const totalStreams = streams.length;
  const totalMs = streams.reduce(
    (sum, row) => sum + (row.ms_played ?? 0),
    0,
  );
  const totalHours = totalMs / 1000 / 60 / 60;
  const totalDays = totalHours / 24;

  // timestamps
  let firstTs: string | null = null;
  let lastTs: string | null = null;

  const tsValues = streams
    .map((r) => r.ts)
    .filter((ts): ts is string => typeof ts === "string");

  if (tsValues.length > 0) {
    // sort lexicographically; ISO timestamps are sortable this way
    tsValues.sort();
    firstTs = tsValues[0];
    lastTs = tsValues[tsValues.length - 1];
  }

  // distinct artists / tracks
  const artistSet = new Set<string>();
  const trackSet = new Set<string>();

  for (const row of streams) {
    if (row.master_metadata_album_artist_name) {
      artistSet.add(row.master_metadata_album_artist_name);
    }
    if (row.master_metadata_track_name) {
      trackSet.add(row.master_metadata_track_name);
    }
  }

  // listening by year
  const byYearMap = new Map<number, { ms: number; streams: number }>();

  for (const row of streams) {
    if (!row.ts) continue;
    const year = new Date(row.ts).getUTCFullYear();
    if (!Number.isFinite(year)) continue;

    const current = byYearMap.get(year) ?? { ms: 0, streams: 0 };
    current.ms += row.ms_played ?? 0;
    current.streams += 1;
    byYearMap.set(year, current);
  }

  const listeningByYear = Array.from(byYearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, { ms, streams }]) => ({
      year,
      hours: ms / 1000 / 60 / 60,
      streams,
    }));

  return {
    totalStreams,
    totalMs,
    totalHours,
    totalDays,
    firstTs,
    lastTs,
    distinctArtists: artistSet.size,
    distinctTracks: trackSet.size,
    listeningByYear,
  };
}

export function computeTopArtists(
  streams: StreamRecord[],
  limit = 10,
): TopArtistRow[] {
  if (streams.length === 0) return [];

  // Group by artist: sum ms_played and count streams
  const map = new Map<string, { ms: number; streams: number }>();

  for (const row of streams) {
    const artist = row.master_metadata_album_artist_name;
    if (!artist) continue;

    const current = map.get(artist) ?? { ms: 0, streams: 0 };
    current.ms += row.ms_played ?? 0;
    current.streams += 1;
    map.set(artist, current);
  }

  const result: TopArtistRow[] = Array.from(map.entries())
    .map(([artist, { ms, streams }]) => ({
      artist,
      hours: ms / 1000 / 60 / 60,
      streams,
    }))
    .sort((a, b) => b.hours - a.hours) // sort by hours desc
    .slice(0, limit);

  return result;
}

export function computeListeningHabits(streams: StreamRecord[]): ListeningHabits {
  if (streams.length === 0) {
    return { byHour: [], byWeekday: [] };
  }

  // group ms_played by hour-of-day (UTC)
  const hourMap = new Map<number, number>();
  // group ms_played by weekday (UTC)
  const weekdayMap = new Map<string, number>();

  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (const row of streams) {
    if (!row.ts) continue;

    const date = new Date(row.ts);
    if (isNaN(date.getTime())) continue;

    const hour = date.getUTCHours(); // 0–23
    const weekdayIndex = date.getUTCDay(); // 0 (Sun) – 6 (Sat)
    const weekday = weekdayNames[weekdayIndex];

    const ms = row.ms_played ?? 0;

    hourMap.set(hour, (hourMap.get(hour) ?? 0) + ms);
    weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + ms);
  }

  const byHour: ListeningByHourRow[] = Array.from(hourMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, ms]) => ({
      hour,
      hours: ms / 1000 / 60 / 60,
    }));

  const weekdayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const byWeekday: ListeningByWeekdayRow[] = weekdayOrder
    .filter((day) => weekdayMap.has(day))
    .map((day) => ({
      weekday: day,
      hours: (weekdayMap.get(day) ?? 0) / 1000 / 60 / 60,
    }));

  return { byHour, byWeekday };
}

export function computeTopTracks(
  streams: StreamRecord[],
  limit = 10,
): TopTrackRow[] {
  if (streams.length === 0) return [];

  const map = new Map<string, { track: string; artist: string; ms: number; streams: number }>();

  for (const row of streams) {
    const track = row.master_metadata_track_name;
    const artist = row.master_metadata_album_artist_name;
    if (!track || !artist) continue;

    const key = `${track}:::${artist}`;
    const current = map.get(key) ?? { track, artist, ms: 0, streams: 0 };
    current.ms += row.ms_played ?? 0;
    current.streams += 1;
    map.set(key, current);
  }

  const result: TopTrackRow[] = Array.from(map.values())
    .map((entry) => ({
      track: entry.track,
      artist: entry.artist,
      hours: entry.ms / 1000 / 60 / 60,
      streams: entry.streams,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit);

  return result;
}

export function computePersonality(
  stats: BasicStats,
  habits: ListeningHabits,
  topArtists: TopArtistRow[],
): PersonalitySummary | null {
  if (stats.totalHours <= 0 || stats.totalStreams <= 0) {
    return null;
  }

  const traits: PersonalityTrait[] = [];

  const totalHours = stats.totalHours;

  // ---- Time-of-day traits ----
  const nightHours = habits.byHour
    .filter((row) => row.hour >= 20 || row.hour <= 3)
    .reduce((sum, row) => sum + row.hours, 0);

  const morningHours = habits.byHour
    .filter((row) => row.hour >= 5 && row.hour <= 11)
    .reduce((sum, row) => sum + row.hours, 0);

  const nightRatio = nightHours / totalHours;
  const morningRatio = morningHours / totalHours;

  if (nightRatio >= 0.6) {
    traits.push({
      id: "night-owl",
      label: "Night Owl",
      description:
        "Most of your listening happens late in the evening and after dark.",
    });
  } else if (morningRatio >= 0.6) {
    traits.push({
      id: "early-bird",
      label: "Early Bird",
      description:
        "You tend to listen in the mornings more than any other time.",
    });
  }

  // ---- Weekday vs weekend traits ----
  const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const weekendNames = ["Saturday", "Sunday"];

  const weekdayHours = habits.byWeekday
    .filter((row) => weekdayNames.includes(row.weekday))
    .reduce((sum, row) => sum + row.hours, 0);
  const weekendHours = habits.byWeekday
    .filter((row) => weekendNames.includes(row.weekday))
    .reduce((sum, row) => sum + row.hours, 0);

  const weekdayRatio = weekdayHours / (weekdayHours + weekendHours || 1);
  const weekendRatio = weekendHours / (weekdayHours + weekendHours || 1);

  if (weekendRatio >= 0.55) {
    traits.push({
      id: "weekend-warrior",
      label: "Weekend Listener",
      description: "You listen more on weekends than during the work week.",
    });
  } else if (weekdayRatio >= 0.55) {
    traits.push({
      id: "weekday-listener",
      label: "Workday Listener",
      description:
        "Most of your listening happens on weekdays—music keeps you company during the grind.",
    });
  }

  // ---- Loyalty vs exploration ----
  const topArtist = topArtists[0];
  if (topArtist) {
    const topArtistRatio = topArtist.hours / totalHours;

    if (topArtistRatio >= 0.3) {
      traits.push({
        id: "loyalist",
        label: "The Loyalist",
        description:
          "A big share of your time goes to your very favorite artists.",
      });
    }
  }

  const artistPerStream = stats.distinctArtists / stats.totalStreams;
  if (artistPerStream >= 0.2) {
    traits.push({
      id: "explorer",
      label: "The Explorer",
      description:
        "You hop between lots of different artists instead of looping the same few.",
    });
  }

  if (traits.length === 0) {
    traits.push({
      id: "balanced",
      label: "The All-Rounder",
      description:
        "Your listening is pretty balanced—no extreme habits stand out.",
    });
  }

  // Build a title from the first 1–2 trait labels
  const mainLabels = traits.slice(0, 2).map((t) => t.label);
  const title =
    mainLabels.length === 1
      ? mainLabels[0]
      : `${mainLabels[0]} · ${mainLabels[1]}`;

  const tagline = "A quick snapshot of how you tend to use Spotify over time.";

  return {
    title,
    tagline,
    traits,
  };
}

// ---- Storytelling computations ----
export function computeEras(stats: BasicStats, streams: StreamRecord[]): EraChapter[] {
  if (stats.listeningByYear.length === 0) return [];

  // Build per-year details: top artist, hours, year-over-year deltas
  const byYear = stats.listeningByYear;

  // Map year -> top artist name
  const topArtistByYear = new Map<number, string>();
  const msByYearArtist = new Map<number, Map<string, number>>();

  for (const row of streams) {
    if (!row.ts) continue;
    const year = new Date(row.ts).getUTCFullYear();
    const artist = row.master_metadata_album_artist_name;
    const ms = row.ms_played ?? 0;
    if (!artist || !Number.isFinite(year)) continue;
    const inner = msByYearArtist.get(year) ?? new Map<string, number>();
    inner.set(artist, (inner.get(artist) ?? 0) + ms);
    msByYearArtist.set(year, inner);
  }

  for (const [year, inner] of msByYearArtist.entries()) {
    let bestArtist = "";
    let bestMs = -1;
    for (const [artist, ms] of inner.entries()) {
      if (ms > bestMs) {
        bestMs = ms;
        bestArtist = artist;
      }
    }
    if (bestArtist) topArtistByYear.set(year, bestArtist);
  }

  const chapters: EraChapter[] = [];

  for (let i = 0; i < byYear.length; i++) {
    const curr = byYear[i];
    const prev = i > 0 ? byYear[i - 1] : undefined;

    const hours = curr.hours;
    const yoy = prev ? hours - prev.hours : 0;
    const topArtist = topArtistByYear.get(curr.year);

    // Heuristics for labels
    let label = "A solid year";
    let description = "Steady listening without extreme spikes.";

    const isPeak = hours >= Math.max(...byYear.map((y) => y.hours)) - 1e-6; // allow float tie
    const isLow = hours <= Math.min(...byYear.map((y) => y.hours)) + 1e-6;

    const changedTopArtist = (() => {
      if (!prev) return false;
      const prevTop = topArtistByYear.get(prev.year);
      return !!topArtist && !!prevTop && topArtist !== prevTop;
    })();

    if (i === 0) {
      label = "Discovery begins";
      description = "Your Spotify journey kicks off.";
    } else if (isPeak) {
      label = "Peak hours year";
      description = "You spent the most time listening this year.";
    } else if (isLow) {
      label = "Quietest year";
      description = "Listening dipped to a low ebb.";
    } else if (changedTopArtist && topArtist) {
      label = `New obsession: ${topArtist}`;
      description = "Your top artist changed—fresh phases and tastes.";
    } else if (yoy >= hours * 0.25) {
      label = "Big jump in listening";
      description = "A notable rise in total hours.";
    } else if (yoy <= -hours * 0.25) {
      label = "Big drop in listening";
      description = "A notable fall in total hours.";
    }

    chapters.push({
      year: curr.year,
      label,
      description,
    });
  }

  return chapters;
}

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

export function computeBadges(streams: StreamRecord[]): Badge[] {
  const badges: Badge[] = [];
  if (streams.length === 0) return badges;

  // Repeat Offender: a single track played an "absurd" number of times (heuristic: >= 500)
  const trackCount = new Map<string, number>();
  for (const r of streams) {
    const t = r.master_metadata_track_name;
    const a = r.master_metadata_album_artist_name;
    if (!t || !a) continue;
    const key = `${t}:::${a}`;
    trackCount.set(key, (trackCount.get(key) ?? 0) + 1);
  }
  const absurd = Array.from(trackCount.values()).some((c) => c >= 500);
  if (absurd) {
    badges.push({ id: "repeat-offender", label: "Repeat Offender", description: "One track was played an outrageous number of times." });
  }

  // Country Hopper: listened across many countries (heuristic: >= 10 distinct conn_country)
  const countries = new Set<string>();
  for (const r of streams) {
    if (typeof r.conn_country === "string" && r.conn_country.length > 0) {
      countries.add(r.conn_country);
    }
  }
  if (countries.size >= 10) {
    badges.push({ id: "country-hopper", label: "Country Hopper", description: "You listened across many countries." });
  }

  // Device Juggler: used many platforms (heuristic: >= 6 distinct platform values)
  const platforms = new Set<string>();
  for (const r of streams) {
    if (typeof r.platform === "string" && r.platform.length > 0) {
      platforms.add(r.platform);
    }
  }
  if (platforms.size >= 6) {
    badges.push({ id: "device-juggler", label: "Device Juggler", description: "You’ve used lots of different platforms to listen." });
  }

  return badges;
}