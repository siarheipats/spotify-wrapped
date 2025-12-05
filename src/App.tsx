// src/App.tsx
import { useState } from "react";
import type { StreamRecord } from "./spotifyTypes";
import { computeBasicStats, computeTopArtists, computeListeningHabits, computeTopTracks, computePersonality } from "./stats";

import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from "@mui/material";

import { ListeningTimelineChart } from "./components/ListeningTimelineChart";
import { TopArtistsChart } from "./components/TopArtistsChart";
import { ListeningByHourChart } from "./components/ListeningByHourChart";
import { ListeningByWeekdayChart } from "./components/ListeningByWeekdayChart";
import { TopTracksChart } from "./components/TopTracksChart";

function App() {
  const [streams, setStreams] = useState<StreamRecord[]>([]);
  const [filesLoaded, setFilesLoaded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const stats = computeBasicStats(streams);
  const topArtists = computeTopArtists(streams, 10);
  const habits = computeListeningHabits(streams);
  const topTracks = computeTopTracks(streams, 10);
  const personality = stats.totalStreams > 0 ? computePersonality(stats, habits, topArtists) : null;

  const parseFiles = async (files: File[]) => {
    setError(null);

    const jsonFiles = files.filter((file) =>
      file.name.toLowerCase().endsWith(".json"),
    );

    if (jsonFiles.length === 0) {
      setError("No JSON files detected. Please drop .json files from Spotify.");
      return;
    }

    try {
      const allRecords: StreamRecord[] = [];
      const fileNames: string[] = [];

      for (const file of jsonFiles) {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
          console.warn(`File ${file.name} did not contain an array, skipping.`);
          continue;
        }

        const withSource = data.map((item: any) => ({
          ...item,
          _source_file: file.name,
        }));

        allRecords.push(...(withSource as StreamRecord[]));
        fileNames.push(file.name);
      }

      setStreams((prev) => [...prev, ...allRecords]);
      setFilesLoaded((prev) => [...prev, ...fileNames]);
    } catch (err) {
      console.error(err);
      setError("Failed to parse one or more JSON files.");
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    await parseFiles(Array.from(event.dataTransfer.files));
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files) return;
    await parseFiles(Array.from(event.target.files));
    event.target.value = "";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Lifetime Wrapped
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={600}>
            Drag &amp; drop your Spotify streaming history JSON files here.
            Everything is processed locally in your browser.
          </Typography>
        </Box>

        {/* Drop zone */}
        <Paper
          variant="outlined"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.getElementById(
              "file-input",
            ) as HTMLInputElement | null;
            input?.click();
          }}
          sx={{
            borderStyle: "dashed",
            borderColor: "primary.main",
            borderRadius: 4,
            py: 6,
            px: 3,
            textAlign: "center",
            cursor: "pointer",
            background:
              "radial-gradient(circle at top, rgba(29,185,84,0.25), transparent 55%)",
            mb: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Drop JSON files here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to browse your files
          </Typography>

          <input
            id="file-input"
            type="file"
            accept=".json"
            multiple
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
        </Paper>

        {error && (
          <Box mb={3}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {/* Only show stats if we have data */}
        {stats.totalStreams > 0 && (
          <>
            {/* Personality summary */}
            {personality && (
              <Box mb={3}>
                <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="overline" color="text.secondary">
                    Your listening personality
                  </Typography>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {personality.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={2}
                  >
                    {personality.tagline}
                  </Typography>

                  <Box
                    display="flex"
                    flexWrap="wrap"
                    gap={1}
                    mb={1.5}
                  >
                    {personality.traits.map((trait) => (
                      <Chip
                        key={trait.id}
                        label={trait.label}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>

                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    {personality.traits.map((trait) => (
                      <li key={trait.id}>
                        <Typography variant="body2">
                          <strong>{trait.label}:</strong> {trait.description}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}
            {/* Top stats row */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={3}>
                <StatCard
                  label="Total listening time"
                  value={`${stats.totalDays.toFixed(1)} days`}
                  subtitle={`${stats.totalHours.toFixed(1)} hours`}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard label="Total streams" value={stats.totalStreams} />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  label="Distinct artists"
                  value={stats.distinctArtists}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  label="Distinct tracks"
                  value={stats.distinctTracks}
                />
              </Grid>
            </Grid>

            {/* File list + core dates */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, borderRadius: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Data loaded
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Files"
                        secondary={
                          filesLoaded.length > 0
                            ? filesLoaded.join(", ")
                            : "none"
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="First stream"
                        secondary={stats.firstTs ?? "n/a"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Latest stream"
                        secondary={stats.lastTs ?? "n/a"}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Chart */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="h6">
                      Listening over the years
                    </Typography>
                    {stats.listeningByYear.length > 0 && (
                      <Chip
                        size="small"
                        label={`From ${stats.listeningByYear[0].year} to ${
                          stats.listeningByYear[
                            stats.listeningByYear.length - 1
                          ].year
                        }`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Hours listened per year, based on your streaming history.
                  </Typography>
                  <ListeningTimelineChart data={stats.listeningByYear} />
                </Paper>
              </Grid>
            </Grid>
            <br/>
            
            {/* Top Artists */}
            {topArtists.length > 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography variant="h6">
                        Top artists by listening time
                      </Typography>
                      <Chip
                        size="small"
                        label={`${topArtists.length} artists shown`}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Total hours listened for each artist, across your entire
                      Spotify history.
                    </Typography>
                    <TopArtistsChart data={topArtists} />
                  </Paper>
                </Grid>
              </Grid>
            )}
            <br/>
            {/* Listening habits */}
            {(habits.byHour.length > 0 || habits.byWeekday.length > 0) && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                      Listening by hour of day (UTC)
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      mb={2}
                    >
                      See which times of day you tend to listen the most.
                      (Currently using UTC; later we can shift to your timezone.)
                    </Typography>
                    <ListeningByHourChart data={habits.byHour} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                      Listening by weekday
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      mb={2}
                    >
                      Total hours listened on each day of the week.
                    </Typography>
                    <ListeningByWeekdayChart data={habits.byWeekday} />
                  </Paper>
                </Grid>
              </Grid>
            )}
            <br/>
            {topTracks.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1}
                      >
                        <Typography variant="h6">
                          Top tracks by listening time
                        </Typography>
                        <Chip
                          size="small"
                          label={`${topTracks.length} tracks shown`}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mb={2}
                      >
                        Your most-played songs over your entire Spotify
                        history.
                      </Typography>
                      <TopTracksChart data={topTracks} />
                    </Paper>
                  </Grid>
                )}
          </>
        )}

        {/* Empty state */}
        {stats.totalStreams === 0 && (
          <Box mt={4}>
            <Typography variant="body1" color="text.secondary">
              No data yet. Drop one or more{" "}
              <strong>Streaming_History_*.json</strong> files from your Spotify
              export to see your Lifetime Wrapped.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        height: "100%",
      }}
    >
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default App;
