import { Box, Paper, Typography, Stack, Slider, FormControlLabel, Checkbox, Tooltip } from "@mui/material";
import type { SkipAnalytics, StreamRecord } from "../interfaces/interfaces"
import { useMemo, useState } from "react";
import { computeSkipping } from "../helpers/computeScipping";

interface Props {
  streams: StreamRecord[];
}

export function SkippingInsightsSection({ streams }: Props) {
  const [useFlag, setUseFlag] = useState(true);
  const [thresholdSec, setThresholdSec] = useState(30);
  const skipping: SkipAnalytics = useMemo(() => computeSkipping(streams, { useFlagPreferentially: useFlag, thresholdMs: thresholdSec * 1000 }), [streams, useFlag, thresholdSec]);
  const pct = (skipping.skipRate * 100).toFixed(1);
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>Skipping behavior</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Overall skip rate, average time before you skip, tracks you never skip, and how it changed over the years.
      </Typography>

      <Stack direction="row" spacing={3} alignItems="center" mb={2}>
        <FormControlLabel control={<Checkbox checked={useFlag} onChange={(e) => setUseFlag(e.target.checked)} />} label={<Tooltip title="Use explicit skip flag when present; otherwise, fallback to threshold heuristic."><span>Prefer skip flag</span></Tooltip>} />
        <Box sx={{ minWidth: 220 }}>
          <Typography variant="caption">Heuristic threshold (seconds)</Typography>
          <Slider value={thresholdSec} onChange={(_e, v) => typeof v === "number" && setThresholdSec(v)} min={5} max={60} step={5} valueLabelDisplay="auto" />
        </Box>
      </Stack>

      <Typography variant="caption" color="text.secondary" mb={1} display="block">
        Note: Some years may show 0% if the original data lacks an explicit skip flag; enabling the heuristic threshold estimates skips from short plays.
      </Typography>

      <Box component="ul" sx={{ pl: 3, mt: 0 }}>
        <li>
          <Typography variant="body2">You skip {pct}% of tracks overall.</Typography>
        </li>
        <li>
          <Typography variant="body2">
            Average time before you skip is {skipping.avgTimeBeforeSkipSec !== null ? `${skipping.avgTimeBeforeSkipSec}s` : "n/a"}.
          </Typography>
        </li>
        <li>
          <Typography variant="body2">
            Tracks you never skip: {skipping.neverSkippedTracks.slice(0, 5).map((t) => `${t.track}${t.artist ? ` — ${t.artist}` : ""}`).join(", ") || "none"}
            {skipping.neverSkippedTracks.length > 5 ? " …" : ""}
          </Typography>
        </li>
      </Box>

      <Box mt={2}>
        <Typography variant="subtitle2">Skip rate by year</Typography>
        <Box component="ul" sx={{ pl: 3, mt: 0 }}>
          {skipping.skipRateByYear.map((y) => (
            <li key={y.year}>
              <Typography variant="body2">{y.year}: {(y.rate * 100).toFixed(1)}%</Typography>
            </li>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
