import type { StreamRecord, RepeatChampions } from "../interfaces/interfaces";

export function computeRepeatChampions(streams: StreamRecord[]): RepeatChampions {
  const trackAgg = new Map<string, { track: string; artist: string; ms: number; plays: number }>();
  const trackDayPlays = new Map<string, number>(); // key: track:::artist:::YYYY-MM-DD

  for (const r of streams) {
    const track = r.master_metadata_track_name;
    const artist = r.master_metadata_album_artist_name;
    if (!track || !artist) continue;
    const ms = r.ms_played ?? 0;
    const key = `${track}:::${artist}`;
    const agg = trackAgg.get(key) ?? { track, artist, ms: 0, plays: 0 };
    agg.ms += ms; agg.plays += 1; trackAgg.set(key, agg);
    if (r.ts) {
      const d = new Date(r.ts);
      if (!isNaN(d.getTime())) {
        const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        const dayKey = `${key}:::${day}`;
        trackDayPlays.set(dayKey, (trackDayPlays.get(dayKey) ?? 0) + 1);
      }
    }
  }

  const highestHoursTracks = Array.from(trackAgg.values())
    .map((t) => ({ track: t.track, artist: t.artist, hours: t.ms / 1000 / 60 / 60 }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  let maxDayPlays = 0;
  const mostPlaysInOneDayRaw: Array<{ track: string; artist: string; day: string; plays: number }> = [];
  for (const plays of trackDayPlays.values()) {
    if (plays > maxDayPlays) maxDayPlays = plays;
  }
  for (const [k, plays] of trackDayPlays.entries()) {
    if (plays === maxDayPlays) {
      const parts = k.split(":::");
      const track = parts[0]; const artist = parts[1]; const day = parts[2];
      mostPlaysInOneDayRaw.push({ track, artist, day, plays });
    }
  }

  const played100Plus = Array.from(trackAgg.values())
    .filter((t) => t.plays >= 100)
    .map((t) => ({ track: t.track, artist: t.artist, plays: t.plays }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  return { highestHoursTracks, mostPlaysInOneDay: mostPlaysInOneDayRaw, played100Plus };
}