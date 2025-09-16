import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Stack,
  Paper,
  Divider,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import {
  CameraAlt as CameraIcon,
  Mic as MicIcon,
  VolumeUp as VolumeIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  FiberManualRecord as RecordIcon,
  Hearing as HearingIcon,
  Replay as ReplayIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// Custom dark theme with beautiful accent colors
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#12072b",
      paper: "rgba(35, 19, 70, 0.92)",
    },
    primary: {
      main: "#ad1fff",
    },
    secondary: {
      main: "#ff4fa7",
    },
    accent: {
      main: "#ffb800",
    },
    text: {
      primary: "#ffffff",
      secondary: "#c6b1e6",
    },
  },
  typography: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

const GradientBox = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #12072b 0%, #2d154d 60%, #ad1fff 100%)",
  minHeight: "100vh",
  color: "white",
  width: "100vw",
  paddingBottom: theme.spacing(8),
  boxSizing: "border-box",
}));

const FullScreenWrapper = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
}));

const EnlargedPaper = styled(Paper)(({ theme }) => ({
  background: "rgba(35,19,70,0.98)",
  borderRadius: "22px",
  boxShadow: "0 6px 32px 0 rgba(173,31,255,0.4)",
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  width: "100%",
  maxWidth: "1100px",
}));

const EnlargedVideo = styled("video")(({ theme }) => ({
  borderRadius: "18px",
  border: "4px solid #ad1fff",
  background: "#181029",
  width: "100%",
  maxWidth: "600px",
  height: "350px",
  objectFit: "cover",
  boxShadow: "0 4px 30px rgba(173,31,255,0.25)",
}));

const EnlargedTranscriptBox = styled(Box)(({ theme }) => ({
  minHeight: "90px",
  width: "100%",
  maxWidth: "600px",
  background: "linear-gradient(90deg, #190c36 0%, #281852 100%)",
  color: "#fff",
  borderRadius: "12px",
  fontFamily: "monospace",
  fontSize: "1.12rem",
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: "2px solid #ad1fff",
  boxShadow: "0 2px 16px rgba(173,31,255,0.18)",
  transition: "background 0.2s",
}));

// Voice vibration animation bars
const VoiceVibrator = ({ active }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    height: "28px",
    marginBottom: "6px",
    gap: "3px"
  }}>
    {[...Array(7)].map((_, i) => (
      <div key={i} style={{
        width: "6px",
        height: active ? `${12 + Math.random() * 20}px` : "12px",
        background: active ? "#ad1fff" : "#444",
        borderRadius: "2px",
        transition: "height 0.2s"
      }} />
    ))}
  </div>
);

