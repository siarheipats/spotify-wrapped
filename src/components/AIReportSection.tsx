import { useState } from "react";
import { Paper, Box, Stack, Typography, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Slider, FormGroup, FormControlLabel, Checkbox } from "@mui/material";
import { Backdrop, CircularProgress } from "@mui/material";
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
  const [open, setOpen] = useState(false);

  // Customization options
  const [tone, setTone] = useState<string>("super engaging, hilarious, witty, playful, slightly self-deprecating");
  const [length, setLength] = useState<number>(200); // words
  const [bullets, setBullets] = useState<number>(4);
  const [focusArtists, setFocusArtists] = useState<boolean>(true);
  const [focusTracks, setFocusTracks] = useState<boolean>(true);
  const [focusHabits, setFocusHabits] = useState<boolean>(true);
  const [includeVerdict, setIncludeVerdict] = useState<boolean>(true);

  const hasKey = Boolean(import.meta.env.VITE_OPENAI_API_KEY);

  const buildSystemPrompt = () => {
    const focusList = [
      ...(focusArtists ? ["artists"] : []),
      ...(focusTracks ? ["tracks"] : []),
      ...(focusHabits ? ["habits"] : []),
    ];
    const focusStr = focusList.length ? focusList.join(", ") : "overall stats";
    return `You are a friendly music analyst with a ${tone} voice. Make it super interesting, engaging, and funny. Produce a concise personality report based on lifetime Spotify stats. Aim for about ${length} words, use Gen Z slang and playful roasting that's kind (no insults, no profanity, no hate). Include ${bullets} punchy bullets with short, funny labels, varied structure and rhythm. Focus primarily on ${focusStr}. ${includeVerdict ? "End with a one-liner \"verdict\" tagline that feels memorable." : ""}`;
  };

  const onGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const text = await generatePersonalityReport({ stats, habits, topArtists, topTracks }, tone);
      setReport(text);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">AI Personality Report</Typography>
          <Button variant="contained" onClick={() => setOpen(true)} disabled={!hasKey || loading}>
            {loading ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={16} />
                <span>Generating…</span>
              </Stack>
            ) : (
              "Customize & Generate"
            )}
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

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Customize AI Report</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <FormControl fullWidth>
                <InputLabel id="tone-label">Tone</InputLabel>
                <Select labelId="tone-label" value={tone} label="Tone" onChange={(e) => setTone(e.target.value)} disabled={loading}>
                  <MenuItem value="super engaging, hilarious, witty, playful, slightly self-deprecating">Engaging & Funny</MenuItem>
                  <MenuItem value="wholesome, warm, positive, uplifting">Wholesome</MenuItem>
                  <MenuItem value="clever, sharp, lightly roasty, kind">Roast-lite</MenuItem>
                  <MenuItem value="poetic, metaphor-rich, lyrical">Poetic</MenuItem>
                  <MenuItem value="insightful, analytical, concise">Analytical</MenuItem>
                </Select>
              </FormControl>
              <Box>
                <Typography gutterBottom>Length (words)</Typography>
                <Slider value={length} onChange={(_e, v) => typeof v === "number" && setLength(v)} min={120} max={300} step={10} valueLabelDisplay="auto" disabled={loading} />
              </Box>
              <Box>
                <Typography gutterBottom>Bullets count</Typography>
                <Slider value={bullets} onChange={(_e, v) => typeof v === "number" && setBullets(v)} min={3} max={6} step={1} valueLabelDisplay="auto" disabled={loading} />
              </Box>
              <FormGroup>
                <Typography gutterBottom>Focus areas</Typography>
                <FormControlLabel control={<Checkbox checked={focusArtists} onChange={(e) => setFocusArtists(e.target.checked)} disabled={loading} />} label="Artists" />
                <FormControlLabel control={<Checkbox checked={focusTracks} onChange={(e) => setFocusTracks(e.target.checked)} disabled={loading} />} label="Tracks" />
                <FormControlLabel control={<Checkbox checked={focusHabits} onChange={(e) => setFocusHabits(e.target.checked)} disabled={loading} />} label="Listening Habits" />
              </FormGroup>
              <FormControlLabel control={<Checkbox checked={includeVerdict} onChange={(e) => setIncludeVerdict(e.target.checked)} disabled={loading} />} label="Include verdict tagline" />
              <Typography variant="caption" color="text.secondary">
                The model will follow these settings while keeping things kind and safe.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button variant="contained" onClick={onGenerate} disabled={loading}>
              {loading ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={16} />
                  <span>Generating…</span>
                </Stack>
              ) : (
                "Generate"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
      {/* Full-screen loading overlay while generating */}
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 2 }}>
        <CircularProgress color="inherit" />
        <Typography variant="body2" sx={{ ml: 2 }}>Summoning your personality report…</Typography>
      </Backdrop>
    </Paper>
  );
}
