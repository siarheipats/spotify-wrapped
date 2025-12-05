// src/spotifyTypes.ts

// This matches the fields from the Spotify streaming history JSON.
// We keep it loose for now and can refine later.
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
