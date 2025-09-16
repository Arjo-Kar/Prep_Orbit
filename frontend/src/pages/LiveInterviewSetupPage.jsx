import React, { useState } from "react";
import { Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem, Chip, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const darkTheme = createTheme({ palette: { mode: "dark" } });

function LiveInterviewSetupPage() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [strengths, setStrengths] = useState([]);
  const [experience, setExperience] = useState("");
  const [profile, setProfile] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Call backend to generate questions, then navigate
    // Example: await generateLiveInterview({topic, level, strengths, experience, profile});
    navigate("/live-interview");
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #100827 0%, #291a54 100%)" }}>
        {/* Back to Dashboard Button - fixed top-left */}
        <Box sx={{ position: "fixed", top: 16, left: 16, zIndex: 2000 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{
              borderColor: "#7b1fa2",
              color: "#fff",
              background: "rgba(255,255,255,0.06)",
              fontWeight: "bold",
              "&:hover": {
                borderColor: "#f50057",
                background: "rgba(123,31,162,0.18)",
              },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>

        <Card sx={{ p: 3, borderRadius: "20px", minWidth: 400, background: "rgba(25,25,25,0.92)" }}>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" mb={2} color="primary">Customize Your Live Interview</Typography>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField label="Topic/Domain" value={topic} onChange={e => setTopic(e.target.value)} required fullWidth />
                <Select value={level} onChange={e => setLevel(e.target.value)} fullWidth>
                  <MenuItem value="Beginner">Beginner</MenuItem>
                  <MenuItem value="Intermediate">Intermediate</MenuItem>
                  <MenuItem value="Expert">Expert</MenuItem>
                </Select>
                <TextField label="Strengths (comma separated)" value={strengths} onChange={e => setStrengths(e.target.value.split(','))} fullWidth />
                <TextField label="Years of Experience" type="number" value={experience} onChange={e => setExperience(e.target.value)} fullWidth />
                <TextField label="Short Profile/Summary" multiline minRows={2} value={profile} onChange={e => setProfile(e.target.value)} fullWidth />
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>Start Interview</Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
export default LiveInterviewSetupPage;