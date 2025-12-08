import { useMemo, useState } from "react";
import { Box, Paper, Typography, List, ListItem, ListItemText, Chip, Stack, Slider } from "@mui/material";
import type { StreamRecord } from "../interfaces/interfaces";
import { computeObsessiveLoops } from "../helpers/computeObsessiveLoops";

interface Props { streams: StreamRecord[] }

export default function ObsessiveLoopsSection({ streams }: Props) {
  const [minDaily, setMinDaily] = useState(50);
  const [minMonthly, setMinMonthly] = useState(100);
  const [minWeeks, setMinWeeks] = useState(3);

  const obsessions = useMemo(() => computeObsessiveLoops(streams, {
    minDailyPlays: minDaily,
    minMonthlyPlays: minMonthly,
    minStreakWeeks: minWeeks,
  }), [streams, minDaily, minMonthly, minWeeks]);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>Your Most Obsessive Loops</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Songs you played more than {minDaily}+ times in a day, hundreds in a month, or for multi-week stretches.
      </Typography>

      <Stack direction="row" spacing={3} mb={2}>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="caption">Daily plays threshold</Typography>
          <Slider value={minDaily} min={20} max={200} step={5} onChange={(_, v) => setMinDaily(v as number)} />
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="caption">Monthly plays threshold</Typography>
          <Slider value={minMonthly} min={50} max={1000} step={50} onChange={(_, v) => setMinMonthly(v as number)} />
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="caption">Min streak weeks</Typography>
          <Slider value={minWeeks} min={2} max={12} step={1} onChange={(_, v) => setMinWeeks(v as number)} />
        </Box>
      </Stack>

      {obsessions.length === 0 ? (
        <Typography>No major obsessions detected for the current thresholds.</Typography>
      ) : (
        <List>
          {obsessions.slice(0, 20).map((o, idx) => (
            <ListItem key={idx} alignItems="flex-start">
              <ListItemText
                primary={`${o.track} — ${o.artist}`}
                secondary={
                  <Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {o.daysOver50.length > 0 && (
                        <Chip size="small" label={`>=${minDaily} plays in a day: ${o.daysOver50.length} days`} />
                      )}
                      {o.monthsOver100.length > 0 && (
                        <Chip size="small" label={`>=${minMonthly} plays in a month: ${o.monthsOver100.length} months`} />
                      )}
                      {o.weekStreaks.length > 0 && (
                        <Chip size="small" label={`Multi-week streaks: ${o.weekStreaks.length}`} />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Obsession score: {o.score}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}
