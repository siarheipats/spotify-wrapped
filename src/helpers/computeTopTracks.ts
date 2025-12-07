import type { StreamRecord, TopTrackRow } from "../interfaces/interfaces";

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