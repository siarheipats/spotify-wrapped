import type { StreamRecord, GhostedArtistRow } from "../interfaces/interfaces";

export function computeGhostedArtists(streams: StreamRecord[], cutoffYears = 2): GhostedArtistRow[] {
  // Artists listened historically but not in the last `cutoffYears` years.
  const byArtistYears = new Map<string, Set<number>>();
  let maxYear = -Infinity;
  for (const r of streams) {
    const artist = r.master_metadata_album_artist_name;
    if (!artist || !r.ts) continue;
    const year = new Date(r.ts).getUTCFullYear();
    if (!Number.isFinite(year)) continue;
    maxYear = Math.max(maxYear, year);
    const set = byArtistYears.get(artist) ?? new Set<number>();
    set.add(year); byArtistYears.set(artist, set);
  }
  const threshold = maxYear - cutoffYears;
  const result: GhostedArtistRow[] = [];
  for (const [artist, years] of byArtistYears.entries()) {
    const lastYear = Math.max(...Array.from(years));
    if (lastYear <= threshold && years.size >= cutoffYears) {
      result.push({ artist, lastYear, yearsActive: years.size });
    }
  }
  return result.sort((a, b) => a.lastYear - b.lastYear).slice(0, 20);
}