import { Box, Paper, Typography, Grid, Tooltip } from "@mui/material";
import type { ForeverTop10, RepeatChampions, GhostedArtistRow, ClimbersRow, FrozenTrackRow } from "../analytics";

interface Props {
  foreverTop: ForeverTop10;
  champions: RepeatChampions;
  ghosted: GhostedArtistRow[];
  climbers: ClimbersRow[];
  frozen: FrozenTrackRow[];
}

export function ArtistTrackInsightsSection({ foreverTop, champions, ghosted, climbers, frozen }: Props) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>
        Artist / Track Insights
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Lifetime trends across your artists and tracks.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="subtitle1">The Forever Top 10 — Artists</Typography>
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption">
                    Computed by summing total milliseconds listened per artist across all years, then sorting by hours.
                  </Typography>
                </Box>
              }
            >
              <Typography variant="caption" sx={{ cursor: "help" }}>?</Typography>
            </Tooltip>
          </Box>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            {foreverTop.topArtists.map((a) => (
              <li key={a.artist}>
                <Tooltip
                  title={`Raw totals: hours=${a.hours.toFixed(3)}, plays=${a.streams}`}
                  placement="right"
                >
                  <Typography variant="body2"><strong>{a.artist}</strong> — {a.hours.toFixed(1)} h · {a.streams} plays</Typography>
                </Tooltip>
              </li>
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="subtitle1">The Forever Top 10 — Tracks</Typography>
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption">
                    Computed by summing total milliseconds listened per track across all years, then sorting by hours.
                  </Typography>
                </Box>
              }
            >
              <Typography variant="caption" sx={{ cursor: "help" }}>?</Typography>
            </Tooltip>
          </Box>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            {foreverTop.topTracks.map((t) => (
              <li key={`${t.track}:::${t.artist}`}>
                <Tooltip title={`Raw totals: hours=${t.hours.toFixed(3)}, plays=${t.streams}`} placement="right">
                  <Typography variant="body2"><strong>{t.track}</strong> — {t.artist} · {t.hours.toFixed(1)} h · {t.streams} plays</Typography>
                </Tooltip>
              </li>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="subtitle1">Repeat Champions</Typography>
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption">
                    Highest hours: tracks sorted by lifetime hours. Most plays in one day: max per-day play count per track. 100+ plays: tracks with total plays ≥ 100.
                  </Typography>
                </Box>
              }
            >
              <Typography variant="caption" sx={{ cursor: "help" }}>?</Typography>
            </Tooltip>
          </Box>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            <li>
              <Typography variant="body2">Highest total hours (tracks): {champions.highestHoursTracks.map((t) => `${t.track} — ${t.artist} (${t.hours.toFixed(1)} h)`).join(", ")}</Typography>
            </li>
            <li>
              <Typography variant="body2">Most plays in one day: {champions.mostPlaysInOneDay.map((t) => `${t.track} — ${t.artist} on ${t.day} (${t.plays})`).join(", ") || "n/a"}</Typography>
            </li>
            <li>
              <Typography variant="body2">100+ plays: {champions.played100Plus.map((t) => `${t.track} — ${t.artist} (${t.plays})`).join(", ") || "none"}</Typography>
            </li>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="subtitle1">The Ghosted Artist</Typography>
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption">
                    Artists listened historically (≥ cutoff years of activity) but not in the last cutoff years (default 2). Last listened year shown.
                  </Typography>
                </Box>
              }
            >
              <Typography variant="caption" sx={{ cursor: "help" }}>?</Typography>
            </Tooltip>
          </Box>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            {ghosted.slice(0, 10).map((g) => (
              <li key={`${g.artist}:::${g.lastYear}`}>
                <Typography variant="body2"><strong>{g.artist}</strong> — last listened {g.lastYear} · active {g.yearsActive} yrs</Typography>
              </li>
            ))}
            {ghosted.length === 0 && (
              <Typography variant="body2" color="text.secondary">No ghosted artists detected.</Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="subtitle1">The Climbers</Typography>
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption">
                    Artists with a large positive year-over-year increase in hours (heuristic: +50 hours).
                  </Typography>
                </Box>
              }
            >
              <Typography variant="caption" sx={{ cursor: "help" }}>?</Typography>
            </Tooltip>
          </Box>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            {climbers.slice(0, 10).map((c) => (
              <li key={`${c.artist}:::${c.year}`}>
                <Typography variant="body2"><strong>{c.artist}</strong> — spike in {c.year} (+{c.deltaHours.toFixed(1)} h YoY)</Typography>
              </li>
            ))}
            {climbers.length === 0 && (
              <Typography variant="body2" color="text.secondary">No climbers detected.</Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="subtitle1">The Frozen Ones</Typography>
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption">
                    Tracks always skipped early: every play skipped before 30 seconds.
                  </Typography>
                </Box>
              }
            >
              <Typography variant="caption" sx={{ cursor: "help" }}>?</Typography>
            </Tooltip>
          </Box>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            {frozen.slice(0, 10).map((f) => (
              <li key={`${f.track}:::${f.artist}`}>
                <Typography variant="body2"><strong>{f.track}</strong> — {f.artist}</Typography>
              </li>
            ))}
            {frozen.length === 0 && (
              <Typography variant="body2" color="text.secondary">No always-skipped tracks detected.</Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
