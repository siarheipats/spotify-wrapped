// src/components/StoryHighlights.tsx
import { Box, Chip, Paper, Typography, Grid, Divider } from "@mui/material";
import type { EraChapter, Milestone, Badge } from "../interfaces/interfaces";

interface Props {
  eras: EraChapter[];
  milestones: Milestone[];
  badges: Badge[];
}

export function StoryHighlights({ eras, milestones, badges }: Props) {
  if (eras.length === 0 && milestones.length === 0 && badges.length === 0) {
    return null;
  }

  return (
    <Grid container spacing={3}>
      {/* Eras at a glance */}
      {eras.length > 0 && (
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Your eras at a glance
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Yearly chapters built from patterns in your listening.
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.25}>
              {eras.map((era) => (
                <Box key={era.year}>
                  <Typography variant="body2">
                    <strong>{era.year} – {era.label}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {era.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      )}

      {/* Highlights / milestones */}
      {(milestones.length > 0 || badges.length > 0) && (
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Highlights
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Notable moments and fun badges.
            </Typography>

            {milestones.length > 0 && (
              <Box mb={2}>
                <Typography variant="overline" color="text.secondary">Milestones</Typography>
                <Box component="ul" sx={{ pl: 3, mt: 0 }}>
                  {milestones.map((m) => (
                    <li key={m.id}>
                      <Typography variant="body2">
                        <strong>{m.label}:</strong> {m.value}{m.ts ? ` \u2014 ${m.ts}` : ""}
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Box>
            )}

            {milestones.length > 0 && badges.length > 0 && (
              <Divider sx={{ my: 1.5 }} />
            )}

            {badges.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary">Badges</Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                  {badges.map((b) => (
                    <Chip key={b.id} label={b.label} color="primary" variant="outlined" size="small" />
                  ))}
                </Box>
                <Box component="ul" sx={{ pl: 3, mt: 1 }}>
                  {badges.map((b) => (
                    <li key={b.id}>
                      <Typography variant="caption" color="text.secondary">
                        {b.description}
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}
