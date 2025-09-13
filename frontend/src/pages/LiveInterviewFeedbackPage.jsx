import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  Chip,
  Grid,
  Alert,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RateReviewIcon from '@mui/icons-material/RateReview';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

// ------------------------------------------------------------------
// Config (replace with import.meta.env / process.env in real build)
// ------------------------------------------------------------------
const BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:8080";

// ------------------------------------------------------------------
// Fallback parser only if backend fields missing
// ------------------------------------------------------------------
function parseFeedbackText(feedback) {
  if (!feedback) return { feedback: "", rating: null, suggestion: "" };
  if (typeof feedback === "object") return feedback;

  let result = { feedback: "", rating: null, suggestion: "" };
  try {
    let cleaned = feedback.replace(/```json|```/g, "").trim();
    if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
      const obj = JSON.parse(cleaned);
      result.feedback = obj.feedback ?? "";
      result.rating = typeof obj.rating === "number" ? obj.rating : (obj.rating ? Number(obj.rating) : null);
      result.suggestion = obj.suggestion ?? "";
      return result;
    }
  } catch {
    // ignore and use regex fallback below
  }
  // Regex fallback
  const fbMatch = feedback.match(/"feedback"\s*:\s*"([^"]+)"/);
  const ratingMatch = feedback.match(/"rating"\s*:\s*(\d+)/);
  const suggMatch = feedback.match(/"suggestion"\s*:\s*"([^"]+)"/);
  result.feedback = fbMatch ? fbMatch[1] : feedback;
  result.rating = ratingMatch ? Number(ratingMatch[1]) : null;
  result.suggestion = suggMatch ? suggMatch[1] : "";
  return result;
}

