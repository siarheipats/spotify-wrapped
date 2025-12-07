import type { StreamRecord, FrozenTrackRow } from "../interfaces/interfaces";

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