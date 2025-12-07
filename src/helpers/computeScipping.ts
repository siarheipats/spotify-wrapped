import type { StreamRecord, SkipAnalytics } from "../interfaces/interfaces";
import { isPodcast } from "./commonHelpers";

export function computeSkipping(streams: StreamRecord[]): SkipAnalytics {
  const trackKey = (r: StreamRecord) => {
    const t = r.master_metadata_track_name || "";
    const a = r.master_metadata_album_artist_name || "";
    return `${t}:::${a}`;
  };

  let totalTracks = 0;
  let skippedTracks = 0;
  let totalSkipMs = 0;
  let skipCountMs = 0;
  const neverSkipped = new Map<string, { track: string; artist?: string; skipped: boolean }>();
  const yearCounts = new Map<number, { total: number; skipped: number }>();

  for (const r of streams) {
    if (isPodcast(r)) continue; // skip analysis focused on music tracks
    const key = trackKey(r);
    const track = r.master_metadata_track_name || "";
    const artist = r.master_metadata_album_artist_name || undefined;
    const skipped = !!r.skipped;
    const ms = r.ms_played ?? 0;
    totalTracks += 1;
    if (skipped) {
      skippedTracks += 1;
      if (ms > 0) { totalSkipMs += ms; skipCountMs += 1; }
    }
    if (!neverSkipped.has(key)) neverSkipped.set(key, { track, artist, skipped });
    else if (neverSkipped.get(key) && neverSkipped.get(key)!.skipped) {
      // once marked skipped, keep as skipped
    }
    // year
    if (r.ts) {
      const y = new Date(r.ts).getUTCFullYear();
      const curr = yearCounts.get(y) ?? { total: 0, skipped: 0 };
      curr.total += 1;
      curr.skipped += skipped ? 1 : 0;
      yearCounts.set(y, curr);
    }
  }

  const skipRate = totalTracks > 0 ? skippedTracks / totalTracks : 0;
  const avgTimeBeforeSkipSec = skipCountMs > 0 ? Math.round(totalSkipMs / skipCountMs / 1000) : null;
  const neverSkippedTracks = Array.from(neverSkipped.values()).filter((v) => !v.skipped);
  const skipRateByYear = Array.from(yearCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, { total, skipped }]) => ({ year, rate: total > 0 ? skipped / total : 0 }));

  return { skipRate, avgTimeBeforeSkipSec, neverSkippedTracks, skipRateByYear };
}
