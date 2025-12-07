import type { StreamRecord, ListeningHabits, ListeningByHourRow, ListeningByWeekdayRow } from "../interfaces/interfaces";

export function computeListeningHabits(streams: StreamRecord[]): ListeningHabits {
  if (streams.length === 0) {
    return { byHour: [], byWeekday: [] };
  }

  // group ms_played by hour-of-day (UTC)
  const hourMap = new Map<number, number>();
  // group ms_played by weekday (UTC)
  const weekdayMap = new Map<string, number>();

  const weekdayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (const row of streams) {
    if (!row.ts) continue;

    const date = new Date(row.ts);
    if (isNaN(date.getTime())) continue;

    const hour = date.getUTCHours(); // 0–23
    const weekdayIndex = date.getUTCDay(); // 0 (Sun) – 6 (Sat)
    const weekday = weekdayNames[weekdayIndex];

    const ms = row.ms_played ?? 0;

    hourMap.set(hour, (hourMap.get(hour) ?? 0) + ms);
    weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + ms);
  }

  const byHour: ListeningByHourRow[] = Array.from(hourMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, ms]) => ({
      hour,
      hours: ms / 1000 / 60 / 60,
    }));

  const weekdayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const byWeekday: ListeningByWeekdayRow[] = weekdayOrder
    .filter((day) => weekdayMap.has(day))
    .map((day) => ({
      weekday: day,
      hours: (weekdayMap.get(day) ?? 0) / 1000 / 60 / 60,
    }));

  return { byHour, byWeekday };
}