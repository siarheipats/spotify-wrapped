// src/App.tsx
import { useState } from "react";
import type { StreamRecord } from "./interfaces/interfaces";

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
import { DateRangeStatsSection } from "./components/DateRangeStatsSection";
import { ListeningHeatmapSection } from "./components/ListeningHeatmapSection";

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
import { computeSessions } from "./helpers/computeSessions";
import { computeForeverTop10 } from "./helpers/computeForeverTop10";
import { computeGhostedArtists } from "./helpers/computeGhostedArtists";
import { computeRepeatChampions } from "./helpers/computeRepeatChampions";
import { computeClimbers } from "./helpers/computeClimbers";
import { computeFrozenTracks } from "./helpers/computeFrozenTracks";
import { computeFirstPlay } from "./helpers/computeFirstPlay";
import { formatLocalDateTime } from "./helpers/formatLocalDateTime";
import AIReportSection from "./components/AIReportSection";
import { StoryHighlights } from "./components/StoryHighlights";

// File Handling
import { expandAndParseFiles } from "./fileHandlingClient";

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
  const sessionStats = computeSessions(streams, 30);
  const foreverTop = computeForeverTop10(streams, 10);
  const champions = computeRepeatChampions(streams);
  const ghosted = computeGhostedArtists(streams, 2);
  const climbers = computeClimbers(streams);
  const frozen = computeFrozenTracks(streams);
  const firstPlay = computeFirstPlay(streams);

  const parseFiles = async (files: File[]) => {
    setError(null);
    setLoading(true);
    try {
      const { records, fileNames } = await expandAndParseFiles(files);
      setStreams((prev) => [...prev, ...records]);
      setFilesLoaded((prev) => [...prev, ...fileNames]);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to parse one or more JSON files.");
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
                sessionStats.avgSessionMinutes !== null ? { label: "Avg session", value: `${sessionStats.avgSessionMinutes} min` } : undefined,
                sessionStats.longestSessionMinutes !== null ? { label: "Longest session", value: `${sessionStats.longestSessionMinutes} min` } : undefined,
                sessionStats.sessionsPerDayAvg !== null ? { label: "Sessions per day", value: sessionStats.sessionsPerDayAvg } : undefined,
                ...(firstPlay
                  ? [
                      {
                        label: "First song played",
                        value: firstPlay.track,
                        subtitle: `${firstPlay.artist}${firstPlay.when ? ` · ${formatLocalDateTime(firstPlay.when)}` : ""}`,
                      },
                    ]
                  : []),
              ].filter(Boolean) as any}
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

            {/* Heatmap */}
            <Box mb={3}>
              <ListeningHeatmapSection streams={streams} />
              {/* TODO: Need some work on this component */}
              {/* <ObsessiveLoopsSection streams={streams} /> */}
            </Box>

            {/* Date range insights */}
            <Box mb={3}>
              <DateRangeStatsSection streams={streams} />
            </Box>

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
              <SkippingInsightsSection streams={streams} />
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
