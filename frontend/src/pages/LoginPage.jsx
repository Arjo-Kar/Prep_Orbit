import React, { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
  Link
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Code as CodeIcon,
  Psychology as Brain
} from '@mui/icons-material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';

// Dark theme matching the other pages
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#100827',
      paper: 'rgba(25, 25, 25, 0.9)',
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
          padding: '12px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(45, 45, 45, 0.5)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

// Styled components
const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
}));

const LoginCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(180deg, rgba(28, 28, 28, 0.95) 0%, rgba(16, 16, 16, 0.95) 100%)',
  border: '1px solid #444',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(20px)',
  maxWidth: '440px',
  width: '100%',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    borderRadius: '12px',
    '& fieldset': {
      borderColor: '#555',
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: '#7b1fa2',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#7b1fa2',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#aaa',
    '&.Mui-focused': {
      color: '#7b1fa2',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: 'white',
    padding: '14px',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
  '&:hover': {
    background: 'linear-gradient(45deg, #9c27b0, #ff4081)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(123, 31, 162, 0.4)',
  },
  transition: 'all 0.3s ease',
  height: '48px',
  fontSize: '1.1rem',
}));

const FloatingElement = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  background: 'linear-gradient(45deg, rgba(123, 31, 162, 0.1), rgba(245, 0, 87, 0.1))',
  filter: 'blur(40px)',
  zIndex: 0,
}));

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      console.log('Login successful:', data);

      // Store the JWT token and user info in localStorage
      localStorage.setItem('token', data.token);

      // Store user info (expects data.user to contain id, name, email, etc.)
      if (data.user && data.user.id) {
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setError('Login response missing user info. Please contact support.');
        setLoading(false);
        return;
      }

      navigate('/dashboard'); // Redirect to dashboard on success
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        {/* Floating background elements */}
        <FloatingElement
          sx={{
            width: 200,
            height: 200,
            top: '10%',
            left: '10%',
          }}
        />
        <FloatingElement
          sx={{
            width: 300,
            height: 300,
            bottom: '10%',
            right: '10%',
          }}
        />
        <FloatingElement
          sx={{
            width: 150,
            height: 150,
            top: '50%',
            left: '5%',
          }}
        />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <LoginCard>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box textAlign="center" mb={4}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    background: 'linear-gradient(135deg, #7b1fa2, #f50057)',
                    boxShadow: '0 8px 25px rgba(123, 31, 162, 0.3)',
                  }}
                >
                  <Brain sx={{ fontSize: 40 }} />
                </Avatar>

                <Typography
                  variant="h4"
                  component="h1"
                  fontWeight="bold"
                  sx={{
                    background: 'linear-gradient(to right, #a0d8ff, #ff80ab)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  Welcome to Prep_Orbit
                </Typography>

                <Typography variant="body1" sx={{ color: '#aaa', mb: 2 }}>
                  Sign in to continue your coding journey
                </Typography>

                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                  <CodeIcon sx={{ color: '#7b1fa2', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Ready to code, learn, and grow?
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 4, borderColor: '#444' }} />

              {/* Error Alert */}
              {error && (
                <Alert
                  severity="error"
                  variant="filled"
                  sx={{
                    mb: 3,
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Box component="form" onSubmit={handleSubmit}>
                <Box mb={3}>
                  <StyledTextField
                    fullWidth
                    id="email"
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#7b1fa2' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box mb={4}>
                  <StyledTextField
                    fullWidth
                    id="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#7b1fa2' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                            sx={{ color: '#aaa' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <GradientButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? null : <LoginIcon />}
                >
                  {loading ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }}
                      />
                      Signing In...
                    </Box>
                  ) : (
                    'Sign In'
                  )}
                </GradientButton>
              </Box>

              {/* Footer Links */}
              <Box textAlign="center" mt={4}>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                  Don't have an account?{' '}
                  <Button
                    variant="text"
                    onClick={() => navigate('/signup')}
                    sx={{
                      color: '#4caf50',
                      fontWeight: 600,
                      textTransform: 'none',
                      minWidth: 'auto',
                      p: 0,
                      '&:hover': {
                        color: '#66bb6a',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign up here
                  </Button>
                </Typography>

                <Typography variant="caption" sx={{ color: '#777' }}>
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </Typography>
              </Box>
            </CardContent>
          </LoginCard>

          {/* Bottom decoration */}
          <Box textAlign="center" mt={4}>
            <Typography variant="body2" sx={{ color: '#555' }}>
              © 2024 CodeArena. Empowering developers worldwide.
            </Typography>
          </Box>
        </Container>
      </GradientBox>
    </ThemeProvider>
  );
}

export default LoginPage;