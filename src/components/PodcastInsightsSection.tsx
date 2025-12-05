import { Box, Chip, Paper, Typography, Grid } from "@mui/material";
import type { TopPodcastShowRow, TopPodcastEpisodeRow, MusicPodcastSplit } from "../analytics";

interface Props {
  split: MusicPodcastSplit;
  topShows: TopPodcastShowRow[];
  topEpisodes: TopPodcastEpisodeRow[];
}

export function PodcastInsightsSection({ split, topShows, topEpisodes }: Props) {
  const podcastBadge = split.podcastRatio >= 0.4 ? "Podcast Heavy Listener" : undefined;
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">Music vs Podcast insights</Typography>
        {podcastBadge && <Chip size="small" label={podcastBadge} color="primary" variant="outlined" />}
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Separate totals for music and podcasts, plus your top shows and episodes.
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <Chip label={`Music: ${split.musicHours.toFixed(1)} h`} color="default" />
        <Chip label={`Podcasts: ${split.podcastHours.toFixed(1)} h`} color="default" />
        <Chip label={`Podcasts share: ${(split.podcastRatio * 100).toFixed(0)}%`} color="default" />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Top podcast shows</Typography>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            {topShows.map((s) => (
              <li key={s.show}>
                <Typography variant="body2">
                  <strong>{s.show}</strong> — {s.hours.toFixed(1)} h · {s.episodes} plays
                </Typography>
              </li>
            ))}
            {topShows.length === 0 && (
              <Typography variant="body2" color="text.secondary">No podcast shows detected.</Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Top podcast episodes</Typography>
          <Box component="ul" sx={{ pl: 3, mt: 0 }}>
            {topEpisodes.map((e) => (
              <li key={`${e.show}:::${e.episode}`}>
                <Typography variant="body2">
                  <strong>{e.episode}</strong> — {e.show} · {e.hours.toFixed(1)} h · {e.plays} plays
                </Typography>
              </li>
            ))}
            {topEpisodes.length === 0 && (
              <Typography variant="body2" color="text.secondary">No podcast episodes detected.</Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
