import { Box, Chip, Paper, Typography } from "@mui/material";
import { TopArtistsChart } from "./TopArtistsChart";
import type { TopArtistRow } from "../stats";

interface Props {
  data: TopArtistRow[];
}

export function TopArtistsSection({ data }: Props) {
  if (data.length === 0) return null;
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">Top artists by listening time</Typography>
        <Chip size="small" label={`${data.length} artists shown`} color="primary" variant="outlined" />
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Total hours listened for each artist, across your entire Spotify history.
      </Typography>
      <TopArtistsChart data={data} />
    </Paper>
  );
}
