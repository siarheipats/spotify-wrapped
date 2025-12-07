import { Box, Chip, Paper, Typography, Slider } from "@mui/material";
import { TopArtistsChart } from "./TopArtistsChart";
import type { TopArtistRow } from "../interfaces/interfaces";
import { useMemo, useState } from "react";

interface Props {
  data: TopArtistRow[];
}

export function TopArtistsSection({ data }: Props) {
  if (data.length === 0) return null;
  const DEFAULT_COUNT = Math.min(10, 30);
  const [count, setCount] = useState<number>(DEFAULT_COUNT);

  const shown = useMemo(() => data.slice(0, Math.min(count, 30)), [data, count]);
  const ariaText = (value: number) => `${value} artists`;
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">Top artists by listening time</Typography>
        <Chip size="small" label={`${shown.length} artists shown`} color="primary" variant="outlined" />
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Total hours listened for each artist, across your entire Spotify history.
      </Typography>
      <Box sx={{ px: 1, mb: 2 }}>
        <Slider
          aria-label="Artists shown"
          getAriaValueText={ariaText}
          valueLabelDisplay="auto"
          value={count}
          onChange={(_e, v) => typeof v === "number" && setCount(v)}
          step={5}
          marks
          min={5}
          max={30}
        />
      </Box>
      <TopArtistsChart data={shown} />
    </Paper>
  );
}
