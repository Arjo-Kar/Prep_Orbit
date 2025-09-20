import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

function CodingChallengeResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, challenge } = location.state || {};

  if (!result || !challenge) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" color="error">No result data found.</Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}>
      <Button
        onClick={() => navigate(-1)}
        startIcon={<ArrowLeft size={20} />}
        sx={{ mb: 3 }}
        variant="outlined"
      >
        Back to Editor
      </Button>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        {challenge.title} - Results
      </Typography>
      <Paper sx={{
        p: 3, mb: 3, borderRadius: '16px', textAlign: 'center', fontWeight: 'bold',
        background: result.allPassed ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.08)',
        color: result.allPassed ? '#4caf50' : '#f44336',
        fontSize: '1.2rem', border: `2px solid ${result.allPassed ? '#4caf50' : '#f44336'}`
      }}>
        {result.allPassed ? "Accepted" : "Wrong Answer"}
        <Typography variant="subtitle2" sx={{ color: "#888", mt: 1 }}>
          {result.passedTestCases}/{result.totalTestCases} test cases passed
        </Typography>
        <Typography variant="body2" sx={{ color: "#ccc", mt: 2 }}>
          {result.allPassed
            ? "All test cases (including hidden) passed! 🎉"
            : "Some test cases (including hidden) failed."}
        </Typography>
      </Paper>
      {Array.isArray(result?.results) && result.results.map((tc, i) => (
        <Paper key={i} sx={{
          p: 2, mb: 2, borderRadius: '10px', border: '2px solid',
          borderColor: tc.passed ? '#4caf50' : '#f44336',
          background: tc.passed ? 'rgba(76,175,80,0.08)' : 'rgba(244,67,54,0.08)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1 }}>
              Test Case {i + 1} {tc.visible ? '(Sample)' : '(Hidden)'}
            </Typography>
            {tc.passed
              ? <CheckCircle size={20} style={{ color: '#4caf50' }} />
              : <XCircle size={20} style={{ color: '#f44336' }} />}
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography sx={{ fontWeight: 'bold', color: '#999' }}>Input:</Typography>
              <Box component="pre" sx={{
                backgroundColor: '#222', p: 1, borderRadius: '6px', color: '#fff', fontFamily: 'monospace'
              }}>{tc.input}</Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography sx={{ fontWeight: 'bold', color: '#999' }}>Expected Output:</Typography>
              <Box component="pre" sx={{
                backgroundColor: '#222', p: 1, borderRadius: '6px', color: '#2196f3', fontFamily: 'monospace'
              }}>{tc.expectedOutput}</Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography sx={{ fontWeight: 'bold', color: '#999' }}>Your Output:</Typography>
              <Box component="pre" sx={{
                backgroundColor: '#222', p: 1, borderRadius: '6px', color: tc.passed ? '#4caf50' : '#f44336', fontFamily: 'monospace'
              }}>{tc.actualOutput}</Box>
              {!tc.passed && tc.error && (
                <Typography sx={{ color: '#f44336', fontSize: '0.95rem', mt: 1 }}>
                  Error: {tc.error}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      ))}
    </Box>
  );
}

export default CodingChallengeResultPage;