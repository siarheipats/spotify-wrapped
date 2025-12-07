import type { StreamRecord } from "../interfaces/interfaces";

export interface FirstPlayInfo {
  track: string;
  artist: string;
  when: Date | null;
}

export function computeFirstPlay(streams: StreamRecord[]): FirstPlayInfo | null {
  if (!streams || streams.length === 0) return null;
  let earliest = streams[0];
  for (const s of streams) {
    if (s.ts && earliest.ts && new Date(s.ts) < new Date(earliest.ts)) {
      earliest = s;
    }
  }
  const track = earliest.master_metadata_track_name || "Unknown track";
  const artist = earliest.master_metadata_album_artist_name || "Unknown artist";
  const when = earliest.ts ? new Date(earliest.ts) : null;
  return { track, artist, when };
}
