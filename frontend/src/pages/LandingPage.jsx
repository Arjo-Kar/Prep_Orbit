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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import {
  Psychology as BrainIcon,
  Dashboard as DashboardIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Chat as ChatIcon,
  Mic as MicIcon,
  Videocam as VideocamIcon,
  School as SchoolIcon,
  RocketLaunch as RocketLaunchIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import PageLayout from "../components/PageLayout";

const FeatureCard = ({ icon, title, description, gradient }) => (
  <Card
    sx={{
      height: "100%",
      background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
      border: "1px solid #444",
      transition: "transform 0.3s ease, border 0.3s ease",
      "&:hover": { transform: "translateY(-6px)", border: "1px solid #7b1fa2" },
    }}
  >
    <CardContent sx={{ p: 4, textAlign: "center" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 80,
          height: 80,
          borderRadius: "50%",
          mx: "auto",
          mb: 2,
          background: gradient,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: "#bbb" }}>
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const StepCard = ({ icon, title, description }) => (
  <Card
    sx={{
      height: "100%",
      background: "linear-gradient(180deg, #121212 0%, #0b0b0b 100%)",
      border: "1px solid #3a3a3a",
    }}
  >
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #7b1fa2, #f50057)",
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ color: "#bdbdbd" }}>
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const TestimonialCard = ({ name, role, quote, avatarColor = "#7b1fa2" }) => (
  <Card
    sx={{
      height: "100%",
      background: "linear-gradient(180deg, #141414 0%, #0c0c0c 100%)",
      border: "1px solid #444",
    }}
  >
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Avatar sx={{ bgcolor: avatarColor, width: 48, height: 48 }}>
          {name?.charAt(0) || "U"}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>
            {name}
          </Typography>
          <Typography variant="body2" sx={{ color: "#9e9e9e" }}>
            {role}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
        <StarIcon sx={{ color: "#ffd54f" }} />
        <StarIcon sx={{ color: "#ffd54f" }} />
        <StarIcon sx={{ color: "#ffd54f" }} />
        <StarIcon sx={{ color: "#ffd54f" }} />
        <StarIcon sx={{ color: "#ffd54f" }} />
      </Stack>
      <Typography variant="body1" sx={{ color: "#cfcfcf", fontStyle: "italic" }}>
        “{quote}”
      </Typography>
    </CardContent>
  </Card>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      title: "AI Resume Builder and Analyser",
      description: "Generate a professional resume tailored to your profile and analyze it deeper.",
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
              py: 1.5,
              px: 4,
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
              py: 1.5,
              px: 4,
              borderColor: "#7b1fa2",
              color: "white",
              "&:hover": { borderColor: "#9c27b0", backgroundColor: "rgba(123,31,162,0.15)" },
            }}
          >
            Explore Features
          </Button>
        </Stack>
      </Box>

      {/* Quick Stats */}
      <Box
        sx={{
          mb: 6,
          p: 3,
          borderRadius: 2,
          border: "1px solid rgba(126,87,194,0.35)",
          background: "linear-gradient(90deg, rgba(26,15,61,0.6), rgba(45,26,84,0.3))",
        }}
      >
        <Grid container spacing={2}>
          {[
            { label: "Practice Questions", value: "2,500+", icon: <SchoolIcon /> },
            { label: "Coding Challenges", value: "300+", icon: <CodeIcon /> },
            { label: "Mock Interviews", value: "40+", icon: <WorkspacePremiumIcon /> },
            { label: "Success Rate Boost", value: "82%", icon: <TrendingUpIcon /> },
          ].map((stat, i) => (
            <Grid key={i} item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #7b1fa2, #f50057)",
                    color: "#fff",
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={900}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#bbb" }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
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

      {/* How It Works */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={900} textAlign="center" sx={{ mb: 2 }}>
          How Prep_Orbit Works
        </Typography>
        <Typography variant="body1" textAlign="center" sx={{ mb: 4, color: "#bbb" }}>
          Follow a proven path from foundations to mock interviews and land your dream role.
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <StepCard
              icon={<RocketLaunchIcon sx={{ color: "white" }} />}
              title="1. Set Your Goal"
              description="Pick your target role and skills. We tailor your journey to your goals and timeline."
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StepCard
              icon={<SchoolIcon sx={{ color: "white" }} />}
              title="2. Learn & Practice"
              description="Master core concepts with guided quizzes and bite-sized explanations."
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StepCard
              icon={<CodeIcon sx={{ color: "white" }} />}
              title="3. Solve Challenges"
              description="Build confidence through daily coding problems with instant feedback."
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StepCard
              icon={<WorkspacePremiumIcon sx={{ color: "white" }} />}
              title="4. Mock Interviews"
              description="Simulate real interviews (voice/video), then improve using detailed reports."
            />
          </Grid>
        </Grid>
      </Box>

      {/* Why Choose Prep_Orbit */}
      <Box
        sx={{
          py: 8,
          px: { xs: 2, md: 4 },
          borderRadius: 2,
          border: "1px solid #444",
          background: "linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)",
        }}
      >
        <Typography variant="h4" fontWeight={900} textAlign="center" sx={{ mb: 3 }}>
          Why Choose Prep_Orbit?
        </Typography>
        <Grid container spacing={3}>
          {[
            {
              title: "Personalized Path",
              desc: "Adaptive practice focuses on your weak areas to accelerate progress.",
            },
            {
              title: "Interview-Ready",
              desc: "Voice and video mock interviews reflect real-world pressure and formats.",
            },
            {
              title: "Industry-Backed",
              desc: "Content curated by engineers and hiring managers across top tech firms.",
            },
            {
              title: "Security First",
              desc: "Your data is protected with enterprise-grade security and privacy controls.",
            },
          ].map((item, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <CheckCircleIcon sx={{ color: "#66bb6a", mt: "2px" }} />
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#bdbdbd" }}>
                    {item.desc}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mt: 3 }}
          justifyContent="center"
          alignItems="center"
        >
          <Chip
            icon={<SecurityIcon sx={{ color: "#90caf9 !important" }} />}
            label="Secure & Private"
            sx={{ color: "#90caf9", borderColor: "#90caf9", border: "1px solid", background: "transparent" }}
            variant="outlined"
          />
          <Chip
            icon={<TrendingUpIcon sx={{ color: "#a5d6a7 !important" }} />}
            label="Results-Driven"
            sx={{ color: "#a5d6a7", borderColor: "#a5d6a7", border: "1px solid", background: "transparent" }}
            variant="outlined"
          />
          <Chip
            icon={<WorkspacePremiumIcon sx={{ color: "#ffd54f !important" }} />}
            label="Expert-Curated"
            sx={{ color: "#ffd54f", borderColor: "#ffd54f", border: "1px solid", background: "transparent" }}
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={900} textAlign="center" sx={{ mb: 2 }}>
          What Our Learners Say
        </Typography>
        <Typography variant="body1" textAlign="center" sx={{ mb: 4, color: "#bbb" }}>
          Thousands of candidates are leveling up their interviews with Prep_Orbit.
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TestimonialCard
              name="Ananya"
              role="SWE Intern @ FinTech"
              quote="The mock interviews felt surprisingly real. The feedback helped me fix my pacing and explain trade-offs better."
              avatarColor="#7b1fa2"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TestimonialCard
              name="Rahul"
              role="Backend Engineer @ Startup"
              quote="Daily challenges kept me consistent. I finally stopped procrastinating and started seeing real progress."
              avatarColor="#4caf50"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TestimonialCard
              name="Mira"
              role="ML Engineer @ HealthTech"
              quote="Loved the targeted quizzes. Focusing on weak areas made my prep efficient and less overwhelming."
              avatarColor="#2196f3"
            />
          </Grid>
        </Grid>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={900} textAlign="center" sx={{ mb: 2 }}>
          Frequently Asked Questions
        </Typography>
        <Typography variant="body1" textAlign="center" sx={{ mb: 4, color: "#bbb" }}>
          Quick answers to common questions about Prep_Orbit.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Accordion sx={{ background: "#121212", border: "1px solid #333" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#bbb" }} />}>
                <Typography fontWeight={800}>Is Prep_Orbit suitable for beginners?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: "#cfcfcf" }}>
                  Absolutely. Start with foundational quizzes and gradually increase difficulty. Our adaptive practice
                  ensures you’re always challenged at the right level.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Grid>
          <Grid item xs={12} md={6}>
            <Accordion sx={{ background: "#121212", border: "1px solid #333" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#bbb" }} />}>
                <Typography fontWeight={800}>Do you support voice and video interviews?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: "#cfcfcf" }}>
                  Yes. You can simulate voice and video interviews with AI, receive feedback on delivery, content, and
                  structure, and iterate quickly.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Grid>
          <Grid item xs={12} md={6}>
            <Accordion sx={{ background: "#121212", border: "1px solid #333" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#bbb" }} />}>
                <Typography fontWeight={800}>Will I get explanations for quiz answers?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: "#cfcfcf" }}>
                  Yes. Most questions include concise explanations, and you’ll get suggestions on topics to review based
                  on your performance.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Grid>
          <Grid item xs={12} md={6}>
            <Accordion sx={{ background: "#121212", border: "1px solid #333" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#bbb" }} />}>
                <Typography fontWeight={800}>How is my data secured?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography sx={{ color: "#cfcfcf" }}>
                  We employ best-practice security measures and never share personal data with third parties without your
                  consent.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Grid>
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
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
          <Chip
            icon={<RocketLaunchIcon sx={{ color: "#ff80ab !important" }} />}
            label="Start fast — no setup needed"
            sx={{ color: "#ff80ab", borderColor: "#ff80ab", border: "1px solid", background: "transparent" }}
            variant="outlined"
          />
          <Chip
            icon={<CheckCircleIcon sx={{ color: "#a5d6a7 !important" }} />}
            label="Track progress & milestones"
            sx={{ color: "#a5d6a7", borderColor: "#a5d6a7", border: "1px solid", background: "transparent" }}
            variant="outlined"
          />
        </Stack>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate(isLoggedIn ? "/dashboard" : "/signup")}
          sx={{
            py: 1.5,
            px: 6,
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