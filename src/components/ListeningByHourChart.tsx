// src/components/ListeningByHourChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { ListeningByHourRow } from "../interfaces/interfaces"

interface Props {
  data: ListeningByHourRow[];
}

export function ListeningByHourChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="hour"
          tickFormatter={(h: number) => `${h}:00`}
          tickLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={{ stroke: "#333" }}
          tickFormatter={(val: number) => `${val.toFixed(1)}h`}
        />
        <Tooltip
          formatter={(value: any, name: any) => {
            if (name === "hours") {
              return [`${(value as number).toFixed(2)} hours`, "Listening"];
            }
            return [value, name];
          }}
          labelFormatter={(label: any) => `${label}:00`}
        />
        <Line
          type="monotone"
          dataKey="hours"
          stroke="#1DB954"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="hours"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
