// src/components/ArtistMonthlyPlaysChart.tsx
import { useMemo, useState } from "react";
import type { StreamRecord } from "../interfaces/interfaces";
import { Autocomplete, TextField, Box, Paper, Typography, Button, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent } from "@mui/material";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

type Props = {
  streams?: StreamRecord[];
  defaultArtist?: string | null;
  fallbackOptions?: string[]; // optional list of artist names to use if none found in streams
};

type MonthRow = { month: string; plays: number; hours: number };

export default function ArtistMonthlyPlaysChart({ streams, defaultArtist, fallbackOptions }: Props) {
  const safeStreams = Array.isArray(streams) ? streams : [];
  const artistOptions = useMemo(() => {
    const opts = computeArtistOptions(safeStreams);
    if (opts.length === 0 && Array.isArray(fallbackOptions) && fallbackOptions.length > 0) {
      return fallbackOptions;
    }
    return opts;
  }, [safeStreams, fallbackOptions]);
  const [selectedArtist] = useState<string | null>(defaultArtist ?? artistOptions[0] ?? null);
  const [selectedArtists, setSelectedArtists] = useState<string[]>(() => {
    const first = defaultArtist ?? artistOptions[0] ?? null;
    return first ? [first] : [];
  });
  const [metric, setMetric] = useState<"streams" | "hours">("streams");
  const [modalMonth, setModalMonth] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const monthlyDataAll = useMemo(() => {
    if (!selectedArtists.length) return [] as MonthRow[];
    return computeMonthlyPlaysMulti(safeStreams, selectedArtists);
  }, [safeStreams, selectedArtists]);

  const [year, setYear] = useState<number | null>(null); // default to All Years
  const seriesData = useMemo(() => buildSeriesFromStreams(safeStreams, selectedArtists, metric, year), [safeStreams, selectedArtists, metric, year]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const s of safeStreams) {
      const ts = s.ts;
      if (!ts) continue;
      const d = new Date(ts);
      if (isNaN(d.getTime())) continue;
      set.add(d.getUTCFullYear());
    }
    return Array.from(set).sort((a,b)=>a-b);
  }, [safeStreams]);

  const monthlyData = useMemo(() => {
    if (!year) return monthlyDataAll;
    const filtered = monthlyDataAll.filter(r => r.month.startsWith(`${year}-`));
    return ensureTwelveMonths(year, filtered);
  }, [monthlyDataAll, year]);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Box sx={{ p: 2 }}>
            {/* Top row: Autocomplete (left), Year controls + toggle (right) */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, gap: 2 }}>
              <Autocomplete
                multiple
                disablePortal
                options={artistOptions}
                value={selectedArtists}
                onChange={(_, value) => {
                  // Limit selection to 5 artists
                  const next = Array.isArray(value) ? value.slice(0, 5) : [];
                  setSelectedArtists(next);
                }}
                getOptionDisabled={(option) => selectedArtists.length >= 5 && !selectedArtists.includes(option)}
                sx={{ width: 420 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Artists"
                    helperText={artistOptions.length === 0 ? "No artists found in streams yet" : selectedArtists.length >= 5 ? "You can select up to 5 artists" : undefined}
                  />
                )}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {availableYears.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button variant="outlined" size="small" onClick={() => setYear(prev => stepYear(availableYears, prev, -1))}>Prev</Button>
                    <Typography variant="body2" sx={{ minWidth: 80, textAlign: "center" }}>
                      {year ?? "All Years"}
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => setYear(prev => stepYear(availableYears, prev, +1))}>Next</Button>
                    <Button variant="text" size="small" onClick={() => setYear(null)} sx={{ ml: 1 }}>All years</Button>
                  </Box>
                )}
                <ToggleButtonGroup
                  value={metric}
                  exclusive
                  size="small"
                  onChange={(_, val) => { if (val) setMetric(val); }}
                  aria-label="metric toggle"
                >
                  <ToggleButton value="streams" aria-label="Streams">Streams</ToggleButton>
                  <ToggleButton value="hours" aria-label="Hours">Hours</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>

            {monthlyData.length > 0 && (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart
                    data={seriesData}
                    margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
                    onMouseMove={(state: any) => {
                      const lbl = state?.activeLabel as string | undefined;
                      if (lbl) setHoveredMonth(lbl);
                    }}
                    onClick={() => {
                      if (hoveredMonth) setModalMonth(hoveredMonth);
                    }}
                  >
                    <defs>
                      <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1DB954" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#1DB954" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#333" }} />
                    <YAxis tickLine={false} axisLine={{ stroke: "#333" }} tickFormatter={(v: number) => metric === "hours" ? `${v.toFixed(1)}h` : String(v)} />
                    <Tooltip content={<CustomTooltip metric={metric} onPickMonth={(m: string) => setModalMonth(m)} />} />
                    <Legend />
                    {selectedArtists.map((artist, idx) => (
                      <Area key={artist} type="monotone" dataKey={artist} stroke={palette[idx % palette.length]} fillOpacity={0.2} fill={palette[idx % palette.length]} name={artist} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
            )}

            {/* Modal: daily chart for selected month */}
            <Dialog open={!!modalMonth} onClose={() => setModalMonth(null)} maxWidth="md" fullWidth>
              <DialogTitle>
                {selectedArtist ? `${selectedArtist} — ${formatMonthLabel(String(modalMonth ?? ""))}` : formatMonthLabel(String(modalMonth ?? ""))}
              </DialogTitle>
              <DialogContent>
                {modalMonth && (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={buildDailySeriesFromStreams(safeStreams, selectedArtists, modalMonth, metric)} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: "#333" }} />
                      <YAxis tickLine={false} axisLine={{ stroke: "#333" }} tickFormatter={(v: number) => metric === "hours" ? `${v.toFixed(1)}h` : String(v)} />
                      <Tooltip content={<MultiDailyTooltip metric={metric} />} wrapperStyle={{ pointerEvents: "auto" }} />
                      <Legend />
                      {selectedArtists.map((artist, idx) => (
                        <Area key={artist} type="monotone" dataKey={artist} stroke={palette[idx % palette.length]} fillOpacity={0.15} fill={palette[idx % palette.length]} name={artist} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </DialogContent>
            </Dialog>
        </Box>
    </Paper>
  );
}

function computeArtistOptions(streams: StreamRecord[]): string[] {
  const counts = new Map<string, number>();
  for (const s of streams) {
    const artist = s.master_metadata_album_artist_name;
    const track = s.master_metadata_track_name;
    if (!artist || !track) continue; // skip podcasts / missing metadata
    counts.set(artist, (counts.get(artist) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([artist]) => artist);
}


function computeMonthlyPlaysMulti(streams: StreamRecord[], artists: string[]): MonthRow[] {
  const byMonth = new Map<string, { plays: number; hours: number }>();
  const set = new Set(artists);
  for (const s of streams) {
    const a = s.master_metadata_album_artist_name;
    const track = s.master_metadata_track_name;
    if (!a || !track) continue;
    if (!set.has(a)) continue;
    const ts = s.ts;
    if (!ts) continue;
    const d = new Date(ts);
    if (isNaN(d.getTime())) continue;
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const prev = byMonth.get(ym) ?? { plays: 0, hours: 0 };
    prev.plays += 1;
    prev.hours += (s.ms_played ?? 0) / 1000 / 60 / 60;
    byMonth.set(ym, prev);
  }
  const rows = Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([month, v]) => ({ month, plays: v.plays, hours: Number(v.hours.toFixed(2)) }));
  return rows;
}

function formatMonthLabel(ym: string): string {
  // ym is like "2020-05"
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return ym;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const name = monthNames[m - 1] ?? mStr;
  return `${name} ${y}`;
}

// Build a table for Recharts: [{ month, ArtistA: value, ArtistB: value, ... }] from raw streams
function buildSeriesFromStreams(streams: StreamRecord[], artists: string[], metric: "streams" | "hours", focusYear: number | null): Array<Record<string, any>> {
  if (!artists.length) return [];
  const set = new Set(artists);
  const byMonthArtist = new Map<string, Map<string, number>>();
  for (const s of streams) {
    const a = s.master_metadata_album_artist_name;
    const track = s.master_metadata_track_name;
    if (!a || !track) continue;
    if (!set.has(a)) continue;
    const ts = s.ts;
    if (!ts) continue;
    const d = new Date(ts);
    if (isNaN(d.getTime())) continue;
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (focusYear && !ym.startsWith(`${focusYear}-`)) continue;
    const inc = metric === "hours" ? (s.ms_played ?? 0) / 1000 / 60 / 60 : 1;
    if (!byMonthArtist.has(ym)) byMonthArtist.set(ym, new Map());
    const m = byMonthArtist.get(ym)!;
    m.set(a, (m.get(a) ?? 0) + inc);
  }
  // Build month list: if focused year, ensure 12 months present
  let months: string[];
  if (focusYear) {
    months = Array.from({ length: 12 }, (_, i) => `${focusYear}-${String(i + 1).padStart(2, "0")}`);
  } else {
    months = Array.from(byMonthArtist.keys()).sort((a,b)=>a<b?-1:a>b?1:0);
  }
  const table: Array<Record<string, any>> = months.map((month) => {
    const row: Record<string, any> = { month };
    const m = byMonthArtist.get(month);
    for (const a of artists) {
      const val = m?.get(a) ?? 0;
      row[a] = metric === "hours" ? Number(val.toFixed(2)) : val;
    }
    return row;
  });
  return table;
}

const palette = [
  "#1DB954",
  "#FF6B6B",
  "#4D96FF",
  "#FFC857",
  "#8E44AD",
  "#2ECC71",
  "#E67E22",
];

function CustomTooltip({ active, payload, label, metric, onPickMonth }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const month = formatMonthLabel(String(label ?? ""));
  const value = item?.value ?? 0;
  return (
    <div
      style={{ background: "rgba(0,0,0,0.75)", color: "#fff", padding: "8px 10px", borderRadius: 6, cursor: "pointer" }}
      onClick={() => {
        if (onPickMonth && label) onPickMonth(String(label));
      }}
      title={`Click to open ${month}`}
    >
      <div style={{ fontWeight: 600 }}>{month}</div>
      {metric === "hours" ? (
        <div>{Number(value).toFixed(2)} Hours</div>
      ) : (
        <div>{value} Streams</div>
      )}
      <div style={{ marginTop: 4, opacity: 0.85 }}>Click to view daily breakdown</div>
    </div>
  );
}



// Build per-artist daily series table for a given month: [{ day, ArtistA, ArtistB, ... }]
function buildDailySeriesFromStreams(streams: StreamRecord[], artists: string[], ym: string, metric: "streams" | "hours"): Array<Record<string, any>> {
  if (!artists.length) return [];
  const set = new Set(artists);
  const byDayArtist = new Map<string, Map<string, number>>();
  for (const s of streams) {
    const a = s.master_metadata_album_artist_name;
    const track = s.master_metadata_track_name;
    if (!a || !track) continue;
    if (!set.has(a)) continue;
    const ts = s.ts;
    if (!ts) continue;
    const d = new Date(ts);
    if (isNaN(d.getTime())) continue;
    const keyYm = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (keyYm !== ym) continue;
    const dayKey = `${String(d.getUTCDate()).padStart(2, "0")}`;
    const inc = metric === "hours" ? (s.ms_played ?? 0) / 1000 / 60 / 60 : 1;
    if (!byDayArtist.has(dayKey)) byDayArtist.set(dayKey, new Map());
    const m = byDayArtist.get(dayKey)!;
    m.set(a, (m.get(a) ?? 0) + inc);
  }
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr), m = Number(mStr);
  const daysInMonth = new Date(y, m, 0).getUTCDate();
  const table: Array<Record<string, any>> = [];
  for (let dNum = 1; dNum <= daysInMonth; dNum++) {
    const day = String(dNum).padStart(2, "0");
    const row: Record<string, any> = { day };
    const m = byDayArtist.get(day);
    for (const a of artists) {
      const val = m?.get(a) ?? 0;
      row[a] = metric === "hours" ? Number(val.toFixed(2)) : val;
    }
    table.push(row);
  }
  return table;
}

function MultiDailyTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload || !payload.length) return null;
  const day = String(label ?? "");
  return (
    <div style={{ background: "rgba(0,0,0,0.75)", color: "#fff", padding: "8px 10px", borderRadius: 6 }}>
      <div style={{ fontWeight: 600 }}>Day {day}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{metric === "hours" ? Number(p.value).toFixed(2) + " h" : p.value + " streams"}</span>
        </div>
      ))}
    </div>
  );
}

// removed unused helpers
function stepYear(years: number[], current: number | null, delta: number): number | null {
  if (years.length === 0) return null;
  if (current === null) return years[0];
  const idx = years.indexOf(current);
  const nextIdx = Math.max(0, Math.min(years.length - 1, idx + delta));
  return years[nextIdx];
}

function ensureTwelveMonths(targetYear: number, rows: MonthRow[]): MonthRow[] {
  const playsMap = new Map(rows.map(r => [r.month, r.plays] as const));
  const hoursMap = new Map(rows.map(r => [r.month, r.hours] as const));
  const out: MonthRow[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${targetYear}-${String(m).padStart(2, "0")}`;
    out.push({ month: key, plays: playsMap.get(key) ?? 0, hours: Number((hoursMap.get(key) ?? 0).toFixed(2)) });
  }
  return out;
}
