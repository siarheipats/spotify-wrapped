import { Box, Paper, Typography } from "@mui/material";
import type { SessionStats } from "../analytics";

interface Props { stats: SessionStats }

export function SessionInsightsSection({ stats }: Props) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>Session analysis</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Groups plays close in time to estimate sessions and typical patterns.
      </Typography>
      <Box component="ul" sx={{ pl: 3, mt: 0 }}>
        <li>
          <Typography variant="body2">Average session length: {stats.avgSessionMinutes !== null ? `${stats.avgSessionMinutes} min` : "n/a"}</Typography>
        </li>
        <li>
          <Typography variant="body2">Longest session: {stats.longestSessionMinutes !== null ? `${stats.longestSessionMinutes} min` : "n/a"}</Typography>
        </li>
        <li>
          <Typography variant="body2">Typical sessions per day: {stats.sessionsPerDayAvg !== null ? stats.sessionsPerDayAvg : "n/a"}</Typography>
        </li>
      </Box>
    </Paper>
  );
}
