import type { StreamRecord, TopPodcastEpisodeRow} from "../interfaces/interfaces";
import { isPodcast } from "./commonHelpers";

export function computeTopPodcastEpisodes(streams: StreamRecord[], limit = 10): TopPodcastEpisodeRow[] {
  const map = new Map<string, { show: string; episode: string; ms: number; plays: number }>();
  for (const r of streams) {
    if (!isPodcast(r)) continue;
    const show = r.episode_show_name || "Unknown Show";
    const episode = r.episode_name || "Unknown Episode";
    const ms = r.ms_played ?? 0;
    const key = `${show}:::${episode}`;
    const curr = map.get(key) ?? { show, episode, ms: 0, plays: 0 };
    curr.ms += ms;
    curr.plays += 1;
    map.set(key, curr);
  }
  return Array.from(map.values())
    .map((v) => ({ show: v.show, episode: v.episode, hours: v.ms / 1000 / 60 / 60, plays: v.plays }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit);
}