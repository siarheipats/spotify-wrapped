import type { StreamRecord, ForeverTop10 } from "../interfaces/interfaces";

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