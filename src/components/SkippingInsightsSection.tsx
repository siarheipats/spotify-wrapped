import { Box, Paper, Typography } from "@mui/material";
import type { SkipAnalytics } from "../interfaces/interfaces"

interface Props {
  skipping: SkipAnalytics;
}

export function SkippingInsightsSection({ skipping }: Props) {
  const pct = (skipping.skipRate * 100).toFixed(1);
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>Skipping behavior</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Overall skip rate, average time before you skip, tracks you never skip, and how it changed over the years.
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
