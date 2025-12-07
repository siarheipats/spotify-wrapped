import type { StreamRecord } from "../interfaces/interfaces";

export function isPodcast(row: StreamRecord): boolean {
  return !!row.episode_name || !!row.episode_show_name;
}