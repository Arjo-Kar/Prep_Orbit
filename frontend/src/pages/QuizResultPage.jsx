import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Avatar,
  Stack,
  Divider,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Alert,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  ArrowBack as BackIcon,
  TrendingUp as StrengthIcon,
  TrendingDown as WeaknessIcon,
  Lightbulb as SuggestionIcon,
  Feedback as FeedbackIcon,
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  Psychology as BrainIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  School as PracticeIcon,
  Dashboard as DashboardIcon,
  Quiz as QuizIcon,
  Help as HintIcon,
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
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    info: {
      main: '#2196f3',
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

const ScoreCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
  boxShadow: '0 8px 30px rgba(76, 175, 80, 0.3)',
  border: 'none',
  color: 'white',
}));

const SectionCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  marginBottom: theme.spacing(3),
  transition: 'all 0.3s ease',
  '&:hover': {
    border: '1px solid #7b1fa2',
    boxShadow: '0 4px 20px rgba(123, 31, 162, 0.3)',
  }
}));

const FeedbackCard = styled(Paper)(({ theme, correct }) => ({
  background: correct
    ? 'linear-gradient(135deg, #4caf5020, #1c1c1c)'
    : 'linear-gradient(135deg, #f4433620, #1c1c1c)',
  border: correct ? '1px solid #4caf50' : '1px solid #f44336',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
}));

