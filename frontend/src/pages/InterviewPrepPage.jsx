import React, { useState, useEffect } from 'react';
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
  Badge,
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
  Star,
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

const NGROK_URL = 'https://1a066ab80207.ngrok-free.app';
const CURRENT_TIME = '2025-09-05 17:25:38';

// Dark theme with enhanced styling
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
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          transition: 'all 0.3s ease-in-out',
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
  },
});

const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)',
  minHeight: '100vh',
  color: 'white',
}));

const InterviewCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  borderRadius: '16px',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border 0.3s ease-in-out',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 40px rgba(123, 31, 162, 0.4)',
    border: '1px solid #7b1fa2',
    '&::before': {
      opacity: 1,
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(123, 31, 162, 0.1), rgba(245, 0, 87, 0.1))',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  height: '56px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s',
  },
  '&:hover::before': {
    left: '100%',
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #7b1fa2, #9c27b0)',
  color: 'white',
  textAlign: 'center',
  borderRadius: '20px',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(123, 31, 162, 0.3)',
  }
}));

const HeroCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #7b1fa2, #f50057)',
  borderRadius: '24px',
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

function InterviewPrepPage() {
  const navigate = useNavigate();

  // State management
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced getUserInfo with JSON user object from localStorage
  const getUserInfo = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = storedUser.id || '1';
    const username = storedUser.name || storedUser.username || 'Guest';
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    return { userId, username, authToken };
  };
  const { username, userId } = getUserInfo();

  useEffect(() => {
    fetchInterviews();
    fetchUserStats();
    // eslint-disable-next-line
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError('');

      const userInfo = getUserInfo();

      if (!userInfo.authToken) {
        setError('Please log in to view your interviews.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${NGROK_URL}/api/interviews/my-interviews`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.authToken}`,
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.interviews)) {
        const processedInterviews = data.interviews.map(interview => ({
          ...interview,
          techstack: Array.isArray(interview.techstack)
            ? interview.techstack
            : (interview.techstack ? interview.techstack.split(',').map(t => t.trim()) : []),
          createdAt: interview.createdAt || CURRENT_TIME,
          hasFeedback: interview.hasFeedback || false
        }));

        setInterviews(processedInterviews);
      } else {
        throw new Error(data.message || 'Invalid response format from server');
      }

    } catch (err) {
      setError(err.message || 'Failed to load interviews. Please try again.');
      if (process.env.NODE_ENV === 'development') {
        const mockInterviews = [
          {
            id: 1,
            role: 'Frontend Developer',
            type: 'technical',
            level: 'mid',
            techstack: ['React', 'JavaScript', 'TypeScript', 'CSS'],
            createdAt: CURRENT_TIME,
            hasFeedback: false,
            amount: 5
          },
          {
            id: 2,
            role: 'Full Stack Developer',
            type: 'mixed',
            level: 'senior',
            techstack: ['Node.js', 'React', 'MongoDB', 'Express'],
            createdAt: '2025-09-04 17:25:38',
            hasFeedback: true,
            amount: 7
          },
          {
            id: 3,
            role: 'Backend Developer',
            type: 'technical',
            level: 'mid',
            techstack: ['Java', 'Spring Boot', 'MySQL', 'REST APIs'],
            createdAt: '2025-09-03 17:25:38',
            hasFeedback: true,
            amount: 5
          },
          {
            id: 4,
            role: 'Product Manager',
            type: 'behavioral',
            level: 'senior',
            techstack: ['Management', 'Strategy', 'Analytics'],
            createdAt: '2025-09-02 17:25:38',
            hasFeedback: true,
            amount: 6
          }
        ];
        setInterviews(mockInterviews);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
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
      } else {
        const fallbackStats = {
          totalFeedbacks: interviews.filter(i => i.hasFeedback).length,
          averageOverallScore: 7.8,
          averageTechnicalScore: 7.5,
          averageCommunicationScore: 8.2,
          averageProblemSolvingScore: 7.4,
          lastInterviewDate: CURRENT_TIME,
          improvementTrend: '+0.8'
        };
        setStats(fallbackStats);
      }
    } catch (err) {
      setStats({
        totalFeedbacks: interviews.filter(i => i.hasFeedback).length,
        averageOverallScore: 7.8,
        averageTechnicalScore: 7.5,
        averageCommunicationScore: 8.2,
        averageProblemSolvingScore: 7.4,
        lastInterviewDate: CURRENT_TIME,
        improvementTrend: '+0.8'
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchInterviews(), fetchUserStats()]);
    setRefreshing(false);
  };

  const handleStartNewInterview = () => {
    navigate('/interview/new');
  };

  const handleViewInterview = (interview) => {
    if (interview.hasFeedback) {
      navigate(`/feedback/${interview.id}`);
    } else {
      navigate(`/interview/session/${interview.id}`);
    }
  };

  const handleViewAllFeedback = () => {
    navigate('/feedback-history');
  };

  const getTypeColor = (type) => {
    const colors = {
      'technical': '#2196F3',
      'behavioral': '#4caf50',
      'mixed': '#ff9800'
    };
    return colors[type] || '#7b1fa2';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'technical': <CodeIcon />,
      'behavioral': <Psychology />,
      'mixed': <TrendingUp />
    };
    return icons[type] || <WorkOutline />;
  };

  const getLevelColor = (level) => {
    const colors = {
      'junior': '#4caf50',
      'mid': '#ff9800',
      'senior': '#f44336'
    };
    return colors[level] || '#7b1fa2';
  };

  const formatType = (type) => {
    const typeMap = {
      'technical': 'Technical',
      'behavioral': 'Behavioral',
      'mixed': 'Mixed'
    };
    return typeMap[type] || type;
  };

  const formatLevel = (level) => {
    const levelMap = {
      'junior': 'Junior',
      'mid': 'Mid-level',
      'senior': 'Senior'
    };
    return levelMap[level] || level;
  };

  const getCompletionRate = () => {
    if (interviews.length === 0) return 0;
    return Math.round((interviews.filter(i => i.hasFeedback).length / interviews.length) * 100);
  };

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
                    '&:hover': { color: '#7b1fa2', backgroundColor: 'rgba(123, 31, 162, 0.1)' }
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
                    background: 'linear-gradient(45deg, #7b1fa2, #f50057, #ff9800)',
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
                    label={`Last updated: ${CURRENT_TIME.split(' ')[1]}`}
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

          {/* Welcome & Stats Section */}
          <Grid container spacing={3} mb={4}>
            {/* Welcome Message */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(123, 31, 162, 0.2), rgba(245, 0, 87, 0.1))',
                border: '1px solid rgba(123, 31, 162, 0.3)',
                borderRadius: '16px'
              }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 60, height: 60, background: 'linear-gradient(135deg, #7b1fa2, #f50057)' }}>
                    <MicIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                      Welcome back, {username}! 👋
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ccc', mb: 1 }}>
                      Ready to advance your interview skills? Track your progress and practice with AI-powered mock interviews.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#aaa' }}>
                      Current session: {CURRENT_TIME} UTC • {interviews.length} total interviews • {getCompletionRate()}% completion rate
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
                      background: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <EmojiEvents sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    {stats?.averageOverallScore?.toFixed(1) || '7.8'}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                    Average Score
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(stats?.averageOverallScore || 7.8) * 10}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        borderRadius: 4,
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                    {stats?.improvementTrend || '+0.8'} from last month
                  </Typography>
                </CardContent>
              </StatsCard>
            </Grid>
          </Grid>

          {/* Performance Overview Cards */}
          {stats && (
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #2196F3, #64b5f6)',
                  color: 'white',
                  borderRadius: '16px'
                }}>
                  <Avatar sx={{ width: 50, height: 50, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <CodeIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.averageTechnicalScore?.toFixed(1) || '7.5'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Technical Skills
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
                  color: 'white',
                  borderRadius: '16px'
                }}>
                  <Avatar sx={{ width: 50, height: 50, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <Psychology />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.averageCommunicationScore?.toFixed(1) || '8.2'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Communication
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                  color: 'white',
                  borderRadius: '16px'
                }}>
                  <Avatar sx={{ width: 50, height: 50, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <Speed />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.averageProblemSolvingScore?.toFixed(1) || '7.4'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Problem Solving
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
                  color: 'white',
                  borderRadius: '16px'
                }}>
                  <Avatar sx={{ width: 50, height: 50, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <Timeline />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalFeedbacks || interviews.filter(i => i.hasFeedback).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completed
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Start New Interview Section */}
          <HeroCard sx={{ p: 5, mb: 4, position: 'relative' }}>
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
            <Typography variant="h4" fontWeight="bold" mb={2} sx={{ position: 'relative', zIndex: 1 }}>
              Ready for Your Next Challenge? 🚀
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1, position: 'relative', zIndex: 1 }}>
              Practice with our AI interviewer and get detailed feedback
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mb: 4, position: 'relative', zIndex: 1 }}>
              Choose from technical, behavioral, or mixed interviews • Get real-time AI feedback • Track your progress
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" sx={{ position: 'relative', zIndex: 1 }}>
              <ActionButton
                variant="contained"
                size="large"
                startIcon={<MicIcon />}
                onClick={handleStartNewInterview}
                sx={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  px: 4,
                  py: 2,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.3)',
                    transform: 'translateY(-2px)',
                  }
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
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                📊 View Feedback History
              </ActionButton>
            </Stack>
            <Box mt={4} pt={3} sx={{ borderTop: '1px solid rgba(255,255,255,0.3)', position: 'relative', zIndex: 1 }}>
              <Grid container spacing={4} textAlign="center">
                <Grid item xs={4}>
                  <Typography variant="h6" fontWeight="bold">
                    {interviews.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Interviews
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h6" fontWeight="bold">
                    {getCompletionRate()}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Completion Rate
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h6" fontWeight="bold">
                    {CURRENT_TIME.split(' ')[0]}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Today's Date
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </HeroCard>

          {/* Error Display */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '12px',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)'
              }}
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            >
              <Typography variant="h6" gutterBottom>⚠️ Unable to Load Interviews</Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}

          {/* Interview History Section */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h4" fontWeight="bold">
              Your Interview Journey 📚
            </Typography>
            {interviews.length > 0 && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  {interviews.filter(i => i.hasFeedback).length} completed • {interviews.filter(i => !i.hasFeedback).length} pending
                </Typography>
                <Chip
                  label={`${getCompletionRate()}% Complete`}
                  sx={{
                    backgroundColor: getCompletionRate() > 70 ? '#4caf50' : getCompletionRate() > 40 ? '#ff9800' : '#f44336',
                    color: 'white'
                  }}
                />
              </Stack>
            )}
          </Box>

          {/* Loading State */}
          {loading ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={8}>
              <CircularProgress sx={{ color: '#7b1fa2', mb: 3 }} size={60} />
              <Typography variant="h6" sx={{ color: '#aaa', mb: 1 }}>
                Loading your interview history...
              </Typography>
              <Typography variant="body2" sx={{ color: '#777' }}>
                Fetching data for {username} • {CURRENT_TIME}
              </Typography>
            </Box>
          ) : interviews.length === 0 ? (
            <Paper
              sx={{
                p: 8,
                textAlign: 'center',
                background: 'rgba(25, 25, 25, 0.8)',
                border: '1px solid #444',
                borderRadius: '20px'
              }}
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 3,
                  background: 'linear-gradient(135deg, #7b1fa2, #f50057)',
                }}
              >
                <DataUsage sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#aaa', mb: 2 }}>
                🎯 Start Your Interview Journey
              </Typography>
              <Typography variant="body1" sx={{ color: '#777', mb: 4, maxWidth: '500px', mx: 'auto' }}>
                No interviews yet, but that's about to change! Take your first mock interview to begin building your skills and tracking your progress.
              </Typography>
              <ActionButton
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleStartNewInterview}
                sx={{
                  background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
                  px: 4,
                  py: 2,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #9c27b0, #ff4081)',
                  }
                }}
              >
                Create Your First Interview
              </ActionButton>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {interviews.map((interview) => (
                <Grid item xs={12} sm={6} lg={4} key={interview.id}>
                  <InterviewCard onClick={() => handleViewInterview(interview)}>
                    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
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
                        <Typography variant="body2" sx={{ color: '#aaa' }}>
                          {new Date(interview.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {interview.hasFeedback && (
                        <Box sx={{
                          mb: 2,
                          p: 1.5,
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          borderRadius: '8px',
                          border: '1px solid rgba(76, 175, 80, 0.3)'
                        }}>
                          <Box display="flex" alignItems="center">
                            <CheckCircle sx={{ color: '#4caf50', mr: 1, fontSize: 20 }} />
                            <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                              ✅ Feedback Available • Detailed analysis ready
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: 'white' }}>
                        {interview.role}
                      </Typography>
                      <Stack spacing={1} mb={3}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" sx={{ color: '#ccc', display: 'flex', alignItems: 'center' }}>
                            <Schedule sx={{ fontSize: 16, mr: 1 }} />
                            Questions:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                            {interview.amount || 5}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" sx={{ color: '#ccc' }}>
                            Duration:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            ~{(interview.amount || 5) * 3} min
                          </Typography>
                        </Box>
                      </Stack>
                      <Box mb={3}>
                        <Typography variant="caption" sx={{ color: '#aaa', mb: 1, display: 'block' }}>
                          Technologies ({interview.techstack?.length || 0}):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {interview.techstack?.slice(0, 4).map((tech, index) => (
                            <Chip
                              key={index}
                              label={tech}
                              size="small"
                              sx={{
                                backgroundColor: '#333',
                                color: '#ccc',
                                fontSize: '0.75rem',
                                mb: 0.5,
                                '&:hover': {
                                  backgroundColor: '#444'
                                }
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
                                fontSize: '0.75rem',
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
                        startIcon={interview.hasFeedback ? <Assessment /> : <MicIcon />}
                        sx={{
                          background: interview.hasFeedback
                            ? 'linear-gradient(45deg, #4caf50, #8bc34a)'
                            : 'linear-gradient(45deg, #7b1fa2, #f50057)',
                          py: 1.5,
                          '&:hover': {
                            background: interview.hasFeedback
                              ? 'linear-gradient(45deg, #66bb6a, #aed581)'
                              : 'linear-gradient(45deg, #9c27b0, #ff4081)',
                          }
                        }}
                      >
                        {interview.hasFeedback ? '📊 View Detailed Feedback' : '🎤 Start Interview'}
                      </ActionButton>
                    </CardContent>
                  </InterviewCard>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Footer Information */}
          {interviews.length > 0 && (
            <Paper sx={{
              p: 4,
              mt: 4,
              textAlign: 'center',
              backgroundColor: 'rgba(25, 25, 25, 0.6)',
              border: '1px solid #444',
              borderRadius: '16px'
            }}>
              <Grid container spacing={3} textAlign="center">
                <Grid item xs={12} sm={3}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#7b1fa2' }}>
                    {interviews.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Total Interviews
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#4caf50' }}>
                    {interviews.filter(i => i.hasFeedback).length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Completed
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#ff9800' }}>
                    {username}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Current User
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#2196F3' }}>
                    {CURRENT_TIME.split(' ')[1]}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Session Time
                  </Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2, borderColor: '#555' }} />
              <Typography variant="body2" sx={{ color: '#777' }}>
                📊 Last updated: {CURRENT_TIME} UTC • Session ID: {Date.now().toString().slice(-6)} • System Status: ✅ Online
              </Typography>
            </Paper>
          )}
        </Container>

        {/* CSS Animations */}
        <style jsx global>{`
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