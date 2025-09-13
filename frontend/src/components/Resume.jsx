import React, { useRef } from "react";
import {
  Box, Paper, Typography, Divider, Chip, Grid, Card, CardContent, Button,
  Container, Link, List, ListItem, ListItemText, Stack
} from "@mui/material";
import {
  GitHub as GitHubIcon, LinkedIn as LinkedInIcon, Phone as PhoneIcon, Email as EmailIcon,
  Download as DownloadIcon, School as SchoolIcon, Work as WorkIcon, Build as BuildIcon,
  EmojiEvents as AchievementsIcon
} from "@mui/icons-material";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export default function Resume({ data }) {
  const resumeRef = useRef(null);

  const handleDownloadPdf = async () => {
    try {
      const element = resumeRef.current;
      if (!element) return;

      const dataUrl = await toPng(element, { quality: 1.0, pixelRatio: 2, backgroundColor: "#ffffff", width: element.scrollWidth, height: element.scrollHeight });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - 2 * margin;
      const imgHeight = (img.height * imgWidth) / img.width;
      const pageHeight = pdfHeight - 2 * margin;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filenameSafe = (data?.personalInformation?.fullName || "Resume").replace(/[^\w\d-_]+/g, "_") + "_Resume.pdf";
      pdf.save(filenameSafe);
    } catch (err) {
      console.error("Error generating PDF", err);
    }
  };

  const personal = data?.personalInformation || {};
  const linkedInUrl = personal.linkedin || personal.linkedIn || "";
  const githubUrl = personal.gitHub || personal.github || "";

  return (
    <Box>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Paper ref={resumeRef} elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2, backgroundColor: "#ffffff", color: "#111" }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, letterSpacing: 0.2, color: "#1a0f3d" }}>
              {personal.fullName || "Your Name"}
            </Typography>
            {(personal.location || personal.email || personal.phoneNumber) && (
              <Typography variant="subtitle1" gutterBottom sx={{ color: "#555" }}>{personal.location}</Typography>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" alignItems="center" mt={2}>
              {personal.email && (
                <Box display="flex" alignItems="center" sx={{ color: "#444" }}>
                  <EmailIcon sx={{ mr: 1 }} />
                  <Link href={`mailto:${personal.email}`} underline="hover" sx={{ color: "#111" }}>
                    {personal.email}
                  </Link>
                </Box>
              )}
              {personal.phoneNumber && (
                <Box display="flex" alignItems="center" sx={{ color: "#444" }}>
                  <PhoneIcon sx={{ mr: 1 }} />
                  <Typography>{personal.phoneNumber}</Typography>
                </Box>
              )}
            </Stack>

            {(githubUrl || linkedInUrl) && (
              <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                {githubUrl && (
                  <Link href={githubUrl} target="_blank" rel="noopener noreferrer" sx={{ display: "flex", alignItems: "center", color: "#333" }}>
                    <GitHubIcon sx={{ mr: 1 }} /> GitHub
                  </Link>
                )}
                {linkedInUrl && (
                  <Link href={linkedInUrl} target="_blank" rel="noopener noreferrer" sx={{ display: "flex", alignItems: "center", color: "#0A66C2" }}>
                    <LinkedInIcon sx={{ mr: 1 }} /> LinkedIn
                  </Link>
                )}
              </Stack>
            )}
          </Box>

          <Divider sx={{ my: 2, borderColor: "#eee" }} />

          {data?.summary && (
            <>
              <Box mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a" }}>Summary</Typography>
                <Typography variant="body1" sx={{ color: "#333", lineHeight: 1.7 }}>{data.summary}</Typography>
              </Box>
              <Divider sx={{ my: 2, borderColor: "#eee" }} />
            </>
          )}

          {(data?.skills || []).length > 0 && (
            <>
              <Box mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a" }}>Skills</Typography>
                <Box mt={1}>
                  {data.skills.map((skill, idx) => (
                    <Chip key={idx} label={`${skill?.title || "Skill"}${skill?.level ? ` - ${skill.level}` : ""}`} variant="outlined" color="default" size="small" sx={{ m: 0.5, borderColor: "#ddd", color: "#333" }} />
                  ))}
                </Box>
              </Box>
              <Divider sx={{ my: 2, borderColor: "#eee" }} />
            </>
          )}

          {(data?.experience || []).length > 0 && (
            <>
              <Box mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 1 }}>
                  <WorkIcon fontSize="small" /> Experience
                </Typography>
                <Stack spacing={1.5} mt={1}>
                  {data.experience.map((exp, idx) => (
                    <Card key={idx} elevation={0} sx={{ border: "1px solid #eee", backgroundColor: "#fff" }}>
                      <CardContent sx={{ p: 2.25 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{exp?.jobTitle}</Typography>
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          {(exp?.company || "") + (exp?.location ? ` | ${exp.location}` : "")}
                        </Typography>
                        {exp?.duration && <Typography variant="body2" sx={{ color: "#777", mt: 0.5 }}>{exp.duration}</Typography>}
                        {exp?.responsibility && <Typography variant="body2" sx={{ mt: 1.25, color: "#333" }}>{exp.responsibility}</Typography>}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
              <Divider sx={{ my: 2, borderColor: "#eee" }} />
            </>
          )}

          {(data?.education || []).length > 0 && (
            <>
              <Box mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 1 }}>
                  <SchoolIcon fontSize="small" /> Education
                </Typography>
                <Stack spacing={1.5} mt={1}>
                  {data.education.map((edu, idx) => (
                    <Card key={idx} elevation={0} sx={{ border: "1px solid #eee", backgroundColor: "#fff" }}>
                      <CardContent sx={{ p: 2.25 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{edu?.degree}</Typography>
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          {(edu?.university || "") + (edu?.location ? `, ${edu.location}` : "")}
                        </Typography>
                        {edu?.graduationYear && <Typography variant="body2" sx={{ color: "#777", mt: 0.5 }}>Graduation Year: {edu.graduationYear}</Typography>}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
              <Divider sx={{ my: 2, borderColor: "#eee" }} />
            </>
          )}

          {(data?.certifications || []).length > 0 && (
            <>
              <Box mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a" }}>Certifications</Typography>
                <Stack spacing={1.5} mt={1}>
                  {data.certifications.map((cert, idx) => (
                    <Card key={idx} elevation={0} sx={{ border: "1px solid #eee", backgroundColor: "#fff" }}>
                      <CardContent sx={{ p: 2.25 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{cert?.title}</Typography>
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          {(cert?.issuingOrganization || "") + (cert?.year ? ` - ${cert.year}` : "")}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
              <Divider sx={{ my: 2, borderColor: "#eee" }} />
            </>
          )}

          {(data?.projects || []).length > 0 && (
            <>
              <Box mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 1 }}>
                  <BuildIcon fontSize="small" /> Projects
                </Typography>
                <Stack spacing={1.5} mt={1}>
                  {data.projects.map((proj, idx) => (
                    <Card key={idx} elevation={0} sx={{ border: "1px solid #eee", backgroundColor: "#fff" }}>
                      <CardContent sx={{ p: 2.25 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{proj?.title}</Typography>
                        {proj?.description && <Typography variant="body2" sx={{ color: "#333", mt: 0.75 }}>{proj.description}</Typography>}
                        {proj?.technologiesUsed && (
                          <Typography variant="body2" sx={{ color: "#666", mt: 0.75 }}>
                            Technologies: {Array.isArray(proj.technologiesUsed) ? proj.technologiesUsed.join(", ") : proj.technologiesUsed}
                          </Typography>
                        )}
                        {proj?.githubLink && (
                          <Box sx={{ mt: 1 }}>
                            <Link href={proj.githubLink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: "#1976d2" }}>
                              GitHub Link
                            </Link>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
              <Divider sx={{ my: 2, borderColor: "#eee" }} />
            </>
          )}

          {(data?.achievements || []).length > 0 && (
            <>
              <Box mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 1 }}>
                  <AchievementsIcon fontSize="small" /> Achievements
                </Typography>
                <Stack spacing={1.5} mt={1}>
                  {data.achievements.map((ach, idx) => (
                    <Card key={idx} elevation={0} sx={{ border: "1px solid #eee", backgroundColor: "#fff" }}>
                      <CardContent sx={{ p: 2.25 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{ach?.title}</Typography>
                        {(ach?.year || ach?.extraInformation) && (
                          <Typography variant="body2" sx={{ color: "#666", mt: 0.5 }}>
                            {[ach?.year, ach?.extraInformation].filter(Boolean).join(" • ")}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
              <Divider sx={{ my: 2, borderColor: "#eee" }} />
            </>
          )}

          {(data?.languages || []).length > 0 && (
            <>
              <Box mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a" }}>Languages</Typography>
                <List dense sx={{ mt: 0.5 }}>
                  {data.languages.map((lang, idx) => (
                    <ListItem key={idx} disableGutters sx={{ color: "#333" }}>
                      <ListItemText primary={`• ${lang?.name}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
              <Divider sx={{ my: 2, borderColor: "#eee" }} />
            </>
          )}

          {(data?.interests || []).length > 0 && (
            <Box mb={1}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#1a1a1a" }}>Interests</Typography>
              <List dense sx={{ mt: 0.5 }}>
                {data.interests.map((interest, idx) => (
                  <ListItem key={idx} disableGutters sx={{ color: "#333" }}>
                    <ListItemText primary={`• ${interest?.name}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>

        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            variant="contained"
            size="large"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPdf}
            sx={{
              px: 4, py: 1.5, borderRadius: 2, textTransform: "none", fontSize: "1.05rem",
              background: "linear-gradient(45deg, #7b1fa2, #f50057)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
              "&:hover": { background: "linear-gradient(45deg, #9c27b0, #ff4081)", transform: "translateY(-2px)" },
              transition: "all 0.25s ease",
            }}
          >
            Download PDF
          </Button>
        </Box>
      </Container>
    </Box>
  );
}