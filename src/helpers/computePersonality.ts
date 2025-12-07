import type { BasicStats, ListeningHabits, TopArtistRow, PersonalitySummary, PersonalityTrait } from "../interfaces/interfaces";

export function computePersonality(
  stats: BasicStats,
  habits: ListeningHabits,
  topArtists: TopArtistRow[],
): PersonalitySummary | null {
  if (stats.totalHours <= 0 || stats.totalStreams <= 0) {
    return null;
  }

  const traits: PersonalityTrait[] = [];

  const totalHours = stats.totalHours;

  // ---- Time-of-day traits ----
  const nightHours = habits.byHour
    .filter((row) => row.hour >= 20 || row.hour <= 3)
    .reduce((sum, row) => sum + row.hours, 0);

  const morningHours = habits.byHour
    .filter((row) => row.hour >= 5 && row.hour <= 11)
    .reduce((sum, row) => sum + row.hours, 0);

  const nightRatio = nightHours / totalHours;
  const morningRatio = morningHours / totalHours;

  if (nightRatio >= 0.6) {
    traits.push({
      id: "night-owl",
      label: "Night Owl",
      description:
        "Most of your listening happens late in the evening and after dark.",
    });
  } else if (morningRatio >= 0.6) {
    traits.push({
      id: "early-bird",
      label: "Early Bird",
      description:
        "You tend to listen in the mornings more than any other time.",
    });
  }

  // ---- Weekday vs weekend traits ----
  const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const weekendNames = ["Saturday", "Sunday"];

  const weekdayHours = habits.byWeekday
    .filter((row) => weekdayNames.includes(row.weekday))
    .reduce((sum, row) => sum + row.hours, 0);
  const weekendHours = habits.byWeekday
    .filter((row) => weekendNames.includes(row.weekday))
    .reduce((sum, row) => sum + row.hours, 0);

  const weekdayRatio = weekdayHours / (weekdayHours + weekendHours || 1);
  const weekendRatio = weekendHours / (weekdayHours + weekendHours || 1);

  if (weekendRatio >= 0.55) {
    traits.push({
      id: "weekend-warrior",
      label: "Weekend Listener",
      description: "You listen more on weekends than during the work week.",
    });
  } else if (weekdayRatio >= 0.55) {
    traits.push({
      id: "weekday-listener",
      label: "Workday Listener",
      description:
        "Most of your listening happens on weekdays—music keeps you company during the grind.",
    });
  }

  // ---- Loyalty vs exploration ----
  const topArtist = topArtists[0];
  if (topArtist) {
    const topArtistRatio = topArtist.hours / totalHours;

    if (topArtistRatio >= 0.3) {
      traits.push({
        id: "loyalist",
        label: "The Loyalist",
        description:
          "A big share of your time goes to your very favorite artists.",
      });
    }
  }

  const artistPerStream = stats.distinctArtists / stats.totalStreams;
  if (artistPerStream >= 0.2) {
    traits.push({
      id: "explorer",
      label: "The Explorer",
      description:
        "You hop between lots of different artists instead of looping the same few.",
    });
  }

  if (traits.length === 0) {
    traits.push({
      id: "balanced",
      label: "The All-Rounder",
      description:
        "Your listening is pretty balanced—no extreme habits stand out.",
    });
  }

  // Build a title from the first 1–2 trait labels
  const mainLabels = traits.slice(0, 2).map((t) => t.label);
  const title =
    mainLabels.length === 1
      ? mainLabels[0]
      : `${mainLabels[0]} · ${mainLabels[1]}`;

  const tagline = "A quick snapshot of how you tend to use Spotify over time.";

  return {
    title,
    tagline,
    traits,
  };
}