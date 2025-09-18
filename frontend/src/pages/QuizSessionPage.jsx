import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Schedule as Clock,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';

// Dark theme matching the Dashboard
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#100827',
      paper: 'rgba(25, 25, 25, 0.8)',
    },
    primary: {
      main: '#7b1fa2',
    },
    secondary: {
      main: '#f50057',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(45, 45, 45, 0.5)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
  },
});

// Styled components
const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)',
  minHeight: '100vh',
  color: 'white',
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(90deg, #1a0f3d 0%, #23164a 50%, #2d1a54 100%)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(126, 87, 194, 0.5)',
  marginBottom: theme.spacing(3),
}));

const QuestionCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  marginBottom: theme.spacing(3),
  transition: 'all 0.3s ease',
  '&:hover': {
    border: '1px solid #7b1fa2',
    boxShadow: '0 4px 20px rgba(123, 31, 162, 0.3)',
  }
}));

const ProgressCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  position: 'sticky',
  top: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  height: '56px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 600,
  background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
  '&:hover': {
    background: 'linear-gradient(45deg, #9c27b0, #ff4081)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(123, 31, 162, 0.4)',
  },
  '&:disabled': {
    background: '#333',
    color: '#666',
  }
}));

const BackButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  borderColor: '#666',
  color: '#ccc',
  '&:hover': {
    borderColor: '#7b1fa2',
    backgroundColor: '#7b1fa220',
  }
}));

const QuizSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState({ questions: [] });
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  // Fetch quiz questions
  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("User not authenticated");

        const res = await fetch(`http://localhost:8080/api/quiz/${sessionId}/questions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        let questions = [];
        if (Array.isArray(data)) {
          questions = data;
        } else if (data.questions && Array.isArray(data.questions)) {
          questions = data.questions;
        }

        setQuizData({ questions });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizQuestions();
  }, [sessionId]);

  // Store answers by questionId
  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Calculate progress
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quizData.questions.length;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Submit quiz
  const handleSubmit = async () => {
    const unansweredQuestions = quizData.questions.filter((q) => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      setConfirmDialog(true);
      return;
    }
    performSubmit();
  };

  const performSubmit = async () => {
    setConfirmDialog(false);
    setSubmitting(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("User not authenticated");

      // Format answers for backend: send only letter value
      const formattedAnswers = quizData.questions.map((question) => ({
        questionId: question.id,
        userAnswer: answers[question.id] || ''
      }));

      const requestBody = { answers: formattedAnswers };

      const response = await fetch(`http://localhost:8080/api/quiz/${sessionId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `Failed to submit quiz: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          } else if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += ` - ${errorText}`;
            }
          } catch {}
        }
        if (response.status === 403) {
          errorMessage = "Access denied. You may not be authorized to submit this quiz, or your session may have expired. Please try logging in again.";
        } else if (response.status === 404) {
          errorMessage = "Quiz session not found. It may have been deleted or expired.";
        } else if (response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        }
        throw new Error(errorMessage);
      }

      const resultData = await response.json();

      // Pass result data to the result page via navigation state
      navigate(`/quiz/${sessionId}/results`, {
        state: {
          result: resultData,
          questionCount: quizData.questions.length
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const unansweredCount = quizData.questions.filter((q) => !answers[q.id]).length;

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <GradientBox>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
              <CircularProgress size={60} sx={{ color: '#7b1fa2', mb: 3 }} />
              <Typography variant="h6" sx={{ color: '#aaa' }}>
                Loading quiz questions...
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                Please wait while we prepare your quiz
              </Typography>
            </Box>
          </Container>
        </GradientBox>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={darkTheme}>
        <GradientBox>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Alert
              severity="error"
              variant="filled"
              sx={{
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                mb: 3,
              }}
              icon={<WarningIcon />}
            >
              <Typography variant="h6" gutterBottom>
                Quiz Loading Error
              </Typography>
              {error}
            </Alert>
            <BackButton
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </BackButton>
          </Container>
        </GradientBox>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header */}
          <HeaderCard>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box display="flex" alignItems="center" gap={3} flexGrow={1}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      background: 'linear-gradient(135deg, #7b1fa2, #f50057)',
                      boxShadow: '0 4px 20px rgba(123, 31, 162, 0.4)',
                    }}
                  >
                    <QuizIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h4"
                      component="h1"
                      fontWeight="bold"
                      sx={{
                        background: 'linear-gradient(to right, #a0d8ff, #ff80ab)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      Quiz Session
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#aaa' }}>
                      Session ID: {sessionId}
                    </Typography>
                  </Box>
                </Box>
                <BackButton
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate('/dashboard')}
                >
                  Back to Dashboard
                </BackButton>
              </Box>
            </CardContent>
          </HeaderCard>

          {/* Progress Card */}
          <ProgressCard>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                  Progress
                </Typography>
                <Chip
                  icon={<CheckIcon />}
                  label={`${answeredCount} of ${totalQuestions} answered`}
                  sx={{
                    background: answeredCount === totalQuestions
                      ? 'linear-gradient(45deg, #4caf50, #8bc34a)'
                      : 'linear-gradient(45deg, #ff9800, #ffc107)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#333',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
                    borderRadius: 4,
                  }
                }}
              />
              <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>
                {Math.round(progressPercentage)}% complete
              </Typography>
            </CardContent>
          </ProgressCard>

          {/* Error Display */}
          {error && (
            <Alert
              severity="error"
              variant="filled"
              sx={{
                mb: 3,
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #f44336, #d32f2f)',
              }}
            >
              {error}
            </Alert>
          )}

          {/* Questions */}
          {quizData.questions.length === 0 ? (
            <Card sx={{ background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)', border: '1px solid #444' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, background: 'linear-gradient(135deg, #666, #999)' }}>
                  <HelpIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" sx={{ color: '#aaa', mb: 1 }}>
                  No Questions Available
                </Typography>
                <Typography variant="body2" sx={{ color: '#777' }}>
                  No questions are available for this quiz session.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              {quizData.questions.map((q, index) => (
                <QuestionCard key={q.id}>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" alignItems="start" gap={2} mb={3}>
                      <Chip
                        label={`Q${index + 1}`}
                        sx={{
                          background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
                          color: 'white',
                          fontWeight: 'bold',
                          minWidth: '48px'
                        }}
                      />
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          color: 'white',
                          fontWeight: 500,
                          lineHeight: 1.4,
                          flexGrow: 1
                        }}
                      >
                        {q.questionText}
                      </Typography>
                      {answers[q.id] && (
                        <CheckIcon sx={{ color: '#4caf50', fontSize: 28 }} />
                      )}
                    </Box>

                    <Divider sx={{ my: 3, borderColor: '#444' }} />

                    {q.choices && q.choices.length > 0 ? (
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          name={`question-${q.id}`}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleChange(q.id, e.target.value)}
                        >
                          <Stack spacing={1}>
                            {q.choices.map((choice, i) => (
                              <Paper
                                key={i}
                                sx={{
                                  p: 2,
                                  backgroundColor: answers[q.id] === String.fromCharCode(65 + i) ? '#7b1fa230' : '#2a2a2a',
                                  border: answers[q.id] === String.fromCharCode(65 + i) ? '2px solid #7b1fa2' : '1px solid #444',
                                  borderRadius: '12px',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    backgroundColor: '#333',
                                    borderColor: '#7b1fa2',
                                  }
                                }}
                              >
                                <FormControlLabel
                                  value={String.fromCharCode(65 + i)} // 'A', 'B', 'C', 'D' (value sent to backend)
                                  control={
                                    <Radio
                                      sx={{
                                        color: '#666',
                                        '&.Mui-checked': {
                                          color: '#7b1fa2',
                                        }
                                      }}
                                    />
                                  }
                                  label={
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        color: 'white',
                                        fontWeight: answers[q.id] === String.fromCharCode(65 + i) ? 600 : 400
                                      }}
                                    >
                                      {choice}
                                    </Typography>
                                  }
                                  sx={{ margin: 0, width: '100%' }}
                                />
                              </Paper>
                            ))}
                          </Stack>
                        </RadioGroup>
                      </FormControl>
                    ) : (
                      <Alert
                        severity="warning"
                        variant="outlined"
                        sx={{
                          borderColor: '#ff9800',
                          color: '#ff9800',
                          backgroundColor: '#ff980020',
                        }}
                      >
                        No options available for this question
                      </Alert>
                    )}
                  </CardContent>
                </QuestionCard>
              ))}

              {/* Submit Section */}
              <Card sx={{ background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)', border: '1px solid #444' }}>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', textAlign: 'center' }}>
                      Ready to Submit?
                    </Typography>

                    {unansweredCount > 0 && (
                      <Alert
                        severity="warning"
                        variant="outlined"
                        sx={{
                          borderColor: '#ff9800',
                          color: '#ff9800',
                          backgroundColor: '#ff980020',
                          width: '100%',
                          maxWidth: '500px'
                        }}
                        icon={<WarningIcon />}
                      >
                        You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}
                      </Alert>
                    )}

                    <SubmitButton
                      variant="contained"
                      size="large"
                      startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                      onClick={handleSubmit}
                      disabled={submitting}
                      sx={{ minWidth: '200px' }}
                    >
                      {submitting ? "Submitting..." : "Submit Quiz"}
                    </SubmitButton>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}

          {/* Confirmation Dialog */}
          <Dialog
            open={confirmDialog}
            onClose={() => setConfirmDialog(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
                border: '1px solid #444',
                borderRadius: '16px',
              }
            }}
          >
            <DialogTitle sx={{ color: 'white', fontWeight: 'bold' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <WarningIcon sx={{ color: '#ff9800' }} />
                Confirm Submission
              </Stack>
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: '#ccc', fontSize: '1rem' }}>
                You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}.
                Are you sure you want to submit the quiz anyway? Unanswered questions will be marked as incorrect.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button
                onClick={() => setConfirmDialog(false)}
                variant="outlined"
                sx={{
                  borderColor: '#666',
                  color: '#ccc',
                  '&:hover': {
                    borderColor: '#7b1fa2',
                    backgroundColor: '#7b1fa220',
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={performSubmit}
                variant="contained"
                sx={{
                  background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #9c27b0, #ff4081)',
                  }
                }}
              >
                Submit Anyway
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </GradientBox>
    </ThemeProvider>
  );
};

export default QuizSessionPage;