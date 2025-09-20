import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import darkTheme from "../ui/theme";

export default function AppThemeProvider({ children }) {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}