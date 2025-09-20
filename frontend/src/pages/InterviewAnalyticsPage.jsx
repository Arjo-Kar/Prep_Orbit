/**
 * Fully self‑contained dark-mode Analytics page.
 * - No external local component/util/theme imports required.
 * - Fixes previous 404 by:
 *      1) Trying time-series endpoint: /api/interviews/analytics/time-series?days=XX
 *      2) If 404 / non-JSON / no series array -> falls back to stats endpoint:
 *         /api/interviews/user/{userId}/stats  (synthesizes a single-point series)
 * - Hard-coded backend base: http://localhost:8080  (per user request)
 * - Includes mini components (MetricCard, TrendBadge, ChartToggleGroup) & CSV export utility inline.
 * - Defensive JSON parsing & content-type checks; graceful error messages.
 *
 * Requirements:
 *   npm i @mui/material @emotion/react @emotion/styled recharts
 *
 * Add route in your router:  <Route path="/analytics" element={<InterviewAnalyticsPage/>} />
 */
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Button,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  Skeleton,
  CssBaseline
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Download,
  Insights,
  Timeline,
  Dataset,
  ShowChart
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip as RTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

/* ----------------------------------------------------------------
   Configuration
-------------------------------------------------------------------*/
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'; // Strictly using port 8080 as requested

/* ----------------------------------------------------------------
   Dark Theme (self-contained)
-------------------------------------------------------------------*/
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7b1fa2' },
    secondary: { main: '#f50057' },
    success: { main: '#4caf50' },
    warning: { main: '#ff9800' },
    error: { main: '#ef5350' },
    info: { main: '#2196f3' },
    background: {
      default: '#0d0918',
      paper: '#181327'
    },
    divider: 'rgba(255,255,255,0.12)',
    text: {
      primary: '#ffffff',
      secondary: '#b7b2c7'
    }
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(8px)'
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 'none',
          color: '#bbb',
          fontWeight: 600,
          '&.Mui-selected': {
            background: 'linear-gradient(45deg,#7b1fa2,#f50057)',
            color: '#fff'
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2d2542',
          fontSize: 12
        }
      }
    }
  }
});

/* ----------------------------------------------------------------
   Styled Background
-------------------------------------------------------------------*/
const GradientBackground = styled('div')(() => ({
  minHeight: '100vh',
  width: '100%',
  background:
    'radial-gradient(circle at 18% 20%, #2b1f48 0%, #150f26 55%, #0d0918 100%)',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column'
}));

/* ----------------------------------------------------------------
   Utility Functions
-------------------------------------------------------------------*/
function formatDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
function addSMA(data, key, windowSize = 5, outKey = 'sma') {
  return data.map((row, i) => {
    if (i + 1 < windowSize) return { ...row, [outKey]: null };
    const slice = data.slice(i + 1 - windowSize, i + 1);
    const avg = slice.reduce((a, r) => a + (r[key] || 0), 0) / windowSize;
    return { ...row, [outKey]: Number(avg.toFixed(2)) };
  });
}
function addEMA(data, key, alpha = 0.3, outKey = 'ema') {
  let prev = null;
  return data.map(r => {
    const val = r[key] ?? 0;
    if (prev == null) prev = val;
    const ema = alpha * val + (1 - alpha) * prev;
    prev = ema;
    return { ...r, [outKey]: Number(ema.toFixed(2)) };
  });
}
function computeSlope(data, key) {
  const pts = data
    .map((d, i) => ({ x: i, y: d[key] }))
    .filter(p => typeof p.y === 'number' && !isNaN(p.y));
  const n = pts.length;
  if (n < 2) return 0;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (const p of pts) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return Number(slope.toFixed(3));
}
function exportSeriesAsCSV(series, filename = 'analytics_export.csv') {
  if (!Array.isArray(series) || !series.length) return;
  const headers = ['timestamp', 'overall', 'technical', 'communication', 'problemSolving'];
  const lines = [headers.join(',')];
  series.forEach(p => {
    lines.push(
      [
        p.timestamp || p.date || '',
        p.overall ?? '',
        p.technical ?? '',
        p.communication ?? '',
        p.problemSolving ?? ''
      ].join(',')
    );
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ----------------------------------------------------------------
   Inline Reusable Mini Components
-------------------------------------------------------------------*/
function MetricCard({ title, value, subtitle, color = '#7b1fa2', icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: 2.5,
        minWidth: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2,
        background: 'linear-gradient(135deg, rgba(123,31,162,0.18), rgba(245,0,87,0.1))',
        border: '1px solid rgba(255,255,255,0.10)',
        '&::after': {
          content: '""',
            position: 'absolute',
            width: 160,
            height: 160,
            right: -55,
            top: -55,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0))',
            borderRadius: '50%'
        }
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        {icon && (
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.10)',
              color: color
            }}
          >
            {icon}
          </Box>
        )}
        <Box flex={1}>
          <Typography
            variant="caption"
            sx={{ textTransform: 'uppercase', letterSpacing: '.07em', color: 'text.secondary', fontWeight: 600 }}
          >
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

