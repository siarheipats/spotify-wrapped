import { useMemo, useState } from "react";
import { Box, Paper, Typography, Grid, TextField } from "@mui/material";
import type { StreamRecord, TopArtistRow, TopTrackRow } from "../interfaces/interfaces";
import { filterStreamsByDateRange } from "../helpers/filterStreamsByDateRange";
import { computeTopArtists } from "../helpers/computeTopArtists";
import { computeTopTracks } from "../helpers/computeTopTracks";

interface Props {
  streams: StreamRecord[];
}

export function DateRangeStatsSection({ streams }: Props) {
  const [startStr, setStartStr] = useState<string>("");
  const [endStr, setEndStr] = useState<string>("");

  const startDate = useMemo(() => (startStr ? new Date(startStr) : null), [startStr]);
  const endDate = useMemo(() => (endStr ? new Date(endStr) : null), [endStr]);

  const filtered = useMemo(() => filterStreamsByDateRange(streams, startDate, endDate), [streams, startDate, endDate]);
  const totalHours = useMemo(() => {
    let ms = 0;
    for (const s of filtered) ms += s.ms_played ?? 0;
    return ms / 1000 / 60 / 60;
  }, [filtered]);

  const topArtists: TopArtistRow[] = useMemo(() => computeTopArtists(filtered, 10), [filtered]);
  const topTracks: TopTrackRow[] = useMemo(() => computeTopTracks(filtered, 10), [filtered]);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>
        Date Range Insights
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Select a date range to see total hours, top artists, and top tracks for that period.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Start date"
            type="date"
            value={startStr}
            onChange={(e) => setStartStr(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="End date"
            type="date"
            value={endStr}
            onChange={(e) => setEndStr(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
      </Grid>

      <Box mb={2}>
        <Typography variant="subtitle1">Total hours in range</Typography>
        <Typography variant="body2">{totalHours.toFixed(1)} hours</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Top artists</Typography>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            {topArtists.map((a) => (
              <li key={a.artist}>
                <Typography variant="body2"><strong>{a.artist}</strong> — {a.hours.toFixed(1)} h · {a.streams} plays</Typography>
              </li>
            ))}
            {topArtists.length === 0 && (
              <Typography variant="body2" color="text.secondary">No artists in selected range.</Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Top tracks</Typography>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            {topTracks.map((t) => (
              <li key={`${t.track}:::${t.artist}`}>
                <Typography variant="body2"><strong>{t.track}</strong> — {t.artist} · {t.hours.toFixed(1)} h · {t.streams} plays</Typography>
              </li>
            ))}
            {topTracks.length === 0 && (
              <Typography variant="body2" color="text.secondary">No tracks in selected range.</Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
