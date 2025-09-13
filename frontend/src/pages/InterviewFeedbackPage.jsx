/* Additions:
   - Polls a few times before using fallback.
   - If ?fallback=1&code=429 present, shows a subtle notice & polls again.
*/
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, Card, CardContent, Button, Grid, Paper, Avatar, Chip,
  LinearProgress, Divider, Stack, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import {
  ArrowBack, TrendingUp, CheckCircle, Warning, School, EmojiEvents, Assessment,
  ExpandMore, PlayArrow, Download, Share, Refresh, Chat as ChatIcon, Psychology, Code,
  Speed, Groups, Architecture, Star, Timeline, DataUsage, Assignment, QuestionAnswer
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';

const NGROK_URL = 'https://c28dbe38c3c2.ngrok-free.app';
const CURRENT_TIME = '2025-09-05 13:50:18';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#100827', paper: 'rgba(25, 25, 25, 0.9)' },
    primary: { main: '#7b1fa2' },
    secondary: { main: '#f50057' },
    success: { main: '#4caf50' },
    warning: { main: '#ff9800' },
    text: { primary: '#ffffff', secondary: '#cccccc' },
  },
  components: {
    MuiAccordion: {
      styleOverrides: { root: { backgroundColor: 'rgba(25, 25, 25, 0.8)', border: '1px solid #444', '&:before': { display: 'none' } } }
    }
  }
});

const GradientBox = styled(Box)(() => ({
  background: 'linear-gradient(135deg,#100827 0%,#1a0f3d 50%,#291a54 100%)',
  minHeight: '100vh',
  color: 'white'
}));
const ScoreCard = styled(Card)(() => ({
  background: 'linear-gradient(135deg,#4caf50,#8bc34a)',
  color: 'white',
  textAlign: 'center',
  borderRadius: '20px',
  transition: 'transform .3s, box-shadow .3s',
  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(76,175,80,.3)' }
}));
const FeedbackCard = styled(Card)(() => ({
  background: 'linear-gradient(180deg,#1c1c1c 0%,#101010 100%)',
  border: '1px solid #444',
  borderRadius: '16px',
  height: '100%',
  transition: 'transform .2s, box-shadow .2s',
  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(123,31,162,.3)', border: '1px solid #7b1fa2' }
}));
const ActionButton = styled(Button)(() => ({
  height: 48, borderRadius: 12, textTransform: 'none', fontSize: '1rem', fontWeight: 600,
  position: 'relative', overflow: 'hidden',
  '&:hover': { transform: 'translateY(-2px)' },
  '&::before': {
    content: '""', position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
    transition: 'left .5s'
  },
  '&:hover::before': { left: '100%' }
}));
const TranscriptMessage = styled(Paper)(({ role }) => ({
  padding: 16, marginBottom: 16, borderRadius: 16,
  background: role === 'assistant' ? 'linear-gradient(135deg,#7b1fa2,#9c27b0)' : 'rgba(25,25,25,0.8)',
  border: role === 'assistant' ? 'none' : '1px solid #444',
  maxWidth: '85%',
  marginLeft: role === 'assistant' ? 0 : 'auto',
  marginRight: role === 'assistant' ? 'auto' : 0,
  position: 'relative'
}));

const ScoreIcon = ({ category }) => {
  const icons = {
    technical: <Code />, communication: <QuestionAnswer />, problemSolving: <Psychology />,
    codeQuality: <Assignment />, systemDesign: <Architecture />, culturalFit: <Groups />,
    performance: <Speed />, creativity: <Star />
  };
  return icons[category] || <DataUsage />;
};

