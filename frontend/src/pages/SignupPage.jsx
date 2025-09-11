import React, { useState } from 'react';
import { signup } from '../api/auth';
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
  InputAdornment,
  IconButton,
  Divider,
  Link,
  LinearProgress
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  PersonAdd as SignupIcon,
  Psychology as Brain,
  CheckCircle,
  VpnKey,
  ArrowBack
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
  height: '100vh',
  width: '100vw',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  padding: '20px',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1000,
  overflowY: 'auto',
}));

const SignupCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(180deg, rgba(28, 28, 28, 0.95) 0%, rgba(16, 16, 16, 0.95) 100%)',
  border: '1px solid #444',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(20px)',
  width: '100%',
  maxWidth: '480px',
  margin: '0 auto',
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
  background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
  '&:hover': {
    background: 'linear-gradient(45deg, #66bb6a, #aed581)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
  },
  transition: 'all 0.3s ease',
  height: '48px',
  fontSize: '1.1rem',
}));

const BackButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  top: '20px',
  left: '20px',
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: 'white',
  zIndex: 1001,
  '&:hover': {
    background: 'rgba(123, 31, 162, 0.3)',
    transform: 'translateX(-5px)',
  },
  transition: 'all 0.3s ease',
}));

const FloatingElement = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  background: 'linear-gradient(45deg, rgba(123, 31, 162, 0.1), rgba(245, 0, 87, 0.1))',
  filter: 'blur(40px)',
  zIndex: 0,
}));

// Main container for perfect centering
const CenteredContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  zIndex: 1,
  padding: '20px 0',
}));

