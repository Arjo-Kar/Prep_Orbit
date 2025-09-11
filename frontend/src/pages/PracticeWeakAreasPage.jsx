import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Avatar,
  LinearProgress,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Psychology as Brain,
  TrendingUp as Improve,
  CheckCircle,
  Warning,
  ArrowBack,
} from "@mui/icons-material";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";

// Dark theme matching other pages
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
          padding: "12px 24px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(45, 45, 45, 0.5)",
          backdropFilter: "blur(10px)",
        },
      },
    },
  },
});

// Styled components
const GradientBox = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)",
  minHeight: "100vh",
  color: "white",
  width: "100%",
  position: "relative",
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(90deg, #1a0f3d 0%, #23164a 50%, #2d1a54 100%)",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
  border: "1px solid rgba(126, 87, 194, 0.5)",
  marginBottom: theme.spacing(4),
}));

const QuestionCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(180deg, rgba(28, 28, 28, 0.95) 0%, rgba(16, 16, 16, 0.95) 100%)",
  border: "1px solid #444",
  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
    border: "1px solid #4caf50",
  },
}));

const StyledRadio = styled(Radio)(({ theme }) => ({
  color: "#666",
  "&.Mui-checked": {
    color: "#4caf50",
  },
  "&:hover": {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
}));

const OptionLabel = styled(FormControlLabel)(({ theme }) => ({
  margin: 0,
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #444",
  transition: "all 0.2s ease",
  backgroundColor: "rgba(51, 51, 51, 0.5)",
  "&:hover": {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    border: "1px solid #4caf50",
  },
  "& .MuiFormControlLabel-label": {
    color: "#ccc",
    fontSize: "1rem",
    lineHeight: 1.5,
    flex: 1,
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(45deg, #4caf50, #8bc34a)",
  height: "48px",
  fontSize: "1.1rem",
  "&:hover": {
    background: "linear-gradient(45deg, #66bb6a, #aed581)",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 25px rgba(76, 175, 80, 0.4)",
  },
  "&:disabled": {
    background: "linear-gradient(45deg, #666, #888)",
  },
  transition: "all 0.3s ease",
}));

const BackButton = styled(Button)(({ theme }) => ({
  position: "absolute",
  top: "20px",
  left: "20px",
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  color: "white",
  zIndex: 1001,
  "&:hover": {
    background: "rgba(123, 31, 162, 0.3)",
    transform: "translateX(-5px)",
  },
  transition: "all 0.3s ease",
}));

const PracticeContainer = styled(Container)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: "none !important",
  margin: "0 auto",
  padding: "20px",
}));

