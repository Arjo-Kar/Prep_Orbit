import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  IconButton,
  Container,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Fab
} from "@mui/material";
import { 
  Psychology as BrainIcon,
  Delete as TrashIcon,
  Send as SendIcon,
  MenuBook as BookIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { generateResume } from "../api/ResumeService";
import { useForm, useFieldArray } from "react-hook-form";
import Resume from "../components/Resume";

const GenerateResume = () => {
  const [data, setData] = useState({
    personalInformation: {
      fullName: "Durgesh Kumar Tiwari",
    },
    summary: "",
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    interests: [],
  });

  const { register, handleSubmit, control, setValue, reset } = useForm({
    defaultValues: data,
  });

  const [showFormUI, setShowFormUI] = useState(false);
  const [showResumeUI, setShowResumeUI] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(true);

  const experienceFields = useFieldArray({ control, name: "experience" });
  const educationFields = useFieldArray({ control, name: "education" });
  const certificationsFields = useFieldArray({
    control,
    name: "certifications",
  });
  const projectsFields = useFieldArray({ control, name: "projects" });
  const languagesFields = useFieldArray({ control, name: "languages" });
  const interestsFields = useFieldArray({ control, name: "interests" });
  const skillsFields = useFieldArray({ control, name: "skills" });

  //handle form submit
  const onSubmit = (data) => {
    console.log("Form Data:", data);
    setData({ ...data });

    setShowFormUI(false);
    setShowPromptInput(false);
    setShowResumeUI(true);
  };

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    console.log(description);
    // server call to get resume

    try {
      setLoading(true);
      const responseData = await generateResume(description);
      console.log(responseData);
      reset(responseData.data);

      toast.success("Resume Generated Successfully!", {
        duration: 3000,
        position: "top-center",
      });
      setShowFormUI(true);
      setShowPromptInput(false);
      setShowResumeUI(false);
    } catch (error) {
      console.log(error);
      toast.error("Error Generating Resume!");
    } finally {
      setLoading(false);
      setDescription("");
    }
  };

  const handleClear = () => {
    setDescription("");
  };

  const renderInput = (name, label, type = "text") => (
    <TextField
      {...register(name)}
      label={label}
      type={type}
      variant="outlined"
      fullWidth
      margin="normal"
      sx={{ mb: 2 }}
    />
  );

  const renderFieldArray = (fields, label, name, keys) => {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          {label}
        </Typography>
        
        {fields.fields.map((field, index) => (
          <Card key={field.id} sx={{ mb: 3, boxShadow: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                {keys.map((key) => (
                  <Grid item xs={12} sm={keys.length > 3 ? 6 : 12} key={key}>
                    {renderInput(`${name}.${index}.${key}`, key.charAt(0).toUpperCase() + key.slice(1))}
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
        
        <Button
          variant="outlined"
          color="primary"
          onClick={() =>
            fields.append(
              keys.reduce((acc, key) => ({ ...acc, [key]: "" }), {})
            )
          }
          startIcon={<AddIcon />}
          sx={{ mt: 1 }}
        >
          Add {label.slice(0, -1)}
        </Button>
      </Box>
    );
  };

  function showFormFunction() {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 2,
                color: 'primary.main'
              }}
            >
              <BookIcon fontSize="large" /> Resume Form
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Card sx={{ mb: 4, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
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
              </CardContent>
            </Card>

            <Card sx={{ mb: 4, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Summary
                </Typography>
                <TextField
                  {...register("summary")}
                  multiline
                  rows={4}
                  variant="outlined"
                  fullWidth
                  placeholder="Write a professional summary..."
                />
              </CardContent>
            </Card>

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
            
            {renderFieldArray(
              certificationsFields,
              "Certifications",
              "certifications",
              ["title", "issuingOrganization", "year"]
            )}
            
            {renderFieldArray(projectsFields, "Projects", "projects", [
              "title",
              "description",
              "technologiesUsed",
              "githubLink",
            ])}

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                {renderFieldArray(languagesFields, "Languages", "languages", ["name"])}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderFieldArray(interestsFields, "Interests", "interests", ["name"])}
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button 
                type="submit" 
                variant="contained" 
                size="large"
                sx={{ 
                  px: 6, 
                  py: 2, 
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  boxShadow: 3
                }}
              >
                Submit Resume
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    );
  }

  function ShowInputField() {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper 
          elevation={6} 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 2,
                color: 'primary.main'
              }}
            >
              <BrainIcon fontSize="large" /> AI Resume Generator
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              Enter a detailed description about yourself to generate your professional resume.
            </Typography>
          </Box>
          
          <TextField
            disabled={loading}
            multiline
            rows={8}
            variant="outlined"
            fullWidth
            placeholder="Describe your professional background, skills, experience, education, and career goals..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ 
              mb: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'white'
              }
            }}
          />
          
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              disabled={loading}
              onClick={handleGenerate}
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{ 
                px: 4, 
                py: 1.5,
                borderRadius: 3,
                boxShadow: 3
              }}
            >
              {loading ? 'Generating...' : 'Generate Resume'}
            </Button>
            
            <Button
              onClick={handleClear}
              variant="outlined"
              size="large"
              startIcon={<TrashIcon />}
              sx={{ 
                px: 4, 
                py: 1.5,
                borderRadius: 3
              }}
            >
              Clear
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  function showResume() {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Resume data={data} />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => {
              setShowPromptInput(true);
              setShowFormUI(false);
              setShowResumeUI(false);
            }}
            startIcon={<RefreshIcon />}
            sx={{ 
              px: 4, 
              py: 1.5,
              borderRadius: 3,
              boxShadow: 3
            }}
          >
            Generate Another
          </Button>
          
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={() => {
              setShowPromptInput(false);
              setShowFormUI(true);
              setShowResumeUI(false);
            }}
            startIcon={<EditIcon />}
            sx={{ 
              px: 4, 
              py: 1.5,
              borderRadius: 3,
              boxShadow: 3
            }}
          >
            Edit Resume
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc', py: 2 }}>
      {showFormUI && showFormFunction()}
      {showPromptInput && ShowInputField()}
      {showResumeUI && showResume()}
    </Box>
  );
};

export default GenerateResume;