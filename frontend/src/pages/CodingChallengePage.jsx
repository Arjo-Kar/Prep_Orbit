import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, RefreshCw, CheckCircle, XCircle, Clock, Database, Settings, ArrowLeft, Code, Terminal, Zap, Eye, EyeOff, Maximize, Minimize, RotateCcw, Copy } from 'lucide-react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  IconButton
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1e1e1e',
      paper: '#2d2d2d',
    },
    primary: {
      main: '#7b1fa2',
    },
    secondary: {
      main: '#f50057',
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
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          '&:focus': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
  },
});

const MonacoLoader = ({ onMonacoReady, language, value, theme, options, onChange }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let editor = null;
    const loadMonaco = () => {
      if (window.monaco) {
        if (editor) editor.dispose();
        editor = window.monaco.editor.create(containerRef.current, {
          value: value,
          language: language,
          theme: theme,
          ...options,
        });

        editor.onDidChangeModelContent(() => {
          onChange(editor.getValue());
        });

        editorRef.current = editor;
        onMonacoReady(editor);
      }
    };

    if (!window.monaco) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/loader.min.js";
      script.onload = () => {
        window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs' } });
        window.require(['vs/editor/editor.main'], () => {
          loadMonaco();
        });
      };
      document.body.appendChild(script);
    } else {
      loadMonaco();
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(value);
    }
  }, [value, editorRef.current]);

  useEffect(() => {
    if (editorRef.current) {
      window.monaco.editor.setTheme(theme);
    }
  }, [theme, editorRef.current]);

  return <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} />;
};

