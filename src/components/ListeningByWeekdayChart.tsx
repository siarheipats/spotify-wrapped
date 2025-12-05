// src/components/ListeningByWeekdayChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ListeningByWeekdayRow } from "../stats";

interface Props {
  data: ListeningByWeekdayRow[];
}

export function ListeningByWeekdayChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="weekday"
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
        />
        <Bar dataKey="hours" name="hours" fill="#1DB954" />
      </BarChart>
    </ResponsiveContainer>
  );
}
