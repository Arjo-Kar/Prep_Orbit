import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip
} from "@mui/material";
import {
  FitnessCenter as PracticeIcon,
  Dashboard as DashboardIcon,
  Send as SubmitIcon
} from "@mui/icons-material";

const PracticeWeakAreasPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [practiceSessionId, setPracticeSessionId] = useState(null);

  // Get number of questions from URL params, default to 5
  const numQuestions = parseInt(searchParams.get("numQuestions") || "5", 10);

  // Fetch weak area questions
  useEffect(() => {
    const fetchWeakAreaQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("User not authenticated");

        const res = await fetch(`http://localhost:8080/api/quiz/weak-areas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ numQuestions }), // Use dynamic number from URL params
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch weak area questions: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Weak areas response:", data);

        // Check if we have valid session data
        if (!data.sessionId || !data.questions || !Array.isArray(data.questions)) {
          throw new Error("Invalid practice session response. Please try again.");
        }

        setQuestions(data.questions);
        setPracticeSessionId(data.sessionId);
      } catch (err) {
        console.error("Error fetching weak area questions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeakAreaQuestions();
  }, [numQuestions]);

  const handleChange = (questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmit = async () => {
    // Check if user has answered all questions
    const unansweredQuestions = questions.filter((_, index) => !answers[index]);
    if (unansweredQuestions.length > 0) {
      const proceed = window.confirm(
        `You have ${unansweredQuestions.length} unanswered questions. Do you want to submit anyway?`
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");

      // Format answers according to backend expectation
      const formattedAnswers = questions.map((question, index) => {
        const userAnswer = answers[index];
        let answerLetter = '';

        if (userAnswer) {
          // Handle "A) Option text" format
          const match = userAnswer.match(/^([A-D])\)/);
          if (match) {
            answerLetter = match[1];
          }
          // Handle just "A", "B", "C", "D" format
          else if (["A", "B", "C", "D"].includes(userAnswer)) {
            answerLetter = userAnswer;
          }
          // Handle case where options don't start with letter format
          // Find which option index this is and convert to A, B, C, D
          else {
            const optionsList = question.options || question.choices || [];
            const optionIndex = optionsList.findIndex(opt => opt === userAnswer);
            if (optionIndex >= 0 && optionIndex < 4) {
              answerLetter = String.fromCharCode(65 + optionIndex); // 65 is 'A'
            }
          }
        }

        console.log(`Question ${index}: userAnswer="${userAnswer}", answerLetter="${answerLetter}"`);

        return {
          questionId: question.id,
          userAnswer: answerLetter
        };
      }).filter(answer => answer.userAnswer !== ''); // Only include answered questions

      const requestBody = { answers: formattedAnswers };

      console.log("Submitting practice answers:", requestBody);

      let submitUrl = `http://localhost:8080/api/quiz/${practiceSessionId}/submit`;

      const response = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Practice submit response status:", response.status);

      if (!response.ok) {
        let errorMessage = `Failed to submit practice quiz: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          console.log("Error response body:", errorData);

          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          } else if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch (parseError) {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          } catch {}
        }

        if (response.status === 403) {
          errorMessage = "Access denied. You may not be authorized to submit this practice quiz.";
        } else if (response.status === 404) {
          errorMessage = "Practice session not found. Please try refreshing the page.";
        } else if (response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Practice quiz submitted successfully:", data);

      // Redirect to QuizResultPage with result and questionCount
      navigate(`/quiz/${practiceSessionId}/results`, {
        state: { result: data, questionCount: questions.length }
      });

      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error submitting practice quiz:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading weak area questions...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<DashboardIcon />}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (questions.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <PracticeIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Practice Your Weak Areas
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            No weak area questions available. Complete some quizzes first to identify areas for improvement.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<DashboardIcon />}
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, backgroundColor: "primary.main", color: "white" }}>
        <Box display="flex" alignItems="center" mb={1}>
          <PracticeIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Practice Your Weak Areas
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          These questions are based on topics where you need improvement. Take your time and focus on understanding each concept.
        </Typography>
        <Box mt={2}>
          <Chip
            label={`${questions.length} Questions`}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              fontWeight: "bold"
            }}
          />
        </Box>
      </Paper>

      {/* Questions Section */}
      {questions.map((q, index) => (
        <Card key={index} elevation={2} sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Q{index + 1}: {q.questionText}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {q.options && q.options.length > 0 ? (
              <FormControl component="fieldset" sx={{ width: "100%" }}>
                <RadioGroup
                  value={answers[index] || ""}
                  onChange={(e) => handleChange(index, e.target.value)}
                >
                  {q.options.slice(0, 4).map((option, i) => (
                    <FormControlLabel
                      key={i}
                      value={option}
                      control={<Radio />}
                      label={
                        <Typography variant="body1" sx={{ ml: 1 }}>
                          {option}
                        </Typography>
                      }
                      sx={{
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                        transition: "background-color 0.2s"
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            ) : q.choices && q.choices.length > 0 ? (
              <FormControl component="fieldset" sx={{ width: "100%" }}>
                <RadioGroup
                  value={answers[index] || ""}
                  onChange={(e) => handleChange(index, e.target.value)}
                >
                  {q.choices.slice(0, 4).map((choice, i) => (
                    <FormControlLabel
                      key={i}
                      value={choice}
                      control={<Radio />}
                      label={
                        <Typography variant="body1" sx={{ ml: 1 }}>
                          {choice}
                        </Typography>
                      }
                      sx={{
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                        transition: "background-color 0.2s"
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            ) : (
              <Alert severity="warning">
                No options available for this question
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "center" }}>
        <Button
          variant="contained"
          size="large"
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SubmitIcon />}
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ minWidth: 200 }}
        >
          {submitting ? "Submitting..." : "Submit Practice Quiz"}
        </Button>

        <Button
          variant="outlined"
          size="large"
          startIcon={<DashboardIcon />}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default PracticeWeakAreasPage;