const LoadingCard = styled(Card)(({ theme }) => ({
  background: "linear-gradient(180deg, rgba(28, 28, 28, 0.95) 0%, rgba(16, 16, 16, 0.95) 100%)",
  border: "1px solid #444",
  minHeight: "300px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const PracticeWeakAreasPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [practiceSessionId, setPracticeSessionId] = useState(null);

  // Override global styles for this page
  React.useEffect(() => {
    const originalRootStyle = document.getElementById('root')?.style.cssText;
    const originalBodyStyle = document.body.style.cssText;

    const root = document.getElementById('root');
    if (root) {
      root.style.maxWidth = 'none';
      root.style.padding = '0';
      root.style.margin = '0';
      root.style.textAlign = 'initial';
      root.style.height = '100vh';
      root.style.width = '100vw';
    }

    document.body.style.display = 'block';
    document.body.style.placeItems = 'initial';

    return () => {
      if (root && originalRootStyle !== undefined) {
        root.style.cssText = originalRootStyle;
      }
      if (originalBodyStyle !== undefined) {
        document.body.style.cssText = originalBodyStyle;
      }
    };
  }, []);

  const numQuestions = parseInt(searchParams.get("numQuestions") || "5", 10);

  // Fetch weak area questions
  useEffect(() => {
    const fetchWeakAreaQuestions = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("User not authenticated");

        const res = await fetch(`http://localhost:8080/api/quiz/weak-areas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ numQuestions }),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch weak area questions: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Weak areas response:", data);

        let questionsList = [];
        let sessionId = null;

        if (Array.isArray(data)) {
          questionsList = data;
        } else if (data.questions && Array.isArray(data.questions)) {
          questionsList = data.questions;
          sessionId = data.sessionId;
        } else if (data.sessionId && data.questions) {
          questionsList = data.questions;
          sessionId = data.sessionId;
        }

        setQuestions(questionsList);
        setPracticeSessionId(sessionId);
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
    const unansweredQuestions = questions.filter((_, index) => !answers[index]);
    if (unansweredQuestions.length > 0) {
      const proceed = window.confirm(
        `You have ${unansweredQuestions.length} unanswered questions. Do you want to submit anyway?`
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("User not authenticated");

      const formattedAnswers = questions.map((question, index) => {
        const userAnswer = answers[index];
        let answerLetter = '';
        if (userAnswer) {
          const match = userAnswer.match(/^([A-D])\)/);
          if (match) {
            answerLetter = match[1];
          } else if (["A", "B", "C", "D"].includes(userAnswer)) {
            answerLetter = userAnswer;
          }
        }
        return {
          questionId: question.id,
          userAnswer: answerLetter
        };
      }).filter(answer => answer.userAnswer !== '');

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

      if (!response.ok) {
        let errorMessage = `Failed to submit practice quiz: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
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

      navigate(`/quiz/${practiceSessionId}/results`, {
        state: { result: data, questionCount: questions.length }
      });

      setError(null);
    } catch (err) {
      console.error("Error submitting practice quiz:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    const answeredCount = Object.keys(answers).length;
    return (answeredCount / questions.length) * 100;
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        {/* Back Button */}
        <BackButton
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </BackButton>

        <PracticeContainer maxWidth="xl" sx={{ py: 4 }}>
          {loading ? (
            <LoadingCard>
              <Box textAlign="center">
                <CircularProgress sx={{ color: "#4caf50", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "#ccc" }}>
                  Loading weak area questions...
                </Typography>
              </Box>
            </LoadingCard>
          ) : error ? (
            <Card sx={{
              background: "linear-gradient(180deg, rgba(28, 28, 28, 0.95) 0%, rgba(16, 16, 16, 0.95) 100%)",
              border: "1px solid #f44336"
            }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Avatar sx={{
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 2,
                  background: "linear-gradient(135deg, #f44336, #d32f2f)"
                }}>
                  <Warning sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" sx={{ color: "#f44336", mb: 2 }}>
                  Error Loading Questions
                </Typography>
                <Typography variant="body1" sx={{ color: "#ccc", mb: 3 }}>
                  {error}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => window.location.reload()}
                  sx={{ mr: 2 }}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/dashboard")}
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : questions.length === 0 ? (
            <Card sx={{
              background: "linear-gradient(180deg, rgba(28, 28, 28, 0.95) 0%, rgba(16, 16, 16, 0.95) 100%)",
              border: "1px solid #444"
            }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Avatar sx={{
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 2,
                  background: "linear-gradient(135deg, #ff9800, #ffc107)"
                }}>
                  <Brain sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" sx={{ color: "white", mb: 2 }}>
                  No Weak Areas Found
                </Typography>
                <Typography variant="body1" sx={{ color: "#ccc", mb: 3 }}>
                  No weak area questions available. Complete some quizzes first to identify areas for improvement.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/dashboard")}
                  sx={{
                    background: "linear-gradient(45deg, #7b1fa2, #f50057)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #9c27b0, #ff4081)",
                    },
                  }}
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header */}
              <HeaderCard>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={3}>
                      <Avatar sx={{
                        width: 80,
                        height: 80,
                        background: "linear-gradient(135deg, #4caf50, #8bc34a)",
                        boxShadow: "0 4px 20px rgba(76, 175, 80, 0.4)",
                      }}>
                        <Improve sx={{ fontSize: 40 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h3" component="h1" fontWeight="bold" sx={{
                          background: "linear-gradient(to right, #4caf50, #8bc34a)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          mb: 1,
                        }}>
                          Practice Your Weak Areas
                        </Typography>
                        <Typography variant="h6" sx={{ color: "#aaa" }}>
                          These {questions.length} questions are based on topics where you need improvement
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Progress Bar */}
                  <Box mt={3}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" sx={{ color: "#aaa" }}>
                        Progress: {Object.keys(answers).length} of {questions.length} answered
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#4caf50", fontWeight: 600 }}>
                        {Math.round(getProgressPercentage())}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressPercentage()}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#333",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#4caf50",
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </HeaderCard>

              {/* Error Message */}
              {error && (
                <Alert severity="error" variant="filled" sx={{
                  mb: 3,
                  borderRadius: "12px",
                  background: "linear-gradient(45deg, #f44336, #d32f2f)",
                }}>
                  {error}
                </Alert>
              )}

              {/* Questions */}
              <Stack spacing={4} mb={4}>
                {questions.map((q, index) => (
                  <QuestionCard key={index}>
                    <CardContent sx={{ p: 4 }}>
                      {/* Question Header */}
                      <Box
                        sx={{
                          background: "linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.1))",
                          borderRadius: "12px",
                          p: 3,
                          mb: 3,
                          border: "1px solid rgba(76, 175, 80, 0.3)",
                        }}
                      >
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              background: "linear-gradient(135deg, #4caf50, #8bc34a)",
                              mr: 2,
                              fontSize: "0.9rem",
                              fontWeight: "bold",
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: "white" }}>
                            Question {index + 1}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{
                            color: "#e0e0e0",
                            lineHeight: 1.6,
                            fontSize: "1.1rem",
                            pl: 5,
                          }}
                        >
                          {q.questionText}
                        </Typography>
                      </Box>

                      {/* Answer Options */}
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#aaa",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            letterSpacing: 1,
                            mb: 2,
                          }}
                        >
                          Choose your answer:
                        </Typography>
                        <RadioGroup
                          value={answers[index] || ""}
                          onChange={(e) => handleChange(index, e.target.value)}
                        >
                          <Stack spacing={2}>
                            {/* Handle both options and choices properties */}
                            {(q.options || q.choices || []).slice(0, 4).map((option, i) => (
                              <OptionLabel
                                key={i}
                                value={option}
                                control={<StyledRadio />}
                                label={option}
                              />
                            ))}
                            {(!q.options && !q.choices) && (
                              <Box
                                sx={{
                                  p: 3,
                                  background: "rgba(255, 193, 7, 0.1)",
                                  border: "1px solid rgba(255, 193, 7, 0.3)",
                                  borderRadius: "12px",
                                  textAlign: "center",
                                }}
                              >
                                <Warning sx={{ color: "#ffc107", mb: 1 }} />
                                <Typography sx={{ color: "#ffc107", fontWeight: 600 }}>
                                  No options available for this question
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </RadioGroup>
                      </Box>
                    </CardContent>
                  </QuestionCard>
                ))}
              </Stack>

              {/* Submit Section */}
              <Card sx={{
                background: "linear-gradient(180deg, rgba(28, 28, 28, 0.95) 0%, rgba(16, 16, 16, 0.95) 100%)",
                border: "1px solid #444",
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box textAlign="center">
                    <Typography variant="h6" sx={{ color: "white", mb: 3 }}>
                      Ready to submit your practice quiz?
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                      <GradientButton
                        onClick={handleSubmit}
                        disabled={submitting}
                        size="large"
                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                      >
                        {submitting ? "Submitting..." : "Submit Practice Quiz"}
                      </GradientButton>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate("/dashboard")}
                        sx={{
                          borderColor: "#666",
                          color: "#ccc",
                          "&:hover": {
                            borderColor: "#7b1fa2",
                            backgroundColor: "rgba(123, 31, 162, 0.1)",
                          },
                        }}
                      >
                        Back to Dashboard
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </PracticeContainer>
      </GradientBox>
    </ThemeProvider>
  );
};

export default PracticeWeakAreasPage;