function LiveInterviewPage() {
  // Pre-interview form state
  const [formStep, setFormStep] = useState(true);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [strengthsInput, setStrengthsInput] = useState("");
  const [strengths, setStrengths] = useState([]);
  const [experience, setExperience] = useState("");
  const [profile, setProfile] = useState("");
  const [formError, setFormError] = useState("");

  // Interview state
  const [liveInterviewId, setLiveInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Camera access
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch(() => setCameraActive(false));
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraActive]);

  // Recording duration timer
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((d) => d + 1);
      }, 1000);
    } else {
      clearInterval(recordTimerRef.current);
    }
    return () => clearInterval(recordTimerRef.current);
  }, [isRecording]);

  // Voice-to-text using Whisper backend (with audio download/playback)
  const startTranscript = async () => {
    setTranscript("");
    setIsRecording(true);
    setIsProcessing(false);
    setAudioURL(null);

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert("Audio recording not supported on this browser.");
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioURL(URL.createObjectURL(audioBlob)); // Enable playback

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        try {
          const authToken = localStorage.getItem("authToken");
          const res = await fetch("http://localhost:8080/api/live-interviews/transcribe", {
            method: "POST",
            headers: {
              Authorization: authToken ? `Bearer ${authToken}` : undefined,
            },
            body: formData,
          });
          const data = await res.json();
          let transcriptText = data.transcript || "No transcript received.";
          // Remove stray warnings if backend missed them
          transcriptText = transcriptText.replace(/.*FP16 is not supported on CPU; using FP32 instead.*/ig, '').trim();
          setTranscript(transcriptText);
        } catch (err) {
          setTranscript("Error transcribing audio.");
        }
        setIsProcessing(false);
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      alert("Could not start audio recording: " + err.message);
      setIsRecording(false);
    }
  };

  const stopTranscript = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Play recorded audio
  const playAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const player = audioPlayerRef.current;
    if (player) {
      const handleEnded = () => setIsPlaying(false);
      player.addEventListener("ended", handleEnded);
      return () => player.removeEventListener("ended", handleEnded);
    }
  }, [audioURL]);

  // Read aloud current question using Web Speech API
  const speakQuestion = () => {
    if ("speechSynthesis" in window && questions.length > 0) {
      const utter = new window.SpeechSynthesisUtterance(
        questions[currentQ]?.question || ""
      );
      utter.lang = "en-US";
      window.speechSynthesis.speak(utter);
    }
  };

  // Add strength tags from comma-separated input
  const handleAddStrengths = () => {
    if (strengthsInput.trim()) {
      const newStrengths = strengthsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !strengths.includes(s));
      setStrengths([...strengths, ...newStrengths]);
      setStrengthsInput("");
    }
  };

  // Remove a strength tag
  const handleDeleteStrength = (strength) => {
    setStrengths(strengths.filter((s) => s !== strength));
  };

  // Save answer for the current question
  const saveAnswer = async () => {
    if (!transcript || transcript.trim() === "" || !liveInterviewId || !questions[currentQ]?.id) return;
    const authToken = localStorage.getItem("authToken");
    const answerPayload = {
      liveInterviewId,
      questionId: questions[currentQ].id,
      answer: transcript,
    };
    try {
      await fetch("http://localhost:8080/api/interview/answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : undefined,
        },
        body: JSON.stringify(answerPayload),
      });
    } catch (err) {
      console.error("Error saving answer:", err);
    }
  };

  // Pre-interview form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!topic || !level || !experience) {
      setFormError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      // 1. Create interview session
      const authToken = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:8080/api/live-interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : undefined,
        },
        body: JSON.stringify({
          topic,
          level,
          strengths,
          experience,
          profile,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to create interview session.");
      }
      const data = await res.json();
      setLiveInterviewId(data.id);

      // 2. Generate questions for the interview session (use the generate endpoint!)
      const genRes = await fetch(
        `http://localhost:8080/api/interview/questions/generate/${data.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken ? `Bearer ${authToken}` : undefined,
          },
          body: JSON.stringify({
            position: topic,
            type: "",
            level,
          }),
        }
      );
      if (!genRes.ok) {
        throw new Error("Failed to generate interview questions.");
      }
      // Consume body if needed: const _genData = await genRes.json();

      // 3. Fetch questions for the given liveInterviewId
      const qRes = await fetch(
        `http://localhost:8080/api/interview/questions/live-interview/${data.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken ? `Bearer ${authToken}` : undefined,
          },
        }
      );
      if (!qRes.ok) {
        throw new Error("Failed to get interview questions.");
      }
      const qData = await qRes.json();
      setQuestions(qData);
      setFormStep(false);
      setCurrentQ(0);
    } catch (err) {
      setFormError(err.message || "Error generating interview.");
    } finally {
      setLoading(false);
    }
  };

  // Go to next question, saving current answer
  const handleNextQuestion = async () => {
    await saveAnswer();
    setTranscript("");
    setAudioURL(null);
    setCurrentQ(currentQ + 1);
  };

  // End interview and go to feedback page, saving last answer
  const handleEndInterview = async () => {
    await saveAnswer();
    navigate(`/live-interview/feedback/${liveInterviewId}`);
  };

  // Format duration mm:ss
  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <GradientBox>
        {/* Back to Dashboard Button - fixed top-left */}
        <Box sx={{ position: "fixed", top: 16, left: 16, zIndex: 2000 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{
              borderColor: "#ad1fff",
              color: "#fff",
              background: "rgba(255,255,255,0.06)",
              fontWeight: "bold",
              "&:hover": {
                borderColor: "#ff4fa7",
                background: "rgba(173,31,255,0.18)",
              },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>

        {formStep ? (
          <FullScreenWrapper>
            {/* --- Form Section --- */}
            <Card sx={{ p: 4, borderRadius: "24px", minWidth: 440, background: "rgba(35,19,70,0.98)", boxShadow: "0 6px 32px 0 rgba(173,31,255,0.3)" }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
                  Get Ready for Your Live Interview
                </Typography>
                <form onSubmit={handleFormSubmit} autoComplete="off">
                  <Stack spacing={3}>
                    <TextField
                      label="Topic/Domain"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      required
                      fullWidth
                      InputProps={{
                        style: { background: "#190c36", color: "#fff" }
                      }}
                    />
                    <Select
                      value={level}
                      onChange={e => setLevel(e.target.value)}
                      fullWidth
                      sx={{ background: "#190c36", color: "#fff" }}
                    >
                      <MenuItem value="Beginner">Beginner</MenuItem>
                      <MenuItem value="Intermediate">Intermediate</MenuItem>
                      <MenuItem value="Expert">Expert</MenuItem>
                    </Select>
                    <Box>
                      <TextField
                        label="Strengths (comma separated)"
                        value={strengthsInput}
                        onChange={e => setStrengthsInput(e.target.value)}
                        fullWidth
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddStrengths();
                          }
                        }}
                        InputProps={{
                          style: { background: "#190c36", color: "#fff" }
                        }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1, mb: 1, color: "#ad1fff", borderColor: "#ad1fff", background: "#190c36" }}
                        onClick={handleAddStrengths}
                      >
                        Add Strengths
                      </Button>
                      <Box sx={{ mt: 1 }}>
                        {strengths.map((strength) => (
                          <Chip
                            key={strength}
                            label={strength}
                            onDelete={() => handleDeleteStrength(strength)}
                            sx={{ mr: 1, mb: 1, background: "#ad1fff", color: "#fff" }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <TextField
                      label="Years of Experience"
                      type="number"
                      value={experience}
                      onChange={e => setExperience(e.target.value)}
                      fullWidth
                      required
                      InputProps={{
                        style: { background: "#190c36", color: "#fff" }
                      }}
                    />
                    <TextField
                      label="Short Profile/Summary"
                      multiline
                      minRows={2}
                      value={profile}
                      onChange={e => setProfile(e.target.value)}
                      fullWidth
                      InputProps={{
                        style: { background: "#190c36", color: "#fff" }
                      }}
                    />
                    {formError && (
                      <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                        {formError}
                      </Typography>
                    )}
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{ mt: 2, background: "linear-gradient(90deg, #ad1fff 0%, #ff4fa7 100%)", color: "#fff", fontWeight: "bold" }}
                      disabled={loading}
                      size="large"
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : "Start Interview"}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </FullScreenWrapper>
        ) : (
          <FullScreenWrapper>
            {/* --- Interview Section --- */}
            <EnlargedPaper>
              <CardContent sx={{ pb: 0 }}>
                <Stack direction="row" alignItems="center" gap={3}>
                  <Avatar
                    sx={{
                      width: 88,
                      height: 88,
                      background: "linear-gradient(135deg, #ad1fff, #ff4fa7)",
                      boxShadow: "0 4px 24px #ad1fff66",
                    }}
                  >
                    <CameraIcon sx={{ fontSize: 48 }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        background: "linear-gradient(to right, #ad1fff, #ffb800)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        mb: 1,
                        fontWeight: "bold",
                      }}
                    >
                      Live Interview
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#c6b1e6" }}>
                      Webcam is live (not recorded). Your answers will be transcribed automatically!
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </EnlargedPaper>
            <Stack direction={{ xs: "column", md: "row" }} gap={6} alignItems="flex-start" sx={{ width: "100%", maxWidth: "1100px" }}>
              {/* Camera & Transcript Side */}
              <Box flex={1} minWidth={340} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <EnlargedPaper sx={{ mb: 3, width: "100%" }}>
                  <Stack alignItems="center" gap={2}>
                    <Typography fontWeight="bold" fontSize={22}>
                      Camera Feed
                    </Typography>
                    <EnlargedVideo
                      ref={videoRef}
                      autoPlay
                    />
                    <Button
                      onClick={() => setCameraActive((val) => !val)}
                      variant="contained"
                      startIcon={<CameraIcon />}
                      sx={{
                        background: cameraActive
                          ? "linear-gradient(90deg, #ad1fff 0%, #ff4fa7 100%)"
                          : "linear-gradient(90deg, #333, #ad1fff 100%)",
                        color: "white",
                        minWidth: "180px",
                        fontWeight: "bold"
                      }}
                      size="large"
                    >
                      {cameraActive ? "Turn Camera Off" : "Enable Camera"}
                    </Button>
                  </Stack>
                </EnlargedPaper>
                <EnlargedPaper>
                  <Stack alignItems="center" gap={2}>
                    <Typography fontWeight="bold" fontSize={22}>
                      Voice Transcript
                    </Typography>
                    <VoiceVibrator active={isRecording} />
                    {/* Recording duration and audio controls */}
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                      minHeight: "32px"
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold", color: "#ad1fff" }}>
                        {isRecording ? `Recording: ${formatDuration(recordDuration)}` : audioURL ? `Last: ${formatDuration(recordDuration)}` : ""}
                      </Typography>
                      {audioURL && (
                        <Tooltip title={isPlaying ? "Pause playback" : "Play your voice answer"}>
                          <IconButton
                            onClick={isPlaying ? pauseAudio : playAudio}
                            color="primary"
                            sx={{ ml: 1 }}
                            disabled={isRecording}
                          >
                            {isPlaying ? <ReplayIcon /> : <HearingIcon />}
                          </IconButton>
                        </Tooltip>
                      )}
                      {/* Audio element for playback */}
                      {audioURL && (
                        <audio
                          ref={audioPlayerRef}
                          src={audioURL}
                          style={{ display: "none" }}
                        />
                      )}
                    </Box>
                    <EnlargedTranscriptBox
                      sx={{
                        background: isRecording
                          ? "linear-gradient(90deg, #ad1fff44 0%, #ff4fa744 100%)"
                          : undefined,
                        borderColor: isRecording ? "#ffb800" : "#ad1fff"
                      }}
                    >
                      {isProcessing ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <CircularProgress color="primary" size={22} />
                          <Typography>Processing...</Typography>
                        </Box>
                      ) : (
                        transcript || "Transcript will appear here..."
                      )}
                    </EnlargedTranscriptBox>
                    <Stack direction="row" spacing={2}>
                      <Tooltip title="Start Recording">
                        <IconButton
                          onClick={startTranscript}
                          color="primary"
                          disabled={isRecording || isProcessing}
                          sx={{
                            background: "#fff2",
                            fontSize: "2rem"
                          }}
                        >
                          <MicIcon fontSize="large" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Stop Recording">
                        <IconButton
                          onClick={stopTranscript}
                          color="secondary"
                          disabled={!isRecording}
                          sx={{
                            background: "#fff2",
                            fontSize: "2rem"
                          }}
                        >
                          <StopIcon fontSize="large" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </EnlargedPaper>
              </Box>
              {/* Interview Q&A */}
              <Box flex={2} minWidth={420}>
                <EnlargedPaper>
                  <Typography fontWeight="bold" fontSize={26} mb={2}>
                    Interview Questions
                  </Typography>
                  <Divider sx={{ mb: 2, borderColor: "#ad1fff" }} />
                  {questions.length === 0 ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      minHeight={120}
                    >
                      <CircularProgress color="primary" />
                    </Box>
                  ) : (
                    <Stack spacing={4}>
                      <Box>
                        <Typography fontSize={20} fontWeight="bold" sx={{
                          background: "linear-gradient(to right, #ad1fff, #ffb800)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          mb: 2,
                        }}>
                          {`Q${currentQ + 1}. ${questions[currentQ]?.question || ""}`}
                        </Typography>
                        <Button
                          startIcon={<VolumeIcon />}
                          variant="outlined"
                          sx={{
                            mt: 1,
                            color: "#ad1fff",
                            borderColor: "#ad1fff",
                            fontWeight: "bold",
                            background: "#190c36"
                          }}
                          size="large"
                          onClick={speakQuestion}
                        >
                          Read Aloud
                        </Button>
                      </Box>
                      <Stack direction="row" spacing={3}>
                        <Button
                          disabled={currentQ === 0}
                          onClick={() => setCurrentQ(currentQ - 1)}
                          variant="contained"
                          sx={{
                            background: "linear-gradient(90deg, #333, #ad1fff 100%)",
                            color: "#fff",
                            fontWeight: "bold"
                          }}
                          size="large"
                        >
                          Previous
                        </Button>
                        <Button
                          disabled={currentQ === questions.length - 1}
                          onClick={handleNextQuestion}
                          variant="contained"
                          sx={{
                            background: "linear-gradient(90deg, #ad1fff 0%, #ffb800 100%)",
                            color: "#fff",
                            fontWeight: "bold"
                          }}
                          size="large"
                        >
                          Next
                        </Button>
                        <Button
                          disabled={currentQ !== questions.length - 1}
                          onClick={handleEndInterview}
                          variant="contained"
                          color="secondary"
                          sx={{
                            ml: 2,
                            background: "linear-gradient(90deg, #ff4fa7 0%, #ad1fff 100%)",
                            color: "#fff",
                            fontWeight: "bold"
                          }}
                          size="large"
                        >
                          End & Get Feedback
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                </EnlargedPaper>
              </Box>
            </Stack>
          </FullScreenWrapper>
        )}
      </GradientBox>
    </ThemeProvider>
  );
}

export default LiveInterviewPage;