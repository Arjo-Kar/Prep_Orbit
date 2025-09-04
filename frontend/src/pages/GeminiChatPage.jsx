import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Chip,
  Fade,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
  Psychology as BrainIcon,
  Person as UserIcon,
  Code as CodeIcon,
  WorkOutline as InterviewIcon,
  School as TechIcon,
  Clear as ClearIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { askGemini } from '../api/gemini';

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

const ChatContainer = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
  border: '1px solid #444',
  height: '600px',
  display: 'flex',
  flexDirection: 'column',
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#1a1a1a',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#666',
    borderRadius: '4px',
    '&:hover': {
      background: '#777',
    },
  },
}));

const UserMessage = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #7b1fa2, #9c27b0)',
  color: 'white',
  padding: theme.spacing(2, 3),
  marginLeft: 'auto',
  marginBottom: theme.spacing(2),
  maxWidth: '80%',
  borderRadius: '20px 20px 4px 20px',
  boxShadow: '0 4px 20px rgba(123, 31, 162, 0.3)',
}));

const AIMessage = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
  color: 'white',
  padding: theme.spacing(2, 3),
  marginRight: 'auto',
  marginBottom: theme.spacing(2),
  maxWidth: '80%',
  borderRadius: '20px 20px 20px 4px',
  border: '1px solid #444',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid #444',
  background: 'rgba(26, 26, 26, 0.8)',
}));

const SendButton = styled(Button)(({ theme }) => ({
  minWidth: '120px',
  height: '56px',
  background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
  '&:hover': {
    background: 'linear-gradient(45deg, #9c27b0, #ff4081)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 15px rgba(123, 31, 162, 0.4)',
  },
  '&:disabled': {
    background: '#333',
    color: '#666',
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

const SuggestionChip = styled(Chip)(({ theme }) => ({
  background: 'rgba(123, 31, 162, 0.2)',
  color: '#bb86fc',
  border: '1px solid rgba(123, 31, 162, 0.5)',
  '&:hover': {
    background: 'rgba(123, 31, 162, 0.3)',
    borderColor: '#7b1fa2',
  },
  '& .MuiChip-icon': {
    color: '#bb86fc',
  }
}));

function GeminiChatPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = { type: 'user', content: prompt, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);
    setError(null);
    const currentPrompt = prompt;
    setPrompt('');

    try {
      const geminiResponse = await askGemini(currentPrompt);
      const aiMessage = {
        type: 'ai',
        content: geminiResponse,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError('Failed to get a response from Gemini. Please try again.');
      console.error('Gemini API error:', err);
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
      setPrompt(currentPrompt); // Restore the prompt
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setPrompt(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const suggestions = [
    { text: "Explain React hooks and their benefits", icon: <CodeIcon /> },
    { text: "How to prepare for a technical interview?", icon: <InterviewIcon /> },
    { text: "What are the latest trends in web development?", icon: <TechIcon /> },
    { text: "Explain the differences between REST and GraphQL", icon: <CodeIcon /> },
  ];

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
                      background: 'linear-gradient(135deg, #4285f4, #34a853, #fbbc05, #ea4335)',
                      boxShadow: '0 4px 20px rgba(66, 133, 244, 0.4)',
                    }}
                  >
                    <BrainIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h4"
                      component="h1"
                      fontWeight="bold"
                      sx={{
                        background: 'linear-gradient(to right, #4285f4, #34a853)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      Chat with Gemini AI ✨
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#aaa' }}>
                      Ask questions about technology, interviews, coding, and more
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={2}>
                  {messages.length > 0 && (
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={clearChat}
                      sx={{
                        borderColor: '#666',
                        color: '#ccc',
                        '&:hover': {
                          borderColor: '#f50057',
                          backgroundColor: '#f5005720',
                        }
                      }}
                    >
                      Clear Chat
                    </Button>
                  )}
                  <BackButton
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/dashboard')}
                  >
                    Back to Dashboard
                  </BackButton>
                </Stack>
              </Box>
            </CardContent>
          </HeaderCard>

          {/* Error Display */}
          {error && (
            <Fade in={!!error}>
              <Alert
                severity="error"
                variant="filled"
                sx={{
                  mb: 3,
                  borderRadius: '12px',
                  background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Suggestions */}
          {messages.length === 0 && (
            <Card sx={{ mb: 3, background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)', border: '1px solid #444' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                  Try asking about:
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  {suggestions.map((suggestion, index) => (
                    <SuggestionChip
                      key={index}
                      icon={suggestion.icon}
                      label={suggestion.text}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      clickable
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Chat Container */}
          <ChatContainer>
            <MessagesArea>
              {messages.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      background: 'linear-gradient(135deg, #4285f4, #34a853)',
                    }}
                  >
                    <SparkleIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: '#aaa', mb: 1, textAlign: 'center' }}>
                    Start a conversation with Gemini
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
                    Ask anything about technology, coding, interviews, or get help with your projects
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => (
                  <Fade in={true} key={index} timeout={500}>
                    <Box>
                      {message.type === 'user' ? (
                        <Box display="flex" alignItems="flex-start" gap={2} justifyContent="flex-end" mb={2}>
                          <UserMessage elevation={3}>
                            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                              {message.content}
                            </Typography>
                          </UserMessage>
                          <Avatar sx={{
                            width: 32,
                            height: 32,
                            background: 'linear-gradient(135deg, #7b1fa2, #9c27b0)'
                          }}>
                            <UserIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        </Box>
                      ) : (
                        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                          <Avatar sx={{
                            width: 32,
                            height: 32,
                            background: 'linear-gradient(135deg, #4285f4, #34a853)'
                          }}>
                            <BrainIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <AIMessage elevation={2}>
                            <Typography
                              variant="body1"
                              sx={{
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6
                              }}
                            >
                              {message.content}
                            </Typography>
                          </AIMessage>
                        </Box>
                      )}
                    </Box>
                  </Fade>
                ))
              )}

              {/* Loading indicator */}
              {isLoading && (
                <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                  <Avatar sx={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #4285f4, #34a853)'
                  }}>
                    <BrainIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <AIMessage elevation={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CircularProgress size={20} sx={{ color: '#4285f4' }} />
                      <Typography variant="body1" sx={{ color: '#aaa' }}>
                        Gemini is thinking...
                      </Typography>
                    </Box>
                  </AIMessage>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </MessagesArea>

            <Divider sx={{ borderColor: '#444' }} />

            {/* Input Area */}
            <InputContainer>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask Gemini a question about technology, interviews, coding..."
                    disabled={isLoading}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ChatIcon sx={{ color: '#666' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#2a2a2a',
                        borderRadius: '20px',
                        '& fieldset': {
                          borderColor: '#555',
                        },
                        '&:hover fieldset': {
                          borderColor: '#7b1fa2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#7b1fa2',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#aaa',
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white',
                      },
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <SendButton
                    type="submit"
                    variant="contained"
                    disabled={isLoading || !prompt.trim()}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </SendButton>
                </Stack>
              </Box>
            </InputContainer>
          </ChatContainer>

          {/* Tips */}
          <Card sx={{ mt: 3, background: 'rgba(123, 31, 162, 0.1)', border: '1px solid rgba(123, 31, 162, 0.3)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ color: '#bb86fc', textAlign: 'center' }}>
                💡 <strong>Pro tip:</strong> Be specific with your questions for better responses.
                Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line.
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </GradientBox>
    </ThemeProvider>
  );
}

export default GeminiChatPage;