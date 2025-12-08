import { useMemo, useState, useEffect } from "react";
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Tooltip, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Button, Avatar, CircularProgress } from "@mui/material";
import { getArtistImageByName } from "../clients/spotifyClient";
import type { StreamRecord } from "../interfaces/interfaces";
import { computeListeningByDay } from "../helpers/computeListeningByDay";

interface Props {
  streams: StreamRecord[];
}

// Simple week-by-week contribution-style heatmap using CSS grid
export function ListeningHeatmapSection({ streams }: Props) {
  const byDay = useMemo(() => computeListeningByDay(streams), [streams]);

  // Build a map for quick lookup
  const map = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of byDay) m.set(d.date, d.hours);
    return m;
  }, [byDay]);

  // Determine base date range (global)
  const globalStart = byDay.length ? new Date(byDay[0].date) : null;
  const globalEnd = byDay.length ? new Date(byDay[byDay.length - 1].date) : null;
  let days: { date: string; d: Date }[] = [];
  if (globalStart && globalEnd) {
    const cur = new Date(globalStart);
    while (cur <= globalEnd) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      days.push({ date: key, d: new Date(cur) });
      cur.setDate(cur.getDate() + 1);
    }
  }

  // Years available and selection
  const years = useMemo(() => {
    const set = new Set<string>();
    for (const d of days) set.add(String(d.d.getFullYear()));
    return Array.from(set).sort();
  }, [days]);
  const [selectedYear, setSelectedYear] = useState<string>(() => (years.length ? years[years.length - 1] : ""));
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [artistImageCache] = useState<Map<string, string>>(new Map());
  const [imagesVersion, setImagesVersion] = useState(0);
  const [imagesLoading, setImagesLoading] = useState(false);

  // Compute unique artists for the currently open day (if any)
  const uniqueArtistsForOpenDay = useMemo(() => {
    if (!openDay) return [] as string[];
    const items = streams.filter((s) => {
      const raw = (s as any).ts ?? (s as any).endTime ?? (s as any).startTime ?? (s as any).timestamp;
      const d = new Date(typeof raw === "string" || typeof raw === "number" || raw instanceof Date ? raw : NaN);
      if (Number.isNaN(d.getTime())) return false;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return key === openDay;
    });
    const names = items.map((s) => ((s as any).artistName ?? (s as any).artist ?? (s as any).master_metadata_album_artist_name ?? "Unknown Artist") as string);
    return Array.from(new Set(names)).filter((a) => !!a && a !== "Unknown Artist");
  }, [streams, openDay]);

  // Prefetch images when a day opens (and trigger a re-render once done)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setImagesLoading(true);
      const toFetch = uniqueArtistsForOpenDay.filter((n) => !artistImageCache.has(n)).slice(0, 10);
      if (toFetch.length === 0) return;
      await Promise.all(toFetch.map(async (name) => {
        try {
          const url = await getArtistImageByName(name);
          if (url) artistImageCache.set(name, url);
        } catch { /* noop */ }
      }));
      if (!cancelled) setImagesVersion((v) => v + 1);
      if (!cancelled) setImagesLoading(false);
    })();
    return () => { cancelled = true; };
  }, [uniqueArtistsForOpenDay]);
  // Ensure selectedYear stays valid when data changes
  if (selectedYear && years.length && !years.includes(selectedYear)) {
    // pick latest year
    setSelectedYear(years[years.length - 1]);
  }

  // If a year is selected, ensure we render the full year's days (placeholders for missing data)
  if (selectedYear) {
    const jan1 = new Date(Number(selectedYear), 0, 1);
    const dec31 = new Date(Number(selectedYear), 11, 31);
    const fullYearDays: { date: string; d: Date }[] = [];
    const cur = new Date(jan1);
    while (cur <= dec31) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      fullYearDays.push({ date: key, d: new Date(cur) });
      cur.setDate(cur.getDate() + 1);
    }
    days = fullYearDays;
  }

  // Compute color based on hours thresholds
  const colorFor = (h: number) => {
    if (h <= 0) return "#e6e6e6"; // empty
    if (h < 0.25) return "#c6e48b";
    if (h < 0.75) return "#7bc96f";
    if (h < 2) return "#239a3b";
    return "#196127";
  };

  // Arrange into columns by week like GitHub contributions, filtered by selected year
  // Each column is a week; each cell is a day (Sun-Sat)
  const columns: Array<Array<{ date: string; hours: number }>> = [];
  let week: Array<{ date: string; hours: number }> = [];
  for (const entry of days) {
    if (selectedYear && String(entry.d.getFullYear()) !== selectedYear) continue;
    const dow = entry.d.getDay(); // 0-6
    const hours = map.get(entry.date) ?? 0;
    week[dow] = { date: entry.date, hours };
    if (dow === 6) {
      columns.push(week);
      week = [];
    }
  }
  if (week.length) columns.push(week);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom>Listening Heatmap</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Contribution-style view of daily listening intensity.
      </Typography>
      {years.length > 1 && (
        <Box sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="heatmap-year-label">Year</InputLabel>
            <Select
              labelId="heatmap-year-label"
              id="heatmap-year"
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      {/* Month markers header */}
      <Box sx={{ display: "flex", gap: 0.5, overflowX: "auto", pb: 0.5, justifyContent: "center" }}>
        {columns.map((col, ci) => {
          // Find a representative date from the column
          const anyItem = col.find((c) => !!c);
          const dateStr = anyItem?.date;
          const d = dateStr ? new Date(dateStr) : null;
          const prevAny = ci > 0 ? columns[ci - 1].find((c) => !!c) : undefined;
          const prevDate = prevAny?.date ? new Date(prevAny.date) : null;
          const showLabel = d && (!prevDate || d.getMonth() !== prevDate.getMonth());
          const label = showLabel && d ? d.toLocaleString(undefined, { month: "short" }) : "";
          return (
            <Box key={`m-${ci}`} sx={{ width: 12, height: 14, display: "flex", alignItems: "center" }}>
              <Typography variant="caption" sx={{ fontSize: 10 }}>{label}</Typography>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", gap: 0.5, overflowX: "auto", pb: 1, justifyContent: "center" }}>
        {/* Weekday labels column */}
        <Box sx={{ display: "grid", gridTemplateRows: "repeat(7, 12px)", gap: 0.5, mr: 1 }}>
          {(["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]).map((wd) => (
            <Typography key={wd} variant="caption" sx={{ fontSize: 10, lineHeight: "12px", color: "text.secondary" }}>{wd}</Typography>
          ))}
        </Box>
        {columns.map((col, ci) => (
          <Box key={ci} sx={{ display: "grid", gridTemplateRows: "repeat(7, 12px)", gap: 0.5 }}>
            {[0,1,2,3,4,5,6].map((row) => {
              const item = col[row];
              const hours = item?.hours ?? 0;
              const isEmpty = hours <= 0;
              const minutes = Math.round(hours * 60);
              const label = item ? `${item.date} • ${hours.toFixed(2)} h • ${minutes} min` : "No data";
              return (
                <Tooltip key={`${ci}-${row}`} title={<Typography variant="caption">{label}</Typography>} arrow>
                  <Box
                    onClick={() => item && setOpenDay(item.date)}
                    sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: isEmpty ? "#fff" : colorFor(hours), border: "1px solid", borderColor: isEmpty ? "#ddd" : "transparent", cursor: item ? "pointer" : "default" }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>
      <Box mt={1}>
        <Typography variant="caption" color="text.secondary">
          Darker circles indicate more listening hours. Hover to see hours/minutes; use the year selector to switch.
        </Typography>
      </Box>

      {/* Day details modal */}
      <Dialog open={!!openDay} onClose={() => setOpenDay(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Listening on {openDay}</span>
          <Button variant="text" size="small" onClick={() => setOpenDay(null)}>Close</Button>
        </DialogTitle>
        <DialogContent dividers>
          {openDay ? (
            (() => {
              const items = streams.filter((s) => {
                // Normalize to local date string YYYY-MM-DD
                const raw = (s as any).ts ?? (s as any).endTime ?? (s as any).startTime ?? (s as any).timestamp;
                const d = new Date(typeof raw === "string" || typeof raw === "number" || raw instanceof Date ? raw : NaN);
                if (Number.isNaN(d.getTime())) return false;
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                return key === openDay;
              });
              // Sort by time if available
              items.sort((a, b) => {
                const ra = (a as any).ts ?? (a as any).endTime ?? (a as any).startTime ?? (a as any).timestamp;
                const rb = (b as any).ts ?? (b as any).endTime ?? (b as any).startTime ?? (b as any).timestamp;
                const da = new Date(typeof ra === "string" || typeof ra === "number" || ra instanceof Date ? ra : NaN).getTime();
                const db = new Date(typeof rb === "string" || typeof rb === "number" || rb instanceof Date ? rb : NaN).getTime();
                return da - db;
              });
              const totalMs = items.reduce((acc, s) => acc + Number((s as any).msPlayed ?? (s as any).ms_played ?? 0), 0);
              const totalHours = totalMs / 1000 / 60 / 60;
              const totalMinutes = Math.round(totalMs / 1000 / 60);
              // Image prefetch handled by top-level useEffect
              return (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Total: {totalHours.toFixed(2)} h ({totalMinutes} min)
                  </Typography>
                  {items.length ? (
                    <List dense>
                      {items.map((s, idx) => {
                        const minutes = Math.round(Number((s as any).msPlayed ?? (s as any).ms_played ?? 0) / 1000 / 60);
                        const primary = (s as any).trackName ?? (s as any).track ?? (s as any).master_metadata_track_name ?? "Unknown Track";
                        const artist = (s as any).artistName ?? (s as any).artist ?? (s as any).master_metadata_album_artist_name ?? "Unknown Artist";
                        const imgUrl = artistImageCache.get(artist);
                        return (
                          <ListItem key={idx} disableGutters>
                            {imagesLoading ? (
                              <CircularProgress size={28} sx={{ mr: 1 }} />
                            ) : imgUrl ? (
                              <Avatar src={imgUrl} alt={artist} sx={{ width: 40, height: 40, mr: 1 }} />
                            ) : (
                              <Avatar sx={{ width: 40, height: 40, mr: 1 }}>
                                {(artist || "?").slice(0,1)}
                              </Avatar>
                            )}
                            <ListItemText
                              primary={`${primary}`}
                              secondary={`${artist} • ${minutes} min`}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography variant="body2">No listening data for this day.</Typography>
                  )}
                </Box>
              );
            })()
          ) : null}
        </DialogContent>
      </Dialog>
    </Paper>
  );
}
