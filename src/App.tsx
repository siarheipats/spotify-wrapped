// src/App.tsx
import { useState } from "react";
import type { StreamRecord } from "./interfaces/interfaces";
import JSZip from "jszip";

// MUI 
import { Box, Container, Typography, Grid, Alert, Backdrop, CircularProgress } from "@mui/material";

// Components
import { ListeningTimelineSection } from "./components/ListeningTimelineSection";
import { TopArtistsSection } from "./components/TopArtistsSection";
import { HabitsSection } from "./components/HabitsSection";
import { TopTracksSection } from "./components/TopTracksSection";
import { DropZone } from "./components/DropZone";
import { PersonalitySummaryCard } from "./components/PersonalitySummaryCard";
import { StatCardsRow } from "./components/StatCardsRow";
import { DataLoadedPanel } from "./components/DataLoadedPanel";
import { PodcastInsightsSection } from "./components/PodcastInsightsSection";
import { SkippingInsightsSection } from "./components/SkippingInsightsSection";
import { SessionInsightsSection } from "./components/SessionInsightsSection";
import { ArtistTrackInsightsSection } from "./components/ArtistTrackInsightsSection";

// Helpers
import { computeBasicStats } from "./helpers/computeBasicStats";
import { computeListeningHabits } from "./helpers/computeListeningHabits";
import { computeTopArtists } from "./helpers/computeTopArtists";
import { computeTopTracks } from "./helpers/computeTopTracks";
import { computePersonality } from "./helpers/computePersonality";
import { computeEras } from "./helpers/computeEras";
import { computeMilestones } from "./helpers/computeMilestones";
import { computeBadges } from "./helpers/computeBadges";
import { computeMusicPodcastSplit } from "./helpers/computeMusicPodcastSplit";
import { computeTopPodcastShows } from "./helpers/computeTopPodcastShows";
import { computeTopPodcastEpisodes } from "./helpers/computeTopPodcastEpisodes";
import { computeSkipping } from "./helpers/computeScipping";
import { computeSessions } from "./helpers/computeSessions";
import { computeForeverTop10 } from "./helpers/computeForeverTop10";
import { computeGhostedArtists } from "./helpers/computeGhostedArtists";
import { computeRepeatChampions } from "./helpers/computeRepeatChampions";
import { computeClimbers } from "./helpers/computeClimbers";
import { computeFrozenTracks } from "./helpers/computeFrozenTracks";
import AIReportSection from "./components/AIReportSection";
import { StoryHighlights } from "./components/StoryHighlights";

