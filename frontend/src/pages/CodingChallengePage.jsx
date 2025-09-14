import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Eye,
  EyeOff,
  RotateCcw,
  Copy
} from 'lucide-react';
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
  Alert,
  IconButton
} from '@mui/material';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CodeIcon from "@mui/icons-material/Code";

/**
 * Run improvements:
 * - Use /submit for "Run" (backend doesn't have /run or /execute).
 * - Normalize various response shapes to compute a clear verdict.
 * - Show verdict even when only top-level counts are returned.
 * - Added debug logging for raw run response.
 * New button remains removed per your request.
 */

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#100827",
      paper: "rgba(25, 25, 25, 0.8)",
    },
    primary: { main: "#7b1fa2" },
    secondary: { main: "#f50057" },
    text: { primary: "#ffffff", secondary: "#cccccc" },
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: "16px", backgroundImage: "none" } } },
    MuiButton: { styleOverrides: { root: { borderRadius: "12px", textTransform: "none", fontWeight: 600 } } },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(45, 45, 45, 0.5)",
          backdropFilter: "blur(4px)",
        },
      },
    },
    MuiSelect: { styleOverrides: { select: { '&:focus': { backgroundColor: 'transparent' } } } },
  },
});

const GradientBox = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #100827 0%, #1a0f3d 50%, #291a54 100%)",
  minHeight: "100vh",
  width: "100vw",
  color: "white",
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 1000,
  overflowY: "auto",
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  background: "linear-gradient(90deg, #1a0f3d 0%, #23164a 50%, #2d1a54 100%)",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
  border: "1px solid rgba(126, 87, 194, 0.5)",
  marginBottom: theme.spacing(4),
  padding: theme.spacing(2),
  position: "sticky",
  top: 0,
  zIndex: 30,
}));

const ChallengeCard = styled(Paper)(({ theme }) => ({
  background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
  border: "1px solid #444",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    border: "1px solid #7b1fa2",
  },
}));

const EditorCard = styled(Paper)(({ theme }) => ({
  background: "linear-gradient(180deg, #101010 0%, #000000 100%)",
  border: "1px solid #444",
  flex: 1,
  display: "flex",
  flexDirection: "column",
}));

const ActionButton = styled(Button)(({ theme }) => ({
  height: "56px",
  borderRadius: "12px",
  textTransform: "none",
  fontSize: "1rem",
  fontWeight: 600,
  transition: "all 0.3s ease",
  "&:hover": { transform: "translateY(-2px)" },
}));

const MainContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  height: "calc(100vh - 120px)",
  borderRadius: "16px",
  boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
  border: "1px solid rgba(45, 45, 45, 0.5)",
  overflow: "hidden",
  backgroundColor: "rgba(25, 25, 25, 0.8)",
  backdropFilter: "blur(4px)",
}));

