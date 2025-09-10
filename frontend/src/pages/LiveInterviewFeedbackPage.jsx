import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RateReviewIcon from '@mui/icons-material/RateReview';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

function parseFeedback(feedback) {
  // Tries to extract feedback, rating, suggestion from a JSON string or fallback to plain text
  if (!feedback) return { feedback: '', rating: null, suggestion: '' };
  if (typeof feedback === 'object') return feedback; // Already parsed

  let result = { feedback: '', rating: null, suggestion: '' };
  try {
    // Remove code block fence if present
    let cleaned = feedback.replace(/```json|```/g, "").trim();
    // If direct JSON, parse
    let obj = JSON.parse(cleaned);
    result.feedback = obj.feedback ?? '';
    result.rating = obj.rating ?? null;
    result.suggestion = obj.suggestion ?? '';
    return result;
  } catch (e) {
    // Try to extract fields from text
    const feedbackMatch = feedback.match(/"feedback"\s*:\s*"([^"]*)"/);
    const ratingMatch = feedback.match(/"rating"\s*:\s*(\d+)/);
    const suggestionMatch = feedback.match(/"suggestion"\s*:\s*"([^"]*)"/);
    result.feedback = feedbackMatch ? feedbackMatch[1] : feedback;
    result.rating = ratingMatch ? Number(ratingMatch[1]) : null;
    result.suggestion = suggestionMatch ? suggestionMatch[1] : '';
    return result;
  }
}

function LiveInterviewFeedbackPage() {
  const { interviewId } = useParams();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFeedback() {
      setLoading(true);
      try {
        const authToken = localStorage.getItem("authToken");
        const ansRes = await fetch(`http://localhost:8080/api/interview/answers/live-interview/${interviewId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken ? `Bearer ${authToken}` : undefined,
          },
        });
        const answers = await ansRes.json();

        const feedbacksArr = [];
        for (const ans of answers) {
          const fbRes = await fetch(`http://localhost:8080/api/interview/answers/${ans.id}/feedback`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken ? `Bearer ${authToken}` : undefined,
            },
          });
          const fbData = await fbRes.json();
          feedbacksArr.push({ ...fbData, question: ans.question });
        }
        setFeedbacks(feedbacksArr);
      } catch (err) {
        setFeedbacks([{ feedback: "Error fetching feedback: " + err.message }]);
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
  }, [interviewId]);

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(120deg, #180f36 60%, #312584 100%)",
      color: "white",
      py: { xs: 2, md: 6 }
    }}>
      <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 1, md: 3 } }}>
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
            <Typography variant="body1" sx={{ color: "#c2c3e0", fontSize: 18 }}>
              Your interview is complete! Here is your feedback for each answer:
            </Typography>
          </CardContent>
        </Card>
        {loading ? (
          <Box display="flex" alignItems="center" justifyContent="center" minHeight={280}>
            <CircularProgress color="secondary" thickness={5} size={60} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {feedbacks.map((fb, idx) => {
              const { feedback, rating, suggestion } = parseFeedback(fb.feedback);
              return (
                <Grid item xs={12} md={6} key={idx}>
                  <Paper sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: "18px",
                    background: "linear-gradient(120deg, #23234e 65%, #2c295d 100%)",
                    boxShadow: "0 4px 16px rgba(60,20,110,0.18)"
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Chip
                        icon={rating >= 7 ? <CheckCircleIcon color="success" /> : <ErrorIcon color="warning" />}
                        label={`Q${idx + 1}`}
                        sx={{
                          mr: 1,
                          fontWeight: "bold",
                          fontSize: 18,
                          bgcolor: rating >= 7 ? "#1de9b6" : "#ffb300",
                          color: "#222",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                          height: 36
                        }}
                      />
                      <Typography
                        component="div"
                        fontWeight={700}
                        fontSize={18}
                        color="primary"
                        sx={{
                          wordBreak: "break-word"
                        }}
                      >
                        {fb.question}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2, borderColor: "#444" }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography fontWeight={700} color="#ffd600" fontSize={15}>
                        Expected Answer:
                      </Typography>
                      <Typography fontSize={15} sx={{ color: "#c2c3e0", mb: 1, wordBreak: "break-word" }}>
                        {fb.correctAns ?? "N/A"}
                      </Typography>
                      <Typography fontWeight={700} color="#ffd600" fontSize={15}>
                        Your Answer:
                      </Typography>
                      <Typography fontSize={15} sx={{ color: "#c2c3e0", mb: 1, wordBreak: "break-word" }}>
                        {fb.userAns ?? "N/A"}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2, borderColor: "#333" }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography fontWeight={700} fontSize={16} color="#1de9b6" sx={{ mb: 1 }}>
                        Feedback:
                      </Typography>
                      <Typography fontSize={15} sx={{ color: "#e0e0e0", fontStyle: "italic" }}>
                        {feedback}
                      </Typography>
                    </Box>
                    <Typography fontSize={15} fontWeight={700} color="#fff" mt={1}>
                      Rating:{" "}
                      <span style={{
                        color: rating >= 7 ? "#1de9b6" : "#ffd600",
                        fontWeight: "bold",
                        fontSize: 16
                      }}>
                        {rating ?? "N/A"} / 10
                      </span>
                    </Typography>
                    {suggestion && (
                      <>
                        <Divider sx={{ my: 2, borderColor: "#444" }} />
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <TipsAndUpdatesIcon sx={{ color: "#ffd600", mr: 1 }} />
                          <Typography fontWeight="bold" color="#ffd600" fontSize={15} mr={1}>
                            Suggestion:
                          </Typography>
                          <Typography fontSize={15} sx={{ color: "#c2c3e0" }}>
                            {suggestion}
                          </Typography>
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