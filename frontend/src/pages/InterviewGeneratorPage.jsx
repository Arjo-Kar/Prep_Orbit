import React, { useState, useEffect, useCallback } from 'react';
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
  Divider,
  LinearProgress
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
  AutoAwesome as AutoAwesomeIcon,
  CheckCircle
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import Vapi from '@vapi-ai/web';


// Constants - ✅ Current timestamp
const VAPI_PUBLIC_KEY = '04195762-bc96-4d8b-8edf-2defb70a65e2';
const NGROK_URL = ' https://d8adc0d2d46e.ngrok-free.app';
const CURRENT_TIME = '2025-09-05 17:56:41'; // ✅ Current UTC time
 // ✅ Current authenticated user

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
    success: {
      main: '#4caf50',
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
   const [interviewIdState, setInterviewIdState] = useState(null);
    const [interviewCreationStatus, setInterviewCreationStatus] = useState('idle');
    const extractInterviewRequirements = (transcript) => {
       let role = '';
       let type = '';
       let level = '';
       let techstackArr = [];
       let amount = '';
       transcript.forEach(msg => {
         if (msg.role === 'user') {
           // ROLE (look for "role", "job", "position")
           const roleMatch = msg.content.match(/(?:role|job|position)[^\w]?[:\-]?\s*([a-zA-Z0-9 \-]+)/i);
           if (roleMatch && roleMatch[1]) role = roleMatch[1].trim();

           // TYPE
           const typeMatch = msg.content.match(/\b(technical|behavioral|mixed)\b/i);
           if (typeMatch && typeMatch[1]) type = typeMatch[1].toLowerCase();

           // LEVEL
           const levelMatch = msg.content.match(/\b(junior|mid|senior)\b/i);
           if (levelMatch && levelMatch[1]) level = levelMatch[1].toLowerCase();

           // TECHSTACK
           if (msg.content.match(/react|node\.?js|python|aws|java|typescript|angular|django|flask|spring|mongo|mysql|postgres|cloud|docker|kubernetes/i)) {
             techstackArr = techstackArr.concat(
               msg.content
                 .split(/,|and|&/i)
                 .map(t => t.trim())
                 .filter(t =>
                   t.length > 1 &&
                   t.match(/react|node\.?js|python|aws|java|typescript|angular|django|flask|spring|mongo|mysql|postgres|cloud|docker|kubernetes/i)
                 )
             );
           }

           // AMOUNT
           const amountMatch = msg.content.match(/\b(3|5|7|10)\b/);
           if (amountMatch && amountMatch[1]) amount = amountMatch[1];
         }
       });
       techstackArr = Array.from(new Set(techstackArr.filter(Boolean)));
       return { role, type, level, techstack: techstackArr.join(','), amount };
     };
    const handleManualFunctionCallFromTranscript = () => {
        if (!vapi) return;
        const userInfo = getUserInfo();
        const params = extractInterviewRequirements(conversationTranscript);
        if (!params.role || !params.type || !params.level || !params.amount) {
          setError('Requirements incomplete in transcript.');
          return;
        }
        vapi.emit('function-call', {
          name: 'generateInterview',
          parameters: {
            role: params.role,
            type: params.type,
            level: params.level,
            techstack: params.techstack,
            amount: params.amount,
            userId: userInfo.userId
          }
        });
        setSuccess('Function-call emitted using transcript!');
      };
  // ✅ Enhanced state management
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
  const [feedbackProcessing, setFeedbackProcessing] = useState(false);

  // ✅ Enhanced user info with authentication
  const getUserInfo = () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = storedUser.id || localStorage.getItem('userId') || '1';
      const username = storedUser.name || storedUser.username || 'Guest';
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!authToken) {
        console.error('❌ No authentication token found for user:', username, 'at', CURRENT_TIME);
        setError('Authentication required. Please login again.');
      }
      console.log('🔐 User Info for interview at', CURRENT_TIME, ':', {
        userId,
        username,
        hasToken: !!authToken,
        tokenLength: authToken?.length || 0
      });
      return { userId, username, authToken };
    };
    const { username } = getUserInfo();

  // ✅ Enhanced API request helper
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

    try {
      const response = await fetch(`${NGROK_URL}${endpoint}`, defaultOptions);
      console.log(`📡 API ${options.method || 'GET'} ${endpoint} - Status:`, response.status, 'at', CURRENT_TIME);
      return response;
    } catch (error) {
      console.error('❌ API request failed at', CURRENT_TIME, ':', error);
      throw error;
    }
  };
 const calculateVoiceInterviewScore = (userAnswers, questionsAsked) => {
    if (userAnswers.length === 0) return 5;

    const responseRate = userAnswers.length / Math.max(questionsAsked.length, 1);
    const avgResponseLength = userAnswers.reduce((sum, ans) => sum + ans.content.length, 0) / userAnswers.length;

    let score = 5; // Base score

    if (responseRate >= 0.8) score += 2;
    else if (responseRate >= 0.6) score += 1;

    if (avgResponseLength > 150) score += 2;
    else if (avgResponseLength > 75) score += 1;

    if (userAnswers.some(ans => ans.content.length > 300)) score += 1;

    return Math.min(10, Math.max(1, score));
  };

  const calculateCommunicationScore = (userAnswers) => {
    if (userAnswers.length === 0) return 6;

    const avgLength = userAnswers.reduce((sum, ans) => sum + ans.content.length, 0) / userAnswers.length;
    const hasDetailedResponses = userAnswers.some(ans => ans.content.length > 200);
    const hasVariedResponses = new Set(userAnswers.map(ans => ans.content.substring(0, 50))).size > 1;

    let score = 6;
    if (avgLength > 100) score += 1;
    if (hasDetailedResponses) score += 1;
    if (hasVariedResponses) score += 1;
    if (userAnswers.length >= 3) score += 1;

    return Math.min(10, Math.max(1, score));
  };

  const calculateTechnicalScore = (userAnswers, interviewType) => {
    let baseScore = 7;

    if (interviewType === 'technical') {
      const technicalKeywords = ['algorithm', 'database', 'api', 'code', 'programming', 'system', 'architecture'];
      const hasTechnicalContent = userAnswers.some(ans =>
        technicalKeywords.some(keyword => ans.content.toLowerCase().includes(keyword))
      );

      if (hasTechnicalContent) baseScore += 1;
      if (userAnswers.some(ans => ans.content.length > 250)) baseScore += 1;
    }

    return Math.min(10, Math.max(1, baseScore));
  };

  const calculateProblemSolvingScore = (userAnswers) => {
    let score = 7;

    const problemSolvingKeywords = ['approach', 'solution', 'problem', 'resolve', 'analyze', 'strategy', 'method'];
    const hasProblemSolvingContent = userAnswers.some(ans =>
      problemSolvingKeywords.some(keyword => ans.content.toLowerCase().includes(keyword))
    );

    if (hasProblemSolvingContent) score += 1;
    if (userAnswers.some(ans => ans.content.includes('example') || ans.content.includes('experience'))) score += 1;

    return Math.min(10, Math.max(1, score));
  };

  const generateStrengthsFromConversation = (userAnswers, questionsAsked) => {
    const strengths = [];

    if (userAnswers.length >= questionsAsked.length * 0.8) {
      strengths.push("Excellent response completion rate and engagement during voice interview");
    }

    if (userAnswers.some(ans => ans.content.length > 200)) {
      strengths.push("Provided detailed and comprehensive verbal answers");
    }

    if (userAnswers.length >= 3) {
      strengths.push("Strong communication skills and active participation");
    }

    strengths.push(`Successfully completed voice interview session on ${CURRENT_TIME}`);
    strengths.push("Demonstrated good verbal communication abilities with AI interviewer");

    return strengths.join('\n');
  };

  const generateImprovementsFromConversation = (userAnswers, formData) => {
    const improvements = [];

    if (userAnswers.length === 0) {
      improvements.push("Practice speaking more during voice interviews");
      improvements.push("Work on providing verbal responses to interview questions");
    } else {
      const avgLength = userAnswers.reduce((sum, ans) => sum + ans.content.length, 0) / userAnswers.length;

      if (avgLength < 100) {
        improvements.push("Practice providing more detailed verbal explanations");
      }

      improvements.push("Continue practicing voice interviews to build confidence");
    }

    improvements.push(`Study more about ${formData.role} specific topics and requirements`);
    improvements.push("Practice articulating technical concepts clearly and concisely");
    improvements.push("Consider taking more mock interviews to improve fluency");

    return improvements.join('\n');
  };

  const assessConversationQuality = (transcript) => {
    if (transcript.length < 5) return 'basic';
    if (transcript.length < 10) return 'good';
    if (transcript.length < 20) return 'excellent';
    return 'outstanding';
  };

 const generateInterviewFeedback = useCallback(async (triggerSource = 'unknown') => {
     if (!conversationTranscript || conversationTranscript.length === 0) {
       setError('Cannot generate feedback: No transcript available.');
       setFeedbackProcessing(false);
       return;
     }

   console.log(`🔄 Generating feedback triggered by: ${triggerSource} at ${CURRENT_TIME} for ${username}`);

   try {
     setFeedbackProcessing(true);

     // ✅ Multiple ways to get interview ID
    // ...other code...

    // PATCH: Use parse method for interviewId from localStorage, like user parsing
    function getParsedInterviewId() {
      const keys = [
        'lastGeneratedInterviewId',
        'currentInterviewId',
        'interviewId'
      ];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const obj = JSON.parse(raw);
            // If you stored as JSON: { id: ..., ... }
            if (typeof obj === 'object' && obj !== null && ('id' in obj || 'interviewId' in obj)) {
              return obj.id || obj.interviewId;
            }
            // If you stored as JSON string: "42"
            if (typeof obj === 'string' || typeof obj === 'number') {
              return obj;
            }
          } catch {
            // Not JSON, treat as string
            return raw;
          }
        }
      }
      return null;
    }

    // Usage:
    let interviewId = interviewIdState || getParsedInterviewId();

     const userInfo = getUserInfo();

     console.log('🔍 Interview ID search at', CURRENT_TIME, ':', {
       fromState: interviewIdState,
       fromLocalStorage: localStorage.getItem('lastGeneratedInterviewId'),
       finalId: interviewId,
       creationStatus: interviewCreationStatus,
       triggerSource: triggerSource
     });

     // ✅ If no interview ID found, try to create a fallback interview
     if (!interviewId) {
       console.warn('⚠️ No interview ID found, attempting fallback creation at', CURRENT_TIME);

       if (interviewCreationStatus === 'created' || formData.role) {
         setCurrentStep('No interview ID found, creating fallback interview...');

         try {
           const fallbackData = {
             role: formData.role || "Software Engineer",
             type: formData.type,
             level: formData.level,
             techstack: formData.techstack.length > 0 ? formData.techstack : ["JavaScript", "React"],
             amount: parseInt(formData.amount) || 5,
             userId: parseInt(userInfo.userId)
           };

           console.log('🆘 Creating fallback interview at', CURRENT_TIME, ':', fallbackData);

           const response = await makeApiRequest('/api/interviews/generate', {
             method: 'POST',
             body: JSON.stringify(fallbackData)
           });

           if (response.ok) {
             const responseData = await response.json();
             interviewId = responseData.interviewId || responseData.id || responseData.data?.id;

             if (interviewId) {
               localStorage.setItem('lastGeneratedInterviewId', interviewId.toString());
               setInterviewIdState(interviewId.toString());
               console.log('✅ Fallback interview created with ID:', interviewId, 'at', CURRENT_TIME);
             }
           }
         } catch (fallbackError) {
           console.error('❌ Fallback interview creation failed:', fallbackError);
         }
       }

       if (!interviewId) {
         console.error('❌ Still no interview ID after fallback attempt at', CURRENT_TIME);
         setError('Interview session not found. Unable to generate feedback.');
         setFeedbackProcessing(false);

         setTimeout(() => {
           navigate('/interview-prep');
         }, 3000);

         return false;
       }
     }

     console.log('📋 Final Interview ID confirmed:', interviewId, 'for user:', userInfo.username);

     // ✅ Extract conversation data
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

     console.log('📊 Conversation analysis at', CURRENT_TIME, ':', {
       totalMessages: conversationTranscript.length,
       userAnswers: userAnswers.length,
       questionsAsked: questionsAsked.length,
       interviewId: interviewId,
       user: userInfo.username,
       triggerSource: triggerSource
     });

     setCurrentStep('📊 Analyzing your interview performance...');
     await new Promise(resolve => setTimeout(resolve, 1000));

     setCurrentStep('🧠 Calculating performance scores...');

     // ✅ Generate comprehensive feedback data
    const feedbackData = {
      interviewId: parseInt(interviewId),
      userId: parseInt(userInfo.userId),
      transcript: conversationTranscript.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString()
      })),
      duration: callDuration,
      totalQuestions: Math.max(questionsAsked.length, parseInt(formData.amount)),
      totalAnswers: userAnswers.length,
      overallScore: calculateVoiceInterviewScore(userAnswers, questionsAsked),
      communicationScore: calculateCommunicationScore(userAnswers),
      technicalScore: calculateTechnicalScore(userAnswers, formData.type),
      problemSolvingScore: calculateProblemSolvingScore(userAnswers),
      strengths: generateStrengthsFromConversation(userAnswers, questionsAsked),
      improvements: generateImprovementsFromConversation(userAnswers, formData),
      interviewMetadata: {
        role: formData.role,
        type: formData.type,
        level: formData.level,
        techstack: Array.isArray(formData.techstack) ? formData.techstack.join(',') : formData.techstack,
        completedAt: new Date().toISOString(),
        user: userInfo.username,
        mode: 'voice_interview',
        actualDuration: callDuration,
        conversationQuality: assessConversationQuality(conversationTranscript),
        endTrigger: triggerSource,
        timestamp: CURRENT_TIME,
        sessionId: Date.now().toString(),
        creationStatus: interviewCreationStatus
      }
    };

     setCurrentStep('💾 Saving feedback to database...');
     console.log('📊 Sending comprehensive feedback data at', CURRENT_TIME, ':', feedbackData);

     const response = await makeApiRequest(`/api/interviews/${interviewId}/feedback`, {
       method: 'POST',
       body: JSON.stringify(feedbackData)
     });

     if (response.ok) {
       const responseData = await response.json();
       console.log('✅ Feedback saved successfully at', CURRENT_TIME, 'for', username, ':', responseData);

       setCurrentStep('✅ Feedback generated successfully!');
       setSuccess(`✅ Interview analysis complete! Detailed feedback saved. Redirecting...`);
       setFeedbackProcessing(false);

       setTimeout(() => {
         navigate(`/feedback/${interviewId}`);
         localStorage.removeItem('lastGeneratedInterviewId');
         localStorage.removeItem('currentInterviewId');
         setInterviewIdState(null);
       }, 2000);

       return true;
     } else {
       const errorText = await response.text();
       throw new Error(`Failed to save feedback: ${errorText}`);
     }
   } catch (error) {
     console.error('❌ Feedback generation failed at', CURRENT_TIME, ':', error);
     setFeedbackProcessing(false);
     setError(`Failed to generate feedback: ${error.message}`);

     setTimeout(() => {
       navigate('/interview-prep');
     }, 3000);

     return false;
   }
 }, [interviewIdState, interviewCreationStatus, conversationTranscript, callDuration, formData, navigate, calculateVoiceInterviewScore, calculateCommunicationScore, calculateTechnicalScore, calculateProblemSolvingScore, generateStrengthsFromConversation, generateImprovementsFromConversation, assessConversationQuality]);

  // ✅ Helper functions for scoring and analysis


  // ✅ Enhanced VAPI initialization
  useEffect(() => {
    console.log('🚀 Initializing VAPI at', CURRENT_TIME, 'for user', username);

    try {
      const vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
      setVapi(vapiInstance);

      // ✅ Call start handler
    vapiInstance.on('call-start', () => {
      console.log('✅ Voice interview call started at', CURRENT_TIME, 'for', username);
      setCallStatus('active');
      setIsGenerating(true);
      setError('');
      setSuccess('🎤 Connected! Starting your complete interview experience...');
      //setConversationTranscript([]);
      setCurrentStep('Collecting interview requirements...');
      setInterviewQuestions([]);
      setCurrentQuestionIndex(0);
      setFeedbackProcessing(false);
      setInterviewCreationStatus('idle');
      setInterviewIdState(null); // Reset state
    });

      // ✅ Enhanced call-end handler
     vapiInstance.on('call-end', async (endData) => {
       console.log('📞 Voice interview call ended at', CURRENT_TIME, 'for', username, ':', endData);
       setCallStatus('idle');
       setIsGenerating(false);
       setCurrentStep('Processing your interview feedback...');

       // Only generate feedback if transcript has content
       if (conversationTranscript && conversationTranscript.length > 0) {
         await generateInterviewFeedback('call-end-event');
       } else {
         setError('Cannot generate feedback: No transcript available.');
         setFeedbackProcessing(false);
       }
     });
      // ✅ Enhanced error handler with feedback generation
      vapiInstance.on('error', async (error) => {
        console.log('🔍 VAPI Event at', CURRENT_TIME, 'for', username, ':', error);

        const isNormalEnding =
          error.errorMsg === 'Meeting has ended' ||
          (error.action === 'error' && error.error?.type === 'ejected') ||
          error.error?.msg === 'Meeting has ended' ||
          error.type === 'call-ended';

        if (isNormalEnding) {
          console.log('✅ Call ended normally via error event at', CURRENT_TIME);
          setCallStatus('idle');
          setIsGenerating(false);

          // ✅ Generate feedback for normal endings
          await generateInterviewFeedback('error-event-normal-end');
          return;
        }

        console.error('❌ VAPI Error at', CURRENT_TIME, ':', error);
        setCallStatus('idle');
        setIsGenerating(false);
        setCurrentStep('');
        setError('Voice call failed. Please try the direct generation option.');
      });

      // ✅ Enhanced function call handler
//      const [interviewIdState, setInterviewIdState] = useState(null);
//      const [interviewCreationStatus, setInterviewCreationStatus] = useState('idle'); // idle, creating, created, failed

     // ✅ Enhanced function call handler with better error handling

      // ✅ Enhanced conversation tracking
      vapiInstance.on('message', (message) => {
        console.log('💬 Interview message at', CURRENT_TIME, ':', message);

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

      // ✅ Speech events
      vapiInstance.on('speech-start', () => {
        console.log('🎤 User started speaking at', CURRENT_TIME);
        setCurrentStep(`Listening to your answer for Question ${currentQuestionIndex}...`);
      });

      vapiInstance.on('speech-end', () => {
        console.log('🔇 User stopped speaking at', CURRENT_TIME);
        setCurrentStep(`Processing your response...`);
      });

      console.log('✅ VAPI initialized successfully at', CURRENT_TIME, 'for complete interview flow');

    } catch (error) {
      console.error('❌ Failed to initialize VAPI at', CURRENT_TIME, ':', error);
      setError('Voice service initialization failed. Please use direct generation.');
    }
      // ✅ Extract interview requirements from transcript

    return () => {
      if (vapi) {
        vapi.stop();
      }
    };
  }, [navigate, currentQuestionIndex, formData.amount, interviewQuestions.length]);

  // ✅ Call duration timer
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

  // ✅ Form handlers
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

  // ✅ Enhanced VAPI start function
  // ... your existing code above remains unchanged ...

  const handleStartVoiceInterview = async () => {
  if (!formData.amount || isNaN(parseInt(formData.amount))) {
    setError("Please select a valid number of questions.");
    return;
  }
    if (!vapi) {
      setError('Voice service not ready. Please refresh the page.');
      return;
    }
    try {
      setError('');
      setCallStatus('connecting');
      setIsGenerating(true);
      setCurrentStep('Generating interview questions...');

      // --- MOVE the function-call logic here ---
      const userInfo = getUserInfo();
      const requestData = {
        role: formData.role || "Software Engineer",
        type: formData.type,
        level: formData.level,
        techstack: formData.techstack.length > 0 ? formData.techstack : ["JavaScript", "React"],
        amount: parseInt(formData.amount) || 5,
        userId: parseInt(userInfo.userId)
      };

      console.log('📤 Interview generation before start at', CURRENT_TIME, 'with data:', requestData);
        if (!formData.amount || isNaN(parseInt(formData.amount))) {
          setError("Please select a valid number of questions.");
          return;
        }
      const response = await makeApiRequest('/api/interviews/generate', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      console.log("Triggering interview generation API call...");
      console.log("API response:", response);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Interview generated at', CURRENT_TIME, ':', responseData);
        console.log('RAW RESPONSE DATA:', responseData);
        const questions = responseData.interview?.questions || responseData.questions || [];

        // Log the generated questions
        console.log('Generated interview questions:', questions);
        questions.forEach((q, i) => console.log(`Question ${i + 1}:`, q));

        // Extract interview ID
        const interviewId = responseData.interviewId ||
          responseData.id ||
          responseData.data?.id ||
          responseData.interview?.id ||
          responseData.data?.interviewId;

        if (interviewId) {
          // Store in both localStorage AND state
          const idString = interviewId.toString();
          localStorage.setItem('lastGeneratedInterviewId', idString);
          setInterviewIdState(idString);
          setInterviewCreationStatus('created');

          console.log('💾 STORED Interview ID (MULTIPLE LOCATIONS):', idString, 'at', CURRENT_TIME);

          // Double verification
          const storedId = localStorage.getItem('lastGeneratedInterviewId');
          console.log('🔍 VERIFICATION - Stored ID:', storedId, 'State ID:', idString, 'at', CURRENT_TIME);

          setInterviewQuestions(questions);
          console.log("Questions are set!");
          setCurrentStep('Interview ready! Starting questions...');
          console.log("Interview Ready!");

          // Update form data
          setFormData(prev => ({
            ...prev,
            role: requestData.role,
            type: requestData.type,
            level: requestData.level,
            techstack: requestData.techstack,
            amount: requestData.amount
          }));
            console.log(requestData.amount);
          // Now start Vapi with the generated questions!
          const config = {

            firstMessage: `Hello ${userInfo.username}! I'm your AI Interview Assistant from Prep Orbit.
            It's ${CURRENT_TIME} and I'll conduct a complete mock interview experience with you today.
            I'll ask ${requestData.amount} questions for ${requestData.level} for the role of ${requestData.role} and provide a complete feedback.
             Are you ready to begin?`,
            model: {
              provider: "openai",
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: `
  You are an AI interview assistant conducting a COMPLETE mock interview for ${userInfo.username} at ${CURRENT_TIME} UTC.
  Here is the list of interview questions you MUST ask, ONE BY ONE, in order:
  ${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
  - Ask each question, wait for a full answer, then move to the next.
  - After all questions, end the interview and say feedback will be generated.`
                }
              ],
              temperature: 0.7
            },
            voice: {
              provider: "11labs",
              voiceId: "21m00Tcm4TlvDq8ikWAM"
            },
            silenceTimeoutSeconds: 60,
            maxDurationSeconds: 2400,
            endCallMessage: null
          };
          await vapi.start(config);

          setIsGenerating(false);
          setCurrentQuestionIndex(1);

        } else {
          setInterviewCreationStatus('failed');
          setError('No interview ID found in API response');
          setIsGenerating(false);
          setCurrentStep('Interview generation failed...');
          return;
        }
      } else if (response.status === 401) {
        setInterviewCreationStatus('failed');
        setError('Authentication failed. Please login again.');
        setIsGenerating(false);
        setCurrentStep('Interview generation failed...');
        return;
      } else {
        setInterviewCreationStatus('failed');
        const errorText = await response.text();
        setError(`HTTP ${response.status}: ${errorText}`);
        setIsGenerating(false);
        setCurrentStep('Interview generation failed...');
        return;
      }
    } catch (error) {
      setInterviewCreationStatus('failed');
      setError(`Sorry, I couldn't generate the interview: ${error.message}. Please try the direct generation option.`);
      setIsGenerating(false);
      setCurrentStep('Interview generation failed...');
      return;
    }
  };

  // ... rest of your file unchanged ...

  // ✅ Enhanced direct generation
 const handleDirectGeneration = async () => {
 if (!formData.amount || isNaN(parseInt(formData.amount))) {
   setError("Please select a valid number of questions.");
   return;
 }
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

     console.log('🧪 Direct generation at', CURRENT_TIME, 'with data:', requestData);

     const response = await makeApiRequest('/api/interviews/generate', {
       method: 'POST',
       body: JSON.stringify(requestData)
     });
     console.log("Triggering interview generation API call...");
         console.log("API response:", response);

     if (!response.ok) {
       const errorText = await response.text();
       console.error('❌ Interview creation failed: raw response:', errorText);
       if (response.status === 401) {
         setError('❌ Authentication failed. Please login again.');
         throw new Error('Authentication failed. Please login again.');
       }
       setError(`❌ Generation failed (HTTP ${response.status}): ${errorText}`);
       return null;
     }

     const responseData = await response.json();
     console.log('Interview generation response:', responseData);

     // PATCH: Check for both success and interviewId
     if (responseData.success && responseData.interviewId) {
       setSuccess(`✅ Interview generated! ID: ${responseData.interviewId}. Generating comprehensive feedback...`);
       localStorage.setItem('lastGeneratedInterviewId', responseData.interviewId);

       // Generate feedback as before
       const feedbackData = {
         interviewId: parseInt(responseData.interviewId),
         userId: parseInt(userInfo.userId),
         transcript: [
           {
             role: "assistant",
             content: `Direct generation interview created for ${userInfo.username} on ${CURRENT_TIME}. Role: ${formData.role}, Type: ${formData.type}, Level: ${formData.level}`,
             timestamp: new Date().toISOString()
           },
           {
             role: "user",
             content: `User successfully generated ${formData.amount} ${formData.type} interview questions for ${formData.role} position using direct generation mode at ${CURRENT_TIME}`,
             timestamp: new Date().toISOString()
           }
         ],
         overallScore: 7,
         communicationScore: 7,
         technicalScore: formData.type === 'technical' ? 8 : 7,
         problemSolvingScore: 7,
         strengths: `Successfully completed interview generation process for ${formData.role} position\nSelected appropriate ${formData.type} interview type for ${formData.level} level\nChose ${formData.amount} questions for comprehensive assessment\nGenerated on ${CURRENT_TIME} by ${userInfo.username}`,
         improvements: `Try the voice interview mode for a more comprehensive experience\nPractice answering the generated questions out loud\nConsider scheduling a voice interview session for real-time feedback\nReview the specific technologies: ${formData.techstack.join(', ')}`,
         duration: 300,
         totalQuestions: parseInt(formData.amount),
         totalAnswers: 0,
         interviewMetadata: {
           role: formData.role,
           type: formData.type,
           level: formData.level,
           techstack: formData.techstack,
           completedAt: new Date().toISOString(),
           user: userInfo.username,
           mode: 'direct_generation',
           timestamp: CURRENT_TIME,
           sessionId: Date.now().toString()
         }
       };

       console.log('📊 Generating direct mode feedback at', CURRENT_TIME, ':', feedbackData);

       const feedbackResponse = await makeApiRequest(`/api/interviews/${responseData.interviewId}/feedback`, {
         method: 'POST',
         body: JSON.stringify(feedbackData)
       });

       if (feedbackResponse.ok) {
         const feedbackResult = await feedbackResponse.json();
         console.log('✅ Comprehensive feedback generated for direct mode at', CURRENT_TIME, ':', feedbackResult);
         setSuccess(`✅ Interview and feedback generated successfully! Redirecting...`);
       } else {
         const feedbackErrorText = await feedbackResponse.text();
         console.warn('⚠️ Failed to generate feedback, but interview created successfully. Feedback error:', feedbackErrorText);
         setSuccess(`✅ Interview generated successfully! Redirecting...`);
       }

       setTimeout(() => {
         navigate(`/feedback/${responseData.interviewId}`);
         localStorage.removeItem('lastGeneratedInterviewId');
       }, 2000);

       return responseData;
     } else {
       // PATCH: Always log the error response
       setError(`❌ Generation failed: ${responseData.error || responseData.message || 'Unknown error'}`);
       console.error('Interview creation failed:', responseData);
       return null;
     }

   } catch (error) {
     console.error('🧪 Direct generation failed at', CURRENT_TIME, ':', error);
     setError(error.message || '❌ Generation failed: Unknown error');
     return null;
   }
 };

  // ✅ Enhanced control handlers
 const handleStopCall = async () => {
   console.log('End Interview Clicked');
   console.log('vapi:', vapi);
   console.log('callStatus:', callStatus);
   if (vapi && callStatus !== 'idle') {
     console.log('Stopping VAPI call...');
     vapi.stop();
   } else {
     console.log('VAPI not ready or callStatus is idle');
   }
 };
    // ✅ Manually emit function-call using transcript



  const handleToggleMute = () => {
    if (vapi) {
      vapi.setMuted(!isMuted);
      setIsMuted(!isMuted);
      console.log('🔇 Mute toggled at', CURRENT_TIME, '- Muted:', !isMuted);
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
    console.log('🔄 Form reset at', CURRENT_TIME, 'for', CURRENT_USER);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* ✅ Enhanced Header */}
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

          {/* ✅ Enhanced Welcome Message */}
          <Paper sx={{ p: 3, mb: 3, backgroundColor: 'rgba(123, 31, 162, 0.15)', border: '1px solid rgba(123, 31, 162, 0.3)', borderRadius: '12px' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <AutoAwesomeIcon sx={{ color: '#7b1fa2', fontSize: 30 }} />
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Welcome back, {username}! 👋
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  Session time: {CURRENT_TIME} UTC • Ready for your complete mock interview experience?
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* ✅ Status Messages */}
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

          {/* ✅ Enhanced Feedback Processing Display */}
          {feedbackProcessing && (
            <Paper sx={{ p: 4, mb: 3, textAlign: 'center', backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', borderRadius: '16px' }}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, backgroundColor: '#4caf50' }}>
                <CheckCircle sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6" sx={{ color: '#4caf50', mb: 1, fontWeight: 'bold' }}>
                🧠 Generating Your Interview Feedback
              </Typography>
              <Typography variant="body1" sx={{ color: '#ccc', mb: 2 }}>
                {currentStep}
              </Typography>
              <LinearProgress
                sx={{
                  mb: 2,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4caf50',
                    borderRadius: 4,
                  }
                }}
              />
              <Typography variant="caption" sx={{ color: '#888' }}>
                Processing at {CURRENT_TIME} for {userInfo.username} • Usually takes 3-5 seconds
              </Typography>
            </Paper>
          )}

          {/* ✅ Main Content */}
          {!isGenerating && !feedbackProcessing ? (
            /* Interview Form */
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
                      <MenuItem value={3}>3 Questions (Quick - 10 min)</MenuItem>
                      <MenuItem value={5}>5 Questions (Standard - 15 min)</MenuItem>
                      <MenuItem value={7}>7 Questions (Detailed - 25 min)</MenuItem>
                      <MenuItem value={10}>10 Questions (Comprehensive - 35 min)</MenuItem>
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
            /* ✅ Enhanced Active Interview UI */
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
             {(callStatus === 'active' || callStatus === 'connecting') && (
               <Stack direction="row" spacing={2} justifyContent="center" sx={{ my: 3 }}>
                 <Button
                   variant="outlined"
                   size="medium"
                   startIcon={<BugReportIcon />}
                   onClick={handleManualFunctionCallFromTranscript}
                   disabled={!vapi}
                   sx={{
                     borderColor: '#4caf50',
                     color: '#4caf50',
                     '&:hover': {
                       borderColor: '#388e3c',
                       color: '#388e3c',
                       backgroundColor: 'rgba(76, 175, 80, 0.1)'
                     }
                   }}
                 >
                   🛠 Emit Function Call from Transcript
                 </Button>
               </Stack>
             )}

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
                      <LinearProgress
                        variant="determinate"
                        value={(currentQuestionIndex / parseInt(formData.amount)) * 100}
                        sx={{
                          mt: 1,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            borderRadius: 4,
                          }
                        }}
                      />
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

              {/* Session Info */}
              <Typography variant="caption" sx={{ opacity: 0.7, mt: 3, display: 'block' }}>
                Session: {CURRENT_TIME} • User: {username} • Auto-feedback enabled
              </Typography>

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