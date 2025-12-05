import { Card, CardContent, Grid, Typography } from "@mui/material";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <Card sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700}>{value}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

interface Props {
  items: StatCardProps[];
}

export function StatCardsRow({ items }: Props) {
  return (
    <Grid container spacing={2} mb={3}>
      {items.map((item, idx) => (
        <Grid key={idx} item xs={12} md={3}>
          <StatCard {...item} />
        </Grid>
      ))}
    </Grid>
  );
}
