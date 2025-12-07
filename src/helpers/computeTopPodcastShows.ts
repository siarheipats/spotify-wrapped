import type { StreamRecord, TopPodcastShowRow } from "../interfaces/interfaces";
import { isPodcast } from "./commonHelpers";

export function computeTopPodcastShows(streams: StreamRecord[], limit = 10): TopPodcastShowRow[] {
  const map = new Map<string, { ms: number; episodes: number }>();
  for (const r of streams) {
    if (!isPodcast(r)) continue;
    const show = r.episode_show_name || "Unknown Show";
    const ms = r.ms_played ?? 0;
    const curr = map.get(show) ?? { ms: 0, episodes: 0 };
    curr.ms += ms;
    curr.episodes += 1;
    map.set(show, curr);
  }
  return Array.from(map.entries())
    .map(([show, { ms, episodes }]) => ({ show, hours: ms / 1000 / 60 / 60, episodes }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit);
}