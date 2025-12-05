import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1DB954", // Spotify-ish green
    },
    background: {
      default: "#050508",
      paper: "#101012",
    },
  },
  shape: {
    borderRadius: 16,
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
