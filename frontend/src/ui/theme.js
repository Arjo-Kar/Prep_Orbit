import { createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#100827",
      paper: "rgba(25, 25, 25, 0.8)",
    },
    primary: { main: "#7b1fa2" },
    secondary: { main: "#f50057" },
    text: { primary: "#ffffff", secondary: "#cccccc" },
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 16, backgroundImage: "none" } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 12, textTransform: "none", fontWeight: 600 } } },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(45,45,45,0.5)",
          backdropFilter: "blur(6px)",
        },
      },
    },
  },
});

export default darkTheme;