const MonacoLoader = ({ onMonacoReady, language, value, theme, options, onChange }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let editor = null;
    const loadMonaco = () => {
      if (window.monaco) {
        if (editor) editor.dispose();
        editor = window.monaco.editor.create(containerRef.current, {
          value,
          language,
          theme,
          ...options,
        });
        editor.onDidChangeModelContent(() => onChange(editor.getValue()));
        editorRef.current = editor;
        onMonacoReady(editor);
      }
    };

    if (!window.monaco) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/loader.min.js";
      script.onload = () => {
        window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs' } });
        window.require(['vs/editor/editor.main'], () => loadMonaco());
      };
      document.body.appendChild(script);
    } else {
      loadMonaco();
    }

    return () => {
      if (editorRef.current) editorRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && window.monaco) {
      window.monaco.editor.setTheme(theme);
    }
  }, [theme]);

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

  const [submissionResult, setSubmissionResult] = useState(null); // for Run panel
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [showResults, setShowResults] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);

  const [paneWidth, setPaneWidth] = useState(45);
  const isDragging = useRef(false);
  const monacoEditorInstance = useRef(null);

  const languageConfigs = {
    javascript: {
      id: 63,
      name: 'JavaScript',
      icon: '🟨',
      template: `// Welcome to Prep_Orbit - JavaScript Solution
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
      template: `# Welcome to Prep_Orbit - Python Solution
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
 * Welcome to Prep_Orbit - Java Solution
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
 * Welcome to Prep_Orbit - C++ Solution
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

  const themes = [
    { value: 'vs-dark', name: 'Dark (Default)' },
    { value: 'light', name: 'Light' },
    { value: 'hc-black', name: 'High Contrast' }
  ];

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
      difficulty: 'easy',
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
      difficulty: 'medium',
    }
  };

  useEffect(() => {
    const originalRootStyle = document.getElementById("root")?.style.cssText;
    const originalBodyStyle = document.body.style.cssText;

    const root = document.getElementById("root");
    if (root) {
      root.style.maxWidth = "none";
      root.style.padding = "0";
      root.style.margin = "0";
      root.style.textAlign = "initial";
      root.style.width = "100vw";
    }

    document.body.style.display = "block";
    document.body.style.placeItems = "initial";
    document.body.style.overflow = "visible";
    document.documentElement.style.overflow = "visible";

    return () => {
      if (root && originalRootStyle !== undefined) {
        root.style.cssText = originalRootStyle;
      }
      if (originalBodyStyle !== undefined) {
        document.body.style.cssText = originalBodyStyle;
      }
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const handleMonacoReady = (editor) => {
    monacoEditorInstance.current = editor;
  };

  // Resizable split
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
    await new Promise(resolve => setTimeout(resolve, 400));
    try {
      const newChallengeId = `challenge-${Math.floor(Math.random() * 2) + 1}`;
      const newChallenge = mockChallenges[newChallengeId];
      if (newChallenge) {
        setChallenge(newChallenge);
        setSelectedDifficulty(newChallenge.difficulty || 'medium');
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

  const fetchChallenge = async (id) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(
        `http://localhost:8080/api/coding/challenge/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken || ''}`
          }
        }
      );
      if (!response.ok) {
        throw new Error("Challenge not found.");
      }
      const data = await response.json();

      const challengeData = {
        id: data.id,
        title: data.title,
        description: data.problem_statement || data.description,
        inputSpec: data.input_specification || data.inputSpec,
        outputSpec: data.output_specification || data.outputSpec,
        timeLimitMs: data.timeLimitMs && data.timeLimitMs > 0 ? data.timeLimitMs : 1000,
        memoryLimitKb: data.memoryLimitKb && data.memoryLimitKb > 0 ? data.memoryLimitKb : 256000,
        visibleTestCases: Array.isArray(data.test_cases)
          ? data.test_cases.filter(tc => tc.visible !== false).map(tc => ({
              input: tc.input,
              expectedOutput: tc.expected_output
            }))
          : [],
        difficulty: data.difficulty || 'medium',
        topics: data.topics || [],
      };

      setChallenge(challengeData);
      setSelectedDifficulty(challengeData.difficulty || 'medium');
      setSubmissionResult(null);
      setCode(languageConfigs[selectedLanguage].template);
    } catch (error) {
      setErrorMessage('Failed to load challenge. Loading a mock challenge.');
      const fallback = mockChallenges['challenge-1'];
      setChallenge(fallback);
      setSelectedDifficulty(fallback.difficulty || 'medium');
      setSubmissionResult(null);
      setCode(languageConfigs[selectedLanguage].template);
    } finally {
      setLoading(false);
    }
  };

  // ===== Normalization helpers for "Run" =====
  const coerceBoolean = (v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 'true';
    if (typeof v === 'number') return v !== 0;
    return false;
  };

  const mapTestCase = (tc) => {
    const input = tc.input ?? tc.stdin ?? tc.caseInput ?? '';
    const expectedOutput = tc.expectedOutput ?? tc.expected_output ?? tc.expected ?? '';
    const actualOutput = tc.actualOutput ?? tc.actual_output ?? tc.output ?? tc.stdout ?? '';
    const error = tc.error ?? tc.stderr ?? tc.message ?? '';
    const visible = (typeof tc.visible !== 'undefined') ? coerceBoolean(tc.visible) : undefined;
    const passedRaw =
      tc.passed ??
      tc.isPassed ??
      tc.success ??
      (typeof tc.status === 'string' ? tc.status.toLowerCase() === 'passed' : undefined);
    const passed = coerceBoolean(passedRaw);
    return { input, expectedOutput, actualOutput, error, passed, ...(typeof visible !== 'undefined' ? { visible } : {}) };
  };

  const normalizeRunResponse = (raw, maybeChallenge) => {
    // If backend returns only counts
    const topPassed = typeof raw?.passedTestCases === 'number' ? raw.passedTestCases : undefined;
    const topTotal = typeof raw?.totalTestCases === 'number' ? raw.totalTestCases : undefined;

    // Prefer any known arrays
    let arr =
      (Array.isArray(raw?.results) && raw.results) ||
      (Array.isArray(raw?.sampleResults) && raw.sampleResults) ||
      (Array.isArray(raw?.test_cases) && raw.test_cases) ||
      (Array.isArray(raw?.testCases) && raw.testCases) ||
      (Array.isArray(raw?.cases) && raw.cases) ||
      [];

    const all = arr.map(mapTestCase);

    // Determine "sample" subset
    let sample = all;
    const hasVisibleFlags = all.some(x => typeof x.visible !== 'undefined');
    if (hasVisibleFlags) {
      const vis = all.filter(x => x.visible === true);
      if (vis.length > 0) sample = vis;
    } else if (maybeChallenge?.visibleTestCases?.length > 0 && all.length >= maybeChallenge.visibleTestCases.length) {
      sample = all.slice(0, maybeChallenge.visibleTestCases.length);
    }

    let totalSample = sample.length;
    let passedSample = sample.filter(x => x.passed).length;

    // If no per-case data but counts exist, use them for verdict
    if (totalSample === 0 && typeof topTotal === 'number') {
      totalSample = topTotal;
      passedSample = typeof topPassed === 'number' ? topPassed : 0;
    }

    let verdict;
    if (totalSample === 0) {
      verdict = "No sample results returned";
    } else {
      verdict = (passedSample === totalSample) ? "All Sample Passed" : "Some Sample Failed";
    }

    return {
      verdict,
      sampleResults: sample,
      totalSample,
      passedSample,
      type: "run"
    };
  };

  // Local mock evaluation for Run
  const evaluateMockVisibleTestCases = (mockChallenge, userCode) => {
    const results = mockChallenge.visibleTestCases.map(testCase => {
      let actualOutput = "MockOutput";
      let passed = false;

      if (mockChallenge.id === 'challenge-1') {
        const [a, b] = testCase.input.split("\n").map(Number);
        const expected = (a + b).toString();
        actualOutput = userCode.includes("a + b") || userCode.includes("solve()")
          ? expected
          : (a + b + 1).toString();
        passed = actualOutput === testCase.expectedOutput;
      } else if (mockChallenge.id === 'challenge-2') {
        const str = testCase.input.trim();
        const expected = str.split("").reverse().join("");
        const looksCorrect =
          userCode.includes("reverse") ||
          userCode.includes("[::-1]") ||
          userCode.includes("StringBuilder") ||
          userCode.includes("Collections.reverse");
        actualOutput = looksCorrect ? expected : str;
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

    const passedSample = results.filter(r => r.passed).length;
    const totalSample = results.length;

    return {
      verdict: passedSample === totalSample ? "All Sample Passed" : "Some Sample Failed",
      sampleResults: results,
      totalSample,
      passedSample,
      type: "run"
    };
  };

  // ===== Submit (navigate to result page) =====
  const submitSolution = async () => {
    if (!challenge || !code || typeof code !== 'string' || !code.trim()) {
      setErrorMessage('Please write some code before submitting.');
      setSubmissionResult(null);
      return;
    }
    const languageId = languageConfigs[selectedLanguage]?.id;
    if (!languageId || typeof languageId !== 'number' || languageId <= 0) {
      setErrorMessage('Please select a valid programming language.');
      setSubmissionResult(null);
      return;
    }
    const authToken = localStorage.getItem('authToken');
    if (!authToken && typeof challenge.id === 'number') {
      setErrorMessage('Authentication token not found. Please log in.');
      setSubmissionResult(null);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (typeof challenge.id === 'number') {
        const response = await fetch(
          `http://localhost:8080/api/coding/challenge/${challenge.id}/submit`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              source_code: code,
              language_id: languageId,
              stdin: ""
            })
          }
        );

        if (!response.ok) {
          let errorMessageText = 'Failed to submit solution.';
          try {
            const errorBody = await response.text();
            errorMessageText = errorBody || errorMessageText;
          } catch {}
          setErrorMessage(errorMessageText);
          setSubmissionResult(null);
          setSubmitting(false);
          return;
        }

        const result = await response.json();
        setSubmissionResult(null);
        setSubmitting(false);
        navigate('/coding-challenge/result', { state: { result, challenge } });
      } else {
        // Mock submit — navigate with local evaluation results
        const results = challenge.visibleTestCases.map(testCase => {
          let actualOutput = "MockOutput";
          let passed = false;

          if (challenge.id === 'challenge-1') {
            const [a, b] = testCase.input.split("\n").map(Number);
            const expected = (a + b).toString();
            actualOutput = code.includes("a + b") || code.includes("solve()")
              ? expected
              : (a + b + 1).toString();
            passed = actualOutput === testCase.expectedOutput;
          } else if (challenge.id === 'challenge-2') {
            const str = testCase.input.trim();
            const expected = str.split("").reverse().join("");
            const looksCorrect =
              code.includes("reverse") ||
              code.includes("[::-1]") ||
              code.includes("StringBuilder") ||
              code.includes("Collections.reverse");
            actualOutput = looksCorrect ? expected : str;
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

        setSubmitting(false);
        navigate('/coding-challenge/result', {
          state: {
            result: {
              allPassed: passedTestCases === totalTestCases,
              passedTestCases,
              totalTestCases,
              results
            },
            challenge
          }
        });
      }
    } catch (error) {
      setErrorMessage("Failed to submit solution. Please try again.");
      setSubmissionResult(null);
      setSubmitting(false);
    }
  };

  // ===== Run sample (use /submit and normalize to a verdict) =====
  const runSampleTestCases = async () => {
    if (!challenge || !code.trim()) {
      setErrorMessage('Please write some code before running.');
      return;
    }

    // Local mock evaluation
    if (typeof challenge.id !== 'number') {
      setRunning(true);
      setErrorMessage(null);
      try {
        const runResult = evaluateMockVisibleTestCases(challenge, code);
        setSubmissionResult(runResult);
        setShowResults(true);
      } catch {
        setErrorMessage("Failed to run sample test cases (mock).");
      } finally {
        setRunning(false);
      }
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setErrorMessage('Authentication token not found. Please log in.');
      return;
    }

    setRunning(true);
    setErrorMessage(null);

    try {
      const languageId = languageConfigs[selectedLanguage].id;
      const response = await fetch(
        `http://localhost:8080/api/coding/challenge/${challenge.id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            source_code: code,
            language_id: languageId,
            stdin: "",
            mode: "run" // harmless hint if backend ignores it
          })
        }
      );
      if (!response.ok) {
        let msg = `Failed to run sample test cases: ${response.status} ${response.statusText}`;
        try {
          const txt = await response.text();
          if (txt) msg += ` - ${txt}`;
        } catch {}
        throw new Error(msg);
      }
      const raw = await response.json();
      // Debug: inspect what backend returns to ensure normalization matches
      // You can keep or remove this after verifying shape
      // eslint-disable-next-line no-console
      console.log("Run raw response:", raw);

      const normalized = normalizeRunResponse(raw, challenge);
      setSubmissionResult(normalized);
      setShowResults(true);
    } catch (error) {
      setErrorMessage(error?.message || "Failed to run sample test cases.");
    } finally {
      setRunning(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    setCode(languageConfigs[newLanguage].template);
    if (monacoEditorInstance.current && window.monaco) {
      const oldModel = monacoEditorInstance.current.getModel();
      const newModel = window.monaco.editor.createModel(languageConfigs[newLanguage].template, newLanguage);
      monacoEditorInstance.current.setModel(newModel);
      if (oldModel) oldModel.dispose();
    }
  };

  const copyCode = () => {
    const text = monacoEditorInstance.current
      ? monacoEditorInstance.current.getValue()
      : code;
    navigator.clipboard.writeText(text || '');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  useEffect(() => {
    const handleResize = () => {
      if (monacoEditorInstance.current) {
        monacoEditorInstance.current.layout();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        <HeaderCard>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ActionButton
                onClick={() => navigate('/dashboard')}
                startIcon={<ArrowBackIcon />}
                sx={{
                  background: 'linear-gradient(45deg, #7b1fa2, #f50057)',
                  '&:hover': { background: 'linear-gradient(45deg, #9c27b0, #ff4081)' },
                }}
              >
                Back to Dashboard
              </ActionButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    p: 1,
                    background: 'linear-gradient(135deg, #7b1fa2, #f50057)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CodeIcon sx={{ fontSize: 24, color: 'white' }} />
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
                      fontSize: '1.3rem'
                    }}
                  >
                    CodeArena
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#aaa', fontWeight: 600 }}>
                    {challenge?.title || 'Loading Challenge...'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {challenge && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Paper
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
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
                    minWidth: 85,
                    textAlign: 'center',
                    border: '1px solid',
                  }}
                >
                  {selectedDifficulty?.toUpperCase?.() || 'MEDIUM'}
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
                    fontWeight: 500,
                  }}
                >
                  <Clock sx={{ fontSize: 16, color: '#90caf9' }} />
                  <Typography variant="body2" sx={{ color: '#ccc', fontWeight: 500 }}>
                    {challenge.timeLimitMs}ms
                  </Typography>
                  <Box sx={{ width: 1, height: 16, backgroundColor: '#555' }} />
                  <Database sx={{ fontSize: 16, color: '#a5d6a7' }} />
                  <Typography variant="body2" sx={{ color: '#ccc', fontWeight: 500 }}>
                    {challenge.memoryLimitKb}KB
                  </Typography>
                </Paper>
                <Box
                  component="img"
                  src="https://avatars.githubusercontent.com/u/9919?v=4"
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    border: '2px solid #7b1fa2',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    ml: 1
                  }}
                  alt="avatar"
                />
              </Box>
            )}
          </Box>
        </HeaderCard>

        <MainContainer id="main-container">
          <ChallengeCard
            sx={{
              width: `${paneWidth}%`,
              height: '100%',
              overflowY: 'auto',
            }}
          >
            <Box sx={{ p: 3 }}>
              {errorMessage && (
                <Alert
                  severity="error"
                  variant="filled"
                  sx={{
                    mb: 3,
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, #f44336, #d32f2f)',
                  }}
                >
                  {errorMessage}
                </Alert>
              )}
              {loading || (generating && !challenge) ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#4caf50', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#aaa' }}>
                    Loading challenge...
                  </Typography>
                </Box>
              ) : challenge ? (
                <Box sx={{ spaceY: 3 }}>
                  <Typography
                    variant="h4"
                    component="h2"
                    sx={{
                      fontWeight: 'bold',
                      mb: 2,
                      background: 'linear-gradient(to right, white, #ccc)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {challenge.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#ccc', lineHeight: '1.6', mb: 3 }}>
                    {challenge.description}
                  </Typography>
                  <Grid container spacing={2} sx={{ my: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2, border: '1px solid rgba(66, 165, 245, 0.5)', background: 'rgba(66, 165, 245, 0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Clock sx={{ fontSize: 20, color: '#90caf9' }} />
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
                          <Database sx={{ fontSize: 20, color: '#a5d6a7' }} />
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
                  <CodeIcon sx={{ fontSize: 64, color: '#444', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#777' }}>
                    No challenge loaded
                  </Typography>
                </Box>
              )}
            </Box>
          </ChallengeCard>

          <Box
            onMouseDown={onMouseDown}
            sx={{
              width: 6,
              cursor: 'ew-resize',
              backgroundColor: '#444',
              '&:hover': { backgroundColor: '#7b1fa2' },
              transition: 'background-color 0.3s',
            }}
          />

          <EditorCard sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                        fontWeight: 'bold',
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
                        fontWeight: 'bold',
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
                        fontWeight: 'bold',
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
                    <Copy sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton onClick={resetCode} size="small" sx={{ color: '#ccc' }}>
                    <RotateCcw sx={{ fontSize: 16 }} />
                  </IconButton>

                  {/* Run */}
                  <ActionButton
                    onClick={runSampleTestCases}
                    disabled={running || submitting || !challenge}
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(45deg, #2196f3, #21CBF3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #42a5f5, #4fc3f7)',
                      },
                    }}
                    startIcon={running ? <CircularProgress size={16} color="inherit" /> : <Play />}
                  >
                    {running ? 'Running...' : 'Run'}
                  </ActionButton>

                  {/* Submit */}
                  <ActionButton
                    onClick={submitSolution}
                    disabled={submitting || running || !challenge}
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #66bb6a, #aed581)',
                      },
                    }}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </ActionButton>
                </Box>
              </Box>
            </Box>

            {/* Editor */}
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
                  guides: { bracketPairs: true, indentation: true },
                  padding: { top: 20, bottom: 20 }
                }}
                onChange={(val) => setCode(val || '')}
                onMonacoReady={handleMonacoReady}
              />
            </Box>

            {/* In-page results (for "Run" only) */}
            {submissionResult && submissionResult.type === "run" && (
              <Box
                sx={{
                  borderTop: '1px solid #444',
                  background: 'linear-gradient(90deg, #1c1c1c 0%, #2d2d2d 100%)',
                  backdropFilter: 'blur(8px)',
                  transition: 'max-height 0.3s',
                  overflow: 'hidden',
                  maxHeight: showResults ? 320 : 48
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #444' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {submissionResult.totalSample > 0 && submissionResult.passedSample === submissionResult.totalSample ? (
                      <>
                        <CheckCircle sx={{ fontSize: 24, color: '#a5d6a7' }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#a5d6a7' }}>
                          {submissionResult.verdict}
                        </Typography>
                      </>
                    ) : submissionResult.totalSample > 0 ? (
                      <>
                        <XCircle sx={{ fontSize: 24, color: '#ef9a9a' }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ef9a9a' }}>
                          {submissionResult.verdict}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffcc80' }}>
                        {submissionResult.verdict}
                      </Typography>
                    )}
                    <Paper sx={{ px: 1.5, py: 0.5, borderRadius: '24px', backgroundColor: '#333', border: '1px solid #555', ml: 1 }}>
                      <Typography variant="body2" sx={{ color: '#ccc' }}>
                        {submissionResult.passedSample}/{submissionResult.totalSample} passed
                      </Typography>
                    </Paper>
                  </Box>
                  <IconButton onClick={() => setShowResults(!showResults)} size="small" sx={{ color: '#ccc' }}>
                    {showResults ? <EyeOff sx={{ fontSize: 20 }} /> : <Eye sx={{ fontSize: 20 }} />}
                  </IconButton>
                </Box>

                <Box sx={{ p: 2, overflowY: 'auto', maxHeight: 256, spaceY: 2 }}>
                  {Array.isArray(submissionResult.sampleResults) && submissionResult.sampleResults.length > 0 ? submissionResult.sampleResults.map((tc, i) => (
                    <Paper
                      key={i}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: tc.passed ? '#4caf50' : '#f44336',
                        background: tc.passed ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.08)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
                          Sample Test Case {i + 1}
                        </Typography>
                        {tc.passed ? (
                          <Typography sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                            Passed
                          </Typography>
                        ) : (
                          <Typography sx={{ color: '#f44336', fontWeight: 'bold' }}>
                            Failed
                          </Typography>
                        )}
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography sx={{ fontWeight: 'bold', color: '#999' }}>
                            Input:
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              backgroundColor: '#222',
                              p: 1,
                              borderRadius: '6px',
                              color: '#fff',
                              fontFamily: 'monospace'
                            }}
                          >
                            {tc.input}
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography sx={{ fontWeight: 'bold', color: '#999' }}>
                            Expected Output:
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              backgroundColor: '#222',
                              p: 1,
                              borderRadius: '6px',
                              color: '#2196f3',
                              fontFamily: 'monospace'
                            }}
                          >
                            {tc.expectedOutput}
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography sx={{ fontWeight: 'bold', color: '#999' }}>
                            Your Output:
                          </Typography>
                          <Box
                            component="pre"
                            sx={{
                              backgroundColor: '#222',
                              p: 1,
                              borderRadius: '6px',
                              color: tc.passed ? '#4caf50' : '#f44336',
                              fontFamily: 'monospace'
                            }}
                          >
                            {tc.actualOutput}
                          </Box>
                          {!tc.passed && tc.error && (
                            <Typography sx={{ color: '#f44336', fontSize: '0.95rem', mt: 1 }}>
                              Error: {tc.error}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  )) : (
                    <Typography sx={{ color: '#ccc' }}>
                      No sample results were returned by the server.
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </EditorCard>
        </MainContainer>
      </GradientBox>
    </ThemeProvider>
  );
};

export default CodingChallengePage;