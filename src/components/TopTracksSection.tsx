import { Box, Chip, Paper, Typography } from "@mui/material";
import { TopTracksChart } from "./TopTracksChart";
import type { TopTrackRow } from "../stats";

interface Props {
  data: TopTrackRow[];
}

export function TopTracksSection({ data }: Props) {
  if (data.length === 0) return null;
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">Top tracks by listening time</Typography>
        <Chip size="small" label={`${data.length} tracks shown`} color="primary" variant="outlined" />
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Your most-played songs over your entire Spotify history.
      </Typography>
      <TopTracksChart data={data} />
    </Paper>
  );
}
