import type { StreamRecord, MusicPodcastSplit } from "../interfaces/interfaces";
import { isPodcast } from "./commonHelpers";

export function computeMusicPodcastSplit(streams: StreamRecord[]): MusicPodcastSplit {
  let musicMs = 0;
  let podcastMs = 0;
  for (const r of streams) {
    const ms = r.ms_played ?? 0;
    if (isPodcast(r)) podcastMs += ms; else musicMs += ms;
  }
  const musicHours = musicMs / 1000 / 60 / 60;
  const podcastHours = podcastMs / 1000 / 60 / 60;
  const total = musicHours + podcastHours;
  return {
    musicHours,
    podcastHours,
    podcastRatio: total > 0 ? podcastHours / total : 0,
  };
}