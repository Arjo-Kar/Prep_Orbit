import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import Vapi from '@vapi-ai/web';

// ---------------------------------------------------------------------
// Constants (consider moving to .env)
// ---------------------------------------------------------------------
const VAPI_PUBLIC_KEY = 'd47641df-6392-43d8-b540-04a3a481a3be';
const NGROK_URL = 'https://5b11c4dc0e03.ngrok-free.app';
const CURRENT_TIME = '2025-09-05 17:56:41';

// ---------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#100827', paper: '#151515' },
    primary: { main: '#7b1fa2' },
    secondary: { main: '#f50057' },
    success: { main: '#4caf50' },
    text: { primary: '#ffffff', secondary: '#cccccc' },
  },
  typography: {
    fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif'
  }
});

const GradientBox = styled(Box)(() => ({
  background: 'linear-gradient(135deg,#100827 0%,#1a0f3d 50%,#291a54 100%)',
  minHeight: '100vh',
  color: 'white'
}));

const StyledCard = styled(Card)(() => ({
  background: 'linear-gradient(180deg,#1c1c1c 0%,#101010 100%)',
  border: '1px solid #444',
  borderRadius: 16
}));

const PulsingAvatar = styled(Avatar)(() => ({
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)', opacity: 1 },
    '50%': { transform: 'scale(1.05)', opacity: 0.85 },
    '100%': { transform: 'scale(1)', opacity: 1 }
  }
}));

const GlowingButton = styled(Button)(() => ({
  position: 'relative',
  overflow: 'hidden',
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

// ---------------------------------------------------------------------
// Utility: extract plausible text from arbitrary event payload
// ---------------------------------------------------------------------
function extractAnyText(raw) {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw.text === 'string' && raw.text.trim()) return raw.text.trim();
  if (typeof raw.content === 'string' && raw.content.trim()) return raw.content.trim();
  if (Array.isArray(raw.content)) {
    const joined = raw.content
      .map(part => {
        if (typeof part === 'string') return part;
        if (part?.text) return part.text;
        if (part?.content) return part.content;
        return '';
      })
      .filter(Boolean)
      .join(' ')
      .trim();
    if (joined) return joined;
  }
  // Deep flatten search
  const candidates = [];
  const stack = [raw];
  const seen = new Set();
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== 'object' || seen.has(node)) continue;
    seen.add(node);
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && v.trim()) {
        if (k.match(/text|content|transcript|message/i)) candidates.push(v.trim());
      } else if (Array.isArray(v)) {
        v.forEach(el => stack.push(el));
      } else if (typeof v === 'object') stack.push(v);
    }
  }
  candidates.sort((a,b) => b.length - a.length);
  return candidates[0] || '';
}

// Relative time helper
function formatRelative(start, ts) {
  if (!start) return '';
  const diffMs = new Date(ts).getTime() - start;
  if (diffMs < 0) return '0.0s';
  return (diffMs / 1000).toFixed(1) + 's';
}