function App() {
  const [streams, setStreams] = useState<StreamRecord[]>([]);
  const [filesLoaded, setFilesLoaded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const stats = computeBasicStats(streams);
  const topArtists = computeTopArtists(streams, 30);
  const habits = computeListeningHabits(streams);
  const topTracks = computeTopTracks(streams, 30);
  const personality = stats.totalStreams > 0 ? computePersonality(stats, habits, topArtists) : null;
  const eras = stats.totalStreams > 0 ? computeEras(stats, streams) : [];
  const milestones = stats.totalStreams > 0 ? computeMilestones(stats, streams) : [];
  const badges = stats.totalStreams > 0 ? computeBadges(streams) : [];
  const podcastSplit = computeMusicPodcastSplit(streams);
  const topPodcastShows = computeTopPodcastShows(streams, 8);
  const topPodcastEpisodes = computeTopPodcastEpisodes(streams, 8);
  const skipping = computeSkipping(streams);
  const sessionStats = computeSessions(streams, 30);
  const foreverTop = computeForeverTop10(streams, 10);
  const champions = computeRepeatChampions(streams);
  const ghosted = computeGhostedArtists(streams, 2);
  const climbers = computeClimbers(streams);
  const frozen = computeFrozenTracks(streams);

  const parseFiles = async (files: File[]) => {
    setError(null);
    setLoading(true);

    // Expand ZIP files into JSON files
    const expandedFiles: File[] = [];
    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".zip")) {
        try {
          const zip = await JSZip.loadAsync(file);
          const entries = Object.values(zip.files).filter((f) => !f.dir && f.name.toLowerCase().endsWith(".json"));
          for (const entry of entries) {
            const content = await entry.async("string");
            const blob = new Blob([content], { type: "application/json" });
            const jsonFile = new File([blob], entry.name, { type: "application/json" });
            expandedFiles.push(jsonFile);
          }
        } catch (e) {
          console.error(e);
          setError("Failed to read ZIP file. Ensure it contains JSON files.");
        }
      } else {
        expandedFiles.push(file);
      }
    }

    const jsonFiles = expandedFiles.filter((file) =>
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
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleFilesPicked = async (files: File[]) => {
    await parseFiles(files);
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
      {/* Global loading backdrop during JSON processing */}
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
        <Typography variant="body2" sx={{ ml: 2 }}>Processing your files…</Typography>
      </Backdrop>
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
        <DropZone onFilesPicked={handleFilesPicked} onDragOver={handleDragOver} />

        {error && (
          <Box mb={3}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {/* Only show stats if we have data */}
        {stats.totalStreams > 0 && (
          <>
            <Grid item xs={12} md={4}>
                <DataLoadedPanel filesLoaded={filesLoaded} firstTs={stats.firstTs} lastTs={stats.lastTs} />
            </Grid>
            <br/>

            {/* Personality summary */}
            {personality && <PersonalitySummaryCard personality={personality} />}
            {/* Top stats row */}
            <StatCardsRow
              items={[
                { label: "Total listening time", value: `${stats.totalDays.toFixed(1)} days`, subtitle: `${stats.totalHours.toFixed(1)} hours` },
                { label: "Total streams", value: stats.totalStreams },
                { label: "Distinct artists", value: stats.distinctArtists },
                { label: "Distinct tracks", value: stats.distinctTracks },
              ]}
            />

            {/* AI Personality Report */}
            {(topArtists.length > 0 || topTracks.length > 0) && (
              <Box mb={3}>
                <AIReportSection stats={stats} habits={habits} topArtists={topArtists} topTracks={topTracks} />
              </Box>
            )}

            {/* Chart */}
            <Grid>
              <ListeningTimelineSection data={stats.listeningByYear} />
            </Grid>
            <br/>

            {/* Top Artists */}
            {topArtists.length > 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TopArtistsSection data={topArtists} />
                </Grid>
              </Grid>
            )}
            <br/>

            {topTracks.length > 0 && (
              <Grid item xs={12} md={6}>
                <TopTracksSection data={topTracks} />
              </Grid>
            )}
            <br/>

            {/* Listening habits */}
            {(habits.byHour.length > 0 || habits.byWeekday.length > 0) && (
              <HabitsSection byHour={habits.byHour} byWeekday={habits.byWeekday} />
            )}
            <br/>

            {/* Storytelling: eras, milestones, badges */}
            {(eras.length > 0 || milestones.length > 0 || badges.length > 0) && (
              <Box mb={3}>
                <StoryHighlights eras={eras} milestones={milestones} badges={badges} />
              </Box>
            )}

            {/* Podcast insights */}
            <Box mb={3}>
              <PodcastInsightsSection split={podcastSplit} topShows={topPodcastShows} topEpisodes={topPodcastEpisodes} />
            </Box>

            {/* Skipping behavior */}
            <Box mb={3}>
              <SkippingInsightsSection skipping={skipping} />
            </Box>

            {/* Session analysis */}
            <Box mb={3}>
              <SessionInsightsSection stats={sessionStats} />
            </Box>

            {/* Artist / Track Insights */}
            <Box mb={3}>
              <ArtistTrackInsightsSection
                foreverTop={foreverTop}
                champions={champions}
                ghosted={ghosted}
                climbers={climbers}
                frozen={frozen}
              />
            </Box>
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

export default App;
