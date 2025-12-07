import type { StreamRecord, ClimbersRow } from "../interfaces/interfaces";

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