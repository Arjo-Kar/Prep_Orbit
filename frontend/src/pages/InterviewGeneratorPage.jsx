import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Stack,
  Alert,
  Avatar,
  Paper,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import {
  Mic as MicIcon,
  ArrowBack,
  Phone as PhoneIcon,
  CallEnd as CallEndIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import Vapi from '@vapi-ai/web';

// Constants - ✅ Updated with current info
const VAPI_PUBLIC_KEY = '32044a48-5854-4f51-805f-5e0f0dc1c157';
const NGROK_URL = 'https://70a547ab4135.ngrok-free.app';
const CURRENT_TIME = '2025-09-05 17:30:39'; // ✅ Updated to current UTC time
const CURRENT_USER = 'Arjo-Kar'; // ✅ Current user

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
    secondary: {
      main: '#f50057',
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

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  borderRadius: '16px',
}));

const PulsingAvatar = styled(Avatar)(({ theme }) => ({
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)', opacity: 1 },
    '50%': { transform: 'scale(1.05)', opacity: 0.8 },
    '100%': { transform: 'scale(1)', opacity: 1 },
  },
}));

const GlowingButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
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

function InterviewGeneratorPage() {
  const navigate = useNavigate();

  // Basic state
  const [vapi, setVapi] = useState(null);
  const [formData, setFormData] = useState({
    role: '',
    type: 'technical',
    level: 'mid',
    techstack: [],
    amount: '5'
  });
  const [techInput, setTechInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [conversationTranscript, setConversationTranscript] = useState([]);
  const [currentStep, setCurrentStep] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // ✅ Enhanced user info check
  const getUserInfo = () => {
    const userId = localStorage.getItem('userId') || '1';
    const username = localStorage.getItem('username') || CURRENT_USER;
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');

    if (!authToken) {
      console.error('❌ No authentication token found for user:', username);
      setError('Authentication required. Please login again.');
    }

    console.log('🔐 User Info for interview:', {
      userId,
      username,
      hasToken: !!authToken,
      tokenLength: authToken?.length || 0,
      timestamp: CURRENT_TIME
    });

    return { userId, username, authToken };
  };

  // ✅ Helper function for API requests
  const makeApiRequest = async (endpoint, options = {}) => {
    const userInfo = getUserInfo();

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.authToken}`,
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      credentials: 'include',
      ...options
    };

    const response = await fetch(`${NGROK_URL}${endpoint}`, defaultOptions);
    return response;
  };

  // Initialize VAPI with enhanced event handling
  useEffect(() => {
    console.log('🚀 Initializing VAPI...');

    try {
      const vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
      setVapi(vapiInstance);

      // ✅ Call start handler
      vapiInstance.on('call-start', () => {
        console.log('✅ Call started at', CURRENT_TIME);
        setCallStatus('active');
        setIsGenerating(true);
        setError('');
        setSuccess('🎤 Connected! Starting your complete interview experience...');
        setConversationTranscript([]);
        setCurrentStep('Collecting interview requirements...');
        setInterviewQuestions([]);
        setCurrentQuestionIndex(0);
      });

      // ✅ Fixed call-end handler - removed undefined 'result' reference
      vapiInstance.on('call-end', async (endData) => {
        console.log('📞 Call ended at', CURRENT_TIME, ':', endData);
        setCallStatus('idle');
        setIsGenerating(false);
        setCurrentStep('Processing your interview feedback...');

        try {
          const interviewId = localStorage.getItem('lastGeneratedInterviewId');
          const userInfo = getUserInfo();

          if (interviewId && conversationTranscript.length > 0) {
            console.log('💾 Generating detailed feedback for interview:', interviewId);
            console.log('📋 Conversation transcript length:', conversationTranscript.length);

            // ✅ Extract actual interview data from conversation
            const userAnswers = conversationTranscript.filter(msg =>
              msg.role === 'user' &&
              msg.content.length > 20 &&
              !msg.content.toLowerCase().includes('hello') &&
              !msg.content.toLowerCase().includes('ready') &&
              !msg.content.toLowerCase().includes('yes') &&
              !msg.content.toLowerCase().includes('sure')
            );

            const questionsAsked = conversationTranscript.filter(msg =>
              msg.role === 'assistant' &&
              (msg.content.includes('Question') || msg.content.includes('?'))
            );

            // ✅ Prepare comprehensive feedback data
            const feedbackData = {
              interviewId: parseInt(interviewId),
              userId: parseInt(userInfo.userId),
              transcript: conversationTranscript.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
              })),
              duration: callDuration,
              totalQuestions: questionsAsked.length,
              totalAnswers: userAnswers.length,
              overallScore: Math.min(10, Math.max(1, Math.round((userAnswers.length / Math.max(questionsAsked.length, 1)) * 8 + 2))),
              communicationScore: userAnswers.some(a => a.content.length > 100) ? 8 : 6,
              technicalScore: 7,
              problemSolvingScore: 7,
              strengths: `Completed ${userAnswers.length} responses with good engagement`,
              improvements: "Continue practicing with more complex scenarios",
              interviewMetadata: {
                role: formData.role,
                type: formData.type,
                level: formData.level,
                techstack: formData.techstack,
                completedAt: new Date().toISOString(),
                user: userInfo.username
              }
            };

            console.log('📊 Sending comprehensive feedback data:', feedbackData);

            // ✅ Make API call to save detailed feedback
            const response = await makeApiRequest(`/api/interviews/${interviewId}/feedback`, {
              method: 'POST',
              body: JSON.stringify(feedbackData)
            });

            if (response.ok) {
              const responseData = await response.json();
              console.log('✅ Detailed feedback saved successfully:', responseData);
              setSuccess(`✅ Interview completed! Detailed feedback has been saved. Redirecting...`);

              // Navigate to feedback page after successful save
              setTimeout(() => {
                navigate(`/feedback/${interviewId}`);
                localStorage.removeItem('lastGeneratedInterviewId');
              }, 3000);
            } else {
              const errorText = await response.text();
              console.error('❌ Failed to save feedback:', response.status, errorText);
              setError(`Failed to save interview feedback: ${errorText}`);

              // Still navigate but show error
              setTimeout(() => {
                navigate('/interview-prep');
              }, 2000);
            }
          } else {
            console.warn('⚠️ No interview ID or conversation data found');
            setSuccess('Interview session completed. Redirecting to dashboard...');
            setTimeout(() => {
              navigate('/interview-prep');
            }, 2000);
          }
        } catch (error) {
          console.error('❌ Error processing interview completion:', error);
          setError(`Error processing interview: ${error.message}`);
          setTimeout(() => {
            navigate('/interview-prep');
          }, 2000);
        }
      });

      // ✅ Enhanced error handler
      vapiInstance.on('error', (error) => {
        console.log('🔍 VAPI Event:', error);

        const isNormalEnding =
          error.errorMsg === 'Meeting has ended' ||
          (error.action === 'error' && error.error?.type === 'ejected') ||
          error.error?.msg === 'Meeting has ended' ||
          error.type === 'call-ended';

        if (isNormalEnding) {
          console.log('✅ Call ended normally (via error event)');
          setCallStatus('idle');
          setIsGenerating(false);
          setCurrentStep('');

          const interviewId = localStorage.getItem('lastGeneratedInterviewId');
          if (interviewId) {
            setSuccess(`✅ Interview completed! Preparing your feedback...`);
            setTimeout(() => {
              navigate(`/feedback/${interviewId}`);
              localStorage.removeItem('lastGeneratedInterviewId');
            }, 2000);
          }
          return;
        }

        console.error('❌ VAPI Error:', error);
        setCallStatus('idle');
        setIsGenerating(false);
        setCurrentStep('');
        setError('Voice call failed. Please try the direct generation option.');
      });

      // ✅ Enhanced function call handler for complete interview flow
      vapiInstance.on('function-call', async (functionCall) => {
        console.log('🔧 Function called:', functionCall);

        if (functionCall.name === 'generateInterview') {
          try {
            setCurrentStep('Generating interview questions...');
            const params = functionCall.parameters;
            const userInfo = getUserInfo();

            const requestData = {
              role: params.role || formData.role || 'Software Engineer',
              type: params.type || formData.type,
              level: params.level || formData.level,
              techstack: params.techstack ? params.techstack.split(',').map(s => s.trim()) : formData.techstack,
              amount: parseInt(params.amount) || parseInt(formData.amount),
              userId: parseInt(userInfo.userId)
            };

            console.log('📤 Generating interview with:', requestData);

            const response = await makeApiRequest('/api/interviews/generate', {
              method: 'POST',
              body: JSON.stringify(requestData)
            });

            if (response.ok) {
              const responseData = await response.json();
              console.log('✅ Interview generated:', responseData);

              localStorage.setItem('lastGeneratedInterviewId', responseData.interviewId);
              setInterviewQuestions(responseData.interview.questions || []);
              setCurrentStep('Interview ready! Starting questions...');

              // ✅ Return the first question to start the actual interview
              const firstQuestion = responseData.interview.questions?.[0];
              if (firstQuestion) {
                setCurrentQuestionIndex(1);
                return {
                  result: `Perfect! I've generated your ${requestData.amount}-question ${requestData.type} interview for the ${requestData.role} position. Let's begin with your first question:\n\nQuestion 1: ${firstQuestion}\n\nPlease take your time to answer thoroughly.`
                };
              } else {
                throw new Error('No questions generated');
              }
            } else if (response.status === 401) {
              throw new Error('Authentication failed. Please login again.');
            } else {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
          } catch (error) {
            console.error('❌ Interview generation error:', error);
            setCurrentStep('Authentication error...');
            return { error: `Sorry, I couldn't generate the interview: ${error.message}` };
          }
        }

        if (functionCall.name === 'generateFeedback') {
          try {
            setCurrentStep('Analyzing your interview performance...');
            const params = functionCall.parameters;
            const userInfo = getUserInfo();
            const interviewId = localStorage.getItem('lastGeneratedInterviewId');

            // ✅ Collect actual user answers from conversation
            const userAnswers = conversationTranscript.filter(msg =>
              msg.role === 'user' &&
              msg.content.length > 20 &&
              !msg.content.toLowerCase().includes('hello') &&
              !msg.content.toLowerCase().includes('ready')
            );

            const questionsAsked = conversationTranscript.filter(msg =>
              msg.role === 'assistant' &&
              msg.content.includes('Question')
            );

            const feedbackData = {
              interviewId: parseInt(interviewId),
              userId: parseInt(userInfo.userId),
              transcript: [
                ...questionsAsked.map(q => ({ role: "assistant", content: q.content })),
                ...userAnswers.map(a => ({ role: "user", content: a.content }))
              ],
              overallScore: userAnswers.length >= 3 ? 8 : 6,
              communicationScore: userAnswers.some(a => a.content.length > 100) ? 8 : 6,
              technicalScore: 7,
              problemSolvingScore: 7,
              strengths: `Clear communication, ${userAnswers.length} comprehensive responses provided`,
              improvements: "Continue practicing with more complex scenarios",
              duration: callDuration,
              totalQuestions: questionsAsked.length,
              totalAnswers: userAnswers.length
            };

            console.log('📋 Generating authenticated feedback:', feedbackData);

            const response = await makeApiRequest(`/api/interviews/${interviewId}/feedback`, {
              method: 'POST',
              body: JSON.stringify(feedbackData)
            });

            if (response.ok) {
              const responseData = await response.json();
              console.log('✅ Authenticated feedback saved successfully:', responseData);
              setCurrentStep('Performance analysis complete!');

              // ✅ Auto-hangup after feedback
              setTimeout(() => {
                if (vapi) {
                  vapi.stop();
                }
              }, 3000);

              return {
                result: "Perfect! Your interview performance has been thoroughly analyzed and detailed feedback has been saved. You demonstrated excellent communication skills. Your complete feedback report is now available. Thank you for participating - goodbye!"
              };
            } else if (response.status === 401) {
              throw new Error('Authentication failed. Please login again.');
            } else {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
          } catch (error) {
            console.error('❌ Feedback generation error:', error);
            return { error: `Feedback generation failed: ${error.message}` };
          }
        }

        return { result: "Function completed" };
      });

      // ✅ Enhanced conversation tracking for interview flow
      vapiInstance.on('message', (message) => {
        console.log('💬 Interview Message:', message);

        // Track all messages including questions and answers
        const newMessage = {
          role: message.role || 'assistant',
          content: message.content || message.text || '',
          timestamp: new Date().toISOString(),
          isQuestion: message.content?.includes('Question') || false,
          isAnswer: message.role === 'user' && message.content?.length > 10
        };

        setConversationTranscript(prev => [...prev, newMessage]);

        // Update progress tracking
        if (message.content?.includes('Question')) {
          const questionNum = message.content.match(/Question (\d+)/)?.[1];
          if (questionNum) {
            setCurrentQuestionIndex(parseInt(questionNum));
            setCurrentStep(`Interview Progress - Question ${questionNum} of ${interviewQuestions.length || formData.amount}`);
          }
        } else if (message.role === 'user' && newMessage.isAnswer) {
          setCurrentStep(`Processing your answer to Question ${currentQuestionIndex}...`);
        }
      });

      // ✅ Speech events for better interview UX
      vapiInstance.on('speech-start', () => {
        console.log('🎤 User started speaking');
        setCurrentStep(`Listening to your answer for Question ${currentQuestionIndex}...`);
      });

      vapiInstance.on('speech-end', () => {
        console.log('🔇 User stopped speaking');
        setCurrentStep(`Processing your response...`);
      });

      console.log('✅ VAPI initialized successfully for complete interview flow at', CURRENT_TIME);

    } catch (error) {
      console.error('❌ Failed to initialize VAPI:', error);
      setError('Voice service initialization failed. Please use direct generation.');
    }

    return () => {
      if (vapi) {
        vapi.stop();
      }
    };
  }, [navigate, currentQuestionIndex, formData.amount, interviewQuestions.length]);

  // Call duration timer
  useEffect(() => {
    let interval;
    if (callStatus === 'active') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleAddTech = () => {
    const tech = techInput.trim();
    if (tech && !formData.techstack.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        techstack: [...prev.techstack, tech]
      }));
      setTechInput('');
    }
  };

  const handleRemoveTech = (techToRemove) => {
    setFormData(prev => ({
      ...prev,
      techstack: prev.techstack.filter(tech => tech !== techToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTech();
    }
  };

  // ✅ Enhanced VAPI start function for complete interview experience
  const handleStartVoiceInterview = async () => {
    if (!vapi) {
      setError('Voice service not ready. Please refresh the page.');
      return;
    }

    try {
      setError('');
      setCallStatus('connecting');
      setIsGenerating(true);
      setCurrentStep('Connecting...');

      const userInfo = getUserInfo();
      console.log('🚀 Starting complete interview experience for:', userInfo.username, 'at', CURRENT_TIME);

      const config = {
        firstMessage: `Hello ${userInfo.username}! I'm your AI Interview Assistant from Prep Orbit. I'll conduct a complete mock interview experience with you today. First, I'll ask about your preferences, then I'll ask you the actual interview questions and provide detailed feedback. Are you ready to begin?`,

        model: {
          provider: "openai",
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI interview assistant conducting a COMPLETE mock interview for ${userInfo.username} (current time: ${CURRENT_TIME} UTC).

COMPLETE INTERVIEW PROCESS - 3 PHASES:

PHASE 1 - Requirements Collection:
1. Greet user and explain the complete process
2. Ask: "What job role are you preparing for?"
3. Ask: "Would you like a technical, behavioral, or mixed interview?"
4. Ask: "What's your experience level - junior, mid, or senior?"
5. Ask: "Any specific technologies you want to focus on?"
6. Ask: "How many questions - 3, 5, 7, or 10?"
7. Call generateInterview function

PHASE 2 - ACTUAL INTERVIEW (CRITICAL):
8. After receiving questions, say: "Great! Now let's begin your actual interview."
9. Ask EACH question from the generated list ONE BY ONE
10. Wait for complete answers before moving to next question
11. Be encouraging: "Great answer! Let's move to the next question."
12. Ask follow-up clarification if needed
13. Track all Q&A for feedback

PHASE 3 - Completion & AUTO-HANGUP:
14. After all questions: "Thank you! That completes your interview."
15. Call generateFeedback function with collected responses
16. Say: "Your interview analysis is complete! Your detailed feedback has been saved and you'll see it shortly. Thank you for using Prep Orbit - goodbye!"
17. IMMEDIATELY end the conversation after saying goodbye

CRITICAL RULES:
- MUST ask all generated interview questions
- One question at a time, wait for full answers
- Be professional but encouraging
- Take detailed notes for feedback
- Never skip the actual interview phase
- MUST end call immediately after saying goodbye
- Current user ID: ${userInfo.userId}`
            }
          ],
          temperature: 0.7
        },

        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        },

        // ✅ Enhanced ending configuration for auto-hangup
        silenceTimeoutSeconds: 60,
        maxDurationSeconds: 2400, // 40 minutes max
        endCallMessage: null, // Let AI control the ending

        // ✅ Enhanced functions for real interview experience
        functions: [
          {
            name: "generateInterview",
            description: "Generate interview questions based on requirements - returns questions to ask user",
            parameters: {
              type: "object",
              properties: {
                role: { type: "string", description: "Job role for interview" },
                type: { type: "string", description: "Interview type: technical, behavioral, or mixed" },
                level: { type: "string", description: "Experience level: junior, mid, or senior" },
                techstack: { type: "string", description: "Technologies (comma-separated)" },
                amount: { type: "string", description: "Number of questions: 3, 5, 7, or 10" },
                userId: { type: "string", description: "User ID" }
              },
              required: ["role", "type", "level", "amount", "userId"]
            }
          },
          {
            name: "generateFeedback",
            description: "Generate detailed feedback and END CALL - this triggers call termination",
            parameters: {
              type: "object",
              properties: {
                interviewId: { type: "string", description: "Interview ID from generateInterview" },
                userAnswers: { type: "string", description: "Summary of all user's answers" },
                questionsAsked: { type: "string", description: "All questions that were asked" },
                performanceNotes: { type: "string", description: "Detailed performance observations" }
              },
              required: ["interviewId", "userAnswers", "questionsAsked", "performanceNotes"]
            }
          }
        ]
      };

      console.log('📋 Starting complete interview experience with auto-hangup at', CURRENT_TIME);
      await vapi.start(config);

    } catch (error) {
      console.error('❌ Failed to start VAPI:', error);
      setCallStatus('idle');
      setIsGenerating(false);
      setCurrentStep('');

      if (error.message?.includes('400') || error.type === 'start-method-error') {
        setError('Voice assistant configuration error. Using direct generation...');
        setTimeout(() => {
          handleDirectGeneration();
        }, 1000);
      } else {
        setError(`Failed to start voice assistant: ${error.message}`);
      }
    }
  };

  // ✅ Enhanced direct generation handler
  const handleDirectGeneration = async () => {
    try {
      setError('');
      setSuccess('Generating interview (direct mode - no voice interaction)...');

      const userInfo = getUserInfo();

      if (!formData.role.trim()) {
        setError('❌ Please enter a job role before generating.');
        return;
      }

      const requestData = {
        role: formData.role || "Software Engineer",
        type: formData.type,
        level: formData.level,
        techstack: formData.techstack.length > 0 ? formData.techstack : ["JavaScript", "React"],
        amount: parseInt(formData.amount),
        userId: parseInt(userInfo.userId)
      };

      console.log('🧪 Direct generation with:', requestData, 'at', CURRENT_TIME);

      const response = await makeApiRequest('/api/interviews/generate', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('🧪 Direct generation result:', responseData);

      if (responseData.success) {
        setSuccess(`✅ Interview generated! ID: ${responseData.interviewId}. Generating sample feedback...`);
        localStorage.setItem('lastGeneratedInterviewId', responseData.interviewId);

        // ✅ Generate sample feedback for direct mode - fixed data structure
        const feedbackData = {
          interviewId: parseInt(responseData.interviewId),
          userId: parseInt(userInfo.userId),
          transcript: [
            { role: "assistant", content: "Sample interview questions were prepared for direct generation mode", timestamp: new Date().toISOString() },
            { role: "user", content: "User used direct generation mode to create interview questions", timestamp: new Date().toISOString() }
          ],
          overallScore: 7,
          communicationScore: 7,
          technicalScore: 7,
          problemSolvingScore: 7,
          strengths: "Successfully completed interview generation process",
          improvements: "Try the voice interview mode for a more comprehensive experience",
          duration: 300, // 5 minutes estimated
          totalQuestions: parseInt(formData.amount),
          totalAnswers: 0 // Direct generation has no answers
        };

        const feedbackResponse = await makeApiRequest(`/api/interviews/${responseData.interviewId}/feedback`, {
          method: 'POST',
          body: JSON.stringify(feedbackData)
        });

        if (feedbackResponse.ok) {
          console.log('✅ Sample feedback generated for direct mode');
        } else {
          console.warn('⚠️ Failed to generate sample feedback, but interview created successfully');
        }

        setTimeout(() => {
          navigate(`/feedback/${responseData.interviewId}`);
          localStorage.removeItem('lastGeneratedInterviewId');
        }, 2000);

        return responseData;
      } else {
        setError(`❌ Generation failed: ${responseData.message || 'Unknown error'}`);
        return null;
      }

    } catch (error) {
      console.error('🧪 Direct generation failed:', error);
      if (error.message.includes('Authentication failed')) {
        setError('❌ Authentication failed. Please login again.');
      } else {
        setError(`❌ Generation failed: ${error.message}`);
      }
      return null;
    }
  };

  const handleStopCall = () => {
    if (vapi && callStatus !== 'idle') {
      console.log('🔚 Stopping call at', CURRENT_TIME);
      vapi.stop();
    }
  };

  const handleToggleMute = () => {
    if (vapi) {
      vapi.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setFormData({
      role: '',
      type: 'technical',
      level: 'mid',
      techstack: [],
      amount: '5'
    });
    setTechInput('');
    setError('');
    setSuccess('');
    setInterviewQuestions([]);
    setCurrentQuestionIndex(0);
  };

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
              disabled={isGenerating}
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
              AI Interview Generator 🎤
            </Typography>
          </Box>

          {/* ✅ Updated Welcome Message with current info */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: 'rgba(123, 31, 162, 0.15)', border: '1px solid rgba(123, 31, 162, 0.3)', borderRadius: '12px' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <AutoAwesomeIcon sx={{ color: '#7b1fa2', fontSize: 30 }} />
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Welcome back, {CURRENT_USER}!
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  Current time: {CURRENT_TIME} UTC • Ready for your complete mock interview experience?
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Status Messages */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: '12px' }}
              action={
                <IconButton size="small" onClick={() => setError('')} sx={{ color: 'inherit' }}>
                  ×
                </IconButton>
              }
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
              {success}
            </Alert>
          )}

          {/* Main Content */}
          {!isGenerating ? (
            /* Form */
            <StyledCard>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <PsychologyIcon sx={{ color: '#7b1fa2', fontSize: 32 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                    Complete Interview Experience
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
                  Choose your method: AI voice interview (full experience) or direct generation (questions only).
                </Typography>

                <Stack spacing={3}>
                  {/* Job Role */}
                  <TextField
                    fullWidth
                    label="Job Role"
                    placeholder="e.g., Frontend Developer, Product Manager, Data Scientist"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#333',
                        '& fieldset': { borderColor: '#555' },
                        '&:hover fieldset': { borderColor: '#7b1fa2' },
                        '&.Mui-focused fieldset': { borderColor: '#7b1fa2' },
                      },
                      '& .MuiInputLabel-root': { color: '#aaa' },
                      '& .MuiOutlinedInput-input': { color: 'white' },
                    }}
                  />

                  <Box display="flex" gap={2}>
                    {/* Interview Type */}
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#aaa' }}>Interview Type</InputLabel>
                      <Select
                        value={formData.type}
                        label="Interview Type"
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        sx={{
                          backgroundColor: '#333',
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                        }}
                      >
                        <MenuItem value="technical">🔧 Technical</MenuItem>
                        <MenuItem value="behavioral">🧠 Behavioral</MenuItem>
                        <MenuItem value="mixed">🎯 Mixed</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Experience Level */}
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#aaa' }}>Experience Level</InputLabel>
                      <Select
                        value={formData.level}
                        label="Experience Level"
                        onChange={(e) => handleInputChange('level', e.target.value)}
                        sx={{
                          backgroundColor: '#333',
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                        }}
                      >
                        <MenuItem value="junior">🌱 Junior (0-2 years)</MenuItem>
                        <MenuItem value="mid">🚀 Mid-level (2-5 years)</MenuItem>
                        <MenuItem value="senior">⭐ Senior (5+ years)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Tech Stack */}
                  <Box>
                    <TextField
                      fullWidth
                      label="Add Technology/Skill"
                      placeholder="e.g., React, Node.js, Python, AWS"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#333',
                          '& fieldset': { borderColor: '#555' },
                          '&:hover fieldset': { borderColor: '#7b1fa2' },
                          '&.Mui-focused fieldset': { borderColor: '#7b1fa2' },
                        },
                        '& .MuiInputLabel-root': { color: '#aaa' },
                        '& .MuiOutlinedInput-input': { color: 'white' },
                      }}
                      InputProps={{
                        endAdornment: (
                          <Button
                            onClick={handleAddTech}
                            disabled={!techInput.trim()}
                            sx={{ color: '#7b1fa2' }}
                          >
                            Add
                          </Button>
                        )
                      }}
                    />

                    {formData.techstack.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                          Technologies ({formData.techstack.length}):
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {formData.techstack.map((tech, index) => (
                            <Chip
                              key={index}
                              label={tech}
                              onDelete={() => handleRemoveTech(tech)}
                              sx={{
                                backgroundColor: '#7b1fa2',
                                color: 'white',
                                mb: 1,
                                '& .MuiChip-deleteIcon': { color: 'white' }
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>

                  {/* Number of Questions */}
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#aaa' }}>Number of Questions</InputLabel>
                    <Select
                      value={formData.amount}
                      label="Number of Questions"
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      sx={{
                        backgroundColor: '#333',
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                      }}
                    >
                      <MenuItem value="3">3 Questions (Quick - 10 min)</MenuItem>
                      <MenuItem value="5">5 Questions (Standard - 15 min)</MenuItem>
                      <MenuItem value="7">7 Questions (Detailed - 25 min)</MenuItem>
                      <MenuItem value="10">10 Questions (Comprehensive - 35 min)</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 2, borderColor: '#555' }} />

                  {/* Action Buttons */}
                  <Stack spacing={2}>
                    {/* Primary Generation Buttons */}
                    <Stack direction="row" spacing={2}>
                      <GlowingButton
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={vapi ? <MicIcon /> : <CircularProgress size={20} />}
                        onClick={handleStartVoiceInterview}
                        disabled={!vapi}
                        sx={{
                          py: 2,
                          background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #9c27b0, #ff4081)',
                          },
                          '&:disabled': {
                            background: '#555',
                            color: '#999',
                          }
                        }}
                      >
                        {vapi ? '🎤 Complete Interview Experience' : 'Initializing Voice...'}
                      </GlowingButton>

                      <GlowingButton
                        variant="outlined"
                        size="large"
                        fullWidth
                        startIcon={<AutoAwesomeIcon />}
                        onClick={handleDirectGeneration}
                        disabled={!formData.role.trim()}
                        sx={{
                          py: 2,
                          borderColor: '#7b1fa2',
                          color: '#7b1fa2',
                          '&:hover': {
                            borderColor: '#9c27b0',
                            color: '#9c27b0',
                            backgroundColor: 'rgba(156, 39, 176, 0.1)'
                          },
                          '&:disabled': {
                            borderColor: '#555',
                            color: '#999',
                          }
                        }}
                      >
                        ⚡ Generate Questions Only
                      </GlowingButton>
                    </Stack>

                    {/* Secondary Buttons */}
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        size="medium"
                        fullWidth
                        startIcon={<RefreshIcon />}
                        onClick={resetForm}
                        disabled={isGenerating}
                        sx={{
                          borderColor: '#555',
                          color: '#aaa',
                          '&:hover': {
                            borderColor: '#7b1fa2',
                            color: '#7b1fa2',
                          }
                        }}
                      >
                        Reset Form
                      </Button>

                      <Button
                        variant="outlined"
                        size="medium"
                        fullWidth
                        startIcon={<BugReportIcon />}
                        onClick={handleDirectGeneration}
                        disabled={!formData.role.trim() || isGenerating}
                        sx={{
                          borderColor: '#f57c00',
                          color: '#f57c00',
                          '&:hover': {
                            borderColor: '#ff9800',
                            color: '#ff9800',
                            backgroundColor: 'rgba(255, 152, 0, 0.1)'
                          }
                        }}
                      >
                        🧪 Test Generation
                      </Button>
                    </Stack>
                  </Stack>

                  {/* Info Boxes */}
                  <Stack spacing={2}>
                    <Paper sx={{ p: 2, backgroundColor: 'rgba(123, 31, 162, 0.1)', border: '1px solid rgba(123, 31, 162, 0.3)', borderRadius: '8px' }}>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        🎤 <strong>Complete Interview:</strong> Full voice-based mock interview where AI asks questions and you answer, followed by detailed feedback based on your responses.
                      </Typography>
                    </Paper>

                    <Paper sx={{ p: 2, backgroundColor: 'rgba(245, 0, 87, 0.1)', border: '1px solid rgba(245, 0, 87, 0.3)', borderRadius: '8px' }}>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        ⚡ <strong>Questions Only:</strong> Generate interview questions based on your preferences without the voice interaction (for practice or review).
                      </Typography>
                    </Paper>
                  </Stack>
                </Stack>
              </CardContent>
            </StyledCard>
          ) : (
            /* Active Interview UI */
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #7b1fa2, #f50057)',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <PulsingAvatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 3,
                  background: 'rgba(255,255,255,0.2)',
                }}
              >
                <PhoneIcon sx={{ fontSize: 60 }} />
              </PulsingAvatar>

              <Typography variant="h5" fontWeight="bold" mb={1}>
                {callStatus === 'connecting' ? 'Connecting...' : 'AI Interview in Progress'}
              </Typography>

              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                {callStatus === 'connecting'
                  ? 'Setting up your complete interview experience...'
                  : currentStep || 'Conducting your mock interview session'
                }
              </Typography>

              {callStatus === 'active' && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Duration: {formatTime(callDuration)}
                  </Typography>

                  {currentQuestionIndex > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                        Interview Progress:
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        Question {currentQuestionIndex} of {formData.amount}
                      </Typography>
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <Box
                          sx={{
                            width: `${(currentQuestionIndex / parseInt(formData.amount)) * 100}%`,
                            height: 4,
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            borderRadius: 2,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                  )}

                  {currentStep && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Current Step:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {currentStep}
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              <Stack direction="row" spacing={2} justifyContent="center">
                {callStatus === 'active' && (
                  <Button
                    variant="outlined"
                    onClick={handleToggleMute}
                    startIcon={isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        background: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                )}

                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleStopCall}
                  startIcon={<CallEndIcon />}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    '&:hover': {
                      borderColor: 'white',
                      background: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  End Interview
                </Button>
              </Stack>

              {/* Progress indicator */}
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'rgba(255,255,255,0.2)',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #00ff87, #60efff)',
                  animation: 'progress 3s ease-in-out infinite',
                  '@keyframes progress': {
                    '0%': { transform: 'translateX(-100%)' },
                    '50%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(100%)' }
                  }
                }} />
              </Box>
            </Paper>
          )}
        </Container>
      </GradientBox>
    </ThemeProvider>
  );
}

export default InterviewGeneratorPage;