function TrendBadge({ slope }) {
  let label = 'Flat';
  let bg = '#616161';
  if (slope > 0.02) {
    label = 'Improving';
    bg = '#2e7d32';
  } else if (slope < -0.02) {
    label = 'Declining';
    bg = '#c62828';
  }
  return (
    <Chip
      label={`${label} (${slope})`}
      sx={{
        background: bg,
        color: '#fff',
        fontWeight: 600,
        letterSpacing: '.4px'
      }}
    />
  );
}

function ChartToggleGroup({ value, onChange }) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(e, v) => v && onChange(v)}
      sx={{
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 3,
        p: 0.4
      }}
    >
      <ToggleButton value="overall">Overall</ToggleButton>
      <ToggleButton value="technical">Tech</ToggleButton>
      <ToggleButton value="communication">Comm</ToggleButton>
      <ToggleButton value="problemSolving">Problem</ToggleButton>
    </ToggleButtonGroup>
  );
}

/* ----------------------------------------------------------------
   Core Analytics Page
-------------------------------------------------------------------*/
const COLORS = {
  overall: '#f50057',
  technical: '#2196f3',
  communication: '#4caf50',
  problemSolving: '#ff9800',
  ema: '#7b1fa2',
  sma: '#ffb347'
};

function InterviewAnalyticsPage() {
  const navigate = useNavigate();

  const [range, setRange] = useState('30');          // days
  const [series, setSeries] = useState([]);          // time-series points
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [showEMA, setShowEMA] = useState(true);
  const [showSMA, setShowSMA] = useState(false);
  const [showBars, setShowBars] = useState(false);

  // Prevent double fetch in React StrictMode dev
  const firstFetchRef = useRef(false);

  // Build final enriched series with smoothing
  const enriched = useMemo(() => {
    if (!series.length) return [];
    let data = [...series].sort(
      (a, b) => new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date)
    );
    data = addEMA(data, 'overall', 0.25, 'overallEma');
    data = addSMA(data, 'overall', 5, 'overallSma');
    return data;
  }, [series]);

  const slope = useMemo(
    () => (enriched.length ? computeSlope(enriched, 'overall') : 0),
    [enriched]
  );

  const latest = enriched[enriched.length - 1];

  const token = useMemo(
    () => localStorage.getItem('authToken') || localStorage.getItem('token'),
    []
  );
  const userId = useMemo(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.id || localStorage.getItem('userId');
  }, []);

  const handleRangeChange = (_, v) => {
    if (v) setRange(v);
  };

  const buildUrl = useCallback(
    (path) => {
      if (!path.startsWith('/')) path = '/' + path;
      return `${API_BASE}${path}`;
    },
    []
  );

  const parseJSONSafely = (text, status) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON (status ${status}): ${e.message}`);
    }
  };

  const fetchTimeSeries = useCallback(
    async (days) => {
      // 1. Try time-series endpoint
      const primary =
        buildUrl(`/api/interviews/analytics/time-series?days=${days}`);
      const headers = {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
        'Content-Type': 'application/json'
      };

      let primaryResponse;
      try {
        primaryResponse = await fetch(primary, { headers });
      } catch (networkErr) {
        throw new Error(`Network error: ${networkErr.message}`);
      }

      const ct = primaryResponse.headers.get('content-type') || '';
      const text = await primaryResponse.text();

      if (primaryResponse.status === 404 || !ct.includes('application/json')) {
        // Fallback path
        return { fallback: true, rawText: text, status: primaryResponse.status };
      }

      const json = parseJSONSafely(text, primaryResponse.status);
      if (!primaryResponse.ok || json.success === false) {
        // Attempt fallback if primary fails logically
        return { fallback: true, rawJson: json, status: primaryResponse.status };
      }
      if (!Array.isArray(json.series)) {
        return { fallback: true, rawJson: json, status: primaryResponse.status };
      }
      return { fallback: false, data: json.series };
    },
    [buildUrl, token]
  );

  const fetchStatsFallback = useCallback(async () => {
    if (!userId) throw new Error('User ID not found for fallback.');
    const url = buildUrl(`/api/interviews/user/${userId}/stats`);
    const res = await fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json'
      }
    });
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
    if (!ct.includes('application/json')) {
      throw new Error(`Fallback also failed (non-JSON, status ${res.status})`);
    }
    const json = parseJSONSafely(text, res.status);
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Fallback stats error ${res.status}`);
    }
    if (!json.stats) throw new Error('Fallback stats missing "stats" object.');
    // Synthesize single point
    const s = json.stats;
    const now = new Date().toISOString();
    return [
      {
        timestamp: now,
        overall: s.averageOverallScore ?? 0,
        technical: s.averageTechnicalScore ?? 0,
        communication: s.averageCommunicationScore ?? 0,
        problemSolving: s.averageProblemSolvingScore ?? 0
      }
    ];
  }, [buildUrl, token, userId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTimeSeries(range);
      if (result.fallback) {
        const fb = await fetchStatsFallback();
        setSeries(fb);
      } else {
        const cleaned = result.data.map(p => ({
          timestamp: p.timestamp || p.date,
          overall: p.overall ?? p.overallScore ?? p.averageOverallScore ?? p.overall_score,
          technical: p.technical ?? p.technicalScore ?? p.averageTechnicalScore ?? p.technical_score,
          communication:
            p.communication ?? p.communicationScore ?? p.averageCommunicationScore ?? p.communication_score,
          problemSolving:
            p.problemSolving ??
            p.problemSolvingScore ??
            p.averageProblemSolvingScore ??
            p.problem_solving_score
        }));
        setSeries(cleaned);
      }
    } catch (e) {
      setError(e.message);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, [fetchTimeSeries, fetchStatsFallback, range]);

  useEffect(() => {
    if (firstFetchRef.current) return;
    firstFetchRef.current = true;
    loadData();
  }, [loadData]);

  // Re-fetch when range changes
  useEffect(() => {
    if (!firstFetchRef.current) return;
    loadData();
  }, [range, loadData]);

  const displayedMetricKey = selectedMetric === 'problemSolving'
    ? 'problemSolving'
    : selectedMetric;

  const metricColor = COLORS[displayedMetricKey] || COLORS.overall;

  // Distribution for bar chart
  const distribution = useMemo(() => {
    if (!enriched.length) return [];
    const buckets = { '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0 };
    enriched.forEach(pt => {
      const v = pt.overall ?? 0;
      if (v < 2) buckets['0-2']++;
      else if (v < 4) buckets['2-4']++;
      else if (v < 6) buckets['4-6']++;
      else if (v < 8) buckets['6-8']++;
      else buckets['8-10']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [enriched]);

  const safeValue = (v) => (v == null ? '--' : Number(v).toFixed(2));

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <GradientBackground>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={4}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title="Back">
                <IconButton
                  onClick={() => navigate(-1)}
                  sx={{
                    color: '#bdb8cc',
                    background: 'rgba(255,255,255,0.05)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.12)',
                      color: 'white'
                    }
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(45deg,#7b1fa2,#f50057,#ff9800)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px'
                }}
              >
                Performance Analytics
              </Typography>
              <TrendBadge slope={slope} />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <ToggleButtonGroup
                exclusive
                size="small"
                value={range}
                onChange={handleRangeChange}
                sx={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 4,
                  p: 0.5
                }}
              >
                <ToggleButton value="7">7D</ToggleButton>
                <ToggleButton value="30">30D</ToggleButton>
                <ToggleButton value="60">60D</ToggleButton>
                <ToggleButton value="90">90D</ToggleButton>
              </ToggleButtonGroup>

              <Tooltip title="Reload">
                <span>
                  <IconButton
                    disabled={loading}
                    onClick={loadData}
                    sx={{
                      color: loading ? '#777' : '#b9b4c9',
                      '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.10)' }
                    }}
                  >
                    <Refresh
                      sx={{
                        animation: loading ? 'spin 1s linear infinite' : 'none'
                      }}
                    />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Export CSV">
                <IconButton
                  disabled={!enriched.length}
                  onClick={() => exportSeriesAsCSV(enriched)}
                  sx={{
                    color: enriched.length ? '#b9b4c9' : '#555',
                    '&:hover': {
                      color: '#fff',
                      background: enriched.length
                        ? 'rgba(255,255,255,0.10)'
                        : 'none'
                    }
                  }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

            {/* Error / Loading */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 3,
                background: 'rgba(244,67,54,0.15)',
                border: '1px solid rgba(244,67,54,0.4)'
              }}
              action={
                <Button
                  size="small"
                  color="inherit"
                  onClick={loadData}
                  sx={{ fontWeight: 600 }}
                >
                  RETRY
                </Button>
              }
            >
              <Typography fontWeight="bold" gutterBottom>
                Error Loading Analytics
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {error}
              </Typography>
            </Alert>
          )}

          {loading && !series.length && (
            <Paper
              sx={{
                p: 4,
                mb: 4,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Loading analytics...
              </Typography>
              <Skeleton
                variant="rectangular"
                height={180}
                sx={{ borderRadius: 2, mb: 2 }}
              />
              <Skeleton
                variant="rectangular"
                height={180}
                sx={{ borderRadius: 2 }}
              />
            </Paper>
          )}

          {!loading && !error && !series.length && (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                mb: 5,
                background: 'rgba(255,255,255,0.04)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                No Data Yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Complete at least one interview with feedback to see charts.
              </Typography>
              <Button
                onClick={loadData}
                variant="contained"
                startIcon={<Refresh />}
                sx={{
                  background: 'linear-gradient(45deg,#7b1fa2,#f50057)',
                  fontWeight: 600
                }}
              >
                Refresh
              </Button>
            </Paper>
          )}

          {enriched.length > 0 && (
            <Stack spacing={4}>
              {/* KPI Cards */}
              <Stack
                direction="row"
                flexWrap="wrap"
                spacing={2}
                useFlexGap
              >
                <MetricCard
                  title="Latest Overall"
                  value={safeValue(latest?.overall)}
                  subtitle="Last data point"
                  icon={<Insights />}
                  color={COLORS.overall}
                />
                <MetricCard
                  title="Technical"
                  value={safeValue(latest?.technical)}
                  subtitle="Latest"
                  icon={<Dataset />}
                  color={COLORS.technical}
                />
                <MetricCard
                  title="Communication"
                  value={safeValue(latest?.communication)}
                  subtitle="Latest"
                  icon={<Dataset />}
                  color={COLORS.communication}
                />
                <MetricCard
                  title="Problem Solving"
                  value={safeValue(latest?.problemSolving)}
                  subtitle="Latest"
                  icon={<Dataset />}
                  color={COLORS.problemSolving}
                />
                <MetricCard
                  title="Data Points"
                  value={enriched.length}
                  subtitle={`${range} day window`}
                  icon={<Timeline />}
                  color="#b39ddb"
                />
              </Stack>

              {/* Controls */}
              <Paper
                sx={{
                  p: 2.5,
                  background: 'linear-gradient(135deg,#241d39,#19142b)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <ChartToggleGroup
                    value={selectedMetric}
                    onChange={setSelectedMetric}
                  />
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={showEMA}
                          onChange={(e) => setShowEMA(e.target.checked)}
                        />
                      }
                      label="EMA"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={showSMA}
                          onChange={(e) => setShowSMA(e.target.checked)}
                        />
                      }
                      label="SMA"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={showBars}
                          onChange={(e) => setShowBars(e.target.checked)}
                        />
                      }
                      label="Bar Dist."
                    />
                  </Stack>
                </Stack>
              </Paper>

              {/* Main Line / Area Chart */}
              <Paper
                sx={{
                  p: 3,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)'
                }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {selectedMetric === 'overall'
                    ? 'Overall Score Over Time'
                    : `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Score Over Time`}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  Hover points for details; toggle EMA / SMA for smoothing.
                </Typography>
                <Box sx={{ width: '100%', height: 340, mt: 2 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={enriched}
                      margin={{ top: 15, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={formatDate}
                        stroke="#b7b2c7"
                        style={{ fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#b7b2c7"
                        domain={[0, 10]}
                        tick={{ fontSize: 12 }}
                      />
                      <RTooltip
                        contentStyle={{
                          background: '#211a32',
                          border: '1px solid #4c3d66'
                        }}
                        labelFormatter={(l) => `Date: ${formatDate(l)}`}
                        formatter={(value, key) => [value, key]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={displayedMetricKey}
                        stroke={metricColor}
                        strokeWidth={2.4}
                        dot={false}
                        name={`${displayedMetricKey} score`}
                        isAnimationActive={false}
                      />
                      {showEMA && selectedMetric === 'overall' && (
                        <Line
                          type="monotone"
                          dataKey="overallEma"
                          stroke={COLORS.ema}
                          strokeWidth={1.5}
                          dot={false}
                          name="EMA"
                          strokeDasharray="4 2"
                          isAnimationActive={false}
                        />
                      )}
                      {showSMA && selectedMetric === 'overall' && (
                        <Line
                          type="monotone"
                          dataKey="overallSma"
                          stroke={COLORS.sma}
                          strokeWidth={1.5}
                          dot={false}
                          name="SMA(5)"
                          strokeDasharray="5 5"
                          isAnimationActive={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* Area Visualization (overall EMA) */}
              {selectedMetric === 'overall' && (
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.10)'
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Smoothed Performance (EMA)
                  </Typography>
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <AreaChart data={enriched}>
                        <defs>
                          <linearGradient id="emaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor={COLORS.ema}
                              stopOpacity={0.7}
                            />
                            <stop
                              offset="95%"
                              stopColor={COLORS.ema}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={formatDate}
                          stroke="#b7b2c7"
                        />
                        <YAxis domain={[0, 10]} stroke="#b7b2c7" />
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                        <RTooltip
                          contentStyle={{
                            background: '#211a32',
                            border: '1px solid #4c3d66'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="overallEma"
                          stroke={COLORS.ema}
                          fill="url(#emaGradient)"
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              )}

              {/* Distribution / Bars */}
              {showBars && (
                <Paper
                  sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.10)'
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Overall Score Distribution
                  </Typography>
                  <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={distribution}>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="range" stroke="#b7b2c7" />
                        <YAxis allowDecimals={false} stroke="#b7b2c7" />
                        <RTooltip
                          contentStyle={{
                            background: '#211a32',
                            border: '1px solid #4c3d66'
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill={COLORS.problemSolving}
                          radius={[6, 6, 0, 0]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              )}

              {/* Footer meta */}
              <Paper
                sx={{
                  p: 3,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={3}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Chip
                      icon={<ShowChart sx={{ color: '#fff' }} />}
                      label={`Points: ${enriched.length}`}
                      sx={{
                        background: 'linear-gradient(45deg,#7b1fa2,#f50057)',
                        color: '#fff',
                        fontWeight: 600
                      }}
                    />
                    <Chip
                      icon={<Insights sx={{ color: '#fff' }} />}
                      label={`Slope: ${slope}`}
                      sx={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff'
                      }}
                    />
                    <Chip
                      icon={<Dataset sx={{ color: '#fff' }} />}
                      label={`Range: ${range}d`}
                      sx={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff'
                      }}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', textAlign: 'right' }}
                  >
                    Last updated: {new Date().toLocaleTimeString()}
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          )}
        </Container>

        {/* Inline Keyframes */}
        <style jsx="true">{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </GradientBackground>
    </ThemeProvider>
  );
}

export default InterviewAnalyticsPage;