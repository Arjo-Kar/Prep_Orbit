import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Grid,
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
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import {
  Code as CodeIcon,
  CalendarToday as Calendar,
  TrendingUp,
  EmojiEvents as Award,
  Schedule as Clock,
  Psychology as BrainIcon,
  PlayArrow as Play,
  Refresh as RefreshCw,
  Assessment as TrendingUpIcon,
  Chat as ChatIcon,
  WorkOutline as InterviewIcon,
  Terminal,
  Mic as MicIcon,
  Description as DescriptionIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import PageLayout from "../components/PageLayout";
import CodingChallengeAPI from "../api/CodingChallengeAPI";

const SIDEBAR_WIDTH = 280;

const StatsCard = styled(Card)(() => ({
  height: "100%",
  background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
  border: "1px solid #444",
  transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    border: "1px solid #7b1fa2",
  },
}));

const MainCard = styled(Card)(() => ({
  background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
  border: "1px solid #444",
}));

const SidebarDrawer = styled(Drawer)(({ theme }) => ({
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  "& .MuiDrawer-paper": {
    width: SIDEBAR_WIDTH,
    boxSizing: "border-box",
    background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
    border: "none",
    borderRight: "2px solid transparent",
    borderImage: "linear-gradient(180deg, #7b1fa2, #f50057) 1",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "4px",
      background:
        "linear-gradient(90deg, #7b1fa2, #f50057, #ff9800, #4caf50, #2196f3)",
      backgroundSize: "200% 100%",
      animation: "gradientShift 8s ease infinite",
    },
    "@keyframes gradientShift": {
      "0%": { backgroundPosition: "0% 50%" },
      "50%": { backgroundPosition: "100% 50%" },
      "100%": { backgroundPosition: "0% 50%" },
    },
  },
}));

const SidebarListItem = styled(ListItemButton)(({ theme, active, gradient }) => ({
  margin: "6px 12px",
  borderRadius: "16px",
  padding: "14px 16px",
  background: active
    ? gradient || "linear-gradient(135deg, #7b1fa2, #f50057)"
    : "rgba(255, 255, 255, 0.02)",
  border: active ? `1px solid transparent` : "1px solid rgba(255, 255, 255, 0.05)",
  borderImage: active ? "linear-gradient(135deg, #7b1fa2, #f50057) 1" : "none",
  boxShadow: active
    ? "0 4px 20px rgba(123, 31, 162, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
    : "0 2px 8px rgba(0, 0, 0, 0.2)",
  transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      gradient ||
      "linear-gradient(135deg, rgba(123, 31, 162, 0.1), rgba(245, 0, 87, 0.1))",
    opacity: 0,
    transition: "opacity 0.3s ease",
    borderRadius: "16px",
  },
  "&:hover": {
    background: active
      ? gradient || "linear-gradient(135deg, #9c27b0, #ff4081)"
      : "rgba(255, 255, 255, 0.1)",
    boxShadow: "0 0 20px rgba(123, 31, 162, 0.4)",
    transform: "scale(1.02)",
    "& .MuiListItemIcon-root": {
      color: active ? "white" : "#7b1fa2 !important",
    },
    "& .MuiListItemText-primary": {
      color: active ? "white" : "#f50057 !important",
      fontWeight: 700,
    },
  },
  "& .MuiListItemIcon-root": {
    color: active ? "white" : "#e0e0e0",
    minWidth: "44px",
    transition: "all 0.3s ease",
    filter: active ? "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" : "none",
  },
  "& .MuiListItemText-primary": {
    color: active ? "white" : "#e0e0e0",
    fontWeight: active ? 700 : 500,
    fontSize: "0.9rem",
    letterSpacing: "0.5px",
    textShadow: active ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "none",
    transition: "all 0.3s ease",
  },
}));

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#333",
    "& fieldset": { borderColor: "#555" },
    "&:hover fieldset": { borderColor: "#7b1fa2" },
    "&.Mui-focused fieldset": { borderColor: "#7b1fa2" },
  },
  "& .MuiInputLabel-root": { color: "#aaa" },
  "& .MuiOutlinedInput-input": { color: "white" },
};

