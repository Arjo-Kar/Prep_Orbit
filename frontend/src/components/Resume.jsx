import React, { useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  IconButton,
} from "@mui/material";
import {
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Build as BuildIcon,
  EmojiEvents as AchievementsIcon,
} from "@mui/icons-material";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 600,
      marginBottom: "1rem",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          marginBottom: "1rem",
          transition: "box-shadow 0.3s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          margin: "0.25rem",
        },
      },
    },
  },
});

const Resume = ({ data }) => {
  const resumeRef = useRef(null);

  const handleDownloadPdf = async () => {
    try {
      const element = resumeRef.current;

      // Capture the element as an image
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Create image object to get dimensions
      const img = new Image();
      img.src = dataUrl;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // PDF setup
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - 2 * margin;

      // Calculate image dimensions
      const imgHeight = (img.height * imgWidth) / img.width;
      const pageHeight = pdfHeight - 2 * margin;

      let heightLeft = imgHeight;
      let position = margin;

      // Add first page
      pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`${data.personalInformation.fullName}_Resume.pdf`);
    } catch (err) {
      console.error("Error generating PDF", err);
      // You can add toast notification here if needed
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          ref={resumeRef}
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: "background.paper",
            transition: "all 0.3s ease",
          }}
        >
          {/* Header Section */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h1" color="primary" gutterBottom>
              {data.personalInformation.fullName}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {data.personalInformation.location}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              alignItems="center"
              mt={2}
            >
              {data.personalInformation.email && (
                <Box display="flex" alignItems="center">
                  <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
                  <Link
                    href={`mailto:${data.personalInformation.email}`}
                    color="secondary"
                    underline="hover"
                  >
                    {data.personalInformation.email}
                  </Link>
                </Box>
              )}
              {data.personalInformation.phoneNumber && (
                <Box display="flex" alignItems="center" color="text.secondary">
                  <PhoneIcon sx={{ mr: 1 }} />
                  <Typography>
                    {data.personalInformation.phoneNumber}
                  </Typography>
                </Box>
              )}
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
              {data.personalInformation.gitHub && (
                <Link
                  href={data.personalInformation.gitHub}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "text.secondary",
                  }}
                >
                  <GitHubIcon sx={{ mr: 1 }} />
                  GitHub
                </Link>
              )}
              {data.personalInformation.linkedIn && (
                <Link
                  href={data.personalInformation.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "#0077b5",
                  }}
                >
                  <LinkedInIcon sx={{ mr: 1 }} />
                  LinkedIn
                </Link>
              )}
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Summary Section */}
          <Box mb={4}>
            <Typography variant="h2" color="secondary">
              Summary
            </Typography>
            <Typography variant="body1" color="text.primary" lineHeight={1.6}>
              {data.summary}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Skills Section */}
          <Box mb={4}>
            <Typography variant="h2" color="secondary">
              Skills
            </Typography>
            <Box mt={2}>
              {data.skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={`${skill.title} - ${skill.level}`}
                  variant="outlined"
                  color="primary"
                  size="medium"
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Experience Section */}
          <Box mb={4}>
            <Typography
              variant="h2"
              color="secondary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <WorkIcon sx={{ mr: 1 }} />
              Experience
            </Typography>
            {data.experience.map((exp, index) => (
              <Card key={index} elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {exp.jobTitle}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {exp.company} | {exp.location}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    gutterBottom
                  >
                    {exp.duration}
                  </Typography>
                  <Typography variant="body1" mt={2}>
                    {exp.responsibility}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Education Section */}
          <Box mb={4}>
            <Typography
              variant="h2"
              color="secondary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <SchoolIcon sx={{ mr: 1 }} />
              Education
            </Typography>
            {data.education.map((edu, index) => (
              <Card key={index} elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {edu.degree}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {edu.university}, {edu.location}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    🎓 Graduation Year: {edu.graduationYear}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Certifications Section */}
          <Box mb={4}>
            <Typography variant="h2" color="secondary">
              Certifications
            </Typography>
            {data.certifications.map((cert, index) => (
              <Card key={index} elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {cert.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {cert.issuingOrganization} - {cert.year}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Projects Section */}
          <Box mb={4}>
            <Typography
              variant="h2"
              color="secondary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <BuildIcon sx={{ mr: 1 }} />
              Projects
            </Typography>
            {data.projects.map((proj, index) => (
              <Card key={index} elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {proj.title}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {proj.description}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    🛠 Technologies:{" "}
                    {Array.isArray(proj.technologiesUsed)
                      ? proj.technologiesUsed.join(", ")
                      : proj.technologiesUsed || "N/A"}
                  </Typography>

                  {proj.githubLink && (
                    <Link
                      href={proj.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                      underline="hover"
                    >
                      🔗 GitHub Link
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Achievements Section */}
          <Box mb={4}>
            <Typography
              variant="h2"
              color="secondary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <AchievementsIcon sx={{ mr: 1 }} />
              Achievements
            </Typography>
            {data.achievements.map((ach, index) => (
              <Card key={index} elevation={2}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {ach.title}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {ach.year}
                  </Typography>
                  <Typography variant="body1">
                    {ach.extraInformation}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Languages Section */}
          <Box mb={4}>
            <Typography variant="h2" color="secondary">
              Languages
            </Typography>
            <List dense>
              {data.languages.map((lang, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemText primary={`• ${lang.name}`} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Interests Section */}
          <Box mb={4}>
            <Typography variant="h2" color="secondary">
              Interests
            </Typography>
            <List dense>
              {data.interests.map((interest, index) => (
                <ListItem key={index} disableGutters>
                  <ListItemText primary={`• ${interest.name}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>

        {/* Download Button */}
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPdf}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "1.1rem",
              boxShadow: 3,
              "&:hover": {
                boxShadow: 6,
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Download PDF
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Resume;
