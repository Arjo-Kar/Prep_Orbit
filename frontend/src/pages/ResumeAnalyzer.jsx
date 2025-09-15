import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  CircularProgress,
  Avatar,
  Slide,
  Fade,
  Zoom,
  Tab,
  Tabs,
  Tooltip,
  Divider,
  Badge
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Assessment,
  CheckCircle,
  Warning,
  Error,
  Download,
  Analytics,
  FilePresent,
  Stars,
  Psychology,
  School,
  Work,
  ContactPage,
  Code,
  AutoAwesome,
  History,
  PictureAsPdf,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Refresh,
  ImageSearch,
  TextFields,
  SmartToy,
  Speed,
  AutoFixHigh,
  ArrowBack,
  Dashboard
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import PageLayout from '../components/PageLayout';
import jsPDF from 'jspdf';

/* ===================== Animations ===================== */
const gentleFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(1deg); }
`;
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 18px rgba(100,181,246,0.35); }
  50% { box-shadow: 0 0 28px rgba(100,181,246,0.65); }
`;
const rotateIcon = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

/* ===================== Styled Components ===================== */
const DarkGradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg,#1a1f2f 0%,#152238 55%,#0f335a 100%)',
  borderRadius: 22,
  padding: theme.spacing(5, 4),
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.08)',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(45deg,rgba(255,255,255,0.05) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.05) 50%,rgba(255,255,255,0.05) 75%,transparent 75%,transparent)',
    backgroundSize: '24px 24px',
    animation: `${shimmer} 6s linear infinite`,
    opacity: 0.4
  }
}));

const EnhancedUploadZone = styled(Paper, {
  shouldForwardProp: (prop) => !['isDragging', 'hasFile', 'analyzing'].includes(prop)
})(({ isDragging, hasFile, analyzing, theme }) => ({
  border: `2px dashed ${
    analyzing ? '#9c27b0' : isDragging ? '#64b5f6' : hasFile ? '#4caf50' : '#47566a'
  }`,
  borderRadius: 18,
  padding: theme.spacing(7, 4),
  textAlign: 'center',
  cursor: analyzing ? 'not-allowed' : 'pointer',
  background:
    analyzing
      ? 'linear-gradient(135deg,rgba(156,39,176,0.12),rgba(156,39,176,0.05))'
      : isDragging
      ? 'linear-gradient(135deg,rgba(100,181,246,0.15),rgba(100,181,246,0.05))'
      : hasFile
      ? 'linear-gradient(135deg,rgba(76,175,80,0.18),rgba(76,175,80,0.05))'
      : 'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))',
  transition: 'all .35s cubic-bezier(.4,0,.2,1)',
  backdropFilter: 'blur(12px)',
  position: 'relative',
  overflow: 'hidden',
  animation: analyzing ? `${pulseGlow} 2.2s ease-in-out infinite` : 'none',
  '&:hover': !analyzing && {
    borderColor: isDragging ? '#64b5f6' : '#90caf9',
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 30px -5px rgba(100,181,246,0.35)'
  }
}));

const AnalysisMethodCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(140deg,#2b2f33 0%,#1f2327 100%)',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.07)',
  transition: 'all .3s ease',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 14px 32px -6px rgba(0,0,0,0.45)',
    borderColor: 'rgba(100,181,246,0.35)'
  }
}));

const ProgressCard = styled(Card)(() => ({
  background: 'linear-gradient(145deg,#1e1e1f 0%,#2a2d2f 100%)',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)'
}));

const PDFViewerContainer = styled(Card)(() => ({
  background: '#161819',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  height: '85vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative'
}));

const PDFControls = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(90deg,#2d3033 0%,#232629 100%)',
  borderBottom: '1px solid rgba(255,255,255,0.09)',
  padding: theme.spacing(1.2, 1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  minHeight: 58
}));

const PDFViewerArea = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
  background: '#101214',
  position: 'relative',
  '&::-webkit-scrollbar': {
    width: 10,
    height: 10
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255,255,255,0.06)'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255,255,255,0.28)',
    borderRadius: 8
  }
}));

