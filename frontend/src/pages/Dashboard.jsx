import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Stack,
  Divider
} from '@mui/material';
import {
  Code as CodeIcon,
  CalendarToday as Calendar,
  TrendingUp,
  EmojiEvents as Award,
  Schedule as Clock,
  Psychology as Brain,
  PlayArrow as Play,
  Refresh as RefreshCw,
  Assessment as TrendingUpIcon,
  Chat as ChatIcon,
  WorkOutline as InterviewIcon,
  Terminal,
  Mic as MicIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import CodingChallengeAPI from '../api/CodingChallengeAPI';

// Dark theme to match the CodingChallengePage
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

// Styled components matching the CodingChallengePage aesthetic
const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)',
  minHeight: '100vh',
  color: 'white',
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    border: '1px solid #7b1fa2',
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  height: '56px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
  }
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(90deg, #1a0f3d 0%, #23164a 50%, #2d1a54 100%)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(126, 87, 194, 0.5)',
  marginBottom: theme.spacing(4),
}));

const DailyChallengeCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  overflow: 'hidden',
}));

const QuizCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
}));

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Existing state
  const [topics, setTopics] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [numWeakQuestions, setNumWeakQuestions] = useState(5);
  const [message, setMessage] = useState("");

  // New coding challenge state
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzesTaken: 0,
    codingChallengesSolved: 0,
    streak: 0,
    rank: '',
    weeklyTarget: 7,
    averageScore: 0
  });

  // Get current user from localStorage, fallback to "Guest"
  const getCurrentUsername = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.name || storedUser.username || "Guest";
  };
  const username = getCurrentUsername();

  // Pre-fill form if URL has query params
  useEffect(() => {
    const urlTopics = searchParams.get("topics");
    const urlNumQuestions = searchParams.get("numQuestions");

    if (urlTopics) setTopics(urlTopics);
    if (urlNumQuestions) setNumQuestions(parseInt(urlNumQuestions, 10));
  }, [searchParams]);

  // Load daily challenge on component mount
  useEffect(() => {
    loadDailyChallenge();
  }, []);

  // Load daily coding challenge, with error handling and id check
  const loadDailyChallenge = async () => {
    try {
      setLoadingChallenge(true);
      setMessage("");
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setMessage("Authentication token not found. Please log in.");
        setDailyChallenge(null);
        return;
      }
      const challenge = await CodingChallengeAPI.generateChallenge(['arrays', 'strings'], 'medium', authToken);
      if (!challenge || !challenge.id) {
        setMessage("Failed to load daily challenge. Please try again later.");
        setDailyChallenge(null);
        return;
      }
      setDailyChallenge(challenge);
    } catch (error) {
      setMessage('Error loading daily challenge: ' + (error.message || error));
      setDailyChallenge(null);
    } finally {
      setLoadingChallenge(false);
    }
  };

  // Fetch wrapper for secured endpoints
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Authentication token not found. Please log in.");

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }

    return res.json();
  };

  // Start Quiz API call
  const startQuiz = async (topicsArray, numQuestions) => {
    return fetchWithAuth("http://localhost:8080/api/quiz/start", {
      method: "POST",
      body: JSON.stringify({ topics: topicsArray, numQuestions }),
    });
  };

  // Handle Start Quiz button
  const handleStartQuiz = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const topicList = topics
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (topicList.length === 0) {
        setMessage("Please enter at least one topic.");
        return;
      }

      const response = await startQuiz(topicList, parseInt(numQuestions, 10));
      navigate(`/quiz/${response.sessionId}`);
    } catch (error) {
      console.error("Start quiz error:", error);
      setMessage(error.message || "Failed to start quiz.");
    }
  };

  // Handle Practice Weak Areas button
  const handlePracticeWeakAreas = () => {
    navigate(`/practice-weak-areas?numQuestions=${numWeakQuestions}`);
  };

  // Handle coding challenge navigation (use id param for route)
  const startCodingChallenge = (challengeId = null) => {
    if (challengeId) {
      navigate(`/coding-challenge/${challengeId}`);
    } else {
      navigate('/coding-challenge');
    }
  };

  const StatCard = ({ title, value, icon, color, gradient }) => (
    <StatsCard>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ color: 'white' }}>
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              background: gradient || `linear-gradient(135deg, ${color}, ${color}90)`,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </StatsCard>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <HeaderCard>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      background: 'linear-gradient(135deg, #7b1fa2, #f50057)',
                      boxShadow: '0 4px 20px rgba(123, 31, 162, 0.4)',
                    }}
                  >
                    <Brain sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h3"
                      component="h1"
                      fontWeight="bold"
                      sx={{
                        background: 'linear-gradient(to right, #a0d8ff, #ff80ab)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                       Welcome back, {username}! 👨‍💻
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#aaa' }}>
                      Ready for today's challenge? Choose your path to success.
                    </Typography>
                  </Box>
                </Box>
                <Box
                  component="img"
                  src="https://avatars.githubusercontent.com/u/9919?v=4"
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    border: '3px solid #7b1fa2',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  }}
                  alt="avatar"
                />
              </Box>
            </CardContent>
          </HeaderCard>

          {/* Error Message */}
          {message && (
            <Alert
              severity="error"
              variant="filled"
              sx={{
                mb: 3,
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #f44336, #d32f2f)',
              }}
            >
              {message}
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Quizzes Taken"
                value={stats.totalQuizzesTaken}
                icon={<Brain />}
                gradient="linear-gradient(135deg, #2196F3, #21CBF3)"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Coding Problems"
                value={stats.codingChallengesSolved}
                icon={<CodeIcon />}
                gradient="linear-gradient(135deg, #4caf50, #8bc34a)"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Current Streak"
                value={`${stats.streak} days`}
                icon={<TrendingUp />}
                gradient="linear-gradient(135deg, #ff9800, #ffc107)"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Average Score"
                value={`${stats.averageScore}%`}
                icon={<Award />}
                gradient="linear-gradient(135deg, #e91e63, #f06292)"
              />
            </Grid>
          </Grid>

          {/* Main Content Grid */}
          <Grid container spacing={3} mb={4}>
            {/* Daily Coding Challenge */}
            <Grid item xs={12} lg={4}>
              <DailyChallengeCard>
                <Box sx={{ background: 'linear-gradient(135deg, #4caf50, #8bc34a)', p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Calendar />
                    <Typography variant="h6" fontWeight="bold">
                      Today's Coding Challenge
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {loadingChallenge ? (
                    <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                      <CircularProgress sx={{ color: '#4caf50', mb: 2 }} />
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        Loading today's challenge...
                      </Typography>
                    </Box>
                  ) : dailyChallenge ? (
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                        {dailyChallenge.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ccc', mb: 3, lineHeight: 1.6 }}>
                        {dailyChallenge.description ?
                          dailyChallenge.description.substring(0, 150) + '...' :
                          'A new coding challenge awaits!'
                        }
                      </Typography>

                      <Stack direction="row" spacing={2} mb={3}>
                        <Paper sx={{ px: 1.5, py: 0.75, borderRadius: '8px', backgroundColor: '#333', border: '1px solid #555' }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Clock sx={{ fontSize: 16, color: '#90caf9' }} />
                            <Typography variant="body2" sx={{ color: '#ccc' }}>
                              {dailyChallenge.timeLimitMs || '1000'}ms
                            </Typography>
                          </Stack>
                        </Paper>
                        <Paper sx={{ px: 1.5, py: 0.75, borderRadius: '8px', backgroundColor: '#333', border: '1px solid #555' }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Brain sx={{ fontSize: 16, color: '#ce93d8' }} />
                            <Typography variant="body2" sx={{ color: '#ccc', textTransform: 'capitalize' }}>
                              {dailyChallenge.difficulty || 'Medium'}
                            </Typography>
                          </Stack>
                        </Paper>
                      </Stack>

                      <Stack spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={<Play />}
                          fullWidth
                          onClick={() => dailyChallenge && dailyChallenge.id && startCodingChallenge(dailyChallenge.id)}
                          disabled={!dailyChallenge || !dailyChallenge.id}
                          sx={{
                            py: 1.5,
                            background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #66bb6a, #aed581)',
                            }
                          }}
                        >
                          Start Daily Challenge
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<RefreshCw />}
                          fullWidth
                          onClick={loadDailyChallenge}
                          sx={{
                            borderColor: '#666',
                            color: '#ccc',
                            '&:hover': {
                              borderColor: '#7b1fa2',
                              backgroundColor: '#7b1fa220',
                            }
                          }}
                        >
                          New Challenge
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Typography sx={{ color: '#aaa', mb: 2 }}>
                        No daily challenge available
                      </Typography>
                      <Button
                        variant="text"
                        size="small"
                        onClick={loadDailyChallenge}
                        sx={{ color: '#7b1fa2' }}
                      >
                        Try loading again
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </DailyChallengeCard>
            </Grid>

            {/* Start Quiz */}
            <Grid item xs={12} lg={4}>
              <QuizCard>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                    Start Knowledge Quiz
                  </Typography>
                  <Box component="form" onSubmit={handleStartQuiz} sx={{ mt: 2 }}>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Topics (comma-separated)"
                        placeholder="e.g., java, spring boot, algorithms"
                        value={topics}
                        onChange={(e) => setTopics(e.target.value)}
                        required
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#333',
                            '& fieldset': {
                              borderColor: '#555',
                            },
                            '&:hover fieldset': {
                              borderColor: '#7b1fa2',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#7b1fa2',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#aaa',
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white',
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Number of Questions"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(e.target.value)}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#333',
                            '& fieldset': {
                              borderColor: '#555',
                            },
                            '&:hover fieldset': {
                              borderColor: '#7b1fa2',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#7b1fa2',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#aaa',
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white',
                          },
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        sx={{
                          py: 1.5,
                          background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #9c27b0, #ff4081)',
                          }
                        }}
                      >
                        Start Quiz
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </QuizCard>
            </Grid>

            {/* Practice Weak Areas */}
            <Grid item xs={12} lg={4}>
              <QuizCard>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                    Practice Weak Areas
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc', mb: 3, lineHeight: 1.6 }}>
                    Focus on topics you've previously struggled with.
                  </Typography>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Number of Questions"
                      type="number"
                      inputProps={{ min: 1 }}
                      value={numWeakQuestions}
                      onChange={(e) => setNumWeakQuestions(e.target.value)}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#333',
                          '& fieldset': {
                            borderColor: '#555',
                          },
                          '&:hover fieldset': {
                            borderColor: '#4caf50',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#4caf50',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#aaa',
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'white',
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handlePracticeWeakAreas}
                      sx={{
                        py: 1.5,
                        background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #66bb6a, #aed581)',
                        }
                      }}
                    >
                      Start Practice Session
                    </Button>
                  </Stack>
                </CardContent>
              </QuizCard>
            </Grid>
          </Grid>

          {/* Quick Actions */}
          <Card sx={{ mb: 4, background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)', border: '1px solid #444' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'white', mb: 3 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} lg={3}>
                  <ActionButton
                    variant="contained"
                    startIcon={<CodeIcon />}
                    fullWidth
                    onClick={() => startCodingChallenge()}
                    sx={{
                      background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #42a5f5, #4fc3f7)',
                      }
                    }}
                  >
                    Random Coding Challenge
                  </ActionButton>
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <ActionButton
                    variant="contained"
                    startIcon={<TrendingUpIcon />}
                    fullWidth
                    onClick={() => navigate("/report/weaknesses")}
                    sx={{
                      background: 'linear-gradient(45deg, #9c27b0, #ab47bc)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #ba68c8, #ce93d8)',
                      }
                    }}
                  >
                    View Reports
                  </ActionButton>
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <ActionButton
                    variant="contained"
                    startIcon={<ChatIcon />}
                    fullWidth
                    onClick={() => navigate("/gemini")}
                    sx={{
                      background: 'linear-gradient(45deg, #ff9800, #ffc107)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #ffb74d, #ffcc80)',
                      }
                    }}
                  >
                    Chat with AI
                  </ActionButton>
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                  <ActionButton
                    variant="contained"
                    startIcon={<MicIcon />}
                    fullWidth
                    onClick={() => navigate("/interview-prep")}
                    sx={{
                      background: 'linear-gradient(45deg, #607d8b, #78909c)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #90a4ae, #b0bec5)',
                      }
                    }}
                  >
                    Interview Prep
                  </ActionButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card sx={{ background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)', border: '1px solid #444' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                Recent Activity
              </Typography>
              <Divider sx={{ my: 2, borderColor: '#444' }} />
              <Box textAlign="center" py={6}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, background: 'linear-gradient(135deg, #666, #999)' }}>
                  <Terminal sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" sx={{ color: '#aaa', mb: 1 }}>
                  Your recent activity will appear here
                </Typography>
                <Typography variant="body2" sx={{ color: '#777' }}>
                  Start solving challenges and taking quizzes to see your progress!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </GradientBox>
    </ThemeProvider>
  );
}

export default Dashboard;