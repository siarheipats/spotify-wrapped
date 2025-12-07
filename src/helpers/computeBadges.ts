import type { StreamRecord, Badge } from "../interfaces/interfaces";

export function computeBadges(streams: StreamRecord[]): Badge[] {
  const badges: Badge[] = [];
  if (streams.length === 0) return badges;

  // Repeat Offender: a single track played an "absurd" number of times (heuristic: >= 500)
  const trackCount = new Map<string, number>();
  for (const r of streams) {
    const t = r.master_metadata_track_name;
    const a = r.master_metadata_album_artist_name;
    if (!t || !a) continue;
    const key = `${t}:::${a}`;
    trackCount.set(key, (trackCount.get(key) ?? 0) + 1);
  }
  const absurd = Array.from(trackCount.values()).some((c) => c >= 500);
  if (absurd) {
    badges.push({ id: "repeat-offender", label: "Repeat Offender", description: "One track was played an outrageous number of times." });
  }

  // Country Hopper: listened across many countries (heuristic: >= 10 distinct conn_country)
  const countries = new Set<string>();
  for (const r of streams) {
    if (typeof r.conn_country === "string" && r.conn_country.length > 0) {
      countries.add(r.conn_country);
    }
  }
  if (countries.size >= 10) {
    badges.push({ id: "country-hopper", label: "Country Hopper", description: "You listened across many countries." });
  }

  // Device Juggler: used many platforms (heuristic: >= 6 distinct platform values)
  const platforms = new Set<string>();
  for (const r of streams) {
    if (typeof r.platform === "string" && r.platform.length > 0) {
      platforms.add(r.platform);
    }
  }
  if (platforms.size >= 6) {
    badges.push({ id: "device-juggler", label: "Device Juggler", description: "You’ve used lots of different platforms to listen." });
  }

  return badges;
}