import type { BasicStats, StreamRecord, EraChapter } from "../interfaces/interfaces";

export function computeEras(stats: BasicStats, streams: StreamRecord[]): EraChapter[] {
  if (stats.listeningByYear.length === 0) return [];

  // Build per-year details: top artist, hours, year-over-year deltas
  const byYear = stats.listeningByYear;

  // Map year -> top artist name
  const topArtistByYear = new Map<number, string>();
  const msByYearArtist = new Map<number, Map<string, number>>();

  for (const row of streams) {
    if (!row.ts) continue;
    const year = new Date(row.ts).getUTCFullYear();
    const artist = row.master_metadata_album_artist_name;
    const ms = row.ms_played ?? 0;
    if (!artist || !Number.isFinite(year)) continue;
    const inner = msByYearArtist.get(year) ?? new Map<string, number>();
    inner.set(artist, (inner.get(artist) ?? 0) + ms);
    msByYearArtist.set(year, inner);
  }

  for (const [year, inner] of msByYearArtist.entries()) {
    let bestArtist = "";
    let bestMs = -1;
    for (const [artist, ms] of inner.entries()) {
      if (ms > bestMs) {
        bestMs = ms;
        bestArtist = artist;
      }
    }
    if (bestArtist) topArtistByYear.set(year, bestArtist);
  }

  const chapters: EraChapter[] = [];

  for (let i = 0; i < byYear.length; i++) {
    const curr = byYear[i];
    const prev = i > 0 ? byYear[i - 1] : undefined;

    const hours = curr.hours;
    const yoy = prev ? hours - prev.hours : 0;
    const topArtist = topArtistByYear.get(curr.year);

    // Heuristics for labels
    let label = "A solid year";
    let description = "Steady listening without extreme spikes.";

    const isPeak = hours >= Math.max(...byYear.map((y) => y.hours)) - 1e-6; // allow float tie
    const isLow = hours <= Math.min(...byYear.map((y) => y.hours)) + 1e-6;

    const changedTopArtist = (() => {
      if (!prev) return false;
      const prevTop = topArtistByYear.get(prev.year);
      return !!topArtist && !!prevTop && topArtist !== prevTop;
    })();

    if (i === 0) {
      label = "Discovery begins";
      description = "Your Spotify journey kicks off.";
    } else if (isPeak) {
      label = "Peak hours year";
      description = "You spent the most time listening this year.";
    } else if (isLow) {
      label = "Quietest year";
      description = "Listening dipped to a low ebb.";
    } else if (changedTopArtist && topArtist) {
      label = `New obsession: ${topArtist}`;
      description = "Your top artist changed—fresh phases and tastes.";
    } else if (yoy >= hours * 0.25) {
      label = "Big jump in listening";
      description = "A notable rise in total hours.";
    } else if (yoy <= -hours * 0.25) {
      label = "Big drop in listening";
      description = "A notable fall in total hours.";
    }

    chapters.push({
      year: curr.year,
      label,
      description,
    });
  }

  return chapters;
}