import { Box, Chip, Paper, Typography } from "@mui/material";
import type { PersonalitySummary } from "../interfaces/interfaces";

interface Props {
  personality: PersonalitySummary;
}

export function PersonalitySummaryCard({ personality }: Props) {
  return (
    <Box mb={3}>
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Your listening personality
        </Typography>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {personality.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {personality.tagline}
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={1} mb={1.5}>
          {personality.traits.map((trait) => (
            <Chip key={trait.id} label={trait.label} color="primary" variant="outlined" size="small" />
          ))}
        </Box>

        <Box component="ul" sx={{ pl: 3, m: 0 }}>
          {personality.traits.map((trait) => (
            <li key={trait.id}>
              <Typography variant="body2">
                <strong>{trait.label}:</strong> {trait.description}
              </Typography>
            </li>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
