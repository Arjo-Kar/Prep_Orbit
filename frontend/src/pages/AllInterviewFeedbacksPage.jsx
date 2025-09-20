import React, { useEffect, useState } from "react";
import {
  Box, Grid, Paper, Typography, Button, Chip, Dialog,
  DialogTitle, DialogContent, Divider, IconButton
} from "@mui/material";
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:8080";

// Calculate average rating (not rounded)
function getAverageRating(answers) {
  const rated = answers
    .map(a => (typeof a.rating === "number" ? a.rating : null))
    .filter(r => r !== null && r > 0);
  if (rated.length === 0) return null;
  return (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1);
}

export default function AllInterviewSessionsGrid() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      const authToken = localStorage.getItem("authToken");
      const res = await fetch(`${BASE_URL}/api/live-interviews/with-feedbacks`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : undefined,
        },
      });
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    fetchSessions();
  }, []);

  const handleOpenDetails = (session) => setSelectedSession(session);
  const handleCloseDetails = () => setSelectedSession(null);

  return (
    <Box sx={{
      p: { xs: 2, md: 6 },
      minHeight: "100vh",
      background: "linear-gradient(120deg, #180f36 60%, #312584 100%)"
    }}>
      {/* Back to Live Interview - top left */}
      <Box sx={{ position: "fixed", top: 16, left: 16, zIndex: 2000 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/live-interview")}
          sx={{
            borderColor: "#ad1fff",
            color: "#fff",
            background: "rgba(255,255,255,0.06)",
            fontWeight: "bold",
            "&:hover": {
              borderColor: "#ff4fa7",
              background: "rgba(173,31,255,0.18)",
            },
          }}
        >
          Back to Live Interview
        </Button>
      </Box>

      {/* Back to Dashboard - top right */}
      <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 2000 }}>
        <Button
          variant="outlined"
          startIcon={<DashboardIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{
            borderColor: "#ad1fff",
            color: "#fff",
            background: "rgba(255,255,255,0.06)",
            fontWeight: "bold",
            "&:hover": {
              borderColor: "#ff4fa7",
              background: "rgba(173,31,255,0.18)",
            },
          }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Typography variant="h3" sx={{
        color: "#ad1fff",
        mb: 4,
        fontWeight: 700,
        letterSpacing: 1,
        textShadow: "0 2px 22px #000"
      }}>
        Interview Sessions
      </Typography>
      {loading ? (
        <Typography color="secondary" fontSize={28}>Loading...</Typography>
      ) : (
        <Grid container spacing={5}>
          {sessions.filter(s => s.position).map((session, idx) => {
            const averageRating = getAverageRating(session.answers || []);
            return (
              <Grid item xs={12} md={6} key={session.interviewId || idx}>
                <Paper sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: "32px",
                  background: "#19182d",
                  color: "#fff",
                  boxShadow: "0 10px 24px 0 rgba(173,31,255,0.17)",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 330,
                  maxWidth: 420,
                  mx: "auto"
                }}>
                  <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    mb: 2
                  }}>
                    <Chip
                      label={`Average Rating: ${averageRating !== null ? averageRating : "Unrated"}/10`}
                      sx={{
                        bgcolor: "#ff7043",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 22,
                        borderRadius: "32px",
                        height: 48,
                        px: 2.5,
                        boxShadow: "0 4px 14px #ad1fff33"
                      }}
                    />
                  </Box>
                  <Typography variant="h3" sx={{
                    fontWeight: 900,
                    mb: 2,
                    color: "#fff",
                    letterSpacing: 1,
                    fontSize: "2.2rem"
                  }}>
                    Interview #{session.interviewId}
                  </Typography>
                  <Typography sx={{
                    mb: 1,
                    fontSize: 18,
                    color: "#c2c3e0",
                    fontWeight: 500
                  }}>
                    {session.position}{session.type ? ` (${session.type})` : ""}
                  </Typography>
                  <Typography sx={{
                    mb: 2,
                    fontSize: 18,
                    color: "#c2c3e0",
                    fontWeight: 500
                  }}>
                    Level: {session.level}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<BarChartIcon />}
                    sx={{
                      mt: 2,
                      background: "linear-gradient(90deg, #ad1fff 0%, #ff4fa7 100%)",
                      color: "#fff",
                      fontWeight: 700,
                      borderRadius: "16px",
                      fontSize: 22,
                      px: 3,
                      py: 2,
                      boxShadow: "0 6px 18px #ad1fff22",
                      textTransform: "none"
                    }}
                    onClick={() => handleOpenDetails(session)}
                  >
                    VIEW DETAILED FEEDBACK
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Modal for detailed session feedback */}
      <Dialog
        open={!!selectedSession}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 6,
            background: "#211e40",
            color: "#fff",
            boxShadow: "0 10px 40px 0 rgba(60,20,110,0.38)"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 28, color: "#ad1fff", pb: 0 }}>
          Interview #{selectedSession?.interviewId} - {selectedSession?.position}
          <IconButton
            aria-label="close"
            onClick={handleCloseDetails}
            sx={{
              position: "absolute",
              right: 16,
              top: 16,
              color: "#fff",
              bgcolor: "#ad1fff",
              "&:hover": { bgcolor: "#ff4fa7" }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          <Typography sx={{ mb: 1 }}>
            Type: {selectedSession?.type}
          </Typography>
          <Typography sx={{ mb: 2 }}>
            Level: {selectedSession?.level}
          </Typography>
          <Divider sx={{ mb: 2, borderColor: "#444" }} />
          <Grid container spacing={3}>
            {selectedSession?.answers?.map((ans, idx) => {
              const good = ans.rating && ans.rating >= 7;
              const chipColor = good ? "#1de9b6" : "#ffb300";
              return (
                <Grid item xs={12} md={6} key={idx}>
                  <Paper sx={{
                    p: 2,
                    borderRadius: "18px",
                    background: "linear-gradient(120deg, #23234e 65%, #2c295d 100%)",
                    boxShadow: "0 4px 16px rgba(60,20,110,0.18)",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 260
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Chip
                        icon={good ? <CheckCircleIcon color="success" /> : <ErrorIcon color="warning" />}
                        label={`Q${idx + 1}`}
                        sx={{
                          mr: 1,
                          fontWeight: "bold",
                          fontSize: 18,
                          bgcolor: chipColor,
                          color: "#222",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                          height: 36
                        }}
                      />
                      <Typography fontWeight={700} fontSize={16} color="primary">
                        {ans.question}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1, borderColor: "#444" }} />
                    <Typography fontWeight={700} color="#ffd600" fontSize={14}>
                      Expected Answer:
                    </Typography>
                    <Typography fontSize={14} sx={{ color: "#c2c3e0", mb: 1 }}>
                      {ans.expectedAnswer ?? "N/A"}
                    </Typography>
                    <Typography fontWeight={700} color="#ffd600" fontSize={14}>
                      Your Answer:
                    </Typography>
                    <Typography fontSize={14} sx={{ color: "#c2c3e0", mb: 1 }}>
                      {ans.userAnswer ?? "N/A"}
                    </Typography>
                    <Typography fontWeight={700} fontSize={15} color="#1de9b6" sx={{ mb: 1 }}>
                      Feedback:
                    </Typography>
                    <Typography fontSize={14} sx={{ color: "#e0e0e0", fontStyle: "italic", mb: 1 }}>
                      {ans.feedback || "No feedback stored."}
                    </Typography>
                    <Typography fontSize={14} fontWeight={700} color="#fff">
                      Rating:{" "}
                      <span
                        style={{
                          color: ans.rating ? (good ? "#1de9b6" : "#ffd600") : "#999",
                          fontWeight: "bold",
                          fontSize: 15
                        }}
                      >
                        {ans.rating ? `${ans.rating} / 10` : "Unrated"}
                      </span>
                    </Typography>
                    {ans.suggestion && (
                     <>
                       <Divider sx={{ my: 2, borderColor: "#444" }} />
                       <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                         <TipsAndUpdatesIcon sx={{ color: "#ffd600", mr: 1, mt: "2px" }} />
                         <Box>
                           <Typography fontWeight="bold" color="#ffd600" fontSize={14} sx={{ mb: 0.5 }}>
                             Suggestion:
                           </Typography>
                           <Typography fontSize={14} sx={{ color: "#c2c3e0", whiteSpace: "pre-wrap" }}>
                             {ans.suggestion ? ans.suggestion : <span style={{ color: "#888" }}>No suggestion stored.</span>}
                           </Typography>
                         </Box>
                       </Box>
                     </>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}