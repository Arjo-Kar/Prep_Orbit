import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Stack,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  ButtonGroup,
  Button
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  NavigateBefore,
  NavigateNext,
  Fullscreen,
  FullscreenExit,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFContainer = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(145deg, #2d2d2d 0%, #1e1e1e 100%)',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  overflow: 'hidden',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const PDFControls = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(90deg, #333 0%, #2a2a2a 100%)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const PDFViewerArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
  background: '#1a1a1a',
  position: 'relative',
  '&::-webkit-scrollbar': {
    width: 8,
    height: 8,
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255,255,255,0.1)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
}));

const StyledPage = styled(Page)(({ theme }) => ({
  margin: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  borderRadius: 8,
  overflow: 'hidden',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

export default function PDFViewer({ file, isVisible, onToggleVisibility }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
    console.error('PDF load error:', error);
  }, []);

  const onDocumentLoadStart = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const rotateLeft = () => {
    setRotation(prev => prev - 90);
  };

  const rotateRight = () => {
    setRotation(prev => prev + 90);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const resetView = () => {
    setScale(1.0);
    setRotation(0);
    setPageNumber(1);
  };

  if (!isVisible) {
    return (
      <Box sx={{
        position: 'fixed',
        top: 100,
        right: 24,
        zIndex: 1000
      }}>
        <Tooltip title="Show PDF Viewer">
          <IconButton
            onClick={onToggleVisibility}
            sx={{
              background: 'linear-gradient(135deg, #64b5f6, #42a5f5)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #42a5f5, #2196f3)',
                transform: 'scale(1.1)',
              },
              boxShadow: '0 4px 12px rgba(100,181,246,0.4)',
              transition: 'all 0.3s ease',
            }}
          >
            <Visibility />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <PDFContainer
      sx={{
        height: isFullscreen ? '100vh' : '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 2000 : 'auto',
      }}
    >
      {/* PDF Controls */}
      <PDFControls>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Hide PDF Viewer">
            <IconButton
              size="small"
              onClick={onToggleVisibility}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <VisibilityOff />
            </IconButton>
          </Tooltip>

          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
            PDF Viewer
          </Typography>

          {file && (
            <Chip
              label={file.name}
              size="small"
              sx={{
                backgroundColor: 'rgba(100,181,246,0.2)',
                color: '#64b5f6',
                maxWidth: 200,
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }
              }}
            />
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {/* Page Navigation */}
          {numPages && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton
                size="small"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <NavigateBefore />
              </IconButton>

              <Typography variant="body2" sx={{ color: 'white', minWidth: 60, textAlign: 'center' }}>
                {pageNumber} / {numPages}
              </Typography>

              <IconButton
                size="small"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <NavigateNext />
              </IconButton>
            </Stack>
          )}

          {/* Zoom Controls */}
          <ButtonGroup size="small" variant="outlined">
            <IconButton
              size="small"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <ZoomOut />
            </IconButton>

            <Button
              size="small"
              onClick={resetView}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.2)',
                minWidth: 60,
                fontSize: '0.75rem'
              }}
            >
              {Math.round(scale * 100)}%
            </Button>

            <IconButton
              size="small"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <ZoomIn />
            </IconButton>
          </ButtonGroup>

          {/* Rotation Controls */}
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={rotateLeft}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <RotateLeft />
            </IconButton>
            <IconButton
              size="small"
              onClick={rotateRight}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <RotateRight />
            </IconButton>
          </Stack>

          {/* Fullscreen Toggle */}
          <IconButton
            size="small"
            onClick={toggleFullscreen}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Stack>
      </PDFControls>

      {/* PDF Viewer Area */}
      <PDFViewerArea>
        {file ? (
          <>
            {loading && (
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                zIndex: 10
              }}>
                <CircularProgress sx={{ color: '#64b5f6', mb: 2 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Loading PDF...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(244,67,54,0.1)',
                  color: '#f44336'
                }}
              >
                {error}
              </Alert>
            )}

            <Document
              file={file}
              onLoadStart={onDocumentLoadStart}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              error=""
            >
              <StyledPage
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress size={24} sx={{ color: '#64b5f6' }} />
                  </Box>
                }
                error={
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Failed to load page
                    </Typography>
                  </Box>
                }
              />
            </Document>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
              No PDF Selected
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
              Upload a resume to view it here
            </Typography>
          </Box>
        )}
      </PDFViewerArea>
    </PDFContainer>
  );
}