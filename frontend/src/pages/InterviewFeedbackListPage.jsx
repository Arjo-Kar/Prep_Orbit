import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Paper,
  Avatar
} from '@mui/material';
import {
  ArrowBack,
  Assessment,
  TrendingUp,
  Star,
  CheckCircle
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';

const NGROK_URL = ' https://87e0bd6486d1.ngrok-free.app';
const CURRENT_TIME = '2025-09-05 17:18:59';
const CURRENT_USER_FALLBACK = 'User';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#100827',
      paper: 'rgba(25, 25, 25, 0.8)',
    },
    primary: { main: '#7b1fa2' },
    text: { primary: '#ffffff', secondary: '#cccccc' },
  },
});

const GradientBox = styled(Box)(() => ({
  background: 'linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)',
  minHeight: '100vh',
  color: 'white',
}));

const FeedbackCard = styled(Card)(() => ({
  height: '100%',
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  borderRadius: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(123, 31, 162, 0.3)',
    border: '1px solid #7b1fa2',
  }
}));

function InterviewFeedbackListPage() {
  const navigate = useNavigate();

  // Data state
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);

  // Auth / resolution
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const [username, setUsername] = useState(CURRENT_USER_FALLBACK);
  const [authToken, setAuthToken] = useState(null);

  // Loading / errors
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsError, setStatsError] = useState('');
  const [authWarning, setAuthWarning] = useState('');

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  const getStoredUser = () => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = storedUser.id || localStorage.getItem('userId') || null;
    const usernameValue =
      storedUser.name ||
      storedUser.username ||
      localStorage.getItem('username') ||
      CURRENT_USER_FALLBACK;
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      null;
    return { userId, usernameValue, token };
  };

  const buildHeaders = () => ({
    'Authorization': `Bearer ${authToken}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  });

  // If in future you add "me" endpoints, flip these to those endpoints.
  const buildFeedbackListEndpoint = (userId) =>
    `${NGROK_URL}/api/interviews/feedback/user/${userId}`;
  const buildFeedbackStatsEndpoint = (userId) =>
    `${NGROK_URL}/api/interviews/feedback/user/${userId}/stats`;

  // Single definition of getScoreColor (removed duplicate)
  const getScoreColor = (score) => {
    if (score >= 9) return '#2e7d32';
    if (score >= 8) return '#4caf50';
    if (score >= 7) return '#8bc34a';
    if (score >= 6) return '#ff9800';
    if (score >= 4) return '#ff5722';
    return '#f44336';
  };

  // ------------------------------------------------------------
  // Resolve the authenticated user's true ID via /my-interviews
  // ------------------------------------------------------------
  const resolveUserContext = useCallback(async () => {
    const { userId, usernameValue, token } = getStoredUser();
    setUsername(usernameValue);
    setAuthToken(token);

    if (!token) {
      setAuthWarning('No auth token found in storage. Please log in again.');
      setLoading(false);
      setStatsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${NGROK_URL}/api/interviews/my-interviews`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
      });

      if (res.status === 401 || res.status === 403) {
        setAuthWarning('Session expired or unauthorized. Please re-login.');
        setLoading(false);
        setStatsLoading(false);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        let discoveredId = null;
        if (Array.isArray(data.interviews) && data.interviews.length > 0) {
          const first = data.interviews[0];
          discoveredId = first.userId || first.userID || first.userid || null;
        }
        if (!discoveredId && userId) discoveredId = userId;

        if (!discoveredId) {
          setResolvedUserId(null);
          setLoading(false);
          setStatsLoading(false);
          return;
        }

        setResolvedUserId(discoveredId);
        return;
      } else {
        if (userId) {
          setResolvedUserId(userId);
        } else {
          setAuthWarning('Could not resolve user ID. Please start an interview first.');
          setResolvedUserId(null);
        }
      }
    } catch (e) {
      console.warn('User context resolution failed:', e);
      if (userId) {
        setResolvedUserId(userId);
      } else {
        setAuthWarning('Network error resolving user. Please retry.');
      }
    }
  }, []);

  // ------------------------------------------------------------
  // Fetch feedback list
  // ------------------------------------------------------------
  const fetchFeedbacks = useCallback(async () => {
    if (!authToken) return;
    if (resolvedUserId == null) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const listUrl = buildFeedbackListEndpoint(resolvedUserId);
      const resp = await fetch(listUrl, {
        headers: buildHeaders(),
        credentials: 'include'
      });

      if (resp.status === 401) {
        setAuthWarning('Unauthorized. Please login again.');
        setFeedbacks([]);
        return;
      }
      if (resp.status === 403) {
        setError(`Forbidden (user mismatch). Resolved userId=${resolvedUserId}.`);
        setFeedbacks([]);
        return;
      }
      if (!resp.ok) {
        setError(`Failed to fetch feedbacks: ${resp.status}`);
        setFeedbacks([]);
        return;
      }

      const data = await resp.json();
      setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
    } catch (e) {
      setError(`Network error: ${e.message}`);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, resolvedUserId]);

  // ------------------------------------------------------------
  // Fetch stats
  // ------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    if (!authToken) return;
    if (resolvedUserId == null) {
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError('');

      const statsUrl = buildFeedbackStatsEndpoint(resolvedUserId);
      const resp = await fetch(statsUrl, {
        headers: buildHeaders(),
        credentials: 'include'
      });

      if (resp.status === 401) {
        setAuthWarning('Unauthorized. Please login again.');
        setStats(null);
        return;
      }
      if (resp.status === 403) {
        setStatsError(`Forbidden loading stats (user mismatch for ${resolvedUserId}).`);
        setStats(null);
        return;
      }
      if (!resp.ok) {
        setStatsError(`Failed to fetch stats: ${resp.status}`);
        setStats(null);
        return;
      }

      const data = await resp.json();
      setStats(data.stats || null);
    } catch (e) {
      setStatsError(`Network error: ${e.message}`);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [authToken, resolvedUserId]);

  // ------------------------------------------------------------
  // Effects
  // ------------------------------------------------------------
  useEffect(() => {
    resolveUserContext();
  }, [resolveUserContext]);

  useEffect(() => {
    if (authToken !== null) {
      fetchFeedbacks();
      fetchStats();
    }
  }, [authToken, resolvedUserId, fetchFeedbacks, fetchStats]);

  // ------------------------------------------------------------
  // UI helpers
  // ------------------------------------------------------------
  const renderLoading = () => (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress sx={{ color: '#7b1fa2' }} />
          </Box>
        </Container>
      </GradientBox>
    </ThemeProvider>
  );

  if (loading && !error && !authWarning) {
    return renderLoading();
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" mb={4}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/interview-prep')}
              sx={{ color: '#aaa', mr: 3 }}
            >
              Back
            </Button>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(to right, #a0d8ff, #ff80ab)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              📊 Interview Feedback History
            </Typography>
          </Box>

          {authWarning && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {authWarning}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {statsError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {statsError}
            </Alert>
          )}

          {/* Stats Overview */}
          {!statsLoading && stats && (
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #7b1fa2, #9c27b0)' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <Assessment sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {stats.totalFeedbacks}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Total Interviews
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #4caf50, #8bc34a)' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <Star sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {stats.averageOverallScore?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Average Score
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #2196F3, #64b5f6)' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <TrendingUp sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {stats.averageTechnicalScore?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Technical Score
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center', background: 'linear-gradient(135deg, #ff9800, #ffb74d)' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <CheckCircle sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {stats.averageCommunicationScore?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Communication
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Feedback List */}
          {feedbacks.length === 0 && !loading ? (
            <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: 'rgba(25, 25, 25, 0.8)' }}>
              <Typography variant="h6" sx={{ color: '#aaa', mb: 2 }}>
                {resolvedUserId == null
                  ? 'No user context yet (no interviews created).'
                  : 'No feedback available yet'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#777' }}>
                {resolvedUserId == null
                  ? 'Generate an interview to start receiving feedback.'
                  : 'Complete some interviews to see your feedback history here!'}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {feedbacks.map((feedback) => (
                <Grid item xs={12} sm={6} lg={4} key={feedback.id}>
                  <FeedbackCard onClick={() => navigate(`/feedback/${feedback.interviewId}`)}>
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Chip
                          label={`Score: ${feedback.overallScore}/10`}
                          sx={{
                            backgroundColor: getScoreColor(feedback.overallScore),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          {feedback.createdAt
                            ? new Date(feedback.createdAt).toLocaleDateString()
                            : ''}
                        </Typography>
                      </Box>

                      <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: 'white' }}>
                        Interview #{feedback.interviewId}
                      </Typography>

                      <Stack spacing={1} mb={3}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Technical:
                          </Typography>
                          <Typography variant="body2" sx={{ color: getScoreColor(feedback.technicalScore), fontWeight: 'bold' }}>
                            {feedback.technicalScore}/10
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Communication:
                          </Typography>
                          <Typography variant="body2" sx={{ color: getScoreColor(feedback.communicationScore), fontWeight: 'bold' }}>
                            {feedback.communicationScore}/10
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Problem Solving:
                          </Typography>
                          <Typography variant="body2" sx={{ color: getScoreColor(feedback.problemSolvingScore), fontWeight: 'bold' }}>
                            {feedback.problemSolvingScore}/10
                          </Typography>
                        </Box>
                      </Stack>

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<Assessment />}
                        sx={{
                          background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #9c27b0, #ff4081)',
                          }
                        }}
                      >
                        View Detailed Feedback
                      </Button>
                    </CardContent>
                  </FeedbackCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </GradientBox>
    </ThemeProvider>
  );
}

export default InterviewFeedbackListPage;