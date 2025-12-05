import { List, ListItem, ListItemText, Paper, Typography } from "@mui/material";

interface Props {
  filesLoaded: string[];
  firstTs: string | null;
  lastTs: string | null;
}

export function DataLoadedPanel({ filesLoaded, firstTs, lastTs }: Props) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>
        Data loaded
      </Typography>
      <List dense>
        <ListItem>
          <ListItemText
            primary="Files"
            secondary={filesLoaded.length > 0 ? filesLoaded.join(", ") : "none"}
          />
        </ListItem>
        <ListItem>
          <ListItemText primary="First stream" secondary={firstTs ?? "n/a"} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Latest stream" secondary={lastTs ?? "n/a"} />
        </ListItem>
      </List>
    </Paper>
  );
}