function LiveInterviewFeedbackPage() {
  const { interviewId } = useParams();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function fetchFeedback() {
      setLoading(true);
      setError("");
      try {
        const authToken = localStorage.getItem("authToken");

        // 1. Get all answers for the live interview
        const ansRes = await fetch(`${BASE_URL}/api/interview/answers/live-interview/${interviewId}`, {
          method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken ? `Bearer ${authToken}` : undefined,
            },
        });
        if (!ansRes.ok) {
          throw new Error(`Failed to fetch answers: ${ansRes.status}`);
        }
        const answers = await ansRes.json();
        if (!Array.isArray(answers) || answers.length === 0) {
          setFeedbacks([]);
          setLoading(false);
          return;
        }

        // 2. Fetch feedback for each answer in parallel (if backend endpoint regenerates each time)
        const fbPromises = answers.map(async (ans) => {
          const fbRes = await fetch(`${BASE_URL}/api/interview/answers/${ans.id}/feedback`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken ? `Bearer ${authToken}` : undefined,
            },
          });
          if (!fbRes.ok) {
            return {
              question: ans.question,
              correctAns: ans.correctAns,
              userAns: ans.answer,
              feedback: `Error fetching feedback (status ${fbRes.status})`,
              rating: 0,
              suggestion: ""
            };
          }
          const fbData = await fbRes.json();
          // Merge original question context where missing
          return {
            ...fbData,
            question: fbData.question || ans.question,
            correctAns: fbData.correctAns ?? ans.correctAns,
            userAns: fbData.userAns ?? ans.answer
          };
        });

        const fetchedFeedbacks = await Promise.all(fbPromises);
        if (!cancelled) setFeedbacks(fetchedFeedbacks);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unknown error while loading feedback.");
          setFeedbacks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchFeedback();
    return () => { cancelled = true; };
  }, [interviewId]);

  // Compute average rating (ignore zeros that mean "unrated")
  const averageRating = useMemo(() => {
    const rated = feedbacks
      .map(f => (typeof f.rating === "number" ? f.rating : null))
      .filter(r => r !== null && r > 0);
    if (rated.length === 0) return null;
    return (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1);
  }, [feedbacks]);

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(120deg, #180f36 60%, #312584 100%)",
      color: "white",
      py: { xs: 2, md: 6 }
    }}>
      <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 1, md: 3 } }}>
        <Card sx={{
          mb: 4,
          borderRadius: "24px",
          background: "rgba(34,40,70,0.95)",
          boxShadow: "0 10px 30px 0 rgba(60,20,110,0.28)"
        }}>
          <CardContent>
            <Typography variant="h3" color="primary" gutterBottom fontWeight={700} sx={{ letterSpacing: 1 }}>
              <RateReviewIcon sx={{ fontSize: 38, mb: -1, mr: 1 }} />
              Interview Feedback
            </Typography>
            <Typography variant="body1" sx={{ color: "#c2c3e0", fontSize: 18, mb: 2 }}>
              Your interview is complete! Here is your feedback for each answer.
            </Typography>
            {averageRating && (
              <Typography variant="h6" sx={{ color: "#1de9b6" }}>
                Average Rating: {averageRating} / 10
              </Typography>
            )}
            {!averageRating && !loading && feedbacks.length > 0 && (
              <Typography variant="h6" sx={{ color: "#ffd600" }}>
                Average Rating: Unrated
              </Typography>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" alignItems="center" justifyContent="center" minHeight={280}>
            <CircularProgress color="secondary" thickness={5} size={60} />
          </Box>
        ) : feedbacks.length === 0 ? (
          <Paper sx={{
            p: 4,
            textAlign: "center",
            background: "rgba(34,40,70,0.9)",
            borderRadius: 4
          }}>
            <Typography variant="h6" sx={{ color: "#ccc" }}>
              No answers or feedback yet for this interview.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {feedbacks.map((fb, idx) => {
              // Prefer backend rating
              let backendRating = (typeof fb.rating === "number" ? fb.rating : null);
              let backendSuggestion = fb.suggestion || "";
              // Fallback parse only if rating missing or 0 and no suggestion
              let parsed = (backendRating && backendRating > 0) || backendSuggestion
                ? { feedback: fb.feedback, rating: backendRating, suggestion: backendSuggestion }
                : parseFeedbackText(fb.feedback);

              const rating = (backendRating && backendRating > 0) ? backendRating
                : (parsed.rating && parsed.rating > 0 ? parsed.rating : null);
              const feedbackText = parsed.feedback || fb.feedback || "";
              const suggestion = backendSuggestion || parsed.suggestion || "";

              const good = rating !== null && rating >= 7;
              const chipColor = good ? "#1de9b6" : "#ffb300";

              return (
                <Grid item xs={12} md={6} key={idx}>
                  <Paper sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: "18px",
                    background: "linear-gradient(120deg, #23234e 65%, #2c295d 100%)",
                    boxShadow: "0 4px 16px rgba(60,20,110,0.18)",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 300
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
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
                      <Typography
                        component="div"
                        fontWeight={700}
                        fontSize={17}
                        color="primary"
                        sx={{ wordBreak: "break-word", lineHeight: 1.25 }}
                      >
                        {fb.question}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2, borderColor: "#444" }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography fontWeight={700} color="#ffd600" fontSize={14}>
                        Expected Answer:
                      </Typography>
                      <Typography fontSize={14} sx={{ color: "#c2c3e0", mb: 1, wordBreak: "break-word" }}>
                        {fb.correctAns ?? "N/A"}
                      </Typography>
                      <Typography fontWeight={700} color="#ffd600" fontSize={14}>
                        Your Answer:
                      </Typography>
                      <Typography fontSize={14} sx={{ color: "#c2c3e0", mb: 1, wordBreak: "break-word" }}>
                        {fb.userAns ?? "N/A"}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2, borderColor: "#333" }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography fontWeight={700} fontSize={15} color="#1de9b6" sx={{ mb: 1 }}>
                        Feedback:
                      </Typography>
                      <Typography fontSize={14} sx={{ color: "#e0e0e0", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                        {feedbackText}
                      </Typography>
                    </Box>

                    <Typography fontSize={14} fontWeight={700} color="#fff" mt="auto">
                      Rating:{" "}
                      <span
                        style={{
                          color: rating !== null ? (good ? "#1de9b6" : "#ffd600") : "#999",
                          fontWeight: "bold",
                          fontSize: 15
                        }}
                      >
                        {rating !== null ? `${rating} / 10` : "Unrated"}
                      </span>
                    </Typography>

                    {suggestion && (
                      <>
                        <Divider sx={{ my: 2, borderColor: "#444" }} />
                        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                          <TipsAndUpdatesIcon sx={{ color: "#ffd600", mr: 1, mt: "2px" }} />
                          <Box>
                            <Typography fontWeight="bold" color="#ffd600" fontSize={14} sx={{ mb: 0.5 }}>
                              Suggestion:
                            </Typography>
                            <Typography fontSize={14} sx={{ color: "#c2c3e0", whiteSpace: "pre-wrap" }}>
                              {suggestion}
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
        )}
      </Box>
    </Box>
  );
}

export default LiveInterviewFeedbackPage;