/* ===================== Helper Small Components ===================== */
function AnalysisProgress({ analyzing, currentStep, analysisMethod, details }) {
  if (!analyzing) return null;
  const steps = [
    { id: 'upload', label: 'Upload', icon: <FilePresent /> },
    { id: 'text', label: 'Text Extraction', icon: <TextFields /> },
    { id: 'image', label: 'Image Processing', icon: <ImageSearch /> },
    { id: 'ai', label: 'AI Analysis', icon: <SmartToy /> },
    { id: 'complete', label: 'Complete', icon: <CheckCircle /> }
  ];
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentStep)
  );
  const progress = (currentIndex / (steps.length - 1)) * 100;

  return (
    <ProgressCard elevation={0}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
            <Box sx={{ position: 'relative' }}>
              <CircularProgress size={38} thickness={4} sx={{ color: '#64b5f6' }} />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Psychology
                  sx={{
                    fontSize: 18,
                    color: '#64b5f6',
                    animation: `${rotateIcon} 2.5s linear infinite`
                  }}
                />
              </Box>
            </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'white' }}>
              AI Processing
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {analysisMethod
                ? `Method: ${analysisMethod.toUpperCase()}`
                : 'Determining best method...'}
            </Typography>
          </Box>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 5,
            backgroundColor: 'rgba(255,255,255,0.15)',
            '& .MuiLinearProgress-bar': {
              background:
                'linear-gradient(90deg,#64b5f6 0%,#42a5f5 40%,#64b5f6 100%)',
              borderRadius: 5
            }
          }}
        />

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.2 }}>
          {steps.map((s, i) => (
            <Tooltip key={s.id} title={s.label}>
              <Avatar
                sx={{
                  width: 26,
                  height: 26,
                  fontSize: 13,
                  bgcolor:
                    i <= currentIndex ? '#64b5f6' : 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              >
                {React.cloneElement(s.icon, { sx: { fontSize: 15 } })}
              </Avatar>
            </Tooltip>
          ))}
        </Stack>

        {details && (
          <Box
            sx={{
              mt: 2,
              p: 1.2,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 1
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}
            >
              {details.hasTextContent
                ? '✓ Text detected'
                : '⚠ Minimal text'}{' '}
              • {details.imagePages > 0 ? `${details.imagePages} pages` : 'No pages'} •
              Running...
            </Typography>
          </Box>
        )}
      </CardContent>
    </ProgressCard>
  );
}

function EnhancedPDFViewer({ file, fileKey, analyzing, onCapabilities }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [scale, setScale] = useState(100);
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  const [error, setError] = useState(null);
  const currentKeyRef = useRef();

  useEffect(() => {
    if (file && fileKey !== currentKeyRef.current) {
      setLoading(true);
      setError(null);
      try {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        currentKeyRef.current = fileKey;
        setLoading(false);
        checkCapabilities(file);
      } catch (e) {
        setError('Could not load PDF');
        setLoading(false);
      }
    }
    return () => {
      if (pdfUrl && fileKey !== currentKeyRef.current) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [file, fileKey]);

  const checkCapabilities = async (f) => {
    try {
      const fd = new FormData();
      fd.append('resume', f);
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:8080/api/resume/check-capabilities', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        const data = await res.json();
        setCapabilities(data.capabilities);
        onCapabilities && onCapabilities(data.capabilities);
      }
    } catch (e) {
      console.warn('Capability check failed', e);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(300, s + 25));
  const zoomOut = () => setScale((s) => Math.max(50, s - 25));
  const resetZoom = () => setScale(100);
  const openFull = () => pdfUrl && window.open(pdfUrl, '_blank');
  const refresh = () => {
    if (file) {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const newUrl = URL.createObjectURL(file);
      setPdfUrl(newUrl);
    }
  };

  if (!file) {
    return (
      <PDFViewerContainer>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            color: 'rgba(255,255,255,0.6)'
          }}
        >
          <PictureAsPdf sx={{ fontSize: 96, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            PDF Viewer
          </Typography>
          <Typography variant="body2">
            Upload a PDF resume to preview it here.
          </Typography>
        </Box>
      </PDFViewerContainer>
    );
  }

  return (
    <PDFViewerContainer>
      <PDFControls>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <PictureAsPdf sx={{ color: '#64b5f6', fontSize: 22 }} />
          <Box>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}
            >
              {file.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
              {capabilities && (
                <>
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                  />
                  {capabilities.supportsTextAnalysis && (
                    <Chip
                      label="Text"
                      size="small"
                      icon={<TextFields sx={{ fontSize: '0.8rem !important' }} />}
                      sx={{
                        height: 20,
                        fontSize: '0.6rem',
                        backgroundColor: '#4caf50',
                        color: 'white'
                      }}
                    />
                  )}
                  {capabilities.supportsImageAnalysis && (
                    <Chip
                      label="Image"
                      size="small"
                      icon={<ImageSearch sx={{ fontSize: '0.8rem !important' }} />}
                      sx={{
                        height: 20,
                        fontSize: '0.6rem',
                        backgroundColor: '#2196f3',
                        color: 'white'
                      }}
                    />
                  )}
                </>
              )}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            size="small"
            onClick={zoomOut}
            disabled={scale <= 50}
            sx={{ color: 'rgba(255,255,255,0.75)' }}
          >
            <ZoomOut fontSize="small" />
          </IconButton>
          <Button
            size="small"
            onClick={resetZoom}
            sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 54, fontSize: '0.7rem' }}
          >
            {scale}%
          </Button>
          <IconButton
            size="small"
            onClick={zoomIn}
            disabled={scale >= 300}
            sx={{ color: 'rgba(255,255,255,0.75)' }}
          >
            <ZoomIn fontSize="small" />
          </IconButton>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ backgroundColor: 'rgba(255,255,255,0.25)', mx: 1 }}
          />
          <IconButton
            size="small"
            onClick={refresh}
            sx={{ color: 'rgba(255,255,255,0.75)' }}
          >
            <Refresh fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={openFull}
            sx={{ color: 'rgba(255,255,255,0.75)' }}
          >
            <Fullscreen fontSize="small" />
          </IconButton>
        </Stack>
      </PDFControls>

      {analyzing && (
        <Box
          sx={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'rgba(100,181,246,0.18)',
            border: '1px solid rgba(100,181,246,0.4)',
            backdropFilter: 'blur(6px)',
            px: 1.5,
            py: 0.5,
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 0.7
          }}
        >
          <Psychology
            sx={{
              fontSize: 16,
              color: '#64b5f6',
              animation: `${rotateIcon} 2.2s linear infinite`
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}
          >
            Analyzing
          </Typography>
        </Box>
      )}

      <PDFViewerArea>
        {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2
              }}
            >
              <CircularProgress sx={{ color: '#64b5f6' }} />
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Loading PDF ...
              </Typography>
            </Box>
        )}
        {error && (
          <Alert
            severity="error"
            sx={{
              backgroundColor: 'rgba(244,67,54,0.1)',
              color: '#f44336',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)'
            }}
          >
            {error}
          </Alert>
        )}
        {pdfUrl && !loading && !error && (
          <iframe
            key={fileKey}
            src={`${pdfUrl}#zoom=${scale}&view=FitH&toolbar=0&navpanes=0`}
            title="Resume PDF"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
      </PDFViewerArea>
    </PDFViewerContainer>
  );
}