const ActionButton = styled(Button)(({ theme }) => ({
  height: '48px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
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

const QuizResultPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get result and questionCount from navigation state
  const result = location.state?.result;
  const questionCount = location.state?.questionCount;

  const handlePracticeWeakAreas = () => {
    navigate("/practice-weak-areas");
  };

  const formatAccuracy = (accuracy) => {
    if (accuracy === null || accuracy === undefined) return '0.0';
    if (typeof accuracy === 'string') {
      if (accuracy === 'NaN' || accuracy.toLowerCase() === 'nan') return '0.0';
      const numAccuracy = parseFloat(accuracy);
      return isNaN(numAccuracy) ? '0.0' : numAccuracy.toFixed(1);
    }
    if (typeof accuracy === 'number') {
      return isNaN(accuracy) ? '0.0' : accuracy.toFixed(1);
    }
    return '0.0';
  };

  const getPerformanceLevel = (accuracy) => {
    const acc = parseFloat(formatAccuracy(accuracy));
    if (acc >= 90) return { level: 'Excellent', color: '#4caf50', icon: <StarIcon /> };
    if (acc >= 75) return { level: 'Good', color: '#8bc34a', icon: <TrophyIcon /> };
    if (acc >= 60) return { level: 'Average', color: '#ff9800', icon: <BrainIcon /> };
    return { level: 'Needs Improvement', color: '#f44336', icon: <WarningIcon /> };
  };

  if (!result) {
    return (
      <ThemeProvider theme={darkTheme}>
        <GradientBox>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Alert
              severity="warning"
              variant="filled"
              sx={{
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #ff9800, #ffc107)',
                mb: 3,
              }}
              icon={<WarningIcon />}
            >
              <Typography variant="h6" gutterBottom>
                No Results Found
              </Typography>
              No quiz results were found. Please complete the quiz first.
            </Alert>
            <ActionButton
              variant="contained"
              startIcon={<QuizIcon />}
              onClick={() => navigate(`/quiz/${sessionId}`)}
              sx={{
                background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #66bb6a, #aed581)',
                }
              }}
            >
              Take Quiz
            </ActionButton>
          </Container>
        </GradientBox>
      </ThemeProvider>
    );
  }

  const performance = getPerformanceLevel(result.accuracy);
  const accuracyValue = parseFloat(formatAccuracy(result.accuracy));

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
                      background: `linear-gradient(135deg, ${performance.color}, ${performance.color}90)`,
                      boxShadow: `0 4px 20px ${performance.color}40`,
                    }}
                  >
                    {performance.icon}
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
                      Quiz Results
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#aaa' }}>
                      Session ID: {sessionId} • Performance: {performance.level}
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

          {/* Score Overview */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={8}>
              <ScoreCard>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" gap={3}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <TrophyIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="h3" fontWeight="bold" gutterBottom>
                        {result.score} / {questionCount}
                      </Typography>
                      <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                        Accuracy: {formatAccuracy(result.accuracy)}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={accuracyValue}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 'white',
                            borderRadius: 6,
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </ScoreCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <SectionCard>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                    Performance Level
                  </Typography>
                  <Chip
                    icon={performance.icon}
                    label={performance.level}
                    sx={{
                      background: `linear-gradient(45deg, ${performance.color}, ${performance.color}90)`,
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      height: '40px',
                      mb: 2
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    {accuracyValue >= 90 && "Outstanding work! You've mastered this topic."}
                    {accuracyValue >= 75 && accuracyValue < 90 && "Great job! You have a solid understanding."}
                    {accuracyValue >= 60 && accuracyValue < 75 && "Good effort! Room for some improvement."}
                    {accuracyValue < 60 && "Keep practicing! You'll get better with time."}
                  </Typography>
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>

          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <SectionCard>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #4caf50, #8bc34a)' }}>
                    <StrengthIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                    Your Strengths
                  </Typography>
                </Box>
                <List>
                  {result.strengths.map((strength, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <StarIcon sx={{ color: '#4caf50' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={strength}
                        sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </SectionCard>
          )}

          {/* Weaknesses */}
          {result.weaknesses && result.weaknesses.length > 0 && (
            <SectionCard>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #ff9800, #ffc107)' }}>
                    <WeaknessIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                    Areas for Improvement
                  </Typography>
                </Box>
                <List>
                  {result.weaknesses.map((weakness, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <WarningIcon sx={{ color: '#ff9800' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={weakness}
                        sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </SectionCard>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <SectionCard>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #2196f3, #64b5f6)' }}>
                    <SuggestionIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                    Suggestions for Improvement
                  </Typography>
                </Box>
                <List>
                  {result.suggestions.map((suggestion, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <SuggestionIcon sx={{ color: '#2196f3' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={suggestion}
                        sx={{ '& .MuiListItemText-primary': { color: 'white' } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </SectionCard>
          )}

          {/* Detailed Feedback */}
          {result.feedback && result.feedback.length > 0 && (
            <SectionCard>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ background: 'linear-gradient(135deg, #7b1fa2, #f50057)' }}>
                    <FeedbackIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                    Detailed Feedback
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {result.feedback.map((fb, index) => (
                    <FeedbackCard key={fb.questionId || index} correct={fb.correct}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            background: fb.correct
                              ? 'linear-gradient(135deg, #4caf50, #8bc34a)'
                              : 'linear-gradient(135deg, #f44336, #ef5350)',
                          }}
                        >
                          {fb.correct ? <CorrectIcon sx={{ fontSize: 18 }} /> : <IncorrectIcon sx={{ fontSize: 18 }} />}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" sx={{
                          color: fb.correct ? '#4caf50' : '#f44336'
                        }}>
                          Question {index + 1}: {fb.correct ? 'Correct' : 'Incorrect'}
                        </Typography>
                      </Box>

                      <Typography variant="body1" sx={{
                        color: 'white',
                        mb: fb.hint ? 2 : 0,
                        lineHeight: 1.6
                      }}>
                        <strong style={{ color: '#90caf9' }}>Feedback:</strong> {fb.feedback}
                      </Typography>

                      {fb.hint && (
                        <Paper sx={{
                          p: 2,
                          background: 'rgba(255, 213, 79, 0.1)',
                          border: '1px solid rgba(255, 213, 79, 0.3)',
                        }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <HintIcon sx={{ color: '#ffd54f', fontSize: 20 }} />
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#ffd54f' }}>
                              Hint
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{
                            color: '#fff3e0',
                            fontStyle: 'italic'
                          }}>
                            {fb.hint}
                          </Typography>
                        </Paper>
                      )}
                    </FeedbackCard>
                  ))}
                </Stack>
              </CardContent>
            </SectionCard>
          )}

          {/* Action Buttons */}
          <Card sx={{ background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)', border: '1px solid #444' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'white', mb: 3 }}>
                What's Next?
              </Typography>
              <Grid container spacing={2}>
                {result.weaknesses && result.weaknesses.length > 0 && (
                  <Grid item xs={12} sm={6} md={4}>
                    <ActionButton
                      variant="contained"
                      startIcon={<PracticeIcon />}
                      fullWidth
                      onClick={handlePracticeWeakAreas}
                      sx={{
                        background: 'linear-gradient(45deg, #ff9800, #ffc107)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #ffb74d, #ffcc80)',
                        }
                      }}
                    >
                      Practice Weak Areas
                    </ActionButton>
                  </Grid>
                )}
                <Grid item xs={12} sm={6} md={4}>
                  <ActionButton
                    variant="contained"
                    startIcon={<DashboardIcon />}
                    fullWidth
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #9c27b0, #ff4081)',
                      }
                    }}
                  >
                    Back to Dashboard
                  </ActionButton>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <ActionButton
                    variant="contained"
                    startIcon={<QuizIcon />}
                    fullWidth
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      background: 'linear-gradient(45deg, #2196f3, #64b5f6)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #42a5f5, #90caf9)',
                      }
                    }}
                  >
                    Take Another Quiz
                  </ActionButton>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </GradientBox>
    </ThemeProvider>
  );
};

export default QuizResultPage;