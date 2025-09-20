import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
  Chip,
  Stack,
  LinearProgress,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Mic as MicIcon,
  WorkOutline,
  Psychology,
  Code as CodeIcon,
  TrendingUp,
  ArrowBack,
  Add as AddIcon,
  Assessment,
  CheckCircle,
  Schedule,
  Refresh,
  Analytics,
  EmojiEvents,
  Timeline,
  AutoAwesome,
  DataUsage,
  Person,
  CalendarToday,
  Speed
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';

/* ====================== Config ====================== */
const NGROK_URL = ' https://87e0bd6486d1.ngrok-free.app';
const MAX_HISTORY_ITEMS = 10; // Limit to latest 10 interviews

/* ====================== Theme ====================== */
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#100827',
      paper: 'rgba(25, 25, 25, 0.8)',
    },
    primary: { main: '#7b1fa2' },
    secondary: { main: '#f50057' },
    success: { main: '#4caf50' },
    warning: { main: '#ff9800' },
    text: { primary: '#ffffff', secondary: '#cccccc' },
  },
  components: {
    MuiCard: {
      styleOverrides: { root: { borderRadius: 16, transition: 'all .3s ease-in-out' } }
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 12, textTransform: 'none', fontWeight: 600 } }
    }
  }
});

/* ====================== Styled Components ====================== */
const GradientBox = styled(Box)(() => ({
  background: 'linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)',
  minHeight: '100vh',
  color: 'white'
}));

const InterviewCard = styled(Card)(() => ({
  height: '100%',
  background: 'linear-gradient(180deg,#1c1c1c 0%,#101010 100%)',
  border: '1px solid #444',
  borderRadius: 16,
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform .3s, box-shadow .3s, border .3s',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 40px rgba(123,31,162,0.4)',
    border: '1px solid #7b1fa2',
    '&::before': { opacity: 1 }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(123,31,162,0.12), rgba(245,0,87,0.12))',
    opacity: 0,
    transition: 'opacity .3s',
    pointerEvents: 'none'
  }
}));

const ActionButton = styled(Button)(() => ({
  height: 56,
  borderRadius: 12,
  fontSize: '1rem',
  fontWeight: 600,
  position: 'relative',
  overflow: 'hidden',
  '&:hover': { transform: 'translateY(-2px)' },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0, left: '-100%',
    width: '100%', height: '100%',
    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
    transition: 'left .5s'
  },
  '&:hover::before': { left: '100%' }
}));

const StatsCard = styled(Card)(() => ({
  background: 'linear-gradient(135deg,#7b1fa2,#9c27b0)',
  color: 'white',
  textAlign: 'center',
  borderRadius: 20,
  transition: 'transform .3s, box-shadow .3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(123,31,162,0.35)'
  }
}));

const HeroCard = styled(Paper)(() => ({
  background: 'linear-gradient(135deg,#7b1fa2,#f50057)',
  borderRadius: 24,
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    opacity: 0.5
  }
}));