function AnalysisMethodSelector({ capabilities, selectedMethod, onChange }) {
  const methods = [
    {
      id: 'smart',
      name: 'Smart',
      desc: 'Automatically chooses best approach',
      icon: <AutoFixHigh />,
      color: '#9c27b0',
      available: true
    },
    {
      id: 'text',
      name: 'Text',
      desc: 'Focus on extracted textual content',
      icon: <TextFields />,
      color: '#4caf50',
      available: capabilities?.supportsTextAnalysis
    },
    {
      id: 'image',
      name: 'Image',
      desc: 'Layout & visual structural analysis',
      icon: <ImageSearch />,
      color: '#2196f3',
      available: capabilities?.supportsImageAnalysis
    }
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle1"
        sx={{ color: '#64b5f6', fontWeight: 700, mb: 1.5 }}
      >
        Choose Analysis Method
      </Typography>
      <Grid container spacing={2}>
        {methods.map((m) => (
          <Grid item xs={12} sm={4} key={m.id}>
            <AnalysisMethodCard
              onClick={() => m.available && onChange(m.id)}
              sx={{
                cursor: m.available ? 'pointer' : 'not-allowed',
                opacity: m.available ? 1 : 0.45,
                border:
                  selectedMethod === m.id
                    ? `2px solid ${m.color}`
                    : '1px solid rgba(255,255,255,0.08)',
                background:
                  selectedMethod === m.id
                    ? `linear-gradient(140deg,${m.color}22,${m.color}08)`
                    : undefined
              }}
            >
              <CardContent sx={{ p: 2.2, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: m.color,
                    width: 46,
                    height: 46,
                    mx: 'auto',
                    mb: 1.2
                  }}
                >
                  {m.icon}
                </Avatar>
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ color: 'white' }}
                >
                  {m.name} Analysis
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.55)' }}
                >
                  {m.desc}
                </Typography>
                {!m.available && (
                  <Chip
                    label="Unavailable"
                    size="small"
                    sx={{
                      mt: 1,
                      background: 'rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.65)',
                      height: 20,
                      fontSize: '0.6rem'
                    }}
                  />
                )}
              </CardContent>
            </AnalysisMethodCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/* ===================== Main Component ===================== */
export default function ResumeAnalyzer() {
    // 👇 Add this at the top with other useState hooks
    const [imageUrls, setImageUrls] = useState([]);

  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [secureImageUrls, setSecureImageUrls] = useState([]);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
    const currentUserId = user?.id;
  const [uploadConfig, setUploadConfig] = useState({
    maxFileSize: '50MB',
    maxFileSizeBytes: 50 * 1024 * 1024,
    supportedFormats: ['application/pdf'],
    supportedExtensions: ['.pdf']


  });

  const [currentStep, setCurrentStep] = useState('upload');
  const [analysisMethod, setAnalysisMethod] = useState('smart');
  const [selectedAnalysisMethod, setSelectedAnalysisMethod] = useState('smart');
  const [capabilities, setCapabilities] = useState(null);
  const [analysisDetails, setAnalysisDetails] = useState({});
  const [showMethodSelector, setShowMethodSelector] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAnalysisHistory();
    loadUploadConfig();
  }, []);

  const loadUploadConfig = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:8080/api/resume/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUploadConfig(data);
      }
    } catch (e) {
      console.warn('Failed to load config', e);
    }
  };
  useEffect(() => {
    const loadImages = async () => {
      if (selectedAnalysis?.pageImages) {
        const token = localStorage.getItem("authToken");
        const urls = [];

        for (const url of selectedAnalysis.pageImages) {
          const res = await fetch(`http://localhost:8080${url}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const blob = await res.blob();
          urls.push(URL.createObjectURL(blob));
        }

        setImageUrls(urls);
      }
    };

    loadImages();
  }, [selectedAnalysis]);

// Inside ResumeAnalyzer.jsx

const handleHistoryClick = async (item) => {
  const analysisId = item.id;   // ✅ always use id from backend
  if (!analysisId) {
    console.error("❌ No analysisId found in history item:", item);
    return;
  }

  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch(`http://localhost:8080/api/resume/analysis/${analysisId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      setSelectedAnalysis(data.analysis);
      setShowResults(true);
      setTabValue(0); // ✅ switch to Analyze tab automatically
    } else {
      console.error('Failed to fetch analysis details');
    }
  } catch (err) {
    console.error(err);
  }
};



 {selectedAnalysis?.pageImages?.length > 0 && (
   <Box sx={{ mt: 3 }}>
     <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
       Resume Pages
     </Typography>
     <Grid container spacing={2}>
       {selectedAnalysis.pageImages.map((url, idx) => (
         <Grid item xs={12} md={6} key={idx}>
           <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
             <img
               src={`http://localhost:8080${url}`}   // ✅ just prepend backend host
               alt={`Resume page ${idx + 1}`}
               style={{ width: "100%", display: "block" }}
             />
           </Card>
         </Grid>
       ))}
     </Grid>
   </Box>
 )}




  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    if (selectedFile.size > uploadConfig.maxFileSizeBytes) {
      setError(`File exceeds maximum size of ${uploadConfig.maxFileSize}`);
      return;
    }

    setFile(selectedFile);
    setFileKey(Date.now());
    setError('');
    setAnalysis(null);
    setSelectedAnalysis(null);
    setShowResults(false);
    setCurrentStep('upload');
    setAnalysisDetails({});
    setCapabilities(null);
    setShowMethodSelector(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };
  // put this near the top of your component, before analyzeResume
const loadAnalysisHistory = async () => {
  setLoadingHistory(true);
  try {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.warn('⚠️ No user found in localStorage');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    const currentUserId = parsedUser.id;
    if (!currentUserId) {
      console.warn('⚠️ No userId inside stored user');
      return;
    }

    const res = await fetch(`http://localhost:8080/api/resume/history?userId=${currentUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      console.log("📜 Raw history response:", data);   // add this
      setAnalysisHistory(data.analyses || []);
    } else {
      console.error('Failed to fetch history:', res.status, res.statusText);
    }
  } catch (e) {
    console.warn('History load failed', e);
  } finally {
    setLoadingHistory(false);
  }
};




  const analyzeResume = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    setCurrentStep('text');

    try {
      const fd = new FormData();
      fd.append('resume', file);

      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:8080/api/resume/analyze', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Analysis-Method': selectedAnalysisMethod
        },
        body: fd
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Server responded with ${res.status}`);
      }

      const result = await res.json();
      const method = result?.analysisInfo?.method || 'smart';
      setAnalysisMethod(method);
      setCurrentStep('complete');

      setAnalysisDetails({
        ...result.details,
        ...result.analysisInfo,
        fileInfo: result.fileInfo,
        pageImages: result.details?.pageImages || []
      });


      setAnalysis(result);
      setTimeout(() => setShowResults(true), 400);
       await loadAnalysisHistory();
    } catch (e) {
      console.error(e);
      setError(e.message || 'Analysis failed');
      setCurrentStep('upload');
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadPDF = async (analysisData = analysis) => {
    if (!analysisData) return;
    setDownloadingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFillColor(26, 31, 47);
      pdf.rect(0, 0, pageWidth, 38, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Resume Analysis Report', 18, 23);
      pdf.setFontSize(9);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}  |  Method: ${analysisDetails.analysisMethod || 'SMART'}`,
        18,
        31
      );

      let y = 50;

      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Overall Score', 18, y);

      y += 10;
      pdf.setFontSize(34);
      const scoreColor = getScoreColorRGB(analysisData.overallScore);
      pdf.setTextColor(...scoreColor);
      pdf.text(`${analysisData.overallScore}%`, 18, y);

      y += 18;
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Category Breakdown', 18, y);

      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      if (analysisData.scores) {
        Object.entries(analysisData.scores).forEach(([cat, val]) => {
          if (y > 260) {
            pdf.addPage();
            y = 30;
          }
          y += 8;
          pdf.setTextColor(60, 60, 60);
          pdf.text(`${cat.toUpperCase()}:`, 22, y);
          const col = getScoreColorRGB(val);
          pdf.setTextColor(...col);
          pdf.text(`${val}%`, 70, y);

          // Draw mini bar
          pdf.setFillColor(225, 225, 225);
            pdf.rect(90, y - 4, 60, 4, 'F');
          pdf.setFillColor(...col);
          pdf.rect(90, y - 4, (val / 100) * 60, 4, 'F');
        });
      }

      y += 16;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Suggestions', 18, y);

      if (analysisData.suggestions) {
        analysisData.suggestions.forEach((sug, i) => {
          y += 10;
          if (y > 260) {
            pdf.addPage();
            y = 30;
          }
          const sevColor =
            sug.severity === 'high'
              ? [244, 67, 54]
              : sug.severity === 'medium'
              ? [255, 152, 0]
              : [76, 175, 80];
          pdf.setFillColor(...sevColor);
          pdf.circle(20, y - 3, 2, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(40, 40, 40);
          pdf.text(`${i + 1}. ${sug.title}`, 26, y);

          y += 5;
          if (y > 270) {
            pdf.addPage();
            y = 30;
          }
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          const wrapped = pdf.splitTextToSize(
            sug.description,
            pageWidth - 38
          );
          pdf.text(wrapped, 26, y);
          y += wrapped.length * 4;

          y += 2;
          pdf.setFontSize(8);
          pdf.setTextColor(110, 110, 110);
          pdf.text(
            `${sug.category} • Priority: ${sug.severity?.toUpperCase()}`,
            26,
            y
          );
        });
      }

      pdf.setFontSize(8);
      pdf.setTextColor(130, 130, 130);
      pdf.text(
        'Generated by Enhanced AI Resume Analyzer',
        18,
        pdf.internal.pageSize.getHeight() - 10
      );

      pdf.save(`resume-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error('PDF generation error', e);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    if (score >= 40) return '#ff5722';
    return '#f44336';
  };
  const getScoreColorRGB = (score) => {
    if (score >= 80) return [76, 175, 80];
    if (score >= 60) return [255, 152, 0];
    if (score >= 40) return [255, 87, 34];
    return [244, 67, 54];
  };
  const getProgressStyle = (score) => ({
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    '& .MuiLinearProgress-bar': {
      background: `linear-gradient(90deg,${getScoreColor(score)},${getScoreColor(
        score
      )}cc)`,
      borderRadius: 4
    }
  });
  const severityIcon = (sev) =>
    sev === 'high' ? (
      <Error sx={{ color: '#f44336' }} />
    ) : sev === 'medium' ? (
      <Warning sx={{ color: '#ff9800' }} />
    ) : (
      <CheckCircle sx={{ color: '#4caf50' }} />
    );
  const categoryIcon = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('contact')) return <ContactPage />;
    if (c.includes('skill')) return <Code />;
    if (c.includes('experience')) return <Work />;
    if (c.includes('education')) return <School />;
    if (c.includes('format')) return <FilePresent />;
    if (c.includes('content')) return <Description />;
    return <AutoAwesome />;
  };
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';


  const currentAnalysis = selectedAnalysis || analysis;

  return (
    <PageLayout
      title="AI Resume Analyzer"
      subtitle="Smart hybrid analysis of structure, content and layout"
      headerIcon={<Assessment sx={{ fontSize: 40 }} />}
    >
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Hero */}
        <DarkGradientBox sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => window.location.href = '/dashboard'}
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.85)',
                '&:hover': {
                  borderColor: '#64b5f6',
                  backgroundColor: 'rgba(100,181,246,0.1)'
                }
              }}
            >
              Dashboard
            </Button>
          </Box>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mb: 3 }}
          >
            <Avatar sx={{ bgcolor: '#64b5f6', width: 56, height: 56 }}>
              <Analytics sx={{ fontSize: 30 }} />
            </Avatar>
            <Avatar sx={{ bgcolor: '#9c27b0', width: 56, height: 56 }}>
              <SmartToy sx={{ fontSize: 30 }} />
            </Avatar>
            <Avatar sx={{ bgcolor: '#4caf50', width: 56, height: 56 }}>
              <AutoFixHigh sx={{ fontSize: 30 }} />
            </Avatar>
          </Stack>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            AI Resume Analyzer
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxWidth: 640, mx: 'auto', opacity: 0.8 }}
          >
            Upload your resume PDF and let the AI extract key insights, evaluate
            structure, and suggest improvements using smart text and image
            analysis.
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ mt: 2 }}
          >
            <Chip
              label="Text Extraction"
              icon={<TextFields />}
              sx={{
                backgroundColor: 'rgba(76,175,80,0.2)',
                color: '#4caf50',
                fontSize: '0.75rem'
              }}
            />
            <Chip
              label="Image Layout"
              icon={<ImageSearch />}
              sx={{
                backgroundColor: 'rgba(33,150,243,0.2)',
                color: '#2196f3',
                fontSize: '0.75rem'
              }}
            />
            <Chip
              label="AI Insights"
              icon={<Psychology />}
              sx={{
                backgroundColor: 'rgba(156,39,176,0.2)',
                color: '#9c27b0',
                fontSize: '0.75rem'
              }}
            />
          </Stack>
        </DarkGradientBox>

        {/* Tabs */}
        <Paper
          sx={{
            borderRadius: 2,
            mb: 3,
            background: 'linear-gradient(145deg,#2c2f32 0%,#1f2326 100%)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.65)',
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': { color: '#64b5f6' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#64b5f6', height: 3 }
            }}
          >
            <Tab icon={<Assessment />} label="Analyze" iconPosition="start" />
            <Tab
              icon={
                <Badge
                  badgeContent={analysisHistory.length}
                  color="primary"
                  max={999}
                >
                  <History />
                </Badge>
              }
              label="History"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Analyze Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {!selectedAnalysis && !file && (
              <Grid item xs={12}>
                <Fade in timeout={500}>
                  <Box>
                    <AnalysisMethodCard sx={{ mb: 3 }}>
                      <CardContent sx={{ p: 4 }}>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{ mb: 3 }}
                        >
                          <Avatar
                            sx={{
                              background:
                                'linear-gradient(135deg,#64b5f6,#42a5f5)',
                              width: 58,
                              height: 58
                            }}
                          >
                            <CloudUpload />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="h5"
                              fontWeight="bold"
                              sx={{ color: 'white' }}
                            >
                              Upload Resume
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: 'rgba(255,255,255,0.55)' }}
                            >
                              PDF only • Up to {uploadConfig.maxFileSize} •
                              Smart hybrid AI analysis
                            </Typography>
                          </Box>
                        </Stack>

                        <EnhancedUploadZone
                          isDragging={isDragging}
                          hasFile={!!file}
                          analyzing={analyzing}
                          onDrop={handleDrop}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                          }}
                          onClick={() =>
                            !analyzing && fileInputRef.current?.click()
                          }
                          elevation={0}
                        >
                          <Box>
                            <CloudUpload
                              sx={{
                                fontSize: 76,
                                color: isDragging
                                  ? '#64b5f6'
                                  : 'rgba(255,255,255,0.35)',
                                mb: 2,
                                transition: 'color .3s'
                              }}
                            />
                            <Typography
                              variant="h5"
                              sx={{ color: 'rgba(255,255,255,0.85)', mb: 1 }}
                            >
                              {analyzing
                                ? 'Analyzing...'
                                : 'Drag & drop your resume or click to browse'}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: 'rgba(255,255,255,0.5)' }}
                            >
                              Secure local upload • No permanent storage
                            </Typography>
                          </Box>
                          <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".pdf"
                            onChange={(e) =>
                              handleFileSelect(e.target.files[0])
                            }
                            disabled={analyzing}
                          />
                        </EnhancedUploadZone>
                        {error && (
                          <Alert
                            severity="error"
                            sx={{
                              mt: 3,
                              borderRadius: 2,
                              backgroundColor: 'rgba(244,67,54,0.12)'
                            }}
                          >
                            {error}
                          </Alert>
                        )}
                      </CardContent>
                    </AnalysisMethodCard>
                  </Box>
                </Fade>
              </Grid>
            )}

            {(file || selectedAnalysis) && (
              <>
                {analyzing && (
                  <Grid item xs={12}>
                    <AnalysisProgress
                      analyzing={analyzing}
                      currentStep={currentStep}
                      analysisMethod={analysisMethod}
                      details={analysisDetails}
                    />
                  </Grid>
                )}

                <Grid item xs={12} lg={6}>
                  <Slide direction="right" in timeout={600}>
                    <Box>
                      <EnhancedPDFViewer
                        file={file}
                        fileKey={fileKey}
                        analyzing={analyzing}
                        onCapabilities={(caps) => setCapabilities(caps)}
                      />
                    </Box>
                  </Slide>
                </Grid>

                <Grid item xs={12} lg={6}>
                  <Grid container spacing={3}>
                    {file && (
                      <Grid item xs={12}>
                        <Fade in timeout={600}>
                          <AnalysisMethodCard>
                            <CardContent sx={{ p: 3 }}>
                              <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                                sx={{ mb: 3 }}
                              >
                                <Avatar
                                  sx={{
                                    background:
                                      'linear-gradient(135deg,#4caf50,#66bb6a)',
                                    width: 50,
                                    height: 50
                                  }}
                                >
                                  <FilePresent />
                                </Avatar>
                                <Box flex={1}>
                                  <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{ color: 'white' }}
                                  >
                                    {file.name}
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ color: 'rgba(255,255,255,0.55)' }}
                                    >
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </Typography>
                                    {capabilities?.recommendedMethod && (
                                      <>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: 'rgba(255,255,255,0.4)'
                                          }}
                                        >
                                          •
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: 'rgba(255,255,255,0.6)'
                                          }}
                                        >
                                          {capabilities.recommendedMethod ===
                                          'hybrid'
                                            ? 'Hybrid ready'
                                            : capabilities.recommendedMethod}
                                        </Typography>
                                      </>
                                    )}
                                  </Stack>
                                </Box>
                                <Stack spacing={1} alignItems="flex-end">
                                  <Chip
                                    label="PDF Ready"
                                    size="small"
                                    color="success"
                                  />
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => {
                                      setFile(null);
                                      setFileKey(null);
                                      setAnalysis(null);
                                      setShowResults(false);
                                      setSelectedAnalysis(null);
                                      setCapabilities(null);
                                      setShowMethodSelector(false);
                                    }}
                                    sx={{
                                      color: 'rgba(255,255,255,0.65)',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    Change
                                  </Button>
                                </Stack>
                              </Stack>

                              {showMethodSelector && capabilities && !analyzing && (
                                <AnalysisMethodSelector
                                  capabilities={capabilities}
                                  selectedMethod={selectedAnalysisMethod}
                                  onChange={setSelectedAnalysisMethod}
                                />
                              )}

                              <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={
                                  analyzing ? (
                                    <Psychology
                                      sx={{
                                        animation: `${rotateIcon} 2.2s linear infinite`
                                      }}
                                    />
                                  ) : (
                                    <SmartToy />
                                  )
                                }
                                disabled={analyzing}
                                onClick={analyzeResume}
                                sx={{
                                  mt: 1,
                                  py: 1.5,
                                  fontWeight: 600,
                                  background: analyzing
                                    ? 'linear-gradient(135deg,#9c27b0,#7b1fa2)'
                                    : 'linear-gradient(135deg,#64b5f6,#42a5f5)',
                                  '&:hover': {
                                    background: analyzing
                                      ? 'linear-gradient(135deg,#7b1fa2,#6a1b9a)'
                                      : 'linear-gradient(135deg,#42a5f5,#1e88e5)'
                                  }
                                }}
                              >
                                {analyzing
                                  ? 'Running AI Analysis...'
                                  : 'Start Analysis'}
                              </Button>

                              {error && (
                                <Alert
                                  severity="error"
                                  sx={{
                                    mt: 2,
                                    backgroundColor: 'rgba(244,67,54,0.12)'
                                  }}
                                >
                                  {error}
                                </Alert>
                              )}
                            </CardContent>
                          </AnalysisMethodCard>
                        </Fade>
                      </Grid>
                    )}
                    {showResults && selectedAnalysis && imageUrls.length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
                          Resume Preview
                        </Typography>
                        <Grid container spacing={2} wrap="nowrap" sx={{ overflowX: "auto" }}>
                          {imageUrls.map((url, idx) => (
                            <Grid item key={idx} sx={{ minWidth: "300px" }}>
                              <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
                                <img
                                  src={url}
                                  alt={`Resume page ${idx + 1}`}
                                  style={{
                                    width: "100%",
                                    maxHeight: "700px",   // ✅ keeps size reasonable
                                    objectFit: "contain",
                                    display: "block"
                                  }}
                                />
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    <Grid item xs={12}>
                      {currentAnalysis && showResults ? (
                        <Fade in timeout={700}>
                          <Box>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{ mb: 3 }}
                            >
                              <Box>
                                <Typography
                                  variant="h5"
                                  fontWeight="bold"
                                  sx={{ color: 'white' }}
                                >
                                  Analysis Results
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{ mt: 1 }}
                                  alignItems="center"
                                >
                                  <Chip
                                    size="small"
                                    label={`${
                                      analysisDetails.analysisMethod
                                        ? analysisDetails.analysisMethod.toUpperCase()
                                        : 'SMART'
                                    } Method`}
                                    icon={
                                      analysisDetails.analysisMethod === 'text' ? (
                                        <TextFields />
                                      ) : analysisDetails.analysisMethod ===
                                        'image' ? (
                                        <ImageSearch />
                                      ) : (
                                        <AutoFixHigh />
                                      )
                                    }
                                    sx={{
                                      backgroundColor:
                                        analysisDetails.analysisMethod ===
                                        'text'
                                          ? '#4caf50'
                                          : analysisDetails.analysisMethod ===
                                            'image'
                                          ? '#2196f3'
                                          : '#9c27b0',
                                      color: 'white'
                                    }}
                                  />
                                  {analysisDetails.processingTimeMs && (
                                    <Chip
                                      size="small"
                                      label={`${analysisDetails.processingTimeMs}ms`}
                                      icon={<Speed />}
                                      variant="outlined"
                                      sx={{
                                        color: 'rgba(255,255,255,0.7)',
                                        borderColor: 'rgba(255,255,255,0.3)'
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                {selectedAnalysis && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                      setSelectedAnalysis(null);
                                      setShowResults(false);
                                    }}
                                    sx={{
                                      borderColor: 'rgba(255,255,255,0.3)',
                                      color: 'rgba(255,255,255,0.75)'
                                    }}
                                  >
                                    New
                                  </Button>
                                )}
                                <Tooltip title="Download Report">
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={
                                      downloadingPDF ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <Download />
                                      )
                                    }
                                    onClick={() => downloadPDF(currentAnalysis)}
                                    disabled={downloadingPDF}
                                    sx={{
                                      borderColor: '#64b5f6',
                                      color: '#64b5f6',
                                      '&:hover': {
                                        borderColor: '#42a5f5',
                                        backgroundColor:
                                          'rgba(100,181,246,0.1)'
                                      }
                                    }}
                                  >
                                    {downloadingPDF ? 'Creating...' : 'Report'}
                                  </Button>
                                </Tooltip>
                              </Stack>
                            </Stack>

                            {/* Overall Score Card */}
                            <Card
                              sx={{
                                background: `linear-gradient(135deg,${getScoreColor(
                                  currentAnalysis.overallScore
                                )},${getScoreColor(
                                  currentAnalysis.overallScore
                                )}99)`,
                                color: 'white',
                                borderRadius: 2,
                                mb: 3,
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                            >
                              <CardContent sx={{ p: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item xs={8}>
                                    <Typography
                                      variant="h2"
                                      fontWeight="bold"
                                      sx={{ mb: 1 }}
                                    >
                                      {currentAnalysis.overallScore}%
                                    </Typography>
                                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                      Overall Score
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ opacity: 0.8 }}
                                    >
                                      Comprehensive {analysisDetails.isImageBased
                                        ? 'image-assisted'
                                        : 'text-first'}{' '}
                                      evaluation
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={4} sx={{ textAlign: 'center' }}>
                                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                      <CircularProgress
                                        variant="determinate"
                                        value={currentAnalysis.overallScore}
                                        size={90}
                                        thickness={4.5}
                                        sx={{
                                          color: 'rgba(255,255,255,0.35)',
                                          '& .MuiCircularProgress-circle': {
                                            strokeLinecap: 'round'
                                          }
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          inset: 0,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <Stars sx={{ fontSize: 40, opacity: 0.85 }} />
                                      </Box>
                                    </Box>
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>

                            {/* Score Breakdown */}
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{ mb: 2, color: '#64b5f6' }}
                            >
                              Score Breakdown
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                              {currentAnalysis.scores &&
                                Object.entries(currentAnalysis.scores).map(
                                  ([category, score], idx) => (
                                    <Grid item xs={6} key={category}>
                                      <Zoom in timeout={600 + idx * 100}>
                                        <AnalysisMethodCard>
                                          <CardContent sx={{ p: 2 }}>
                                            <Stack
                                              direction="row"
                                              spacing={1.3}
                                              alignItems="center"
                                              sx={{ mb: 1.2 }}
                                            >
                                              <Avatar
                                                sx={{
                                                  width: 34,
                                                  height: 34,
                                                  background: `linear-gradient(135deg,${getScoreColor(
                                                    score
                                                  )},${getScoreColor(score)}aa)`
                                                }}
                                              >
                                                {categoryIcon(category)}
                                              </Avatar>
                                              <Box flex={1}>
                                                <Typography
                                                  variant="body2"
                                                  fontWeight="600"
                                                  sx={{
                                                    color: 'white',
                                                    textTransform: 'capitalize',
                                                    lineHeight: 1.1
                                                  }}
                                                >
                                                  {category}
                                                </Typography>
                                                <Typography
                                                  variant="h6"
                                                  fontWeight="bold"
                                                  sx={{ mt: 0.2 }}
                                                  color={getScoreColor(score)}
                                                >
                                                  {score}%
                                                </Typography>
                                              </Box>
                                            </Stack>
                                            <LinearProgress
                                              variant="determinate"
                                              value={score}
                                              sx={getProgressStyle(score)}
                                            />
                                          </CardContent>
                                        </AnalysisMethodCard>
                                      </Zoom>
                                    </Grid>
                                  )
                                )}
                            </Grid>

                            {/* Suggestions */}
                            {currentAnalysis.suggestions &&
                              currentAnalysis.suggestions.length > 0 && (
                                <Box>
                                  <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{ mb: 2, color: '#64b5f6' }}
                                  >
                                    Top Suggestions
                                  </Typography>
                                  <Stack spacing={2}>
                                    {currentAnalysis.suggestions
                                      .slice(0, 6)
                                      .map((sug, idx) => (
                                        <Slide
                                          key={idx}
                                          direction="left"
                                          in
                                          timeout={650 + idx * 130}
                                        >
                                          <Card
                                            sx={{
                                              background:
                                                'linear-gradient(140deg,#2b2d30,#202325)',
                                              borderRadius: 2,
                                              borderLeft: `5px solid ${
                                                sug.severity === 'high'
                                                  ? '#f44336'
                                                  : sug.severity === 'medium'
                                                  ? '#ff9800'
                                                  : '#4caf50'
                                              }`,
                                              border: '1px solid rgba(255,255,255,0.07)',
                                              '&:hover': {
                                                transform: 'translateX(4px)',
                                                transition: 'all .35s ease'
                                              }
                                            }}
                                          >
                                            <CardContent sx={{ p: 2.4 }}>
                                              <Stack
                                                direction="row"
                                                spacing={2}
                                                alignItems="flex-start"
                                              >
                                                <Avatar
                                                  sx={{
                                                    width: 40,
                                                    height: 40,
                                                    bgcolor:
                                                      sug.severity === 'high'
                                                        ? '#f44336'
                                                        : sug.severity === 'medium'
                                                        ? '#ff9800'
                                                        : '#4caf50'
                                                  }}
                                                >
                                                  {severityIcon(sug.severity)}
                                                </Avatar>
                                                <Box flex={1}>
                                                  <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    sx={{ mb: 0.7 }}
                                                  >
                                                    <Typography
                                                      variant="subtitle2"
                                                      fontWeight="bold"
                                                      sx={{ color: 'white' }}
                                                    >
                                                      {sug.title}
                                                    </Typography>
                                                    <Chip
                                                      label={sug.severity?.toUpperCase()}
                                                      size="small"
                                                      sx={{
                                                        backgroundColor:
                                                          sug.severity === 'high'
                                                            ? '#f44336'
                                                            : sug.severity ===
                                                              'medium'
                                                            ? '#ff9800'
                                                            : '#4caf50',
                                                        color: 'white',
                                                        height: 20,
                                                        fontSize: '0.6rem'
                                                      }}
                                                    />
                                                  </Stack>
                                                  <Typography
                                                    variant="body2"
                                                    sx={{
                                                      color:
                                                        'rgba(255,255,255,0.75)',
                                                      mb: 1
                                                    }}
                                                  >
                                                    {sug.description}
                                                  </Typography>
                                                  <Chip
                                                    label={sug.category}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{
                                                      color:
                                                        'rgba(255,255,255,0.65)',
                                                      borderColor:
                                                        'rgba(255,255,255,0.3)',
                                                      fontSize: '0.65rem'
                                                    }}
                                                  />
                                                </Box>
                                              </Stack>
                                            </CardContent>
                                          </Card>
                                        </Slide>
                                      ))}
                                    {currentAnalysis.suggestions.length > 6 && (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          textAlign: 'center',
                                          color: 'rgba(255,255,255,0.5)'
                                        }}
                                      >
                                        +{' '}
                                        {currentAnalysis.suggestions.length - 6}{' '}
                                        more in full report
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>
                              )}
                          </Box>
                        </Fade>
                      ) : analyzing ? (
                        <AnalysisMethodCard
                          sx={{
                            minHeight: 300,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <CardContent sx={{ textAlign: 'center', p: 4 }}>
                            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                              <CircularProgress
                                size={68}
                                thickness={4.2}
                                sx={{ color: '#64b5f6' }}
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Psychology
                                  sx={{
                                    fontSize: 30,
                                    color: '#64b5f6',
                                    animation: `${rotateIcon} 2.2s linear infinite`
                                  }}
                                />
                              </Box>
                            </Box>
                            <Typography
                              variant="h6"
                              fontWeight="600"
                              sx={{ color: 'white', mb: 1 }}
                            >
                              Analyzing
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: 'rgba(255,255,255,0.55)' }}
                            >
                              AI is evaluating your resume content and layout...
                            </Typography>
                          </CardContent>
                        </AnalysisMethodCard>
                      ) : !selectedAnalysis && (
                        <AnalysisMethodCard
                          sx={{
                            minHeight: 260,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <CardContent sx={{ textAlign: 'center', p: 4 }}>
                            <Stack
                              spacing={2}
                              alignItems="center"
                              sx={{ color: 'rgba(255,255,255,0.55)' }}
                            >
                              <Assessment
                                sx={{
                                  fontSize: 80,
                                  opacity: 0.3,
                                  animation: `${gentleFloat} 4s ease-in-out infinite`
                                }}
                              />
                              <Typography
                                variant="h6"
                                fontWeight="600"
                                sx={{ color: 'rgba(255,255,255,0.75)' }}
                              >
                                Ready for Analysis
                              </Typography>
                              <Typography variant="body2">
                                Upload a PDF to begin intelligent evaluation
                              </Typography>
                            </Stack>
                          </CardContent>
                        </AnalysisMethodCard>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </>
            )}
          </Grid>
        )}



        {/* History Tab */}
        {tabValue === 1 && (
          <Box>
            {loadingHistory ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress sx={{ color: '#64b5f6' }} />
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}
                >
                  Loading analysis history...
                </Typography>
              </Box>
            ) : analysisHistory.length > 0 ? (
              <Grid container spacing={2}>
                {analysisHistory.map((item, idx) => (
                  <Grid item xs={12} md={6} lg={4} key={item.details?.analysisId || idx}>
                    <Fade in timeout={450 + idx * 90}>
                      <AnalysisMethodCard
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleHistoryClick(item)}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            sx={{ mb: 2 }}
                          >
                            <Avatar
                              sx={{
                                width: 44,
                                height: 44,
                                background: `linear-gradient(135deg,${getScoreColor(
                                  item.overallScore
                                )},${getScoreColor(item.overallScore)}aa)`
                              }}
                            >
                              <Description />
                            </Avatar>
                            <Typography
                              variant="h5"
                              fontWeight="bold"
                              color={getScoreColor(item.overallScore)}
                            >
                              {item.overallScore}%
                            </Typography>
                          </Stack>
                          <Typography
                            variant="subtitle2"
                            fontWeight="600"
                            sx={{
                              color: 'white',
                              mb: 0.5,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.details?.filename || 'Resume.pdf'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.5)' }}
                          >
                            {formatDate(item.details?.createdAt)}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={item.overallScore}
                            sx={{ ...getProgressStyle(item.overallScore), mt: 2 }}
                          />
                        </CardContent>
                      </AnalysisMethodCard>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <AnalysisMethodCard sx={{ textAlign: 'center', py: 8 }}>
                <CardContent>
                  <History
                    sx={{ fontSize: 74, mb: 2, color: 'rgba(255,255,255,0.3)' }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}
                  >
                    No past analyses yet
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Your results will appear here after analysis.
                  </Typography>
                </CardContent>
              </AnalysisMethodCard>
            )}
          </Box>
        )}
      </Container>
    </PageLayout>
  );
}