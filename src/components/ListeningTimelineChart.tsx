// src/components/ListeningTimelineChart.tsx
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export interface YearListeningRow {
  year: number;
  hours: number;
  streams: number;
}

interface Props {
  data: YearListeningRow[];
}

export function ListeningTimelineChart({ data }: Props) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart
        data={data}
        margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1DB954" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#1DB954" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={{ stroke: "#333" }}
        />
        <YAxis
          tickLine={false}
          axisLine={{ stroke: "#333" }}
          tickFormatter={(val: number) => `${val}h`}
        />
        <Tooltip
          formatter={(value: any, name: any) => {
            if (name === "hours") {
              return [`${(value as number).toFixed(1)} hours`, "Listening"];
            }
            if (name === "streams") {
              return [value, "Streams"];
            }
            return [value, name];
          }}
          labelFormatter={(label: any) => `Year ${label}`}
        />
        <Area
          type="monotone"
          dataKey="hours"
          stroke="#1DB954"
          fill="url(#colorHours)"
          name="hours"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
