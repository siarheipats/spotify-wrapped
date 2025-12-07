export interface StreamRecord {
  ts?: string; // ISO timestamp, string
  ms_played?: number;
  platform?: string;
  conn_country?: string;

  master_metadata_track_name?: string;
  master_metadata_album_artist_name?: string;
  master_metadata_album_album_name?: string;

  episode_name?: string;
  episode_show_name?: string;

  shuffle?: boolean;
  skipped?: boolean;
  offline?: boolean;
  incognito_mode?: boolean;

  // for debugging / provenance
  _source_file?: string;

  [key: string]: unknown; // allow extra unknown fields
}

export interface MusicPodcastSplit {
  musicHours: number;
  podcastHours: number;
  podcastRatio: number; // 0..1
}

export interface TopPodcastShowRow {
  show: string;
  hours: number;
  episodes: number;
}

export interface TopPodcastEpisodeRow {
  show: string;
  episode: string;
  hours: number;
  plays: number;
}

export interface SkipAnalytics {
  skipRate: number; // 0..1 over music tracks
  avgTimeBeforeSkipSec: number | null;
  neverSkippedTracks: Array<{ track: string; artist?: string }>;
  skipRateByYear: { year: number; rate: number }[];
}

export interface SessionStats {
  avgSessionMinutes: number | null;
  longestSessionMinutes: number | null;
  sessionsPerDayAvg: number | null;
}

export interface ForeverTop10 {
  topArtists: Array<{ artist: string; hours: number; streams: number }>;
  topTracks: Array<{ track: string; artist: string; hours: number; streams: number }>;
}

export interface RepeatChampions {
  highestHoursTracks: Array<{ track: string; artist: string; hours: number }>;
  mostPlaysInOneDay: Array<{ track: string; artist: string; day: string; plays: number }>;
  played100Plus: Array<{ track: string; artist: string; plays: number }>;
}

export interface GhostedArtistRow { artist: string; lastYear: number; yearsActive: number }

export interface ClimbersRow { artist: string; year: number; deltaHours: number }

export interface FrozenTrackRow { track: string; artist: string }

export interface BasicStats {
  totalStreams: number;
  totalMs: number;
  totalHours: number;
  totalDays: number;
  firstTs: string | null;
  lastTs: string | null;
  distinctArtists: number;
  distinctTracks: number;
  listeningByYear: { year: number; hours: number; streams: number }[];
}

export interface TopArtistRow {
  artist: string;
  hours: number;
  streams: number;
}

export interface ListeningByHourRow {
  hour: number;    // 0–23
  hours: number;
}

export interface ListeningByWeekdayRow {
  weekday: string; // "Monday", ...
  hours: number;
}

export interface ListeningHabits {
  byHour: ListeningByHourRow[];
  byWeekday: ListeningByWeekdayRow[];
}

export interface TopTrackRow {
  track: string;
  artist: string;
  hours: number;
  streams: number;
}

export interface PersonalityTrait {
  id: string;
  label: string;
  description: string;
}

export interface PersonalitySummary {
  title: string;
  tagline: string;
  traits: PersonalityTrait[];
}

// ---- Storytelling types ----
export interface EraChapter {
  year: number;
  label: string;
  description: string;
}

export interface Milestone {
  id: string;
  label: string;
  value: string;
  ts?: string;
}

export interface Badge {
  id: string;
  label: string;
  description: string;
}