const PasswordStrengthIndicator = ({ password }) => {
  const getStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const getColor = () => {
    if (strength <= 2) return '#f44336';
    if (strength <= 3) return '#ff9800';
    if (strength <= 4) return '#4caf50';
    return '#2196f3';
  };

  const getLabel = () => {
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    if (strength <= 4) return 'Strong';
    return 'Excellent';
  };

  return password.length > 0 ? (
    <Box sx={{ mt: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="caption" sx={{ color: '#aaa' }}>
          Password Strength
        </Typography>
        <Typography variant="caption" sx={{ color: getColor(), fontWeight: 600 }}>
          {getLabel()}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(strength / 5) * 100}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: '#333',
          '& .MuiLinearProgress-bar': {
            backgroundColor: getColor(),
            borderRadius: 2,
          },
        }}
      />
    </Box>
  ) : null;
};

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  // Override global styles for this page
  React.useEffect(() => {
    // Store original styles
    const originalRootStyle = document.getElementById('root')?.style.cssText;
    const originalBodyStyle = document.body.style.cssText;

    // Apply signup page specific styles
    const root = document.getElementById('root');
    if (root) {
      root.style.maxWidth = 'none';
      root.style.padding = '0';
      root.style.margin = '0';
      root.style.textAlign = 'initial';
      root.style.height = '100vh';
      root.style.width = '100vw';
    }

    document.body.style.display = 'block';
    document.body.style.placeItems = 'initial';

    // Cleanup function to restore original styles
    return () => {
      if (root && originalRootStyle !== undefined) {
        root.style.cssText = originalRootStyle;
      }
      if (originalBodyStyle !== undefined) {
        document.body.style.cssText = originalBodyStyle;
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    setIsSuccess(false);

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await signup(email, password);
      if (response.status === 200) {
        setMessage('A verification email has been sent to your inbox. Please click the link to activate your account.');
        setIsSuccess(true);
      } else {
        setMessage(response.message);
      }
    } catch (error) {
      setMessage('Signup failed. Please check your information and try again. If the problem persists, the server may be experiencing an issue.');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsDontMatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        {/* Back to Login Button */}
        <BackButton
          startIcon={<ArrowBack />}
          onClick={() => navigate('/login')}
        >
          Back to Login
        </BackButton>

        {/* Floating background elements */}
        <FloatingElement
          sx={{
            width: 200,
            height: 200,
            top: '15%',
            left: '8%',
          }}
        />
        <FloatingElement
          sx={{
            width: 350,
            height: 350,
            bottom: '5%',
            right: '5%',
          }}
        />
        <FloatingElement
          sx={{
            width: 180,
            height: 180,
            top: '60%',
            left: '3%',
          }}
        />

        <CenteredContainer>
          <SignupCard>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box textAlign="center" mb={4}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)',
                  }}
                >
                  {isSuccess ? <CheckCircle sx={{ fontSize: 40 }} /> : <Brain sx={{ fontSize: 40 }} />}
                </Avatar>

                <Typography
                  variant="h4"
                  component="h1"
                  fontWeight="bold"
                  sx={{
                    background: isSuccess
                      ? 'linear-gradient(to right, #4caf50, #8bc34a)'
                      : 'linear-gradient(to right, #a0d8ff, #ff80ab)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  {isSuccess ? 'Check Your Email!' : 'Join Prep_Orbit'}
                </Typography>

                <Typography variant="body1" sx={{ color: '#aaa', mb: 2 }}>
                  {isSuccess
                    ? 'We\'ve sent you a verification link'
                    : 'Create your account and start coding'
                  }
                </Typography>

                {!isSuccess && (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                    <VpnKey sx={{ color: '#4caf50', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      Join thousands of developers worldwide
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 4, borderColor: '#444' }} />

              {/* Message Alert */}
              {message && (
                <Alert
                  severity={isSuccess ? "success" : "error"}
                  variant="filled"
                  sx={{
                    mb: 3,
                    borderRadius: '12px',
                    background: isSuccess
                      ? 'linear-gradient(45deg, #4caf50, #66bb6a)'
                      : 'linear-gradient(45deg, #f44336, #d32f2f)',
                  }}
                >
                  {message}
                </Alert>
              )}

              {!isSuccess && (
                <>
                  {/* Signup Form */}
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

                    <Box mb={3}>
                      <StyledTextField
                        fullWidth
                        id="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
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
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                sx={{ color: '#aaa' }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <PasswordStrengthIndicator password={password} />
                    </Box>

                    <Box mb={4}>
                      <StyledTextField
                        fullWidth
                        id="confirmPassword"
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        error={passwordsDontMatch}
                        helperText={
                          passwordsDontMatch ? 'Passwords do not match' :
                          passwordsMatch ? 'Passwords match!' : ''
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: passwordsMatch ? '#4caf50' : passwordsDontMatch ? '#f44336' : '#7b1fa2' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle confirm password visibility"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                                sx={{ color: '#aaa' }}
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        FormHelperTextProps={{
                          sx: {
                            color: passwordsMatch ? '#4caf50' : passwordsDontMatch ? '#f44336' : '#aaa',
                            fontWeight: passwordsMatch || passwordsDontMatch ? 600 : 400,
                          }
                        }}
                      />
                    </Box>

                    <GradientButton
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={isLoading || passwordsDontMatch}
                      startIcon={isLoading ? null : <SignupIcon />}
                    >
                      {isLoading ? (
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
                          Creating Account...
                        </Box>
                      ) : (
                        'Create Account'
                      )}
                    </GradientButton>
                  </Box>

                  {/* Footer Links */}
                  <Box textAlign="center" mt={4}>
                    <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                      Already have an account?{' '}
                      <Link
                        component="button"
                        type="button"
                        onClick={() => navigate('/login')}
                        sx={{
                          color: '#7b1fa2',
                          textDecoration: 'none',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#f50057',
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Sign in here
                      </Link>
                    </Typography>
                  </Box>
                </>
              )}

              {isSuccess && (
                <Box textAlign="center" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/login')}
                    sx={{
                      borderColor: '#4caf50',
                      color: '#4caf50',
                      '&:hover': {
                        borderColor: '#66bb6a',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      }
                    }}
                  >
                    Go to Login
                  </Button>
                </Box>
              )}

              <Box textAlign="center" mt={4}>
                <Typography variant="caption" sx={{ color: '#777' }}>
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </Typography>
              </Box>
            </CardContent>
          </SignupCard>

          {/* Bottom decoration */}
          <Box textAlign="center" mt={4}>
            <Typography variant="body2" sx={{ color: '#555' }}>
              © 2024 Prep_Orbit. Empowering developers worldwide.
            </Typography>
          </Box>
        </CenteredContainer>
      </GradientBox>
    </ThemeProvider>
  );
}

export default SignupPage;