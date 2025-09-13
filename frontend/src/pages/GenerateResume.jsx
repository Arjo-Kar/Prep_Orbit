import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Psychology as BrainIcon,
  Delete as TrashIcon,
  Send as SendIcon,
  MenuBook as BookIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { generateResume } from "../api/ResumeService";
import Resume from "../components/Resume";
import PageLayout from "../components/PageLayout";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#333",
    "& fieldset": { borderColor: "#555" },
    "&:hover fieldset": { borderColor: "#7b1fa2" },
    "&.Mui-focused fieldset": { borderColor: "#7b1fa2" },
  },
  "& .MuiInputLabel-root": { color: "#aaa" },
  "& .MuiOutlinedInput-input": {
    color: "white",
    caretColor: "white",
  },
};

export default function GenerateResume() {
  const navigate = useNavigate();

  // visibility states
  const [showFormUI, setShowFormUI] = useState(false);
  const [showResumeUI, setShowResumeUI] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(true);

  // prompt state
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // keep a stable ref to the textarea for selection restore
  const promptRef = useRef(null);

  // resume data + form
  const [data, setData] = useState({
    personalInformation: { fullName: "Durgesh Kumar Tiwari" },
    summary: "",
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    interests: [],
  });

  const { register, handleSubmit, control, reset } = useForm({ defaultValues: data });

  const experienceFields = useFieldArray({ control, name: "experience" });
  const educationFields = useFieldArray({ control, name: "education" });
  const certificationsFields = useFieldArray({ control, name: "certifications" });
  const projectsFields = useFieldArray({ control, name: "projects" });
  const languagesFields = useFieldArray({ control, name: "languages" });
  const interestsFields = useFieldArray({ control, name: "interests" });
  const skillsFields = useFieldArray({ control, name: "skills" });

  // Preserve caret position and scroll while typing
  const handlePromptChange = (e) => {
    const start = e.target.selectionStart ?? 0;
    const end = e.target.selectionEnd ?? start;
    const top = e.target.scrollTop ?? 0;

    setDescription(e.target.value);

    requestAnimationFrame(() => {
      if (!promptRef.current) return;
      try {
        promptRef.current.selectionStart = start;
        promptRef.current.selectionEnd = end;
        promptRef.current.scrollTop = top;
      } catch {}
    });
  };

  const onSubmit = (formData) => {
    setData({ ...formData });
    setShowFormUI(false);
    setShowPromptInput(false);
    setShowResumeUI(true);
  };

  const handleGenerate = async () => {
    try {
      if (!description.trim()) {
        toast.error("Please add a brief description to generate your resume.");
        return;
      }
      setLoading(true);
      const responseData = await generateResume(description);
      const next = responseData?.data ?? responseData;
      reset(next);
      toast.success("Resume Generated Successfully!", { duration: 3000, position: "top-center" });
      setShowFormUI(true);
      setShowPromptInput(false);
      setShowResumeUI(false);
    } catch (e) {
      console.error(e);
      toast.error("Error Generating Resume!");
    } finally {
      setLoading(false);
      // keep description for further edits
    }
  };

  const renderInput = (name, label, type = "text") => (
    <TextField
      {...register(name)}
      label={label}
      type={type}
      variant="outlined"
      fullWidth
      margin="normal"
      sx={{ mb: 2, ...inputSx }}
    />
  );

  const renderFieldArray = (fields, label, name, keys) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        {label}
      </Typography>
      <Stack spacing={2}>
        {fields.fields.map((field, index) => (
          <Card
            key={field.id}
            sx={{
              background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
              border: "1px solid #444",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {keys.map((key) => (
                  <Grid item xs={12} sm={keys.length > 3 ? 6 : 12} key={key}>
                    {renderInput(`${name}.${index}.${key}`, key.charAt(0).toUpperCase() + key.slice(1))}
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => fields.remove(index)}
                  startIcon={<TrashIcon />}
                >
                  Remove {label.slice(0, -1)}
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Button
        variant="outlined"
        color="primary"
        onClick={() => fields.append(keys.reduce((acc, key) => ({ ...acc, [key]: "" }), {}))}
        startIcon={<AddIcon />}
        sx={{
          mt: 2,
          borderColor: "#7b1fa2",
          color: "#ccc",
          "&:hover": { borderColor: "#9c27b0", backgroundColor: "rgba(123,31,162,0.15)" },
        }}
      >
        Add {label.slice(0, -1)}
      </Button>
    </Box>
  );

  const PromptInput = () => (
    <Card
      sx={{
        background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
        border: "1px solid #444",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, #7b1fa2, #f50057)",
              boxShadow: "0 4px 20px rgba(123,31,162,0.4)",
            }}
          >
            <BrainIcon sx={{ fontSize: 34 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              AI Resume Generator
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaa" }}>
              Describe your background. We’ll generate a draft you can edit.
            </Typography>
          </Box>
        </Box>

        <TextField
          inputRef={promptRef}
          autoFocus
          disabled={loading}
          multiline
          rows={8}
          variant="outlined"
          fullWidth
          placeholder="Describe your professional background, skills, experience, education, and career goals..."
          value={description}
          onChange={handlePromptChange}
          sx={inputSx}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
          <Button
            disabled={loading}
            onClick={handleGenerate}
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            sx={{
              background: "linear-gradient(45deg, #7b1fa2, #f50057)",
              "&:hover": { background: "linear-gradient(45deg, #9c27b0, #ff4081)" },
            }}
          >
            {loading ? "Generating..." : "Generate Resume"}
          </Button>

          <Button
            onClick={() => setDescription("")}
            variant="outlined"
            size="large"
            startIcon={<TrashIcon />}
            sx={{
              borderColor: "#666",
              color: "#ccc",
              "&:hover": { borderColor: "#7b1fa2", backgroundColor: "rgba(123,31,162,0.15)" },
            }}
          >
            Clear
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  const ResumeForm = () => (
    <Card
      sx={{
        background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
        border: "1px solid #444",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Resume Form
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              {renderInput("personalInformation.fullName", "Full Name")}
            </Grid>
            <Grid item xs={12} sm={6}>
              {renderInput("personalInformation.email", "Email", "email")}
            </Grid>
            <Grid item xs={12} sm={6}>
              {renderInput("personalInformation.phoneNumber", "Phone Number", "tel")}
            </Grid>
            <Grid item xs={12} sm={6}>
              {renderInput("personalInformation.location", "Location")}
            </Grid>
            <Grid item xs={12} sm={4}>
              {renderInput("personalInformation.linkedin", "LinkedIn", "url")}
            </Grid>
            <Grid item xs={12} sm={4}>
              {renderInput("personalInformation.gitHub", "GitHub", "url")}
            </Grid>
            <Grid item xs={12} sm={4}>
              {renderInput("personalInformation.portfolio", "Portfolio", "url")}
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: "#333" }} />

          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
            Summary
          </Typography>
          <TextField
            {...register("summary")}
            multiline
            rows={4}
            variant="outlined"
            fullWidth
            placeholder="Write a professional summary..."
            sx={inputSx}
          />

          <Divider sx={{ my: 3, borderColor: "#333" }} />

          {renderFieldArray(skillsFields, "Skills", "skills", ["title", "level"])}
          {renderFieldArray(experienceFields, "Experience", "experience", [
            "jobTitle",
            "company",
            "location",
            "duration",
            "responsibility",
          ])}
          {renderFieldArray(educationFields, "Education", "education", [
            "degree",
            "university",
            "location",
            "graduationYear",
          ])}
          {renderFieldArray(certificationsFields, "Certifications", "certifications", [
            "title",
            "issuingOrganization",
            "year",
          ])}
          {renderFieldArray(projectsFields, "Projects", "projects", [
            "title",
            "description",
            "technologiesUsed",
            "githubLink",
          ])}

          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              {renderFieldArray(languagesFields, "Languages", "languages", ["name"])}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderFieldArray(interestsFields, "Interests", "interests", ["name"])}
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              type="submit"
              sx={{
                background: "linear-gradient(45deg, #4caf50, #8bc34a)",
                "&:hover": { background: "linear-gradient(45deg, #66bb6a, #aed581)" },
              }}
            >
              Submit Resume
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const ResumePreview = () => (
    <Card
      sx={{
        background: "linear-gradient(180deg, #1c1c1c 0%, #101010 100%)",
        border: "1px solid #444",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Resume Preview
        </Typography>
        <Resume data={data} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              setShowPromptInput(true);
              setShowFormUI(false);
              setShowResumeUI(false);
            }}
            startIcon={<RefreshIcon />}
            sx={{
              background: "linear-gradient(45deg, #7b1fa2, #f50057)",
              "&:hover": { background: "linear-gradient(45deg, #9c27b0, #ff4081)" },
            }}
          >
            Generate Another
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              setShowPromptInput(false);
              setShowFormUI(true);
              setShowResumeUI(false);
            }}
            startIcon={<EditIcon />}
            sx={{
              background: "linear-gradient(45deg, #4caf50, #8bc34a)",
              "&:hover": { background: "linear-gradient(45deg, #66bb6a, #aed581)" },
            }}
          >
            Edit Resume
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  const rightHeaderContent = (
    <Button
      variant="outlined"
      startIcon={<DashboardIcon />}
      onClick={() => navigate("/dashboard")}
      sx={{
        borderColor: "#7b1fa2",
        color: "white",
        "&:hover": { borderColor: "#9c27b0", backgroundColor: "rgba(123,31,162,0.15)" },
      }}
      aria-label="Back to Dashboard"
    >
      Back to Dashboard
    </Button>
  );

  return (
    <PageLayout
      maxWidth="xl"
      headerIcon={<BrainIcon sx={{ fontSize: 40 }} />}
      title="AI Resume Builder"
      subtitle="Generate, edit, and preview a professional resume tailored to you."
      rightHeaderContent={rightHeaderContent}
    >
      {/* Center all sections horizontally via Grid container */}
      <Grid container spacing={3} justifyContent="center">
        {showPromptInput && (
          <Grid item xs={12} md={8} lg={7}>
            <PromptInput />
          </Grid>
        )}

        {showFormUI && (
          <Grid item xs={12} md={10} lg={9}>
            <ResumeForm />
          </Grid>
        )}

        {showResumeUI && (
          <Grid item xs={12} md={10} lg={9}>
            <ResumePreview />
          </Grid>
        )}
      </Grid>
    </PageLayout>
  );
}