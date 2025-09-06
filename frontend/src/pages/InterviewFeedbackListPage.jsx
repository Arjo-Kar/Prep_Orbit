import React, { useState, useEffect } from 'react';
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
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';

const NGROK_URL = 'https://ae3c273ae5e6.ngrok-free.app';
const CURRENT_TIME = '2025-09-05 17:18:59';
const CURRENT_USER = 'Arjo-Kar';

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
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
  },
});

const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)',
  minHeight: '100vh',
  color: 'white',
}));

const FeedbackCard = styled(Card)(({ theme }) => ({
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
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const getUserInfo = () => {
    const userId = localStorage.getItem('userId') || '1';
    const username = localStorage.getItem('username') || CURRENT_USER;
    const authToken = localStorage.getItem('authToken');
    return { userId, username, authToken };
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const userInfo = getUserInfo();

      console.log(`🔍 Fetching all feedbacks for user ${userInfo.username} at ${CURRENT_TIME}`);

      const response = await fetch(`${NGROK_URL}/api/interviews/feedback/user/${userInfo.userId}`, {
        headers: {
          'Authorization': `Bearer ${userInfo.authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
        console.log(`✅ Loaded ${data.feedbacks?.length || 0} feedbacks for ${userInfo.username}`);
      } else {
        throw new Error(`Failed to fetch feedbacks: ${response.status}`);
      }
    } catch (err) {
      console.error('❌ Error fetching feedbacks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const userInfo = getUserInfo();

      const response = await fetch(`${NGROK_URL}/api/interviews/feedback/user/${userInfo.userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${userInfo.authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        console.log('✅ Stats loaded:', data.stats);
      }
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 9) return '#2e7d32';
    if (score >= 8) return '#4caf50';
    if (score >= 7) return '#8bc34a';
    if (score >= 6) return '#ff9800';
    if (score >= 4) return '#ff5722';
    return '#f44336';
  };

  const getScoreLevel = (score) => {
    if (score >= 9) return 'Outstanding';
    if (score >= 8) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Average';
    if (score >= 4) return 'Below Average';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
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

          {/* Stats Overview */}
          {stats && (
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Feedback List */}
          {feedbacks.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: 'rgba(25, 25, 25, 0.8)' }}>
              <Typography variant="h6" sx={{ color: '#aaa', mb: 2 }}>
                No feedback available yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#777' }}>
                Complete some interviews to see your feedback history here!
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
                          {new Date(feedback.createdAt).toLocaleDateString()}
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