const StatTile = ({ title, value, icon, gradient }) => (
  <StatsCard>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" sx={{ color: "#aaa", mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold" sx={{ color: "white" }}>
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ width: 56, height: 56, background: gradient }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </StatsCard>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");

  // Form / quiz state
  const [topics, setTopics] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [numWeakQuestions, setNumWeakQuestions] = useState(5);

  // Messages / status
  const [message, setMessage] = useState("");

  // Challenge state
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);

  // Button loading indicator (which button is pressed)
  const [loadingButton, setLoadingButton] = useState("");

  // Stats state (will be updated from backend)
  const [stats, setStats] = useState({
    totalQuizzesTaken: 0,
    codingChallengesSolved: 0,
    streak: 0,
    rank: "",
    averageScore: 0,
    latestChallengeSolved: false,
  });

  // Prevent double invocation (React StrictMode dev)
  const hasLoadedRef = useRef(false);
  // Prevent race conditions if multiple requests triggered
  const requestIdRef = useRef(0);

  const getCurrentUsername = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.name || storedUser.username || "Guest";
  };
  const username = getCurrentUsername();

  const navigationItems = [
    {
      key: "generateResume",
      label: "Generate Resume",
      icon: <DescriptionIcon />,
      gradient: "linear-gradient(135deg, #2196F3, #21CBF3)",
      onClick: () => {
        setLoadingButton("generateResume");
        setActiveNavItem("generateResume");
        navigate("/resume-generate");
      },
    },
    {
      key: "analyzeResume",
      label: "Analyze Resume",
      icon: <DescriptionIcon />,
      gradient: "linear-gradient(135deg, #00bcd4, #26c6da)",
      onClick: () => {
        setLoadingButton("analyzeResume");
        setActiveNavItem("analyzeResume");
        navigate("/resume-analyzer");
      },
    },
    {
      key: "viewReports",
      label: "View Reports",
      icon: <TrendingUpIcon />,
      gradient: "linear-gradient(135deg, #9c27b0, #ab47bc)",
      onClick: () => {
        setLoadingButton("viewReports");
        setActiveNavItem("viewReports");
        navigate("/report/weaknesses");
      },
    },
    {
      key: "chatAi",
      label: "Chat with AI",
      icon: <ChatIcon />,
      gradient: "linear-gradient(135deg, #ff9800, #ffc107)",
      onClick: () => {
        setLoadingButton("chatAi");
        setActiveNavItem("chatAi");
        navigate("/gemini");
      },
    },
    {
      key: "interviewPrep",
      label: "Interview Prep",
      icon: <MicIcon />,
      gradient: "linear-gradient(135deg, #607d8b, #78909c)",
      onClick: () => {
        setLoadingButton("interviewPrep");
        setActiveNavItem("interviewPrep");
        navigate("/interview-prep");
      },
    },
    {
      key: "liveInterview",
      label: "Live Interview",
      icon: <InterviewIcon />,
      gradient: "linear-gradient(135deg, #e91e63, #f06292)",
      onClick: () => {
        setLoadingButton("liveInterview");
        setActiveNavItem("liveInterview");
        navigate("/live-interview");
      },
    },
  ];

  useEffect(() => {
    const urlTopics = searchParams.get("topics");
    const urlNumQuestions = searchParams.get("numQuestions");
    if (urlTopics) setTopics(urlTopics);
    if (urlNumQuestions) setNumQuestions(parseInt(urlNumQuestions, 10));
  }, [searchParams]);

  const fetchDashboardStats = async () => {
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || !user?.id) return;
    try {
      const res = await fetch(
        `http://localhost:8080/auth/dashboard-stats?userId=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to load dashboard stats");
      const data = await res.json();
      setStats({
        totalQuizzesTaken: data.totalQuizzesTaken,
        codingChallengesSolved: data.codingChallengesSolved,
        streak: data.streak,
        rank: data.rank,
        averageScore: data.averageScore,
        accuracy: data.accuracy,
        latestChallengeSolved: data.latestChallengeSolved,
      });
    } catch (err) {
      setMessage("Failed to load dashboard stats");
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadDailyChallenge();
    fetchDashboardStats();
  }, []);

  const handleLogout = () => {
    setLoadingButton("logout");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  const loadDailyChallenge = async () => {
    const currentId = ++requestIdRef.current;
    try {
      setLoadingChallenge(true);
      setMessage("");
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        if (currentId !== requestIdRef.current) return;
        setMessage("Authentication token not found. Please log in.");
        setDailyChallenge(null);
        return;
      }

      const challenge = await CodingChallengeAPI.getDailyChallenge(authToken);

      if (currentId !== requestIdRef.current) return;
      if (!challenge || !challenge.id) {
        setMessage("Failed to load daily challenge. Please try again later.");
        setDailyChallenge(null);
        return;
      }
      setDailyChallenge(challenge);
    } catch (error) {
      if (currentId !== requestIdRef.current) return;
      setMessage("Error loading daily challenge: " + (error.message || error));
      setDailyChallenge(null);
    } finally {
      if (currentId === requestIdRef.current) setLoadingChallenge(false);
    }
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Authentication token not found. Please log in.");
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }
    return res.json();
  };

  const startQuiz = async (topicsArray, numQuestions) => {
    return fetchWithAuth("http://localhost:8080/api/quiz/start", {
      method: "POST",
      body: JSON.stringify({ topics: topicsArray, numQuestions }),
    });
  };

  const handleStartQuiz = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoadingButton("startQuiz");
    try {
      const topicList = topics
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (topicList.length === 0) {
        setMessage("Please enter at least one topic.");
        setLoadingButton("");
        return;
      }
      const response = await startQuiz(topicList, parseInt(numQuestions, 10));
      navigate(`/quiz/${response.sessionId}`);
    } catch (error) {
      console.error("Start quiz error:", error);
      setMessage(error.message || "Failed to start quiz.");
      setLoadingButton("");
    }
  };

  const handlePracticeWeakAreas = () => {
    setLoadingButton("startPractice");
    navigate(`/practice-weak-areas?numQuestions=${numWeakQuestions}`);
  };

  const startCodingChallenge = (challengeId) => {
    setLoadingButton("startDaily");
    navigate(`/coding-challenge/${challengeId}`);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(true);
  };

  const rightHeader = (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "2px solid #7b1fa2",
          background: "linear-gradient(135deg, #7b1fa2, #f50057)",
          boxShadow: "0 4px 18px rgba(0,0,0,0.6)",
        }}
      >
        <BrainIcon />
      </Avatar>
      <Button
        variant="outlined"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        disabled={loadingButton === "logout"}
        sx={{
          borderColor: "#7b1fa2",
          color: "white",
          fontWeight: 600,
          "&:hover": {
            borderColor: "#f50057",
            backgroundColor: "rgba(123,31,162,0.15)",
          },
        }}
      >
        {loadingButton === "logout" ? "Loading..." : "Logout"}
      </Button>
    </Stack>
  );

  const sidebarContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid rgba(123, 31, 162, 0.2)",
          background:
            "linear-gradient(135deg, rgba(123, 31, 162, 0.1), rgba(245, 0, 87, 0.1))",
          backdropFilter: "blur(10px)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: "-2px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(45deg, #7b1fa2, #f50057, #ff9800)",
                  zIndex: -1,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  background: "linear-gradient(135deg, #7b1fa2, #f50057)",
                  boxShadow: "0 4px 15px rgba(123, 31, 162, 0.3)",
                }}
              >
                <BrainIcon />
              </Avatar>
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                  background: "linear-gradient(135deg, #ffffff, #e0e0e0)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Quick Actions
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, py: 2, background: "rgba(255, 255, 255, 0.01)" }}>
        <List>
          {navigationItems.map((item, index) => (
            <ListItem key={item.key} disablePadding>
              <SidebarListItem
                active={activeNavItem === item.key}
                gradient={item.gradient}
                onClick={item.onClick}
                disabled={loadingButton === item.key}
                sx={{
                  animationDelay: `${index * 0.1}s`,
                  animation: "slideInLeft 0.6s ease forwards",
                  opacity: 0,
                  "@keyframes slideInLeft": {
                    from: {
                      opacity: 0,
                      transform: "translateX(-20px)",
                    },
                    to: {
                      opacity: 1,
                      transform: "translateX(0)",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    background:
                      activeNavItem === item.key
                        ? "rgba(255, 255, 255, 0.1)"
                        : "transparent",
                    borderRadius: "8px",
                    padding: "8px",
                    marginRight: "4px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={loadingButton === item.key ? "Loading..." : item.label}
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                  }}
                />
                {activeNavItem === item.key && (
                  <Box
                    sx={{
                      position: "absolute",
                      right: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "3px",
                      height: "60%",
                      background:
                        "linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.8), transparent)",
                      borderRadius: "2px",
                    }}
                  />
                )}
              </SidebarListItem>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: "1px solid rgba(123, 31, 162, 0.2)",
          background:
            "linear-gradient(135deg, rgba(123, 31, 162, 0.05), rgba(245, 0, 87, 0.05))",
        }}
      />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#0a0a0a" }}>
      {/* Sidebar — always visible */}
      <SidebarDrawer variant="permanent">{sidebarContent}</SidebarDrawer>

      {/* Main Content (no extra left margin/width) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0, // prevent overflow on small screens
        }}
      >
        <PageLayout
          maxWidth="xl"
          headerIcon={<BrainIcon sx={{ fontSize: 40 }} />}
          title={`Welcome back, ${username}!`}
          subtitle="Ready for today's challenge? Choose your path to success."
          rightHeaderContent={rightHeader}
        >
          <Grid container justifyContent="center" spacing={3}>
            <Grid item xs={12} md={10} lg={9}>
              <Stack spacing={3}>
                {message && (
                  <Alert
                    severity="error"
                    variant="filled"
                    sx={{
                      borderRadius: "12px",
                      background: "linear-gradient(45deg, #f44336, #d32f2f)",
                    }}
                  >
                    {message}
                  </Alert>
                )}

                {stats.latestChallengeSolved && (
                  <Alert
                    severity="success"
                    variant="filled"
                    sx={{
                      borderRadius: "12px",
                      background: "linear-gradient(45deg, #4caf50, #8bc34a)",
                      mb: 2,
                    }}
                  >
                    🎉 Congratulations! You have solved today's coding challenge!
                  </Alert>
                )}

                {/* Stats */}
                <Box>
                  <Grid container spacing={2} justifyContent="center">
                    <Grid item xs={12} sm={6}>
                      <StatTile
                        title="Quizzes Taken"
                        value={stats.totalQuizzesTaken ?? 0}
                        icon={<BrainIcon />}
                        gradient="linear-gradient(135deg, #2196F3, #21CBF3)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StatTile
                        title="Coding Problems"
                        value={stats.codingChallengesSolved ?? 0}
                        icon={<CodeIcon />}
                        gradient="linear-gradient(135deg, #4caf50, #8bc34a)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StatTile
                        title="Accuracy"
                        value={`${stats.accuracy ?? 0}%`}
                        icon={<Award />}
                        gradient="linear-gradient(135deg, #00c853, #64dd17)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StatTile
                        title="Current Streak"
                        value={`${stats.streak ?? 0} days`}
                        icon={<TrendingUp />}
                        gradient="linear-gradient(135deg, #ff9800, #ffc107)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StatTile
                        title="Rank"
                        value={stats.rank ?? "Participant"}
                        icon={<TrendingUpIcon />}
                        gradient="linear-gradient(135deg, #7b1fa2, #f50057)"
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Daily Challenge */}
                <MainCard>
                  <Box
                    sx={{
                      background: "linear-gradient(135deg, #4caf50, #8bc34a)",
                      p: 3,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Calendar />
                      <Typography variant="h6" fontWeight="bold">
                        Today's Coding Challenge
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    {loadingChallenge ? (
                      <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                        <CircularProgress sx={{ color: "#4caf50", mb: 2 }} />
                        <Typography variant="body2" sx={{ color: "#aaa" }}>
                          Loading today's challenge...
                        </Typography>
                      </Box>
                    ) : dailyChallenge ? (
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: "white" }}>
                          {dailyChallenge.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#ccc", mb: 3, lineHeight: 1.6 }}>
                          {dailyChallenge.description
                            ? dailyChallenge.description.substring(0, 150) + "..."
                            : "A new coding challenge awaits!"}
                        </Typography>

                        <Stack direction="row" spacing={2} mb={3}>
                          <Paper
                            sx={{
                              px: 1.5,
                              py: 0.75,
                              borderRadius: "8px",
                              backgroundColor: "#333",
                              border: "1px solid #555",
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Clock sx={{ fontSize: 16, color: "#90caf9" }} />
                              <Typography variant="body2" sx={{ color: "#ccc" }}>
                                {dailyChallenge.timeLimitMs || "1000"}ms
                              </Typography>
                            </Stack>
                          </Paper>
                          <Paper
                            sx={{
                              px: 1.5,
                              py: 0.75,
                              borderRadius: "8px",
                              backgroundColor: "#333",
                              border: "1px solid #555",
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <BrainIcon sx={{ fontSize: 16, color: "#ce93d8" }} />
                              <Typography
                                variant="body2"
                                sx={{ color: "#ccc", textTransform: "capitalize" }}
                              >
                                {dailyChallenge.difficulty || "Medium"}
                              </Typography>
                            </Stack>
                          </Paper>
                        </Stack>

                        <Stack spacing={2}>
                          <Button
                            variant="contained"
                            startIcon={<Play />}
                            fullWidth
                            onClick={() =>
                              dailyChallenge && dailyChallenge.id && startCodingChallenge(dailyChallenge.id)
                            }
                            disabled={!dailyChallenge || !dailyChallenge.id || loadingButton === "startDaily"}
                            sx={{
                              py: 1.5,
                              background: "linear-gradient(45deg, #4caf50, #8bc34a)",
                              "&:hover": {
                                background: "linear-gradient(45deg, #66bb6a, #aed581)",
                              },
                            }}
                          >
                            {loadingButton === "startDaily"
                              ? "Loading..."
                              : stats.latestChallengeSolved
                              ? "Try Again"
                              : "Start Daily Challenge"}
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      <Box textAlign="center" py={4}>
                        <Typography sx={{ color: "#aaa", mb: 2 }}>
                          No daily challenge available
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          onClick={async () => {
                            setLoadingButton("retryDaily");
                            try {
                              await loadDailyChallenge();
                            } finally {
                              setLoadingButton("");
                            }
                          }}
                          disabled={loadingButton === "retryDaily"}
                          sx={{ color: "#7b1fa2" }}
                        >
                          {loadingButton === "retryDaily" ? "Loading..." : "Try loading again"}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </MainCard>

                {/* Start Knowledge Quiz */}
                <MainCard>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: "white" }}>
                      Start Knowledge Quiz
                    </Typography>
                    <Box component="form" onSubmit={handleStartQuiz} sx={{ mt: 2 }}>
                      <Stack spacing={3}>
                        <TextField
                          fullWidth
                          label="Topics (comma-separated)"
                          placeholder="e.g., java, spring boot, algorithms"
                          value={topics}
                          onChange={(e) => setTopics(e.target.value)}
                          required
                          variant="outlined"
                          sx={inputSx}
                        />
                        <TextField
                          fullWidth
                          label="Number of Questions"
                          type="number"
                          inputProps={{ min: 1 }}
                          value={numQuestions}
                          onChange={(e) => setNumQuestions(e.target.value)}
                          variant="outlined"
                          sx={inputSx}
                        />
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          fullWidth
                          disabled={loadingButton === "startQuiz"}
                          sx={{
                            py: 1.5,
                            background: "linear-gradient(45deg, #7b1fa2, #f50057)",
                            "&:hover": {
                              background: "linear-gradient(45deg, #9c27b0, #ff4081)",
                            },
                          }}
                        >
                          {loadingButton === "startQuiz" ? "Loading..." : "Start Quiz"}
                        </Button>
                      </Stack>
                    </Box>
                  </CardContent>
                </MainCard>

                {/* Practice Weak Areas */}
                <MainCard>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: "white" }}>
                      Practice Weak Areas
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#ccc", mb: 3, lineHeight: 1.6 }}>
                      Focus on topics you've previously struggled with.
                    </Typography>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Number of Questions"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={numWeakQuestions}
                        onChange={(e) => setNumWeakQuestions(e.target.value)}
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: "#333",
                            "& fieldset": { borderColor: "#555" },
                            "&:hover fieldset": { borderColor: "#4caf50" },
                            "&.Mui-focused fieldset": { borderColor: "#4caf50" },
                          },
                          "& .MuiInputLabel-root": { color: "#aaa" },
                          "& .MuiOutlinedInput-input": { color: "white" },
                        }}
                      />
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handlePracticeWeakAreas}
                        disabled={loadingButton === "startPractice"}
                        sx={{
                          py: 1.5,
                          background: "linear-gradient(45deg, #4caf50, #8bc34a)",
                          "&:hover": {
                            background: "linear-gradient(45deg, #66bb6a, #aed581)",
                          },
                        }}
                      >
                        {loadingButton === "startPractice" ? "Loading..." : "Start Practice Session"}
                      </Button>
                    </Stack>
                  </CardContent>
                </MainCard>
              </Stack>
            </Grid>
          </Grid>
        </PageLayout>
      </Box>
    </Box>
  );
}