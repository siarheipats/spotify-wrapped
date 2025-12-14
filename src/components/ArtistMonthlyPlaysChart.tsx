// src/components/ArtistMonthlyPlaysChart.tsx
import { useMemo, useState } from "react";
import type { StreamRecord } from "../interfaces/interfaces";
import { Autocomplete, TextField, Box, Paper, Typography, Button, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent } from "@mui/material";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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
  const [selectedArtist, setSelectedArtist] = useState<string | null>(defaultArtist ?? artistOptions[0] ?? null);
  const [metric, setMetric] = useState<"streams" | "hours">("streams");
  const [modalMonth, setModalMonth] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const monthlyDataAll = useMemo(() => {
    if (!selectedArtist) return [] as MonthRow[];
    return computeMonthlyPlays(safeStreams, selectedArtist);
  }, [safeStreams, selectedArtist]);

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

  const [year, setYear] = useState<number | null>(null); // default to All Years

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
                disablePortal
                options={artistOptions}
                value={selectedArtist}
                onChange={(_, value) => setSelectedArtist(value)}
                sx={{ width: 360 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Artist"
                    helperText={artistOptions.length === 0 ? "No artists found in streams yet" : undefined}
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
                    data={monthlyData}
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
                    <Tooltip
                      content={<CustomTooltip metric={metric} onPickMonth={(ym: string) => setModalMonth(ym)} />}
                    />
                    <Area type="monotone" dataKey={metric === "hours" ? "hours" : "plays"} stroke="#1DB954" fill="url(#colorPlays)" name={metric === "hours" ? "Hours" : "Streams"} />
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
                    <AreaChart data={computeDailyData(safeStreams, selectedArtist ?? "", modalMonth)} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1DB954" stopOpacity={0.9} />
                          <stop offset="95%" stopColor="#1DB954" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: "#333" }} />
                      <YAxis tickLine={false} axisLine={{ stroke: "#333" }} tickFormatter={(v: number) => metric === "hours" ? `${v.toFixed(1)}h` : String(v)} />
                      <Tooltip content={<DailyTooltip metric={metric} />} wrapperStyle={{ pointerEvents: "auto" }} />
                      <Area type="monotone" dataKey={metric === "hours" ? "hours" : "plays"} stroke="#1DB954" fill="url(#colorDaily)" name={metric === "hours" ? "Hours" : "Streams"} />
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

function computeMonthlyPlays(streams: StreamRecord[], artist: string): MonthRow[] {
  const byMonth = new Map<string, number>();
  const byMonthHours = new Map<string, number>();
  for (const s of streams) {
    const a = s.master_metadata_album_artist_name;
    const track = s.master_metadata_track_name;
    if (!a || !track) continue;
    if (a !== artist) continue;
    const ts = s.ts;
    if (!ts) continue;
    const d = new Date(ts);
    if (isNaN(d.getTime())) continue;
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    byMonth.set(ym, (byMonth.get(ym) ?? 0) + 1);
    const hoursInc = (s.ms_played ?? 0) / 1000 / 60 / 60;
    byMonthHours.set(ym, (byMonthHours.get(ym) ?? 0) + hoursInc);
  }
  // Sort months ascending
  const rows = Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([month, plays]) => ({ month, plays, hours: Number((byMonthHours.get(month) ?? 0).toFixed(2)) }));
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

function computeDailyData(streams: StreamRecord[], artist: string, ym: string): Array<{ day: string; plays: number; hours: number }> {
  const byDay = new Map<string, { plays: number; hours: number }>();
  for (const s of streams) {
    const a = s.master_metadata_album_artist_name;
    const track = s.master_metadata_track_name;
    if (!a || !track) continue;
    if (a !== artist) continue;
    const ts = s.ts;
    if (!ts) continue;
    const d = new Date(ts);
    if (isNaN(d.getTime())) continue;
    const keyYm = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (keyYm !== ym) continue;
    const dayKey = `${String(d.getUTCDate()).padStart(2, "0")}`;
    const prev = byDay.get(dayKey) ?? { plays: 0, hours: 0 };
    prev.plays += 1;
    prev.hours += (s.ms_played ?? 0) / 1000 / 60 / 60;
    byDay.set(dayKey, prev);
  }
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr), m = Number(mStr);
  const daysInMonth = new Date(y, m, 0).getUTCDate();
  const out: Array<{ day: string; plays: number; hours: number }> = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = String(d).padStart(2, "0");
    const v = byDay.get(key) ?? { plays: 0, hours: 0 };
    out.push({ day: key, plays: v.plays, hours: Number(v.hours.toFixed(2)) });
  }
  return out;
}

function DailyTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const day = String(label ?? "");
  const value = item?.value ?? 0;
  return (
    <div style={{ background: "rgba(0,0,0,0.75)", color: "#fff", padding: "8px 10px", borderRadius: 6 }}>
      <div style={{ fontWeight: 600 }}>Day {day}</div>
      {metric === "hours" ? (
        <div>{Number(value).toFixed(2)} Hours</div>
      ) : (
        <div>{value} Streams</div>
      )}
    </div>
  );
}
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
