import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Stack,
} from "@mui/material";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import {
  Assessment as TrendingUpIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { getUserWeaknesses } from "../api/quiz";

// Dark theme to match the Dashboard
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#100827",
      paper: "rgba(25, 25, 25, 0.8)",
    },
    primary: {
      main: "#7b1fa2",
    },
    secondary: {
      main: "#f50057",
    },
    text: {
      primary: "#ffffff",
      secondary: "#cccccc",
    },
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(45, 45, 45, 0.5)",
          backdropFilter: "blur(4px)",
        },
      },
    },
  },
});

// Styled components to match Dashboard aesthetic
const GradientBox = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)",
  minHeight: "100vh",
  width: "100vw",
  color: "white",
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 1000,
  overflowY: "auto",
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(90deg, #1a0f3d 0%, #23164a 50%, #2d1a54 100%)",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
  border: "1px solid rgba(126, 87, 194, 0.5)",
  marginBottom: theme.spacing(4),
}));

const ReportCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
  border: "1px solid #444",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    border: "1px solid #7b1fa2",
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  height: "56px",
  borderRadius: "12px",
  textTransform: "none",
  fontSize: "1rem",
  fontWeight: 600,
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
  },
}));

// Main container for proper alignment
const ReportContainer = styled(Container)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: "none !important",
  margin: "0 auto",
  padding: "20px",
}));

const WeaknessReportPage = () => {
  const navigate = useNavigate();
  const [weaknesses, setWeaknesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Override global styles for this page
  useEffect(() => {
    // Store original styles
    const originalRootStyle = document.getElementById("root")?.style.cssText;
    const originalBodyStyle = document.body.style.cssText;

    // Apply page-specific styles
    const root = document.getElementById("root");
    if (root) {
      root.style.maxWidth = "none";
      root.style.padding = "0";
      root.style.margin = "0";
      root.style.textAlign = "initial";
      root.style.width = "100vw";
    }

    document.body.style.display = "block";
    document.body.style.placeItems = "initial";
    document.body.style.overflow = "visible";
    document.documentElement.style.overflow = "visible";

    // Cleanup function to restore original styles
    return () => {
      if (root && originalRootStyle !== undefined) {
        root.style.cssText = originalRootStyle;
      }
      if (originalBodyStyle !== undefined) {
        document.body.style.cssText = originalBodyStyle;
      }
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Fetch weaknesses
  useEffect(() => {
    const fetchWeaknesses = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No user logged in. Please sign in to view your weaknesses.");
        setIsLoading(false);
        return;
      }

      const user = localStorage.getItem("user");
      let userId = null;
      try {
        userId = user ? JSON.parse(user).id : null;
      } catch (e) {
        userId = null;
      }

      if (!userId) {
        setError("User information missing. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getUserWeaknesses(userId);
        setWeaknesses(data);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load user weaknesses. Please check your backend."
        );
        console.error("API error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeaknesses();
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <ReportContainer maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <HeaderCard>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={3}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: "linear-gradient(135deg, #7b1fa2, #f50057)",
                    boxShadow: "0 4px 20px rgba(123, 31, 162, 0.4)",
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography
                    variant="h3"
                    component="h1"
                    fontWeight="bold"
                    sx={{
                      background: "linear-gradient(to right, #a0d8ff, #ff80ab)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      mb: 1,
                    }}
                  >
                    Your Weak Areas Report
                  </Typography>
                  <Typography variant="h6" sx={{ color: "#aaa" }}>
                    Identify and improve your weak topics based on quiz performance.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </HeaderCard>

          {/* Loading State */}
          {isLoading && (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <CircularProgress sx={{ color: "#4caf50", mb: 2 }} />
              <Typography variant="body2" sx={{ color: "#aaa" }}>
                Loading weaknesses report...
              </Typography>
            </Box>
          )}

          {/* Error State */}
          {error && (
            <ReportCard sx={{ mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Alert
                  severity="error"
                  variant="filled"
                  sx={{
                    mb: 3,
                    borderRadius: "12px",
                    background: "linear-gradient(45deg, #f44336, #d32f2f)",
                  }}
                >
                  {error}
                </Alert>
                <Stack direction="row" spacing={2}>
                  <ActionButton
                    variant="contained"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/login")}
                    sx={{
                      background: "linear-gradient(45deg, #2196F3, #21CBF3)",
                      "&:hover": {
                        background: "linear-gradient(45deg, #42a5f5, #4fc3f7)",
                      },
                    }}
                  >
                    Go to Login
                  </ActionButton>
                  <ActionButton
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/dashboard")}
                    sx={{
                      borderColor: "#666",
                      color: "#ccc",
                      "&:hover": {
                        borderColor: "#7b1fa2",
                        backgroundColor: "#7b1fa220",
                      },
                    }}
                  >
                    Back to Dashboard
                  </ActionButton>
                </Stack>
              </CardContent>
            </ReportCard>
          )}

          {/* No Weaknesses Found */}
          {!isLoading && !error && (!weaknesses || weaknesses.length === 0) && (
            <ReportCard>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ color: "white" }}
                >
                  No Weaknesses Found
                </Typography>
                <Typography variant="body2" sx={{ color: "#ccc", mb: 3, lineHeight: 1.6 }}>
                  No weaknesses found yet. Take some quizzes to generate a report!
                </Typography>
                <ActionButton
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate("/dashboard")}
                  sx={{
                    background: "linear-gradient(45deg, #4caf50, #8bc34a)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #66bb6a, #aed581)",
                    },
                  }}
                >
                  Back to Dashboard
                </ActionButton>
              </CardContent>
            </ReportCard>
          )}

          {/* Weaknesses List */}
          {!isLoading && !error && weaknesses && weaknesses.length > 0 && (
            <ReportCard>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ color: "white" }}
                >
                  Your Weak Areas
                </Typography>
                <Typography variant="body2" sx={{ color: "#ccc", mb: 3, lineHeight: 1.6 }}>
                  Based on your quiz history, here are the topics where you have the most incorrect answers.
                </Typography>
                <Divider sx={{ my: 2, borderColor: "#444" }} />
                <List>
                  {weaknesses.map((weakness) => (
                    <React.Fragment key={weakness.id}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ color: "white", fontWeight: "bold" }}>
                              {weakness.topic}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ color: "#ccc", display: "inline" }}
                              >
                                Incorrect Answers: {weakness.incorrectCount}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "#888", ml: 2, display: "inline" }}
                              >
                                (Last updated: {new Date(weakness.lastUpdated).toLocaleString()})
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider sx={{ borderColor: "#444" }} />
                    </React.Fragment>
                  ))}
                </List>
                <ActionButton
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate("/dashboard")}
                  sx={{
                    mt: 3,
                    background: "linear-gradient(45deg, #4caf50, #8bc34a)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #66bb6a, #aed581)",
                    },
                  }}
                >
                  Back to Dashboard
                </ActionButton>
              </CardContent>
            </ReportCard>
          )}
        </ReportContainer>
      </GradientBox>
    </ThemeProvider>
  );
};

export default WeaknessReportPage;