const CodingChallengePage = () => {
  const { id: challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('java');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [showSettings, setShowSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [authToken] = useState('mock-auth-token-123');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);

  const [paneWidth, setPaneWidth] = useState(null);
  const isDragging = useRef(false);
  const monacoEditorInstance = useRef(null);

  const languageConfigs = {
    javascript: {
      id: 63,
      name: 'JavaScript',
      icon: '🟨',
      template: `// Welcome to CodeArena - JavaScript Solution
// Time to show your coding skills! 💪

function solve() {
    // 🚀 Implement your solution here
    // Read input, process data, return output

    return "Your answer here";
}

// Test your solution
console.log(solve());`
    },
    python: {
      id: 71,
      name: 'Python',
      icon: '🐍',
      template: `# Welcome to CodeArena - Python Solution
# Time to show your coding skills! 💪

def solve():
    """
    🚀 Implement your solution here
    Read input, process data, return output
    """

    return "Your answer here"

# Test your solution
if __name__ == "__main__":
    print(solve())`
    },
    java: {
      id: 62,
      name: 'Java',
      icon: '☕',
      template: `import java.util.*;
import java.io.*;

/**
 * Welcome to CodeArena - Java Solution
 * Time to show your coding skills! 💪
 */
public class Solution {

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        Solution solution = new Solution();

        // 🚀 Read input and call your solve method
        String result = solution.solve();
        System.out.println(result);
    }

    public String solve() {
        // 🚀 Implement your solution here
        // Read input, process data, return output

        return "Your answer here";
    }
}`
    },
    cpp: {
      id: 54,
      name: 'C++',
      icon: '⚡',
      template: `#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;

/*
 * Welcome to CodeArena - C++ Solution
 * Time to show your coding skills! 💪
 */

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // 🚀 Implement your solution here
    // Read input, process data, output result

    cout << "Your answer here" << endl;
    return 0;
}`
    },
  };

  const availableTopics = ['arrays', 'algorithms', 'data-structures', 'recursion', 'dynamic-programming', 'graphs', 'trees', 'linked-lists', 'strings'];
  const difficultyLevels = ['easy', 'medium', 'hard'];
  const themes = [
    { value: 'vs-dark', name: 'Dark (Default)' },
    { value: 'light', name: 'Light' },
    { value: 'hc-black', name: 'High Contrast' }
  ];

  // Mock challenges
  const mockChallenges = {
    'challenge-1': {
      id: 'challenge-1',
      title: 'Sum of Two Numbers',
      description: 'Given two integers, return their sum.',
      inputSpec: 'Two integers on separate lines.',
      outputSpec: 'A single integer which is their sum.',
      timeLimitMs: 1000,
      memoryLimitKb: 256000,
      visibleTestCases: [
        { input: '1\n2', expectedOutput: '3' },
        { input: '10\n-5', expectedOutput: '5' },
      ],
    },
    'challenge-2': {
      id: 'challenge-2',
      title: 'Reverse a String',
      description: 'Given a string, return the string in reverse.',
      inputSpec: 'A single string.',
      outputSpec: 'The reversed string.',
      timeLimitMs: 1000,
      memoryLimitKb: 256000,
      visibleTestCases: [
        { input: 'hello', expectedOutput: 'olleh' },
        { input: 'world', expectedOutput: 'dlrow' },
      ],
    }
  };

  const handleMonacoReady = (editor) => {
    monacoEditorInstance.current = editor;
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const container = document.getElementById('main-container');
    const newWidth = e.clientX - container.getBoundingClientRect().left;
    const percentage = (newWidth / container.offsetWidth) * 100;
    setPaneWidth(Math.min(90, Math.max(10, percentage)));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const generateChallenge = async () => {
    setGenerating(true);
    setErrorMessage(null);
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      const newChallengeId = `challenge-${Math.floor(Math.random() * 2) + 1}`;
      const newChallenge = mockChallenges[newChallengeId];
      if (newChallenge) {
        setChallenge(newChallenge);
        setSubmissionResult(null);
        setCode(languageConfigs[selectedLanguage].template);
      } else {
        throw new Error("Challenge not found.");
      }
    } catch (error) {
      setErrorMessage('Failed to generate challenge. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const fetchChallenge = async (challengeId) => {
    setLoading(true);
    setErrorMessage(null);
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      const challengeData = mockChallenges[challengeId];
      if (challengeData) {
        setChallenge(challengeData);
        setSubmissionResult(null);
        setCode(languageConfigs[selectedLanguage].template);
      } else {
        throw new Error("Challenge not found.");
      }
    } catch (error) {
      setErrorMessage('Failed to load challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitSolution = async () => {
    if (!challenge || !code.trim()) {
      setErrorMessage('Please write some code before submitting.');
      return;
    }
    if (!authToken) {
      setErrorMessage('Authentication token not found. Please log in.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const results = challenge.visibleTestCases.map(testCase => {
        let actualOutput = "MockOutput";
        let passed = false;

        if (challenge.id === 'challenge-1') {
          const [a, b] = testCase.input.split("\n").map(Number);
          const expected = (a + b).toString();
          actualOutput = code.includes("a + b") ? expected : (a + b + 1).toString();
          passed = actualOutput === testCase.expectedOutput;
        } else if (challenge.id === 'challenge-2') {
          const str = testCase.input.trim();
          const expected = str.split("").reverse().join("");
          actualOutput = (code.includes("reverse") || code.includes("::-1")) ? expected : str;
          passed = actualOutput === testCase.expectedOutput;
        }

        return {
          passed,
          visible: true,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput
        };
      });

      const passedTestCases = results.filter(r => r.passed).length;
      const totalTestCases = results.length;

      setSubmissionResult({
        allPassed: passedTestCases === totalTestCases,
        passedTestCases,
        totalTestCases,
        results
      });
    } catch (error) {
      setErrorMessage("Failed to submit solution. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    setCode(languageConfigs[newLanguage].template);
    if (monacoEditorInstance.current) {
        const oldModel = monacoEditorInstance.current.getModel();
        const newModel = window.monaco.editor.createModel(languageConfigs[newLanguage].template, newLanguage);
        monacoEditorInstance.current.setModel(newModel);
        if (oldModel) oldModel.dispose();
    }
  };

  const handleTopicChange = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const copyCode = () => {
    if (monacoEditorInstance.current) {
      navigator.clipboard.writeText(monacoEditorInstance.current.getValue());
    }
  };

  const resetCode = () => {
    const template = languageConfigs[selectedLanguage].template;
    setCode(template);
    if (monacoEditorInstance.current) {
        monacoEditorInstance.current.setValue(template);
    }
  };

  useEffect(() => {
    if (challengeId) {
      fetchChallenge(challengeId);
    } else {
      generateChallenge();
    }
  }, [challengeId, authToken]);

  useEffect(() => {
      const handleResize = () => {
          if (monacoEditorInstance.current) {
              monacoEditorInstance.current.layout();
          }
      };
      window.addEventListener('resize', handleResize);
      return () => {
          window.removeEventListener('resize', handleResize);
      };
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        <Box
          sx={{
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'linear-gradient(90deg, #1a0f3d 0%, #23164a 50%, #2d1a54 100%)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
            borderBottom: '1px solid rgba(126, 87, 194, 0.5)',
            py: 2,
            px: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                onClick={() => navigate('/dashboard')}
                startIcon={<ArrowLeft size={16} />}
                sx={{ color: '#ccc', '&:hover': { backgroundColor: '#7b1fa250', color: 'white' } }}
              >
                Back to Dashboard
              </Button>
              <Box sx={{ height: 24, width: 1, backgroundColor: '#7b1fa280' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1,
                    background: 'linear-gradient(135deg, #7b1fa2, #f50057)',
                    borderRadius: '8px',
                  }}
                >
                  <Code size={20} color="white" />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    component="h1"
                    sx={{
                      fontWeight: 'bold',
                      background: 'linear-gradient(to right, #a0d8ff, #ff80ab)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    CodeArena
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>
                    {challenge?.title || 'Loading Challenge...'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {challenge && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Paper
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      border: '1px solid',
                      backgroundColor:
                        selectedDifficulty === 'easy'
                          ? '#4caf5020'
                          : selectedDifficulty === 'medium'
                          ? '#ff980020'
                          : '#f4433620',
                      borderColor:
                        selectedDifficulty === 'easy'
                          ? '#4caf5050'
                          : selectedDifficulty === 'medium'
                          ? '#ff980050'
                          : '#f4433650',
                      color:
                        selectedDifficulty === 'easy'
                          ? '#a5d6a7'
                          : selectedDifficulty === 'medium'
                          ? '#ffcc80'
                          : '#ef9a9a',
                    }}
                  >
                    {selectedDifficulty.toUpperCase()}
                  </Paper>
                  <Paper
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 1.5,
                      py: 0.75,
                      backgroundColor: '#333',
                      border: '1px solid #555',
                      borderRadius: '8px',
                    }}
                  >
                    <Clock size={16} style={{ color: '#90caf9' }} />
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      {challenge.timeLimitMs}ms
                    </Typography>
                    <Box sx={{ width: 1, height: 16, backgroundColor: '#555' }} />
                    <Database size={16} style={{ color: '#a5d6a7' }} />
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      {challenge.memoryLimitKb}KB
                    </Typography>
                  </Paper>
                </Box>
              )}
              <Box
                component="img"
                src="https://avatars.githubusercontent.com/u/9919?v=4"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '2px solid #7b1fa2',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
                alt="avatar"
              />
            </Box>
          </Box>
        </Box>

        <Box
          id="main-container"
          sx={{
            ...(!isFullscreen ? { maxWidth: '1280px', mx: 'auto', mt: 3 } : { position: 'fixed', inset: '80px 0 0 0', zIndex: 20 }),
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            border: '1px solid rgba(45, 45, 45, 0.5)',
            overflow: 'hidden',
            height: isFullscreen ? 'calc(100vh - 80px)' : '85vh',
            backgroundColor: 'rgba(25, 25, 25, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
          }}
        >
          <Box
            sx={{
              width: paneWidth ? `${paneWidth}%` : '45%',
              height: '100%',
              overflowY: 'auto',
              background: 'linear-gradient(180deg, #1c1c1c 0%, #101010 100%)',
              borderRight: '1px solid #444',
            }}
          >
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                background: 'rgba(25, 25, 25, 0.9)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #444',
                px: 3,
                py: 1.5,
                zIndex: 10,
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button variant="contained" sx={{ px: 2, py: 1, fontSize: '0.875rem' }} startIcon={<Terminal size={16} />}>
                  Problem
                </Button>
                <Button sx={{ px: 2, py: 1, fontSize: '0.875rem' }}>Submissions</Button>
                <Button sx={{ px: 2, py: 1, fontSize: '0.875rem' }}>Discuss</Button>
              </Box>
            </Box>
            <Box sx={{ p: 3 }}>
              {errorMessage && (
                <Alert
                  severity="error"
                  variant="filled"
                  sx={{ mb: 3, borderRadius: '12px' }}
                >
                  {errorMessage}
                </Alert>
              )}
              {loading || (generating && !challenge) ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress color="primary" sx={{ mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#aaa' }}>
                    Loading challenge...
                  </Typography>
                </Box>
              ) : challenge ? (
                <Box sx={{ spaceY: 3 }}>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 2, background: 'linear-gradient(to right, white, #ccc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {challenge.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ccc', lineHeight: '1.6' }}>
                    {challenge.description}
                  </Typography>
                  <Grid container spacing={2} sx={{ my: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, border: '1px solid rgba(66, 165, 245, 0.5)', background: 'rgba(66, 165, 245, 0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Clock size={20} style={{ color: '#90caf9' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'semibold', color: '#90caf9' }}>
                            Time Limit
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {challenge.timeLimitMs}ms
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, border: '1px solid rgba(76, 175, 80, 0.5)', background: 'rgba(76, 175, 80, 0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Database size={20} style={{ color: '#a5d6a7' }} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'semibold', color: '#a5d6a7' }}>
                            Memory Limit
                          </Typography>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {challenge.memoryLimitKb}KB
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2.5, border: '1px solid #444', background: 'rgba(45, 45, 45, 0.5)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ce93d8', mb: 1.5 }}>
                          Input Format
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ccc', lineHeight: '1.6' }}>
                          {challenge.inputSpec}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2.5, border: '1px solid #444', background: 'rgba(45, 45, 45, 0.5)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f48fb1', mb: 1.5 }}>
                          Output Format
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ccc', lineHeight: '1.6' }}>
                          {challenge.outputSpec}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  {challenge.visibleTestCases?.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Sample Test Cases
                      </Typography>
                      <Box sx={{ spaceY: 2 }}>
                        {challenge.visibleTestCases.map((testCase, i) => (
                          <Paper key={i} sx={{ border: '1px solid #444', overflow: 'hidden' }}>
                            <Box sx={{ p: 1.5, borderBottom: '1px solid #444', background: 'linear-gradient(90deg, #7b1fa250, #f5005750)' }}>
                              <Typography sx={{ fontWeight: 'bold', color: '#ce93d8' }}>
                                Example {i + 1}
                              </Typography>
                            </Box>
                            <Box sx={{ p: 2 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                    Input:
                                  </Typography>
                                  <Box component="pre" sx={{ backgroundColor: '#111', border: '1px solid #444', p: 1.5, borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'monospace', color: '#a5d6a7', overflowX: 'auto' }}>
                                    {testCase.input}
                                  </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="body2" sx={{ color: '#aaa', mb: 1 }}>
                                    Expected Output:
                                  </Typography>
                                  <Box component="pre" sx={{ backgroundColor: '#111', border: '1px solid #444', p: 1.5, borderRadius: '8px', fontSize: '0.875rem', fontFamily: 'monospace', color: '#90caf9', overflowX: 'auto' }}>
                                    {testCase.expectedOutput}
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Code size={64} style={{ color: '#444', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#777' }}>
                    No challenge loaded
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box
            onMouseDown={onMouseDown}
            sx={{
              width: 6,
              cursor: 'ew-resize',
              backgroundColor: '#444',
              '&:hover': {
                backgroundColor: '#7b1fa2',
              },
              transition: 'background-color 0.3s',
            }}
          />

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #101010 0%, #000000 100%)' }}>
            <Box
              sx={{
                background: 'linear-gradient(90deg, #1c1c1c 0%, #2d2d2d 100%)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #444',
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <FormControl sx={{ m: 1, minWidth: 120 }}>
                    <Select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      sx={{
                        backgroundColor: '#333',
                        color: 'white',
                        '& .MuiSelect-icon': { color: 'white' },
                        '&:hover fieldset': { borderColor: '#7b1fa2 !important' },
                        '&.Mui-focused fieldset': { borderColor: '#7b1fa2 !important' },
                      }}
                    >
                      {Object.entries(languageConfigs).map(([key, value]) => (
                        <MenuItem key={key} value={key} sx={{ color: 'white' }}>
                          <span style={{ marginRight: '8px' }}>{value.icon}</span>
                          {value.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl sx={{ m: 1, minWidth: 80 }}>
                    <Select
                      value={fontSize}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setFontSize(newSize);
                        if (monacoEditorInstance.current) {
                          monacoEditorInstance.current.updateOptions({ fontSize: newSize });
                        }
                      }}
                      sx={{
                        backgroundColor: '#333',
                        color: 'white',
                        '& .MuiSelect-icon': { color: 'white' },
                        '&:hover fieldset': { borderColor: '#7b1fa2 !important' },
                        '&.Mui-focused fieldset': { borderColor: '#7b1fa2 !important' },
                      }}
                    >
                      {[12, 14, 16, 18, 20].map(size => (
                        <MenuItem key={size} value={size}>
                          {size}px
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl sx={{ m: 1, minWidth: 120 }}>
                    <Select
                      value={editorTheme}
                      onChange={(e) => setEditorTheme(e.target.value)}
                      sx={{
                        backgroundColor: '#333',
                        color: 'white',
                        '& .MuiSelect-icon': { color: 'white' },
                        '&:hover fieldset': { borderColor: '#7b1fa2 !important' },
                        '&.Mui-focused fieldset': { borderColor: '#7b1fa2 !important' },
                      }}
                    >
                      {themes.map(theme => (
                        <MenuItem key={theme.value} value={theme.value}>
                          {theme.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={copyCode} size="small" sx={{ color: '#ccc' }}>
                    <Copy size={16} />
                  </IconButton>
                  <IconButton onClick={resetCode} size="small" sx={{ color: '#ccc' }}>
                    <RotateCcw size={16} />
                  </IconButton>
                  <IconButton onClick={() => setIsFullscreen(!isFullscreen)} size="small" sx={{ color: '#ccc' }}>
                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  </IconButton>
                  <Box sx={{ width: 1, height: 24, backgroundColor: '#555' }} />
                  <Button
                    onClick={submitSolution}
                    disabled={submitting || !challenge}
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #66bb6a 30%, #aed581 90%)',
                      },
                      color: 'white',
                      px: 3,
                      py: 1.5,
                      borderRadius: '12px',
                    }}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Play size={16} />}
                  >
                    {submitting ? 'Running...' : 'Run & Submit'}
                  </Button>
                  <Button
                    onClick={generateChallenge}
                    disabled={generating}
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(45deg, #7b1fa2 30%, #f50057 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #9c27b0 30%, #ff4081 90%)',
                      },
                      color: 'white',
                      px: 2,
                      py: 1.5,
                      borderRadius: '12px',
                    }}
                    startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <RefreshCw size={16} />}
                  >
                    New
                  </Button>
                  <IconButton onClick={() => setShowSettings(!showSettings)} size="small" sx={{ color: '#ccc' }}>
                    <Settings size={16} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <MonacoLoader
                language={selectedLanguage}
                value={code}
                theme={editorTheme}
                options={{
                  fontSize: fontSize,
                  minimap: { enabled: true, scale: 0.8 },
                  scrollBeyondLastLine: false,
                  fontLigatures: true,
                  smoothScrolling: true,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  renderWhitespace: 'selection',
                  bracketPairColorization: { enabled: true },
                  guides: {
                    bracketPairs: true,
                    indentation: true
                  },
                  padding: { top: 20, bottom: 20 }
                }}
                onChange={(val) => setCode(val || '')}
                onMonacoReady={handleMonacoReady}
              />
            </Box>
            {submissionResult && (
              <Box sx={{ borderTop: '1px solid #444', background: 'linear-gradient(90deg, #1c1c1c 0%, #2d2d2d 100%)', backdropFilter: 'blur(8px)', transition: 'max-height 0.3s', overflow: 'hidden', maxHeight: showResults ? 320 : 48 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #444' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {submissionResult.allPassed ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle size={24} style={{ color: '#a5d6a7' }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#a5d6a7' }}>
                          All Tests Passed!
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <XCircle size={24} style={{ color: '#ef9a9a' }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ef9a9a' }}>
                          Some Tests Failed
                        </Typography>
                      </Box>
                    )}
                    <Paper sx={{ px: 1.5, py: 0.5, borderRadius: '24px', backgroundColor: '#333', border: '1px solid #555' }}>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        {submissionResult.passedTestCases}/{submissionResult.totalTestCases} passed
                      </Typography>
                    </Paper>
                  </Box>
                  <IconButton onClick={() => setShowResults(!showResults)} size="small" sx={{ color: '#ccc' }}>
                    {showResults ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </Box>
                <Box sx={{ p: 2, overflowY: 'auto', maxHeight: 256, spaceY: 2 }}>
                  {submissionResult.results.map((res, i) => (
                    <Paper key={i} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: res.passed ? '#a5d6a7' : '#ef9a9a', background: res.passed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'semibold' }}>
                          Test {i + 1}
                        </Typography>
                        {res.passed ? (
                          <CheckCircle size={20} style={{ color: '#a5d6a7' }} />
                        ) : (
                          <XCircle size={20} style={{ color: '#ef9a9a' }} />
                        )}
                      </Box>
                      <Grid container spacing={2} sx={{ fontSize: '0.875rem' }}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                            Input:
                          </Typography>
                          <Box component="pre" sx={{ backgroundColor: '#111', border: '1px solid #444', p: 1, borderRadius: '8px', color: '#a5d6a7', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            {res.input}
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                            Expected Output:
                          </Typography>
                          <Box component="pre" sx={{ backgroundColor: '#111', border: '1px solid #444', p: 1, borderRadius: '8px', color: '#90caf9', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            {res.expectedOutput}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                            Your Output:
                          </Typography>
                          <Box component="pre" sx={{ p: 1, borderRadius: '8px', color: res.passed ? '#a5d6a7' : '#ef9a9a', background: res.passed ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)', border: res.passed ? '1px solid #4caf50' : '1px solid #f44336', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            {res.actualOutput}
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default CodingChallengePage;
