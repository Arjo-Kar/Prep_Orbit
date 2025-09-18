import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Paper,
  Chip,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Mic as MicIcon,
  Call as PhoneIcon,
  ArrowBack,
  Person as PersonIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import Vapi from '@vapi-ai/web';

// Constants
const VAPI_PUBLIC_KEY ='d47641df-6392-43d8-b540-04a3a481a3be';
const NGROK_URL = ' https://87e0bd6486d1.ngrok-free.app';
const CURRENT_TIME = '2025-09-05 15:28:13';

// Dark theme
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

const CallCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  borderRadius: '24px',
  transition: 'all 0.3s ease',
}));

const InterviewerCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  background: 'linear-gradient(135deg, #7b1fa2, #f50057)',
  borderRadius: '20px',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent)',
  }
}));

const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
};

function InterviewSessionPage() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [vapi, setVapi] = useState(null);
  const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
  const [messages, setMessages] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Get user info with enhanced authentication
  const getUserInfo = () => {
    // Parse from localStorage if present
    const parsedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = parsedUser.name || parsedUser.username || localStorage.getItem('username') || 'Guest';
    const userId = parsedUser.id || localStorage.getItem('userId') || '1';
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');

    console.log('👤 User info for session:', { userName, userId, hasToken: !!authToken, timestamp: CURRENT_TIME });
    return { userName, userId, authToken };
  };
  const userInfo = getUserInfo();

  useEffect(() => {
    // ✅ Fetch interview details with authentication
    const fetchInterview = async () => {
      try {
        const { authToken } = userInfo;

        console.log('🔍 Fetching interview details for ID:', interviewId);

        const response = await fetch(`${NGROK_URL}/api/interviews/${interviewId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          const actualInterview = data.interview || data.data || data;

          console.log('✅ Interview data loaded:', actualInterview);
          setInterview(actualInterview);
        } else {
          console.warn('⚠️ Interview not found, using fallback data');
          // ✅ Enhanced fallback with realistic backend data structure
          const mockInterview = {
            id: interviewId,
            role: 'Backend Developer',
            type: 'Technical',
            level: 'Mid-level',
            questions: [
              'What is the difference between synchronous and asynchronous programming in Java?',
              'Explain the concept of dependency injection in Spring Boot.',
              'How would you design a REST API for a user management system?',
              'What are the SOLID principles and how do you apply them?',
              'Describe how you would optimize database queries in a high-traffic application.'
            ],
            techstack: ['Java', 'Spring Boot', 'MySQL', 'REST APIs'],
            createdAt: CURRENT_TIME,
            amount: 5
          };
          setInterview(mockInterview);
        }
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching interview:', error);
        // Use enhanced fallback on error
        const fallbackInterview = {
          id: interviewId,
          role: 'Backend Developer',
          type: 'Technical',
          level: 'Mid-level',
          questions: [
            'Explain the difference between synchronous and asynchronous programming',
            'How do you handle errors in your code?',
            'Describe a challenging technical problem you solved recently',
            'What are the principles of clean code?',
            'How do you approach debugging complex issues?'
          ],
          techstack: ['Java', 'Spring Boot', 'MySQL'],
          createdAt: CURRENT_TIME,
          amount: 5
        };
        setInterview(fallbackInterview);
        setLoading(false);
      }
    };

    fetchInterview();
    // eslint-disable-next-line
  }, [interviewId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
      setVapi(vapiInstance);

      // ✅ Enhanced event listeners
      const onCallStart = () => {
        console.log('✅ Interview call started for', userInfo.userName);
        setCallStatus(CallStatus.ACTIVE);
      };

      const onCallEnd = () => {
        console.log('📞 Interview call ended for', userInfo.userName);
        setCallStatus(CallStatus.FINISHED);
        // Navigate to feedback page after call ends
        setTimeout(() => {
          navigate(`/feedback/${interviewId}`);
        }, 2000);
      };

      const onMessage = (message) => {
        console.log('💬 Interview message:', message);
        if (message.type === "transcript" && message.transcriptType === "final") {
          const newMessage = { role: message.role, content: message.transcript };
          setMessages((prev) => [...prev, newMessage]);
        }
      };

      const onSpeechStart = () => {
        console.log('🎤 User started speaking');
        setIsSpeaking(true);
      };

      const onSpeechEnd = () => {
        console.log('🔇 User stopped speaking');
        setIsSpeaking(false);
      };

      const onError = (error) => {
        console.error('❌ VAPI Error for', userInfo.userName, ':', error);
        setCallStatus(CallStatus.INACTIVE);
      };

      vapiInstance.on("call-start", onCallStart);
      vapiInstance.on("call-end", onCallEnd);
      vapiInstance.on("message", onMessage);
      vapiInstance.on("speech-start", onSpeechStart);
      vapiInstance.on("speech-end", onSpeechEnd);
      vapiInstance.on("error", onError);

      return () => {
        vapiInstance.off("call-start", onCallStart);
        vapiInstance.off("call-end", onCallEnd);
        vapiInstance.off("message", onMessage);
        vapiInstance.off("speech-start", onSpeechStart);
        vapiInstance.off("speech-end", onSpeechEnd);
        vapiInstance.off("error", onError);
        vapiInstance.stop();
      };
    }
  }, [interviewId, navigate, userInfo.userName]);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }
  }, [messages]);

  const handleStartCall = async () => {
    if (!vapi || !interview) return;

    try {
      setCallStatus(CallStatus.CONNECTING);

      console.log('🚀 Starting interview call for', userInfo.userName, 'at', CURRENT_TIME);

      // ✅ Enhanced interview assistant configuration
      const interviewAssistant = {
        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI interviewer conducting a ${interview.type.toLowerCase()} interview for a ${interview.role} position with ${userInfo.userName} (current time: ${CURRENT_TIME}).

Interview Details:
- Role: ${interview.role}
- Type: ${interview.type}
- Level: ${interview.level}
- Technologies: ${interview.techstack.join(', ')}
- Questions to ask: ${interview.amount}

INTERVIEW PROCESS:
1. Greet the candidate warmly and explain the interview structure
2. Ask the prepared questions one by one from this list:
${interview.questions.map((q, i) => `   ${i + 1}. ${q}`).join('\n')}

3. For each question:
   - Ask the question clearly
   - Listen to the complete answer
   - Provide brief encouraging feedback
   - Ask follow-up clarifications if needed
   - Move to the next question

4. After all questions, thank the candidate and end the interview

Guidelines:
- Keep the interview professional but friendly
- Encourage detailed explanations
- Ask for specific examples when appropriate
- Maintain a conversational tone
- End positively and mention they'll receive feedback soon

Current candidate: ${userInfo.userName}
Interview session started: ${CURRENT_TIME}`
            }
          ],
          temperature: 0.7
        },
        voice: {
          provider: "deepgram",
          voiceId: "aura-asteria-en"
        },
        firstMessage: `Hello ${userInfo.userName}! Welcome to your ${interview.role} interview session. I'm excited to assess your ${interview.type.toLowerCase()} skills today. We'll be covering questions related to ${interview.techstack.join(', ')} and I have ${interview.questions.length} questions prepared for you. This should take about ${interview.questions.length * 3} minutes. Are you ready to begin?`,

        silenceTimeoutSeconds: 45,
        maxDurationSeconds: interview.questions.length * 180, // 3 minutes per question
        endCallMessage: `Thank you ${userInfo.userName} for completing your ${interview.role} interview! You'll receive detailed feedback shortly. Have a great day!`
      };

      console.log('📋 Starting interview with configuration:', interviewAssistant);
      await vapi.start(interviewAssistant);

    } catch (error) {
      console.error('❌ Error starting interview for', userInfo.userName, ':', error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleEndCall = () => {
    if (vapi) {
      console.log('🔚 Ending interview call for', userInfo.userName);
      vapi.stop();
      setCallStatus(CallStatus.FINISHED);
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <GradientBox>
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
              <CircularProgress sx={{ color: '#7b1fa2' }} />
            </Box>
          </Container>
        </GradientBox>
      </ThemeProvider>
    );
  }

  if (!interview) {
    return (
      <ThemeProvider theme={darkTheme}>
        <GradientBox>
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h6" textAlign="center">
              Interview not found
            </Typography>
          </Container>
        </GradientBox>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <Container maxWidth="md" sx={{ py: 4 }}>
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
              {interview.role} Interview
            </Typography>
          </Box>

          {/* ✅ Enhanced Interview Details */}
          <Card sx={{ mb: 4, background: 'rgba(25, 25, 25, 0.8)', border: '1px solid #444' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Chip
                  label={interview.type}
                  sx={{
                    backgroundColor: '#7b1fa2',
                    color: 'white'
                  }}
                />
                <Chip
                  label={interview.level}
                  variant="outlined"
                  sx={{
                    borderColor: '#7b1fa2',
                    color: '#7b1fa2'
                  }}
                />
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  {interview.questions.length} Questions • ~{interview.questions.length * 3} minutes
                </Typography>
              </Stack>

              {/* ✅ Technology Stack Display */}
              <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                Technologies Covered:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {interview.techstack.map((tech, index) => (
                  <Chip
                    key={index}
                    label={tech}
                    size="small"
                    sx={{
                      backgroundColor: '#333',
                      color: '#ccc',
                      fontSize: '0.75rem'
                    }}
                  />
                ))}
              </Stack>

              {/* ✅ Session Info */}
              <Box mt={2} pt={2} sx={{ borderTop: '1px solid #555' }}>
                <Typography variant="caption" sx={{ color: '#888' }}>
                  Session for: {userInfo.userName} • Started: {CURRENT_TIME}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Call Interface */}
          <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
            {/* AI Interviewer Card */}
            <InterviewerCard sx={{ width: 200, height: 200 }}>
              <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                position: 'relative',
                zIndex: 1
              }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    background: 'rgba(255,255,255,0.2)',
                    position: 'relative'
                  }}
                >
                  <MicIcon sx={{ fontSize: 40 }} />
                  {isSpeaking && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -4,
                        left: -4,
                        right: -4,
                        bottom: -4,
                        border: '3px solid #fff',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite'
                      }}
                    />
                  )}
                </Avatar>
                <Typography variant="h6" fontWeight="bold" textAlign="center">
                  AI Interviewer
                </Typography>
              </CardContent>
            </InterviewerCard>

            {/* User Card */}
            <CallCard sx={{ width: 200, height: 200 }}>
              <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ color: 'white' }}>
                  {userInfo.userName}
                </Typography>
              </CardContent>
            </CallCard>
          </Box>

          {/* ✅ Enhanced Transcript Display */}
          {lastMessage && (
            <Paper
              sx={{
                mt: 4,
                p: 3,
                background: 'rgba(25, 25, 25, 0.8)',
                border: '1px solid #444',
                borderRadius: '12px'
              }}
            >
              <Typography variant="caption" sx={{ color: '#aaa', mb: 1, display: 'block' }}>
                Latest Message:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'white',
                  lineHeight: 1.6,
                  fontStyle: 'italic'
                }}
              >
                "{lastMessage}"
              </Typography>
            </Paper>
          )}

          {/* ✅ Enhanced Call Controls */}
          <Box display="flex" justifyContent="center" mt={4}>
            {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<PhoneIcon />}
                onClick={handleStartCall}
                disabled={callStatus === CallStatus.FINISHED}
                sx={{
                  px: 6,
                  py: 2,
                  borderRadius: '50px',
                  background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                  fontSize: '1.1rem',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #66bb6a, #aed581)',
                  },
                  '&.Mui-disabled': {
                    background: '#555',
                    color: '#999'
                  }
                }}
              >
                {callStatus === CallStatus.FINISHED ? 'Interview Completed' : 'Start Interview'}
              </Button>
            ) : callStatus === CallStatus.CONNECTING ? (
              <Button
                variant="contained"
                size="large"
                disabled
                sx={{
                  px: 6,
                  py: 2,
                  borderRadius: '50px',
                  background: '#ff9800',
                }}
              >
                Connecting...
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleEndCall}
                sx={{
                  px: 6,
                  py: 2,
                  borderRadius: '50px',
                  background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ef5350, #e57373)',
                  }
                }}
              >
                End Interview
              </Button>
            )}
          </Box>

          {/* ✅ Status Information */}
          {callStatus !== CallStatus.INACTIVE && (
            <Paper sx={{ mt: 3, p: 2, textAlign: 'center', backgroundColor: 'rgba(123, 31, 162, 0.1)' }}>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                Interview Status: <strong>{callStatus}</strong> |
                Session ID: {interviewId} |
                Time: {CURRENT_TIME}
              </Typography>
            </Paper>
          )}
        </Container>

        {/* CSS for pulse animation */}
        <style jsx global>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </GradientBox>
    </ThemeProvider>
  );
}

export default InterviewSessionPage;