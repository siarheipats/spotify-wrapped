// src/components/TopTracksChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TopTrackRow } from "../interfaces/interfaces";

interface Props {
  data: TopTrackRow[];
}

const COLORS = [
  "#1DB954",
  "#1ED760",
  "#1AA34A",
  "#20C15B",
  "#17A54A",
  "#24E067",
  "#0F8A3E",
  "#2CF06E",
  "#146F35",
  "#3BFF7E",
];

export function TopTracksChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  // Show top at top (reverse for vertical layout)
  const displayData = [...data].reverse();

  // Use a shorter label (track – artist) on the axis
  const formatted = displayData.map((row) => ({
    ...row,
    label: `${row.track} — ${row.artist}`,
  }));

  const rowHeight = 26; // px per row
  const chartHeight = Math.max(240, Math.min(rowHeight * formatted.length, 1000));

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={formatted}
        layout="vertical"
        margin={{ top: 16, right: 24, left: 0, bottom: 16 }}
      >
        <XAxis
          type="number"
          tickFormatter={(val: number) => `${val.toFixed(1)}h`}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={300}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: any, name: any) => {
            if (name === "hours") {
              return [`${(value as number).toFixed(2)} hours`, "Listening"];
            }
            if (name === "streams") {
              return [value, "Streams"];
            }
            return [value, name];
          }}
          labelFormatter={(label: any) => label}
        />
        <Bar dataKey="hours" name="hours">
          {formatted.map((entry, index) => (
            <Cell
              key={`${entry.track}-${entry.artist}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