function InterviewFeedbackPage() {
  const { interviewId, userId: paramUserId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [pollNote, setPollNote] = useState('');
  const pollAttemptsRef = useRef(0);
  const MAX_POLL = 5;

  const getUserInfo = () => {
    const parsed = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = parsed.id || localStorage.getItem('userId') || paramUserId || '1';
    const username = parsed.name || parsed.username || localStorage.getItem('username') || 'Guest';
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    return { userId, username, authToken };
  };
  const userInfo = getUserInfo();

  const query = new URLSearchParams(location.search);
  const cameFromFallback = query.get('fallback') === '1';
  const fallbackCode = query.get('code');

  useEffect(() => {
    pollAttemptsRef.current = 0;
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const fetchData = async (allowPoll) => {
    try {
      setLoading(true);
      setError('');
      const ui = getUserInfo();

      const headers = {
        'Authorization': `Bearer ${ui.authToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      };

      const [intRes, fbRes] = await Promise.allSettled([
        fetch(`${NGROK_URL}/api/interviews/${interviewId}`, { headers, credentials: 'include' }),
        fetch(`${NGROK_URL}/api/interviews/${interviewId}/feedback`, { headers, credentials: 'include' })
      ]);

      let actualInterview;
      if (intRes.status === 'fulfilled' && intRes.value.ok) {
        const data = await intRes.value.json();
        actualInterview = data.interview || data.data || data;
      } else {
        actualInterview = {
          id: interviewId,
            role: 'Backend Developer',
          type: 'Technical',
          level: 'Mid-level',
          techstack: ['Java', 'Spring Boot'],
          amount: 5,
          questions: []
        };
      }

      let loadedFeedback = null;
      if (fbRes.status === 'fulfilled' && fbRes.value.ok) {
        const fbData = await fbRes.value.json();
        loadedFeedback = fbData.feedback || null;
      }

      if (!loadedFeedback) {
        if (allowPoll && pollAttemptsRef.current < MAX_POLL) {
          pollAttemptsRef.current += 1;
          setPollNote(`Waiting for feedback analysis (attempt ${pollAttemptsRef.current}/${MAX_POLL})...`);
          await sleep(1000 * pollAttemptsRef.current); // backoff
          return fetchData(true);
        }
        // fallback
        setFeedback(transformFeedback(generateFallbackFeedback(actualInterview, ui), actualInterview, ui));
        setInterview(actualInterview);
        setLoading(false);
        return;
      }

      setFeedback(transformFeedback(loadedFeedback, actualInterview, ui));
      setInterview(actualInterview);
      setLoading(false);
    } catch (e) {
      setError(e.message || 'Unknown error');
      setLoading(false);
    }
  };

  const transformFeedback = (fb, interviewObj, ui) => {
    // Accept both real backend obj and fallback structure
    const safe = (v, def) => (v === undefined || v === null ? def : v);
    const overall = fb.overallScore != null ? fb.overallScore : fb.totalScore;
    const percent = overall > 10 ? overall : overall * 10;

    let transcript = [];
    if (fb.transcript) {
      if (typeof fb.transcript === 'string') {
        try { transcript = JSON.parse(fb.transcript); } catch { transcript = []; }
      } else if (Array.isArray(fb.transcript)) transcript = fb.transcript;
    }
    if (!transcript.length) transcript = generateTranscript(interviewObj, ui);

    return {
      id: fb.id || Date.now(),
      interviewId: fb.interviewId || interviewId,
      totalScore: Math.round(percent) || 75,
      strengths: splitList(fb.strengths, [
        'Clear communication', 'Structured thought process'
      ]),
      weaknesses: splitList(fb.improvements || fb.areasForImprovement, [
        'Provide more concrete examples', 'Improve depth on system design trade-offs'
      ]),
      recommendations: splitList(fb.recommendations, [
        'Practice medium-hard problems daily',
        'Review core system design patterns',
        'Refine explanation of performance considerations'
      ]),
      scores: {
        technical: toPercent(fb.technicalScore),
        communication: toPercent(fb.communicationScore),
        problemSolving: toPercent(fb.problemSolvingScore),
        codeQuality: 74,
        systemDesign: 72,
        culturalFit: toPercent(fb.overallScore)
      },
      finalAssessment: fb.feedback || fb.finalAssessment ||
        `Good performance in the ${interviewObj.role} mock interview.`,
      createdAt: fb.createdAt || CURRENT_TIME,
      transcript,
      interviewDuration: calculateDuration(interviewObj),
      questionsAnswered: transcript.filter(m => m.role === 'user').length,
      totalQuestions: interviewObj.amount || interviewObj.questions?.length || 5
    };
  };

  const splitList = (raw, fallback) => {
    if (!raw) return fallback;
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string') {
      return raw.split(/\r?\n|•|-|\*/).map(s => s.trim()).filter(Boolean);
    }
    return fallback;
  };

  const toPercent = (v) => {
    if (v == null) return 70;
    const n = Number(v);
    return n <= 10 ? n * 10 : n;
  };

  const generateTranscript = (interview, ui) => ([
    {
      role: 'assistant',
      content: `Hello ${ui.username}! Welcome to your ${interview.role} interview session.`,
      timestamp: CURRENT_TIME
    }
  ]);

  const generateFallbackFeedback = (interview, ui) => ({
    interviewId,
    totalScore: 75,
    strengths: 'Structured responses\nGood baseline knowledge',
    improvements: 'Add deeper technical details\nClarify trade-offs sooner',
    recommendations: 'Practice system design questions\nImprove algorithm optimization explanations',
    overallScore: 7.5,
    technicalScore: 7,
    communicationScore: 8,
    problemSolvingScore: 7,
    feedback: `Fallback feedback generated for ${ui.username}.`
  });

  const calculateDuration = (interview) => {
    const count = interview.amount || 5;
    return `${count * 3} minutes`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#2e7d32';
    if (score >= 80) return '#4caf50';
    if (score >= 70) return '#8bc34a';
    if (score >= 60) return '#ff9800';
    if (score >= 40) return '#ff5722';
    return '#f44336';
  };
  const getScoreLevel = (score) => {
    if (score >= 90) return 'Outstanding';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    if (score >= 40) return 'Below Average';
    return 'Needs Improvement';
  };
  const formatTimestamp = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleRetakeInterview = () => navigate('/interview/new');
  const handleNewInterview = () => navigate('/interview/new');
  const handleBackToDashboard = () => navigate('/interview-prep');

  const handleDownloadReport = async () => {
    if (!feedback) return;
    setGeneratingReport(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      const txt = `
INTERVIEW FEEDBACK REPORT
Generated: ${new Date().toISOString()}
Candidate: ${userInfo.username}
Interview ID: ${interviewId}

OVERALL SCORE: ${feedback.totalScore}/100 (${getScoreLevel(feedback.totalScore)})

STRENGTHS:
${feedback.strengths.map(s => '• ' + s).join('\n')}

AREAS FOR IMPROVEMENT:
${feedback.weaknesses.map(s => '• ' + s).join('\n')}

RECOMMENDATIONS:
${feedback.recommendations.map(s => '• ' + s).join('\n')}

FINAL ASSESSMENT:
${feedback.finalAssessment}
`.trim();
      const blob = new Blob([txt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-feedback-${interviewId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleShareFeedback = async () => {
    if (!feedback) return;
    const shareData = {
      title: `Interview Feedback - ${feedback.totalScore}/100`,
      text: `I completed my interview and scored ${feedback.totalScore}/100.`,
      url: window.location.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard');
      }
    } catch {
      alert('Share failed');
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <GradientBox>
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
              <CircularProgress sx={{ color: '#7b1fa2', mb: 3 }} size={60} />
              <Typography variant="h6" sx={{ color: '#aaa', mb: 1 }}>
                {pollNote || 'Loading your feedback report...'}
              </Typography>
              {cameFromFallback && fallbackCode === '429' && (
                <Typography variant="caption" sx={{ color: '#ff9800' }}>
                  Previous attempt throttled (429). Waiting for server to finish analysis...
                </Typography>
              )}
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
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
              {error}
            </Alert>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={() => fetchData(true)} startIcon={<Refresh />}>
                Retry
              </Button>
              <Button variant="outlined" onClick={handleBackToDashboard} startIcon={<ArrowBack />}>
                Back
              </Button>
            </Stack>
          </Container>
        </GradientBox>
      </ThemeProvider>
    );
  }

  if (!feedback || !interview) {
    return (
      <ThemeProvider theme={darkTheme}>
        <GradientBox>
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(25,25,25,0.8)' }}>
              <Typography variant="h6" sx={{ color: '#aaa', mb: 2 }}>
                Feedback Not Available
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="contained" startIcon={<PlayArrow />} onClick={handleNewInterview}>
                  Start New Interview
                </Button>
                <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBackToDashboard}>
                  Dashboard
                </Button>
              </Stack>
            </Paper>
          </Container>
        </GradientBox>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
            <Box display="flex" alignItems="center">
              <Tooltip title="Back to Interview Dashboard">
                <IconButton
                  onClick={handleBackToDashboard}
                  sx={{ color: '#aaa', mr: 2, '&:hover': { color: '#7b1fa2', backgroundColor: 'rgba(123,31,162,0.1)' } }}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  sx={{
                    background: 'linear-gradient(45deg,#7b1fa2,#f50057,#ff9800)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  📊 Interview Feedback Report
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip label={interview.role || 'Role'} sx={{ backgroundColor: '#7b1fa2', color: 'white' }} />
                  <Chip label={interview.type || 'Type'} variant="outlined" sx={{ borderColor: '#7b1fa2', color: '#7b1fa2' }} />
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    Generated: {new Date(feedback.createdAt).toLocaleDateString()} • User: {userInfo.username}
                  </Typography>
                  {cameFromFallback && fallbackCode === '429' && (
                    <Chip label="Recovered After 429" size="small" sx={{ background: '#ff9800', color: '#000' }} />
                  )}
                </Stack>
              </Box>
            </Box>
            <Stack direction="row" spacing={2}>
              <Tooltip title="Share this feedback report">
                <ActionButton variant="outlined" startIcon={<Share />} onClick={handleShareFeedback}
                  sx={{ borderColor: '#666', color: '#ccc', '&:hover': { borderColor: '#7b1fa2', backgroundColor: '#7b1fa220', color: '#7b1fa2' } }}>
                  Share
                </ActionButton>
              </Tooltip>
              <Tooltip title="Download detailed report">
                <ActionButton
                  variant="outlined"
                  startIcon={generatingReport ? <CircularProgress size={20} /> : <Download />}
                  onClick={handleDownloadReport}
                  disabled={generatingReport}
                  sx={{ borderColor: '#666', color: '#ccc', '&:hover': { borderColor: '#7b1fa2', backgroundColor: '#7b1fa220', color: '#7b1fa2' } }}
                >
                  {generatingReport ? 'Generating...' : 'Download'}
                </ActionButton>
              </Tooltip>
            </Stack>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={4}>
              <ScoreCard>
                <CardContent sx={{ p: 4 }}>
                  <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 3, background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.3)' }}>
                    <EmojiEvents sx={{ fontSize: 60 }} />
                  </Avatar>
                  <Typography variant="h1" fontWeight="bold" mb={1} sx={{ fontSize: '3.5rem' }}>
                    {feedback.totalScore}
                  </Typography>
                  <Typography variant="h6" mb={2} sx={{ opacity: 0.9 }}>
                    Overall Score
                  </Typography>
                  <Chip label={getScoreLevel(feedback.totalScore)} sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', py: 1, px: 2 }} />
                  <Box mt={4} pt={3} sx={{ borderTop: '2px solid rgba(255,255,255,0.2)' }}>
                    <Grid container spacing={3} textAlign="center">
                      <Grid item xs={4}>
                        <Typography variant="h6" fontWeight="bold">{feedback.questionsAnswered}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Answers</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="h6" fontWeight="bold">{feedback.interviewDuration}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Duration</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="h6" fontWeight="bold">{interview.level || 'Mid'}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Level</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  {interview.techstack?.length > 0 && (
                    <Box mt={3} pt={3} sx={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>Technologies:</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {interview.techstack.map((t,i)=>(
                          <Chip key={i} label={t} size="small"
                                sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '.75rem' }} />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </ScoreCard>
            </Grid>

            <Grid item xs={12} lg={8}>
              <FeedbackCard>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Timeline sx={{ color: '#7b1fa2', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="bold">Detailed Performance Analysis</Typography>
                  </Box>
                  <Grid container spacing={3}>
                    {Object.entries(feedback.scores).map(([c, s]) => (
                      <Grid item xs={12} sm={6} key={c}>
                        <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box display="flex" alignItems="center">
                              <Box sx={{ color: getScoreColor(s), mr: 1 }}>
                                <ScoreIcon category={c} />
                              </Box>
                              <Typography variant="body1" sx={{ color: 'white', textTransform: 'capitalize', fontWeight: 600, fontSize: '.95rem' }}>
                                {c.replace(/([A-Z])/g,' $1').trim()}
                              </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: getScoreColor(s) }}>{s}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={s}
                            sx={{
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: '#333',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getScoreColor(s),
                                borderRadius: 6,
                                transition: 'width 1s'
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#aaa', mt: 1, display: 'block' }}>
                            {getScoreLevel(s)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </FeedbackCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <FeedbackCard>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <CheckCircle sx={{ color: '#4caf50', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="bold">Key Strengths ({feedback.strengths.length})</Typography>
                  </Box>
                  <Stack spacing={2}>
                    {feedback.strengths.map((s,i)=>(
                      <Box key={i} sx={{
                        p: 2, borderRadius: 2, backgroundColor: 'rgba(76,175,80,0.06)',
                        border: '1px solid rgba(76,175,80,0.2)', transition: '.2s',
                        '&:hover': { backgroundColor: 'rgba(76,175,80,0.12)', transform: 'translateX(4px)' }
                      }}>
                        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>{i+1}. {s}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </FeedbackCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <FeedbackCard>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Warning sx={{ color: '#ff9800', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="bold">Growth Opportunities ({feedback.weaknesses.length})</Typography>
                  </Box>
                  <Stack spacing={2}>
                    {feedback.weaknesses.map((w,i)=>(
                      <Box key={i} sx={{
                        p: 2, borderRadius: 2, backgroundColor: 'rgba(255,152,0,0.06)',
                        border: '1px solid rgba(255,152,0,0.2)', transition: '.2s',
                        '&:hover': { backgroundColor: 'rgba(255,152,0,0.12)', transform: 'translateX(4px)' }
                      }}>
                        <Typography variant="body2" sx={{ color: '#e0e0e0' }}>{i+1}. {w}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </FeedbackCard>
            </Grid>

            <Grid item xs={12}>
              <FeedbackCard>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <School sx={{ color: '#7b1fa2', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="bold">Personalized Learning Path ({feedback.recommendations.length} steps)</Typography>
                  </Box>
                  <Grid container spacing={3}>
                    {feedback.recommendations.map((r,i)=>(
                      <Grid item xs={12} sm={6} lg={4} key={i}>
                        <Paper sx={{
                          p: 3, height: '100%',
                          background: 'linear-gradient(135deg,rgba(123,31,162,0.1),rgba(123,31,162,0.05))',
                          border: '1px solid rgba(123,31,162,0.3)',
                          borderRadius: 2,
                          transition: '.3s',
                          '&:hover': { transform: 'translateY(-4px)', border: '1px solid rgba(123,31,162,0.5)', boxShadow: '0 8px 30px rgba(123,31,162,0.2)' }
                        }}>
                          <Typography variant="body2" sx={{ color: '#e0e0e0', lineHeight: 1.5 }}>
                            {i+1}. {r}
                          </Typography>
                          {i < 3 && (
                            <Chip label="High Priority" size="small"
                                  sx={{ mt: 1, background: 'rgba(245,0,87,0.25)', color: '#f50057', fontSize: '0.65rem' }} />
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </FeedbackCard>
            </Grid>

            <Grid item xs={12}>
              <FeedbackCard>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Assessment sx={{ color: '#2196F3', mr: 2, fontSize: 28 }} />
                    <Typography variant="h6" fontWeight="bold">Final Assessment & Career Guidance</Typography>
                  </Box>
                  <Paper sx={{
                    p: 4,
                    background: 'linear-gradient(135deg,rgba(33,150,243,0.1),rgba(33,150,243,0.05))',
                    border: '1px solid rgba(33,150,243,0.3)', borderRadius: 2
                  }}>
                    <Typography variant="body1" sx={{ color: '#e0e0e0', lineHeight: 1.7, fontStyle: 'italic', mb: 3 }}>
                      "{feedback.finalAssessment}"
                    </Typography>
                    <Divider sx={{ my: 2, borderColor: 'rgba(33,150,243,0.3)' }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Assessment Date</Typography>
                        <Typography variant="body2">
                          {new Date(feedback.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Interview Focus</Typography>
                        <Typography variant="body2">
                          {interview.type} • {interview.level} Level
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Readiness Level</Typography>
                        <Typography variant="body2" sx={{ color: getScoreColor(feedback.totalScore) }}>
                          {getScoreLevel(feedback.totalScore)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </CardContent>
              </FeedbackCard>
            </Grid>

            <Grid item xs={12}>
              <FeedbackCard>
                <CardContent sx={{ p: 0 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#7b1fa2' }} />} sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center">
                        <ChatIcon sx={{ color: '#7b1fa2', mr: 2, fontSize: 28 }} />
                        <Box>
                          <Typography variant="h6" fontWeight="bold">Interview Conversation Log</Typography>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>
                            {feedback.transcript.length} messages • Duration: {feedback.interviewDuration}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3, pt: 0 }}>
                      <Box sx={{ maxHeight: 500, overflowY: 'auto', pr: 1 }}>
                        {feedback.transcript.map((m,i)=>(
                          <TranscriptMessage key={i} role={m.role}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                              <Box display="flex" alignItems="center">
                                {m.role === 'assistant'
                                  ? <Psychology sx={{ mr: 1, fontSize: 16 }} />
                                  : <Avatar sx={{ width: 16, height: 16, mr: 1, fontSize: '.7rem' }}>U</Avatar>}
                                <Typography variant="subtitle2" fontWeight="bold"
                                  sx={{ color: m.role === 'assistant' ? 'rgba(255,255,255,0.9)' : '#7b1fa2' }}>
                                  {m.role === 'assistant' ? 'AI Interviewer' : userInfo.username}
                                </Typography>
                              </Box>
                              {m.timestamp && (
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '.7rem' }}>
                                  {formatTimestamp(m.timestamp)}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="body2" sx={{ color: m.role === 'assistant' ? 'white' : '#e0e0e0', lineHeight: 1.5 }}>
                              {m.content}
                            </Typography>
                          </TranscriptMessage>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </FeedbackCard>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{
                p: 5,
                background: 'linear-gradient(135deg,#7b1fa2,#f50057)',
                borderRadius: 4,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  position: 'absolute', top: -50, right: -50, width: 200, height: 200,
                  borderRadius: '50%', background: 'rgba(255,255,255,0.1)', opacity: 0.5
                }} />
                <Typography variant="h4" fontWeight="bold" mb={2}>Ready for Your Next Challenge? 🚀</Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                  Continue your interview preparation journey
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
                  Track progress • Build confidence • Land your dream job
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" sx={{ mt: 4 }}>
                  <ActionButton variant="contained" size="large" startIcon={<Refresh />} onClick={handleRetakeInterview}
                    sx={{
                      background: 'rgba(255,255,255,0.2)', color: 'white', px: 4, py: 1.5,
                      border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)',
                      '&:hover': { background: 'rgba(255,255,255,0.3)', transform: 'translateY(-2px)' }
                    }}>
                    Practice More Questions
                  </ActionButton>
                  <ActionButton variant="contained" size="large" startIcon={<PlayArrow />} onClick={handleNewInterview}
                    sx={{
                      background: 'rgba(255,255,255,0.2)', color: 'white', px: 4, py: 1.5,
                      border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)',
                      '&:hover': { background: 'rgba(255,255,255,0.3)', transform: 'translateY(-2px)' }
                    }}>
                    Start New Interview
                  </ActionButton>
                  <ActionButton variant="outlined" size="large" startIcon={<TrendingUp />} onClick={handleBackToDashboard}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.5)', color: 'white', px: 4, py: 1.5,
                      '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)', transform: 'translateY(-2px)' }
                    }}>
                    View Progress
                  </ActionButton>
                </Stack>
                <Box mt={4} pt={3} sx={{ borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                  <Grid container spacing={4} textAlign="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="h6" fontWeight="bold">Interview #{interviewId}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Session Completed</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="h6" fontWeight="bold">{feedback.totalScore}% Score</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Performance Rating</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="h6" fontWeight="bold">{CURRENT_TIME.split(' ')[1]}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Generated Today</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </GradientBox>
    </ThemeProvider>
  );
}

export default InterviewFeedbackPage;