/* ====================== Component ====================== */
function InterviewPrepPage() {
  const navigate = useNavigate();

  /* ---------- State ---------- */
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const firstLoadRef = useRef(true);

  /* ---------- User Info ---------- */
  const getUserInfo = useCallback(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = storedUser.id || localStorage.getItem('userId') || '1';
    const username = storedUser.name || storedUser.username || 'Guest';
    const authToken =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token');
    return { userId, username, authToken };
  }, []);

  const { username } = getUserInfo();

  /* ---------- Effects ---------- */
  useEffect(() => {
    // Load interviews + stats concurrently
    (async () => {
      await Promise.all([fetchInterviews(), fetchUserStats()]);
      setLastUpdated(new Date());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- API Calls ---------- */
  const fetchInterviews = async () => {
    try {
      if (firstLoadRef.current) setLoading(true);
      setError('');
      const userInfo = getUserInfo();

      if (!userInfo.authToken) {
        setError('Please log in to view your interviews.');
        setTimeout(() => setLoading(false), 250);
        return;
      }

      const res = await fetch(`${NGROK_URL}/api/interviews/my-interviews`, {
        headers: {
          'Authorization': `Bearer ${userInfo.authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.interviews)) {
        const processed = data.interviews.map(iv => {
          const normalizedStack = Array.isArray(iv.techstack)
            ? iv.techstack
            : (iv.techstack
              ? iv.techstack.split(',').map(t => t.trim()).filter(Boolean)
              : []);
          return {
            ...iv,
            techstack: normalizedStack,
            createdAt: iv.createdAt || new Date().toISOString(),
            hasFeedback: iv.hasFeedback === true
          };
        });

        // Sort by creation date (newest first) and limit to latest 10
        const sortedInterviews = processed.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        const limitedInterviews = sortedInterviews.slice(0, MAX_HISTORY_ITEMS);

        setInterviews(limitedInterviews);
      } else {
        throw new Error(data.message || 'Invalid response format');
      }
    } catch (e) {
      setError(e.message || 'Failed to load interviews.');
    } finally {
      firstLoadRef.current = false;
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const userInfo = getUserInfo();
      if (!userInfo.authToken) {
        setStats(null);
        return;
      }
      const res = await fetch(`${NGROK_URL}/api/interviews/user/${userInfo.userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${userInfo.authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        // Expect unified stats shape (average*Score etc.)
        setStats(data.stats || null);
      } else {
        console.warn('[stats] backend responded', res.status);
        setStats(null);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
      setStats(null);
    }
  };

  /* ---------- Derived Values ---------- */
  const completionRate = interviews.length === 0
    ? 0
    : Math.round(
        (interviews.filter(i => i.hasFeedback).length / interviews.length) * 100
      );

  const dynamicLastUpdated = lastUpdated.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  /* ---------- Handlers ---------- */
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchInterviews(), fetchUserStats()]);
    setRefreshing(false);
    setLastUpdated(new Date());
  };

  const handleStartNewInterview = () => navigate('/interview/new');

  const handleViewInterview = (interview) => {
    if (interview.hasFeedback) {
      navigate(`/feedback/${interview.id}`);
    } else {
      navigate(`/interview/session/${interview.id}`);
    }
  };

  const handleViewAllFeedback = () => navigate('/feedback-history');

  /* ---------- Utility UI Helpers ---------- */
  const getTypeColor = (type) =>
    ({ technical: '#2196F3', behavioral: '#4caf50', mixed: '#ff9800' }[type] || '#7b1fa2');

  const getTypeIcon = (type) =>
    ({ technical: <CodeIcon />, behavioral: <Psychology />, mixed: <TrendingUp /> }[type] || <WorkOutline />);

  const getLevelColor = (level) =>
    ({ junior: '#4caf50', mid: '#ff9800', senior: '#f44336' }[level] || '#7b1fa2');

  const formatType = t => ({ technical: 'Technical', behavioral: 'Behavioral', mixed: 'Mixed' }[t] || t);
  const formatLevel = l => ({ junior: 'Junior', mid: 'Mid-level', senior: 'Senior' }[l] || l);

  /* ---------- Render ---------- */
  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
              <Box display="flex" alignItems="center">
                <Tooltip title="Back to Dashboard">
                  <IconButton
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      color: '#aaa',
                      mr: 2,
                      '&:hover': { color: '#7b1fa2', backgroundColor: 'rgba(123,31,162,0.1)' }
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography
                    variant="h3"
                    component="h1"
                    fontWeight="bold"
                    sx={{
                      background: 'linear-gradient(45deg,#7b1fa2,#f50057,#ff9800)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    Interview Preparation Hub 🎯
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                      icon={<Person />}
                      label={username}
                      sx={{ backgroundColor: '#7b1fa2', color: 'white' }}
                    />
                    <Chip
                      icon={<CalendarToday />}
                      label={`Updated: ${dynamicLastUpdated}`}
                      variant="outlined"
                      sx={{ borderColor: '#7b1fa2', color: '#7b1fa2' }}
                    />
                    <Tooltip title="Refresh data">
                      <IconButton
                        onClick={handleRefresh}
                        disabled={refreshing}
                        sx={{ color: '#aaa', '&:hover': { color: '#7b1fa2' } }}
                      >
                        <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Box>
              <Stack direction="row" spacing={2}>
                <Tooltip title="View detailed feedback history">
                  <ActionButton
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={handleViewAllFeedback}
                    sx={{
                      borderColor: '#666',
                      color: '#ccc',
                      '&:hover': {
                        borderColor: '#7b1fa2',
                        backgroundColor: '#7b1fa220',
                        color: '#7b1fa2'
                      }
                    }}
                  >
                    📊 All Feedback
                  </ActionButton>
                </Tooltip>
                <Tooltip title="View performance analytics">
                  <ActionButton
                    variant="outlined"
                    startIcon={<Analytics />}
                    onClick={() => navigate('/analytics')}
                    sx={{
                      borderColor: '#666',
                      color: '#ccc',
                      '&:hover': {
                        borderColor: '#2196F3',
                        backgroundColor: '#2196F320',
                        color: '#2196F3'
                      }
                    }}
                  >
                    📈 Analytics
                  </ActionButton>
                </Tooltip>
              </Stack>
            </Box>

          {/* Welcome & Summary */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} lg={8}>
              <Paper
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg,rgba(123,31,162,0.2),rgba(245,0,87,0.1))',
                  border: '1px solid rgba(123,31,162,0.3)',
                  borderRadius: 16
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      background: 'linear-gradient(135deg,#7b1fa2,#f50057)'
                    }}
                  >
                    <MicIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                      Welcome back, {username}! 👋
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                      Ready to advance your interview skills? Track progress & practice with AI-powered sessions.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Showing latest {Math.min(interviews.length, MAX_HISTORY_ITEMS)} interviews • {completionRate}% completion rate
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={4}>
              <StatsCard>
                <CardContent sx={{ p: 3 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      mx: 'auto',
                      mb: 2,
                      background: 'rgba(255,255,255,0.2)'
                    }}
                  >
                    <EmojiEvents sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    {stats?.averageOverallScore != null
                      ? stats.averageOverallScore.toFixed(1)
                      : '--'}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                    Average Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(stats?.averageOverallScore || 0) * 10}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        borderRadius: 4
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                    {stats?.improvementTrend || '—'} trend
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
          </Grid>

          {/* Stats Detail Cards */}
          {stats ? (
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg,#2196F3,#64b5f6)',
                    color: 'white',
                    borderRadius: 16
                  }}
                >
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      mx: 'auto',
                      mb: 2,
                      backgroundColor: 'rgba(255,255,255,0.25)'
                    }}
                  >
                    <CodeIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.averageTechnicalScore != null
                      ? stats.averageTechnicalScore.toFixed(1)
                      : '--'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Technical Skills
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg,#4caf50,#8bc34a)',
                    color: 'white',
                    borderRadius: 16
                  }}
                >
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      mx: 'auto',
                      mb: 2,
                      backgroundColor: 'rgba(255,255,255,0.25)'
                    }}
                  >
                    <Psychology />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.averageCommunicationScore != null
                      ? stats.averageCommunicationScore.toFixed(1)
                      : '--'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Communication
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg,#ff9800,#ffb74d)',
                    color: 'white',
                    borderRadius: 16
                  }}
                >
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      mx: 'auto',
                      mb: 2,
                      backgroundColor: 'rgba(255,255,255,0.25)'
                    }}
                  >
                    <Speed />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.averageProblemSolvingScore != null
                      ? stats.averageProblemSolvingScore.toFixed(1)
                      : '--'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Problem Solving
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg,#9c27b0,#ba68c8)',
                    color: 'white',
                    borderRadius: 16
                  }}
                >
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      mx: 'auto',
                      mb: 2,
                      backgroundColor: 'rgba(255,255,255,0.25)'
                    }}
                  >
                    <Timeline />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalFeedbacks != null
                      ? stats.totalFeedbacks
                      : interviews.filter(i => i.hasFeedback).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completed
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          ) : (
            !loading && (
              <Alert
                severity="info"
                sx={{
                  mb: 4,
                  borderRadius: 2,
                  background: 'rgba(33,150,243,0.08)',
                  border: '1px solid rgba(33,150,243,0.3)'
                }}
              >
                No performance stats yet. Complete at least one interview with feedback to see analytics.
              </Alert>
            )
          )}

          {/* Hero / Call-To-Action */}
          <HeroCard sx={{ p: 5, mb: 4 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 3,
                background: 'rgba(255,255,255,0.2)',
                border: '3px solid rgba(255,255,255,0.3)'
              }}
            >
              <AutoAwesome sx={{ fontSize: 50 }} />
            </Avatar>
            <Typography variant="h4" fontWeight="bold" mb={2}>
              Ready for Your Next Challenge? 🚀
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
              Practice with our AI interviewer and get detailed feedback
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mb: 4, maxWidth: 680, mx: 'auto' }}>
              Choose technical, behavioral, or mixed interviews • Real-time AI assistance • Track measurable progress
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="center"
            >
              <ActionButton
                variant="contained"
                size="large"
                startIcon={<MicIcon />}
                onClick={handleStartNewInterview}
                sx={{
                  background: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  px: 4,
                  py: 2,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  '&:hover': { background: 'rgba(255,255,255,0.35)' }
                }}
              >
                🎤 Start New Interview
              </ActionButton>
              <ActionButton
                variant="outlined"
                size="large"
                startIcon={<Assessment />}
                onClick={handleViewAllFeedback}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  px: 4,
                  py: 2,
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                📊 View Feedback History
              </ActionButton>
            </Stack>
            <Box mt={4} pt={3} sx={{ borderTop: '1px solid rgba(255,255,255,0.35)' }}>
              <Grid container spacing={4} textAlign="center">
                <Grid item xs={4}>
                  <Typography variant="h6" fontWeight="bold">
                    {interviews.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Recent Interviews
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h6" fontWeight="bold">
                    {completionRate}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Completion Rate
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h6" fontWeight="bold">
                    {new Date().toISOString().split('T')[0]}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Today
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </HeroCard>

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 3,
                backgroundColor: 'rgba(244,67,54,0.12)',
                border: '1px solid rgba(244,67,54,0.3)'
              }}
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            >
              <Typography variant="h6" gutterBottom>
                ⚠️ Unable to Load Interviews
              </Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}

          {/* History Section Header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Typography variant="h4" fontWeight="bold">
              Recent Interview History 📚
            </Typography>
            {interviews.length > 0 && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  {interviews.filter(i => i.hasFeedback).length} completed •{' '}
                  {interviews.filter(i => !i.hasFeedback).length} pending
                </Typography>
                <Chip
                  label={`Latest ${Math.min(interviews.length, MAX_HISTORY_ITEMS)}`}
                  sx={{
                    backgroundColor: '#7b1fa2',
                    color: 'white'
                  }}
                />
                <Chip
                  label={`${completionRate}% Complete`}
                  sx={{
                    backgroundColor:
                      completionRate > 70
                        ? '#4caf50'
                        : completionRate > 40
                        ? '#ff9800'
                        : '#f44336',
                    color: 'white'
                  }}
                />
              </Stack>
            )}
          </Box>

          {/* Loading / Empty / List */}
          {loading ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              py={8}
            >
              <CircularProgress sx={{ color: '#7b1fa2', mb: 3 }} size={60} />
              <Typography variant="h6" sx={{ color: '#aaa', mb: 1 }}>
                Loading your interview history...
              </Typography>
              <Typography variant="body2" sx={{ color: '#777' }}>
                Fetching data • {new Date().toLocaleString()}
              </Typography>
            </Box>
          ) : interviews.length === 0 ? (
            <Paper
              sx={{
                p: 8,
                textAlign: 'center',
                background: 'rgba(25,25,25,0.8)',
                border: '1px solid #444',
                borderRadius: 4
              }}
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 3,
                  background:
                    'linear-gradient(135deg,#7b1fa2,#f50057)'
                }}
              >
                <DataUsage sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ color: '#aaa', mb: 2 }}
              >
                🎯 Start Your Interview Journey
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#777',
                  mb: 4,
                  maxWidth: 500,
                  mx: 'auto'
                }}
              >
                No interviews yet. Take your first mock interview to build
                momentum and track improvement.
              </Typography>
              <ActionButton
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleStartNewInterview}
                sx={{
                  background: 'linear-gradient(45deg,#7b1fa2,#f50057)',
                  px: 4,
                  py: 2,
                  '&:hover': {
                    background: 'linear-gradient(45deg,#9c27b0,#ff4081)'
                  }
                }}
              >
                Create Your First Interview
              </ActionButton>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {interviews.map(interview => (
                <Grid item xs={12} sm={6} lg={4} key={interview.id}>
                  <InterviewCard onClick={() => handleViewInterview(interview)}>
                    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={2}
                      >
                        <Stack direction="row" spacing={1}>
                          <Chip
                            icon={getTypeIcon(interview.type)}
                            label={formatType(interview.type)}
                            sx={{
                              backgroundColor: getTypeColor(interview.type),
                              color: 'white',
                              '& .MuiChip-icon': { color: 'white' }
                            }}
                          />
                          <Chip
                            label={formatLevel(interview.level)}
                            size="small"
                            sx={{
                              backgroundColor: getLevelColor(interview.level),
                              color: 'white'
                            }}
                          />
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{ color: '#aaa' }}
                        >
                          {interview.createdAt
                            ? new Date(interview.createdAt).toLocaleDateString()
                            : ''}
                        </Typography>
                      </Box>

                      {interview.hasFeedback && (
                        <Box
                          sx={{
                            mb: 2,
                            p: 1.5,
                            backgroundColor: 'rgba(76,175,80,0.12)',
                            borderRadius: 1.5,
                            border: '1px solid rgba(76,175,80,0.35)'
                          }}
                        >
                          <Box display="flex" alignItems="center">
                            <CheckCircle
                              sx={{ color: '#4caf50', mr: 1, fontSize: 20 }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: '#4caf50', fontWeight: 'bold' }}
                            >
                              ✅ Feedback Available
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        mb={2}
                        sx={{ color: 'white' }}
                      >
                        {interview.role}
                      </Typography>

                      <Stack spacing={1} mb={3}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#ccc',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Schedule sx={{ fontSize: 16, mr: 1 }} />
                            Questions:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: '#fff', fontWeight: 'bold' }}
                          >
                            {interview.amount ||
                              interview.questions?.length ||
                              5}
                          </Typography>
                        </Box>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Duration:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: '#fff' }}
                          >
                            ~{(interview.amount ||
                              interview.questions?.length ||
                              5) * 3}{' '}
                            min
                          </Typography>
                        </Box>
                      </Stack>

                      <Box mb={3}>
                        <Typography
                          variant="caption"
                          sx={{ color: '#aaa', mb: 1, display: 'block' }}
                        >
                          Technologies ({interview.techstack?.length || 0}):
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {interview.techstack
                            ?.slice(0, 4)
                            .map((tech, idx) => (
                              <Chip
                                key={idx}
                                label={tech}
                                size="small"
                                sx={{
                                  backgroundColor: '#333',
                                  color: '#ccc',
                                  fontSize: '.7rem',
                                  mb: 0.5,
                                  '&:hover': { backgroundColor: '#444' }
                                }}
                              />
                            ))}
                          {interview.techstack?.length > 4 && (
                            <Chip
                              label={`+${interview.techstack.length - 4}`}
                              size="small"
                              sx={{
                                backgroundColor: '#555',
                                color: '#ccc',
                                fontSize: '.7rem',
                                mb: 0.5
                              }}
                            />
                          )}
                        </Stack>
                      </Box>

                      <Divider sx={{ mb: 3, borderColor: '#555' }} />

                      <ActionButton
                        variant="contained"
                        fullWidth
                        startIcon={
                          interview.hasFeedback ? <Assessment /> : <MicIcon />
                        }
                        sx={{
                          background: interview.hasFeedback
                            ? 'linear-gradient(45deg,#4caf50,#8bc34a)'
                            : 'linear-gradient(45deg,#7b1fa2,#f50057)',
                          py: 1.4,
                          '&:hover': {
                            background: interview.hasFeedback
                              ? 'linear-gradient(45deg,#66bb6a,#aed581)'
                              : 'linear-gradient(45deg,#9c27b0,#ff4081)'
                          }
                        }}
                      >
                        {interview.hasFeedback
                          ? '📊 View Detailed Feedback'
                          : '🎤 Start Interview'}
                      </ActionButton>
                    </CardContent>
                  </InterviewCard>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Footer Summary */}
          {interviews.length > 0 && (
            <Paper
              sx={{
                p: 4,
                mt: 4,
                textAlign: 'center',
                backgroundColor: 'rgba(25,25,25,0.6)',
                border: '1px solid #444',
                borderRadius: 4
              }}
            >
              <Grid container spacing={3} textAlign="center">
                <Grid item xs={12} sm={3}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: '#7b1fa2' }}
                  >
                    {interviews.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Recent Interviews
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: '#4caf50' }}
                  >
                    {interviews.filter(i => i.hasFeedback).length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Completed
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: '#ff9800' }}
                  >
                    {username}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Current User
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: '#2196F3' }}
                  >
                    {dynamicLastUpdated}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Local Time
                  </Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2, borderColor: '#555' }} />
              <Typography variant="body2" sx={{ color: '#777' }}>
                📊 Last updated: {dynamicLastUpdated} • Session ID:{' '}
                {Date.now().toString().slice(-6)} • System Status: ✅ Online • Showing latest {MAX_HISTORY_ITEMS} interviews
              </Typography>
            </Paper>
          )}
        </Container>

        {/* Animations */}
        <style jsx="true">{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </GradientBox>
    </ThemeProvider>
  );
}

export default InterviewPrepPage;