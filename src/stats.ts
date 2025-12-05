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