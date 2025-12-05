import { Box, Paper, Typography } from "@mui/material";

interface Props {
  onFilesPicked: (files: File[]) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function DropZone({ onFilesPicked, onDragOver }: Props) {
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onFilesPicked(Array.from(event.dataTransfer.files));
  };

  return (
    <Paper
      variant="outlined"
      onDragOver={onDragOver}
      onDrop={handleDrop}
      onClick={() => {
        const input = document.getElementById("file-input") as HTMLInputElement | null;
        input?.click();
      }}
      sx={{
        borderStyle: "dashed",
        borderColor: "primary.main",
        borderRadius: 4,
        py: 6,
        px: 3,
        textAlign: "center",
        cursor: "pointer",
        background: "radial-gradient(circle at top, rgba(29,185,84,0.25), transparent 55%)",
        mb: 4,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Drop JSON or ZIP files here
      </Typography>
      <Typography variant="body2" color="text.secondary">
        or click to browse your files
      </Typography>

      <input
        id="file-input"
        type="file"
        accept=".json,.zip"
        multiple
        onChange={(e) => {
          if (!e.target.files) return;
          onFilesPicked(Array.from(e.target.files));
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
    </Paper>
  );
}
