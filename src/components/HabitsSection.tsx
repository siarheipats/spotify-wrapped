import { Paper, Typography, Grid } from "@mui/material";
import { ListeningByHourChart } from "./ListeningByHourChart";
import { ListeningByWeekdayChart } from "./ListeningByWeekdayChart";
import type { ListeningByHourRow, ListeningByWeekdayRow } from "../interfaces/interfaces"

interface Props {
  byHour: ListeningByHourRow[];
  byWeekday: ListeningByWeekdayRow[];
}

export function HabitsSection({ byHour, byWeekday }: Props) {
  if (byHour.length === 0 && byWeekday.length === 0) return null;
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
          <Typography variant="h6" gutterBottom>
            Listening by hour of day
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            See which times of day you tend to listen the most.
          </Typography>
          <ListeningByHourChart data={byHour} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
          <Typography variant="h6" gutterBottom>
            Listening by weekday
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Total hours listened on each day of the week.
          </Typography>
          <ListeningByWeekdayChart data={byWeekday} />
        </Paper>
      </Grid>
    </Grid>
  );
}
