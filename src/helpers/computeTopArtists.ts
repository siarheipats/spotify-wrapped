import type { StreamRecord, TopArtistRow } from "../interfaces/interfaces";

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