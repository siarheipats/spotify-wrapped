import type { StreamRecord, BasicStats } from "../interfaces/interfaces";

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