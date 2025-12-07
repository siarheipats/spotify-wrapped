// src/components/TopArtistsChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TopArtistRow } from "../interfaces/interfaces";

interface Props {
  data: TopArtistRow[];
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

export function TopArtistsChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  // We reverse to show top at the top in a horizontal bar chart
  const displayData = [...data].reverse();

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={displayData}
        layout="vertical"
        margin={{ top: 16, right: 24, left: 0, bottom: 16 }}
      >
        <XAxis
          type="number"
          tickFormatter={(val: number) => `${val.toFixed(1)}h`}
        />
        <YAxis
          type="category"
          dataKey="artist"
          width={180}
        />
        <Tooltip
          formatter={(value: any, name: any, _props: any) => {
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
          {displayData.map((entry, index) => (
            <Cell
              key={entry.artist}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
