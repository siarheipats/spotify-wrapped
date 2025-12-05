import { Box, Chip, Paper, Typography } from "@mui/material";
import { ListeningTimelineChart } from "./ListeningTimelineChart";

interface Props {
  data: { year: number; hours: number; streams: number }[];
}

export function ListeningTimelineSection({ data }: Props) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">Listening over the years</Typography>
        {data.length > 0 && (
          <Chip
            size="small"
            label={`From ${data[0].year} to ${data[data.length - 1].year}`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Hours listened per year, based on your streaming history.
      </Typography>
      <ListeningTimelineChart data={data} />
    </Paper>
  );
}
