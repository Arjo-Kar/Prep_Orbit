import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Container,
} from "@mui/material";
import {
  Psychology as BrainIcon,
  Dashboard as DashboardIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Menu as MenuIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Chat as ChatIcon,
  Mic as MicIcon,
  Videocam as VideocamIcon,
} from "@mui/icons-material";
import PageLayout from "../components/PageLayout";

const FeatureCard = ({ icon, title, description, gradient }) => (
  <Card sx={{
    height: "100%",
    background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
    border: "1px solid #444",
    transition: "transform 0.3s ease, border 0.3s ease",
    "&:hover": { transform: "translateY(-6px)", border: "1px solid #7b1fa2" },
  }}>
    <CardContent sx={{ p: 4, textAlign: "center" }}>
      <Box
        sx={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 80, height: 80, borderRadius: "50%", mx: "auto", mb: 2, background: gradient,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>{title}</Typography>
      <Typography variant="body1" sx={{ color: "#bbb" }}>{description}</Typography>
    </CardContent>
  </Card>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, []);

  const features = [
    {
      title: "Knowledge Quizzes",
      description: "Test your knowledge with quizzes on your chosen topics.",
      icon: <BrainIcon sx={{ fontSize: 40 }} />,
      gradient: "linear-gradient(135deg, #7b1fa2, #9c27b0)",
    },
    {
      title: "Daily Coding Challenges",
      description: "Improve problem-solving with fresh challenges every day.",
      icon: <CodeIcon sx={{ fontSize: 40 }} />,
      gradient: "linear-gradient(135deg, #4caf50, #8bc34a)",
    },
    {
      title: "AI Resume Builder",
      description: "Generate a professional resume tailored to your profile.",
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      gradient: "linear-gradient(135deg, #2196F3, #21CBF3)",
    },
    {
      title: "AI Chat Assistant",
      description: "Get instant answers and guidance while you prepare.",
      icon: <ChatIcon sx={{ fontSize: 40 }} />,
      gradient: "linear-gradient(135deg, #ff9800, #ffc107)",
    },
    {
      title: "Voice Interview",
      description: "Practice voice interviews with AI and get feedback.",
      icon: <MicIcon sx={{ fontSize: 40 }} />,
      gradient: "linear-gradient(135deg, #e91e63, #f06292)",
    },
    {
      title: "Video Interview",
      description: "Simulate real video interviews and analyze your performance.",
      icon: <VideocamIcon sx={{ fontSize: 40 }} />,
      gradient: "linear-gradient(135deg, #0d47a1, #1a237e)",
    },
  ];

  const rightHeaderContent = (
    <Stack direction="row" spacing={2} alignItems="center">
      {isLoggedIn ? (
        <Button
          variant="contained"
          startIcon={<DashboardIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{
            background: "linear-gradient(45deg, #7b1fa2, #f50057)",
            "&:hover": { background: "linear-gradient(45deg, #9c27b0, #ff4081)" },
          }}
        >
          Dashboard
        </Button>
      ) : (
        <>
          <Button
            variant="outlined"
            startIcon={<LoginIcon />}
            onClick={() => navigate("/login")}
            sx={{
              borderColor: "#7b1fa2",
              color: "white",
              "&:hover": { borderColor: "#9c27b0", backgroundColor: "rgba(123,31,162,0.15)" },
            }}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate("/signup")}
            sx={{
              background: "linear-gradient(45deg, #7b1fa2, #f50057)",
              "&:hover": { background: "linear-gradient(45deg, #9c27b0, #ff4081)" },
            }}
          >
            Sign Up
          </Button>
        </>
      )}
    </Stack>
  );

  return (
    <PageLayout
      maxWidth="xl"
      headerIcon={<BrainIcon sx={{ fontSize: 40 }} />}
      title="Ace Your Next Tech Interview"
      subtitle="Practice coding challenges, quizzes, and AI-powered interviews — all in one place."
      rightHeaderContent={rightHeaderContent}
    >
      {/* Hero CTA */}
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(isLoggedIn ? "/dashboard" : "/signup")}
            sx={{
              py: 1.5, px: 4,
              background: "linear-gradient(45deg, #7b1fa2, #f50057)",
              "&:hover": { background: "linear-gradient(45deg, #9c27b0, #ff4081)" },
            }}
          >
            {isLoggedIn ? "Go to Dashboard" : "Get Started"}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            sx={{
              py: 1.5, px: 4, borderColor: "#7b1fa2", color: "white",
              "&:hover": { borderColor: "#9c27b0", backgroundColor: "rgba(123,31,162,0.15)" },
            }}
          >
            Explore Features
          </Button>
        </Stack>
      </Box>

      {/* Features */}
      <Box id="features" sx={{ py: 2 }}>
        <Grid container spacing={4}>
          {features.map((f, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <FeatureCard {...f} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Bottom CTA */}
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>
          Ready to elevate your interview skills?
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: "#bbb" }}>
          Join thousands mastering coding, quizzes, and interviews with Prep_Orbit.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate(isLoggedIn ? "/dashboard" : "/signup")}
          sx={{
            py: 1.5, px: 6,
            background: "linear-gradient(45deg, #7b1fa2, #f50057)",
            "&:hover": { background: "linear-gradient(45deg, #9c27b0, #ff4081)" },
          }}
        >
          {isLoggedIn ? "Go to Dashboard" : "Start Your Journey"}
        </Button>
      </Box>
    </PageLayout>
  );
}