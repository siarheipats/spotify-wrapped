import { useState } from "react";
import { Paper, Stack, Typography, Button, Alert } from "@mui/material";
import { generatePersonalityReport } from "../openaiClient";

interface Props {
  stats: any;
  habits: any;
  topArtists: any;
  topTracks: any;
}

export default function AIReportSection({ stats, habits, topArtists, topTracks }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string>("");

  const hasKey = Boolean(import.meta.env.VITE_OPENAI_API_KEY);

  const onGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const text = await generatePersonalityReport({ stats, habits, topArtists, topTracks });
      setReport(text);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">AI Personality Report</Typography>
          <Button variant="contained" onClick={onGenerate} disabled={!hasKey || loading}>
            {loading ? "Generating…" : "Generate"}
          </Button>
        </Stack>
        {!hasKey && (
          <Alert severity="info">
            Add `VITE_OPENAI_API_KEY` to your environment to enable AI generation.
          </Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {report && (
          <Typography whiteSpace="pre-wrap" fontSize={15}>
            {report}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