function InterviewGeneratorPage() {
  const navigate = useNavigate();

  // Core states
  const [vapi, setVapi] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle | connecting | active
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callStartTimeRef = useRef(null);

  // Interview data
  const [interviewIdState, setInterviewIdState] = useState(null);
  const [interviewCreationStatus, setInterviewCreationStatus] = useState('idle');
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Transcript
  const [conversationTranscript, setConversationTranscript] = useState([]);
  const transcriptRef = useRef([]);
  const [liveUserPartial, setLiveUserPartial] = useState(''); // streaming partial user speech
  const [currentStep, setCurrentStep] = useState('');
  const transcriptScrollRef = useRef(null);
  const lastAssistantQuestionRef = useRef(''); // duplicate suppression
  const partialCommitTimerRef = useRef(null);

  // Form
  const [formData, setFormData] = useState({
    role: '',
    type: 'technical',
    level: 'mid',
    techstack: [],
    amount: '5'
  });
  const [techInput, setTechInput] = useState('');

  // UX
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [feedbackProcessing, setFeedbackProcessing] = useState(false);
  const feedbackPostedRef = useRef(false);

  // Show fullscreen session UI logic
  const showInterviewUI =
    callStatus !== 'idle' ||
    feedbackProcessing ||
    (isGenerating && callStatus === 'connecting');

  // User info
  const getUserInfo = () => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = storedUser.id || localStorage.getItem('userId') || '1';
    const username = storedUser.name || storedUser.username || 'Guest';
    const authToken =
      localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!authToken) setError('Authentication required. Please login again.');
    return { userId, username, authToken };
  };
  const { username } = getUserInfo();

  // API helper
  const makeApiRequest = async (endpoint, options = {}) => {
    const { authToken } = getUserInfo();
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      credentials: 'include',
      ...options
    };
    return fetch(`${NGROK_URL}${endpoint}`, defaultOptions);
  };

  // Append transcript
  const appendTranscript = useCallback((entry) => {
    setConversationTranscript(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === entry.role && last.content === entry.content) {
        return prev;
      }
      const updated = [...prev, entry];
      transcriptRef.current = updated;
      return updated;
    });
  }, []);

  // Auto scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [conversationTranscript, liveUserPartial]);

  // Partial commit timer
  const schedulePartialCommit = () => {
    if (partialCommitTimerRef.current) clearTimeout(partialCommitTimerRef.current);
    if (!liveUserPartial) return;
    partialCommitTimerRef.current = setTimeout(() => {
      if (liveUserPartial) {
        appendTranscript({
          role: 'user',
          content: liveUserPartial + ' (partial)',
          timestamp: new Date().toISOString(),
          isAnswer: true
        });
        setLiveUserPartial('');
      }
    }, 1600);
  };

 const lastFeedbackPostRef = useRef(0);

 // Utility to sleep
 const sleep = (ms) => new Promise(r => setTimeout(r, ms));

 // Enhanced generation with defer + retry
 const generateInterviewFeedback = async (reason = 'manual', externalTranscript = null) => {
   if (feedbackProcessing || feedbackPostedRef.current) return;

   // Wait for transcript to stabilize: no new messages for 1200ms OR max wait 3000ms
   const STABILIZE_WINDOW = 1200;
   const MAX_WAIT = 3000;
   let idleTime = 0;
   let lastCount = transcriptRef.current.length;

   while (idleTime < MAX_WAIT) {
     await sleep(300);
     const currentCount = transcriptRef.current.length;
     if (currentCount === lastCount) {
       idleTime += 300;
       if (idleTime >= STABILIZE_WINDOW) break;
     } else {
       lastCount = currentCount;
       idleTime = 0;
     }
   }

   // Flush remaining partial
   if (liveUserPartial && !transcriptRef.current.find(m => m.content === liveUserPartial)) {
     appendTranscript({
       role: 'user',
       content: liveUserPartial,
       timestamp: new Date().toISOString(),
       isAnswer: true
     });
     setLiveUserPartial('');
   }

   let usableTranscript = externalTranscript || transcriptRef.current;
   if (!usableTranscript || usableTranscript.length < 2) {
     console.warn('[FEEDBACK][POST] Transcript too short, delaying 1s...');
     await sleep(1000);
     usableTranscript = transcriptRef.current;
   }
   if (!usableTranscript || usableTranscript.length < 2) {
     setError('Cannot generate feedback: Insufficient transcript.');
     return;
   }

   const interviewId = interviewIdState || localStorage.getItem('lastGeneratedInterviewId');
   if (!interviewId) {
     setError('No interview ID to save feedback.');
     return;
   }

   const { userId } = getUserInfo();
   if (!userId) {
     setError('User ID missing.');
     return;
   }

   const payload = {
     interviewId,
     userId,
     transcript: usableTranscript,
     responses: [],
     totalQuestions: interviewQuestions.length,
     totalAnswers: usableTranscript.filter(m => m.role === 'user').length,
     duration: callStartTimeRef.current
       ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
       : 0,
     interviewMetadata: {
       startedAt: callStartTimeRef.current
         ? new Date(callStartTimeRef.current).toISOString()
         : new Date().toISOString(),
       endedAt: new Date().toISOString(),
       environment: 'voice-ai',
       reason
     }
   };

   const postOnce = async () => {
     return makeApiRequest(`/api/interviews/${interviewId}/feedback`, {
       method: 'POST',
       body: JSON.stringify(payload)
     });
   };

   try {
     setFeedbackProcessing(true);
     let attempt = 0;
     let res;
     let bodyText = '';

     while (attempt < 3) {
       attempt++;
       console.log(`[FEEDBACK][POST][Attempt ${attempt}] messages=${payload.transcript.length}`);
       res = await postOnce();
       bodyText = await res.text();
       console.log('[FEEDBACK][POST][RAW]', res.status, bodyText.slice(0, 400));

       if (res.ok) break;

       // Detect throttle message (custom or HTTP status)
       if (res.status === 429 || bodyText.toLowerCase().includes('throttled')) {
         // Extract seconds if present
         let waitSeconds = 11; // default fallback
         const match = bodyText.match(/retry in (\d+)s/i);
         if (match) waitSeconds = parseInt(match[1], 10) + 1;
         console.warn(`[FEEDBACK][POST] Throttled. Waiting ${waitSeconds}s before retry...`);
         await sleep(waitSeconds * 1000);
         continue;
       }

       // Non-throttle failure: do not loop further
       break;
     }

     if (!res || !res.ok) {
       setError(`Feedback generation failed (${res ? res.status : 'no-response'}). Showing fallback.`);
       // Navigate anyway; feedback page will fallback gracefully
       navigate(`/interview/${interviewId}/feedback?fallback=1&code=${res ? res.status : 'na'}`);
       return;
     }

     feedbackPostedRef.current = true;
     lastFeedbackPostRef.current = Date.now();
     // Store transcript size for fallback improvement logic on feedback page
     localStorage.setItem(`transcript_len_${interviewId}`, String(payload.transcript.length));
     navigate(`/interview/${interviewId}/feedback`);
   } catch (e) {
     console.error('[FEEDBACK][POST][EXCEPTION]', e);
     setError('Failed to generate feedback: ' + (e.message || 'Unknown error'));
   } finally {
     setFeedbackProcessing(false);
   }
 };
  // VAPI initialization
  useEffect(() => {
    const vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
    setVapi(vapiInstance);

    const ALL_DEBUG_EVENTS = [
      'call-start','call-end','error','message',
      'speech-transcript','transcript',
      'partial-transcript','final-transcript',
      'transcript.partial','transcript.final',
      'conversation.update','conversation.updated',
      'speech-start','speech-end'
    ];

    ALL_DEBUG_EVENTS.forEach(evt => {
      vapiInstance.on(evt, payload => {
        console.log(`[VAPI DEBUG] ${evt}`, payload);
      });
    });

    // Additional possible ASR events in newer SDKs
    ['speech.recognition.partial', 'speech.recognition.final'].forEach(evt => {
      vapiInstance.on(evt, data => {
        const text = extractAnyText(data);
        if (!text) return;
        if (evt.endsWith('partial')) {
          setLiveUserPartial(text);
          schedulePartialCommit();
        } else {
          // final
          if (liveUserPartial && text.length < liveUserPartial.length) {
            appendTranscript({
              role: 'user',
              content: liveUserPartial,
              timestamp: new Date().toISOString(),
              isAnswer: true
            });
          } else {
            appendTranscript({
              role: 'user',
              content: text,
              timestamp: new Date().toISOString(),
              isAnswer: true
            });
          }
          setLiveUserPartial('');
        }
      });
    });

    vapiInstance.on('call-start', () => {
      callStartTimeRef.current = Date.now();
      setCallStatus('active');
      setIsGenerating(false);
      setError('');
      setSuccess('🎤 Connected! Interview starting...');
      setConversationTranscript([]);
      transcriptRef.current = [];
      setLiveUserPartial('');
      setCurrentStep('Beginning interview...');
      setCurrentQuestionIndex(0);
      lastAssistantQuestionRef.current = '';
      feedbackPostedRef.current = false;
    });

    // Assistant messages
    vapiInstance.on('message', raw => {
      const text = extractAnyText(raw);
      if (!text) return;
      const normalized = text.replace(/\s+/g,' ').trim().toLowerCase();
      if (normalized && normalized === lastAssistantQuestionRef.current) {
        console.log('🔁 Suppressed duplicate assistant output.');
        return;
      }
      lastAssistantQuestionRef.current = normalized;

      const looksLikeQuestion = /\?$/.test(text.trim()) || /^[0-9]+\./.test(text.trim());
      if (looksLikeQuestion) {
        setCurrentQuestionIndex(prev => prev + 1);
      }

      appendTranscript({
        role: raw.role || 'assistant',
        content: text,
        timestamp: new Date().toISOString(),
        isAnswer: false
      });
    });

    // Transcript-related events
    const transcriptLikeEvents = [
      'speech-transcript','transcript',
      'partial-transcript','final-transcript',
      'transcript.partial','transcript.final',
      'conversation.update','conversation.updated'
    ];

    transcriptLikeEvents.forEach(evt => {
      vapiInstance.on(evt, data => {
        const text = extractAnyText(data);
        if (!text) return;
        const isPartial = evt.includes('partial') || evt.includes('update');

        if (isPartial) {
          setLiveUserPartial(text);
          schedulePartialCommit();
        } else {
          // final
          if (liveUserPartial && text === liveUserPartial) {
            appendTranscript({
              role: 'user',
              content: text,
              timestamp: new Date().toISOString(),
              isAnswer: true
            });
            setLiveUserPartial('');
          } else {
            setLiveUserPartial('');
            appendTranscript({
              role: 'user',
              content: text,
              timestamp: new Date().toISOString(),
              isAnswer: true
            });
          }
        }
      });
    });

    vapiInstance.on('speech-start', () => {
      setCurrentStep('Listening...');
    });

    vapiInstance.on('speech-end', () => {
      setCurrentStep('Processing your response...');
    });

   vapiInstance.on('call-end', () => {
     // Give final transcript events a little more time (2s) before generation
     const FINAL_DELAY_MS = 2000;
     if (liveUserPartial) {
       appendTranscript({
         role: 'user',
         content: liveUserPartial,
         timestamp: new Date().toISOString(),
         isAnswer: true
       });
       setLiveUserPartial('');
     }
     setTimeout(async () => {
       if (transcriptRef.current.length > 0) {
         await generateInterviewFeedback('call-end', transcriptRef.current);
       } else {
         setError('Cannot generate feedback: No transcript captured.');
         setFeedbackProcessing(false);
       }
       setCallStatus('idle');
       setIsGenerating(false);
     }, FINAL_DELAY_MS);
   });

    vapiInstance.on('error', async (err) => {
      const normalEnd =
        err?.errorMsg === 'Meeting has ended' ||
        err?.error?.msg === 'Meeting has ended' ||
        err?.type === 'call-ended' ||
        (err?.action === 'error' && err?.error?.type === 'ejected');

      if (normalEnd) {
        if (liveUserPartial) {
          appendTranscript({
            role: 'user',
            content: liveUserPartial,
            timestamp: new Date().toISOString(),
            isAnswer: true
          });
          setLiveUserPartial('');
        }
        if (transcriptRef.current.length > 0 && !feedbackPostedRef.current) {
          await generateInterviewFeedback('error-normal', transcriptRef.current);
        }
        setCallStatus('idle');
        setIsGenerating(false);
        return;
      }
      setError('Voice call failed. Try direct generation.');
      setCallStatus('idle');
      setIsGenerating(false);
    });

    return () => {
      try { vapiInstance.stop(); } catch (e) {}
      if (partialCommitTimerRef.current) clearTimeout(partialCommitTimerRef.current);
      setVapi(null);
    };
  }, [appendTranscript, liveUserPartial]);

  // Diagnostic: if no user transcript after 10s of active
  useEffect(() => {
    if (callStatus === 'active') {
      const diag = setTimeout(() => {
        if (conversationTranscript.filter(m => m.role === 'user').length === 0) {
          console.warn('[DIAG] No user transcript messages yet. Check event names / mic.');
        }
      }, 10000);
      return () => clearTimeout(diag);
    }
  }, [callStatus, conversationTranscript]);

  // Duration timer
  useEffect(() => {
    let interval;
    if (callStatus === 'active' && callStartTimeRef.current) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleAddTech = () => {
    const tech = techInput.trim();
    if (tech && !formData.techstack.includes(tech)) {
      setFormData(prev => ({ ...prev, techstack: [...prev.techstack, tech] }));
      setTechInput('');
    }
  };
  const handleRemoveTech = tech =>
    setFormData(prev => ({ ...prev, techstack: prev.techstack.filter(t => t !== tech) }));
  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTech();
    }
  };

  const handleStartVoiceInterview = async () => {
    if (!formData.amount || isNaN(parseInt(formData.amount))) {
      setError('Please select a valid number of questions.');
      return;
    }
    if (!vapi) {
      setError('Voice service not ready. Refresh the page.');
      return;
    }
    try {
      setError('');
      setCallStatus('connecting');
      setIsGenerating(true);
      setCurrentStep('Generating interview questions...');
      const { userId, username } = getUserInfo();
      const requestData = {
        role: formData.role || 'Software Engineer',
        type: formData.type,
        level: formData.level,
        techstack: formData.techstack.length > 0
          ? formData.techstack
          : ['JavaScript', 'React'],
        amount: parseInt(formData.amount) || 5,
        userId: parseInt(userId)
      };

      const response = await makeApiRequest('/api/interviews/generate', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        let questions = data.interview?.questions || data.questions || [];
        if (typeof questions === 'string') {
          try { questions = JSON.parse(questions); } catch {}
        }
        setInterviewQuestions(questions);

        const interviewId = data.interviewId ||
          data.id ||
          data.data?.id ||
          data.interview?.id ||
          data.data?.interviewId;
        if (interviewId) {
          localStorage.setItem('lastGeneratedInterviewId', interviewId.toString());
          setInterviewIdState(interviewId.toString());
          setInterviewCreationStatus('created');
        } else {
          setInterviewCreationStatus('failed');
          setError('No interview ID found in response.');
        }

        const systemPrompt = `You are an AI interview assistant conducting a STRICTLY SEQUENTIAL interview.
Rules:
1. You have EXACTLY ${requestData.amount} questions. Ask ONE at a time in order, never repeat a previous one.
2. After asking a question, WAIT for the user's answer (do not re-ask).
3. Do NOT restate or paraphrase prior questions.
4. When all questions are finished, say: "Interview complete. Generating feedback now." then remain silent.
5. Do NOT apologize unless necessary. Be concise.
Questions:
${(Array.isArray(questions) ? questions : []).map((q,i)=>`${i+1}. ${q}`).join('\n')}
Begin only after greeting if you haven't already.`;

        const config = {
          firstMessage: `Hello ${username}! I will conduct a mock interview with ${requestData.amount} ${requestData.type} questions for a ${requestData.level} level ${requestData.role} role. Are you ready?`,
          model: {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.6
          },
          voice: {
            provider: '11labs',
            voiceId: '21m00Tcm4TlvDq8ikWAM'
          },
          silenceTimeoutSeconds: 60,
          maxDurationSeconds: 2400,
          endCallMessage: null
          // Optionally add transcriber here if confirmed by SDK:
          // transcriber: { provider: 'openai', model: 'gpt-4o-mini-transcribe' },
        };

        await vapi.start(config);
      } else {
        const txt = await response.text();
        setError(`Interview generation failed: ${response.status} ${txt}`);
        setCallStatus('idle');
        setIsGenerating(false);
      }
    } catch (e) {
      setError(`Failed to start interview: ${e.message}`);
      setCallStatus('idle');
      setIsGenerating(false);
    }
  };

  const handleDirectGeneration = async () => {
    if (!formData.amount || isNaN(parseInt(formData.amount))) {
      setError('Please select a valid number of questions.');
      return;
    }
    try {
      setError('');
      setSuccess('Generating interview (questions only)...');
      const { userId } = getUserInfo();
      if (!formData.role.trim()) {
        setError('Enter a job role first.');
        return;
      }
      const requestData = {
        role: formData.role || 'Software Engineer',
        type: formData.type,
        level: formData.level,
        techstack: formData.techstack.length > 0
          ? formData.techstack
          : ['JavaScript', 'React'],
        amount: parseInt(formData.amount),
        userId: parseInt(userId)
      };
      const response = await makeApiRequest('/api/interviews/generate', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      if (!response.ok) {
        const txt = await response.text();
        setError(`Generation failed: ${response.status} ${txt}`);
        return;
      }
      const data = await response.json();
      if (data.success && data.interviewId) {
        setSuccess('Interview generated! Redirecting...');
        localStorage.setItem('lastGeneratedInterviewId', data.interviewId);
        setTimeout(() => navigate(`/feedback/${data.interviewId}`), 1500);
      } else {
        setError('Generation failed: missing interviewId.');
      }
    } catch (e) {
      setError(e.message || 'Generation failed.');
    }
  };

  const handleStopCall = async () => {
    if (vapi && callStatus !== 'idle') {
      try { vapi.stop(); } catch {}
      if (liveUserPartial) {
        appendTranscript({
          role: 'user',
          content: liveUserPartial,
          timestamp: new Date().toISOString(),
          isAnswer: true
        });
        setLiveUserPartial('');
      }
      if (transcriptRef.current.length > 0) {
        await generateInterviewFeedback('manual-stop', transcriptRef.current);
      } else {
        setError('No transcript captured to generate feedback.');
      }
    }
  };

  const handleToggleMute = () => {
    if (vapi) {
      vapi.setMuted(!isMuted);
      setIsMuted(m => !m);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2,'0')}`;
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
      {showInterviewUI ? (
        <Box
          sx={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg,#7b1fa2,#f50057)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <PulsingAvatar
              sx={{
                width: 90,
                height: 90,
                background: 'rgba(255,255,255,0.15)'
              }}
            >
              <PhoneIcon sx={{ fontSize: 48 }} />
            </PulsingAvatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {callStatus === 'connecting'
                  ? 'Connecting...'
                  : (callStatus === 'active'
                    ? 'Interview In Progress'
                    : feedbackProcessing
                      ? 'Finalizing Feedback'
                      : 'Session')}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {currentStep || (callStatus === 'connecting'
                  ? 'Setting up your interview...'
                  : 'Preparing...')}
              </Typography>
              {callStatus === 'active' && callStartTimeRef.current && (
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Duration: {formatTime(callDuration)}
                </Typography>
              )}
            </Box>
            <Box flexGrow={1} />
            <Stack direction="row" spacing={1}>
              {callStatus === 'active' && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleToggleMute}
                  startIcon={isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  sx={{ color: '#fff', borderColor: '#fff' }}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={handleStopCall}
                startIcon={<CallEndIcon />}
                sx={{ color: '#fff', borderColor: '#fff' }}
              >
                End
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              px: 4,
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            {currentQuestionIndex > 0 && (
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(currentQuestionIndex / parseInt(formData.amount || 1)) * 100}
                  sx={{
                    mt: 0.5,
                    width: 200,
                    height: 8,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.25)',
                    '& .MuiLinearProgress-bar': {
                      background: 'rgba(255,255,255,0.9)'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  Question {currentQuestionIndex} / {formData.amount}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Transcript Panel */}
          <Box
            ref={transcriptScrollRef}
            sx={{
              flexGrow: 1,
              mx: 3,
              mb: 2,
              background: 'rgba(0,0,0,0.35)',
              borderRadius: 2,
              p: 2,
              overflowY: 'auto',
              backdropFilter: 'blur(4px)'
            }}
          >
            {conversationTranscript.length === 0 && !liveUserPartial ? (
              <Typography
                variant="body2"
                sx={{ opacity: 0.75, textAlign: 'center', mt: 4 }}
              >
                Transcript will appear live here...
              </Typography>
            ) : (
              <>
                {conversationTranscript.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        background:
                          msg.role === 'user'
                            ? 'linear-gradient(135deg,#2196f3,#1976d2)'
                            : 'linear-gradient(135deg,#ffffff22,#ffffff10)',
                        color: '#fff',
                        fontSize: '.9rem',
                        position: 'relative',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.content}
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          bottom: -16,
                          right: 4,
                          opacity: 0.55,
                          fontSize: '0.65rem'
                        }}
                      >
                        {formatRelative(callStartTimeRef.current, msg.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {liveUserPartial && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      mb: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg,#64b5f6,#1976d2)',
                        color: '#fff',
                        fontSize: '.9rem',
                        opacity: 0.7,
                        fontStyle: 'italic',
                        position: 'relative'
                      }}
                    >
                      {liveUserPartial}
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          bottom: -16,
                          right: 4,
                          opacity: 0.55,
                          fontSize: '0.65rem'
                        }}
                      >
                        (live)
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Footer / status */}
          <Box
            sx={{
              px: 3,
              pb: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Session {CURRENT_TIME} • User {username}
            </Typography>
            {feedbackProcessing && (
              <Typography
                variant="caption"
                sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <CircularProgress size={12} color="inherit" />
                Generating feedback...
              </Typography>
            )}
          </Box>

          {/* Animated bar */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'rgba(255,255,255,0.25)',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                height: '100%',
                background: 'linear-gradient(90deg,#00ff87,#60efff)',
                animation: 'progress 3s ease-in-out infinite',
                '@keyframes progress': {
                  '0%': { transform: 'translateX(-100%)' },
                  '50%': { transform: 'translateX(0)' },
                  '100%': { transform: 'translateX(100%)' }
                }
              }}
            />
          </Box>
        </Box>
      ) : (
        // Pre-interview Form Layout
        <GradientBox>
          <Container maxWidth="md" sx={{ py: 4 }}>
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
                  background: 'linear-gradient(to right,#a0d8ff,#ff80ab)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                AI Interview Generator 🎤
              </Typography>
            </Box>

            <Paper
              sx={{
                p: 3, mb: 3,
                backgroundColor: 'rgba(123,31,162,0.15)',
                border: '1px solid rgba(123,31,162,0.3)',
                borderRadius: 2
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <AutoAwesomeIcon sx={{ color: '#7b1fa2', fontSize: 30 }} />
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Welcome back, {username}! 👋
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Session time: {CURRENT_TIME} UTC • Ready for a complete mock interview?
                  </Typography>
                </Box>
              </Box>
            </Paper>

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

            <StyledCard>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <PsychologyIcon sx={{ color: '#7b1fa2', fontSize: 32 }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                    Complete Interview Experience
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
                  Choose a voice-driven interview (full experience + feedback) or generate questions only.
                </Typography>

                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Job Role"
                    placeholder="e.g., Frontend Developer, Product Manager"
                    value={formData.role}
                    onChange={e => handleInputChange('role', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#333',
                        '& fieldset': { borderColor: '#555' },
                        '&:hover fieldset': { borderColor: '#7b1fa2' },
                        '&.Mui-focused fieldset': { borderColor: '#7b1fa2' }
                      },
                      '& .MuiInputLabel-root': { color: '#aaa' },
                      '& .MuiOutlinedInput-input': { color: 'white' }
                    }}
                  />

                  <Box display="flex" gap={2}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#aaa' }}>Interview Type</InputLabel>
                      <Select
                        value={formData.type}
                        label="Interview Type"
                        onChange={e => handleInputChange('type', e.target.value)}
                        sx={{
                          backgroundColor: '#333',
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' }
                        }}
                      >
                        <MenuItem value="technical">🔧 Technical</MenuItem>
                        <MenuItem value="behavioral">🧠 Behavioral</MenuItem>
                        <MenuItem value="mixed">🎯 Mixed</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#aaa' }}>Experience Level</InputLabel>
                      <Select
                        value={formData.level}
                        label="Experience Level"
                        onChange={e => handleInputChange('level', e.target.value)}
                        sx={{
                          backgroundColor: '#333',
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' }
                        }}
                      >
                        <MenuItem value="junior">🌱 Junior</MenuItem>
                        <MenuItem value="mid">🚀 Mid-level</MenuItem>
                        <MenuItem value="senior">⭐ Senior</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <TextField
                      fullWidth
                      label="Add Technology/Skill"
                      placeholder="e.g., React, Node.js, AWS"
                      value={techInput}
                      onChange={e => setTechInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#333',
                          '& fieldset': { borderColor: '#555' },
                          '&:hover fieldset': { borderColor: '#7b1fa2' },
                          '&.Mui-focused fieldset': { borderColor: '#7b1fa2' }
                        },
                        '& .MuiInputLabel-root': { color: '#aaa' },
                        '& .MuiOutlinedInput-input': { color: 'white' }
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
                          {formData.techstack.map((tech, i) => (
                            <Chip
                              key={i}
                              label={tech}
                              onDelete={() => handleRemoveTech(tech)}
                              sx={{
                                backgroundColor: '#7b1fa2',
                                color: '#fff',
                                mb: 1,
                                '& .MuiChip-deleteIcon': { color: '#fff' }
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>

                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#aaa' }}>Number of Questions</InputLabel>
                    <Select
                      value={formData.amount}
                      label="Number of Questions"
                      onChange={e => handleInputChange('amount', e.target.value)}
                      sx={{
                        backgroundColor: '#333',
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7b1fa2' }
                      }}
                    >
                      <MenuItem value={3}>3 (Quick)</MenuItem>
                      <MenuItem value={5}>5 (Standard)</MenuItem>
                      <MenuItem value={7}>7 (Detailed)</MenuItem>
                      <MenuItem value={10}>10 (Comprehensive)</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 2, borderColor: '#555' }} />

                  <Stack spacing={2}>
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
                          background: 'linear-gradient(45deg,#7b1fa2,#f50057)',
                          '&:hover': {
                            background: 'linear-gradient(45deg,#9c27b0,#ff4081)'
                          },
                          '&:disabled': { background: '#555', color: '#999' }
                        }}
                      >
                        {vapi ? '🎤 Start Voice Interview' : 'Initializing Voice...'}
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
                            backgroundColor: 'rgba(156,39,176,0.15)'
                          },
                          '&:disabled': { borderColor: '#555', color: '#999' }
                        }}
                      >
                        ⚡ Generate Questions Only
                      </GlowingButton>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        size="medium"
                        fullWidth
                        startIcon={<RefreshIcon />}
                        onClick={resetForm}
                        sx={{
                          borderColor: '#555',
                          color: '#aaa',
                          '&:hover': {
                            borderColor: '#7b1fa2',
                            color: '#7b1fa2'
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
                        disabled={!formData.role.trim()}
                        sx={{
                          borderColor: '#f57c00',
                          color: '#f57c00',
                          '&:hover': {
                            borderColor: '#ff9800',
                            color: '#ff9800',
                            backgroundColor: 'rgba(255,152,0,0.15)'
                          }
                        }}
                      >
                        🧪 Test Generation
                      </Button>
                    </Stack>
                  </Stack>

                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Paper sx={{ p: 2, backgroundColor: 'rgba(123,31,162,0.12)', border: '1px solid rgba(123,31,162,0.3)', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        🎤 <strong>Voice Interview:</strong> Full sequential Q&A with live transcription & automatic feedback.
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, backgroundColor: 'rgba(245,0,87,0.12)', border: '1px solid rgba(245,0,87,0.3)', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        ⚡ <strong>Questions Only:</strong> Quickly generate interview questions for self-practice.
                      </Typography>
                    </Paper>
                  </Stack>
                </Stack>
              </CardContent>
            </StyledCard>
          </Container>
        </GradientBox>
      )}
    </ThemeProvider>
  );
}

export default InterviewGeneratorPage;