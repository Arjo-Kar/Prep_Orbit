package com.preporbit.prep_orbit.service;

import com.preporbit.prep_orbit.model.Interview;
import com.preporbit.prep_orbit.dto.InterviewRequestDto;
import com.preporbit.prep_orbit.dto.InterviewResponseDto;
import com.preporbit.prep_orbit.repository.InterviewFeedbackRepository;
import com.preporbit.prep_orbit.repository.InterviewRepository;
import com.preporbit.prep_orbit.config.InterviewAIConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.preporbit.prep_orbit.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class InterviewService {
    @Autowired
    private InterviewFeedbackRepository interviewFeedbackRepository;

    private static final Logger logger = LoggerFactory.getLogger(InterviewService.class);

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private InterviewAIConfig interviewAIConfig;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @Qualifier("interviewRestTemplate")
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String[] COVER_IMAGES = {
            "interview-cover-1.jpg",
            "interview-cover-2.jpg",
            "interview-cover-3.jpg",
            "interview-cover-4.jpg",
            "interview-cover-5.jpg"
    };

    public InterviewResponseDto generateInterview(InterviewRequestDto request) {
        try {
            logger.info("Generating interview for user: {} with role: {}", request.getUserId(), request.getRole());

            // Generate questions using Gemini AI
            String questionsJson = generateQuestionsWithAI(request);

            // Create interview entity
            Interview interview = new Interview();
            interview.setRole(request.getRole());
            interview.setType(request.getType());
            interview.setLevel(request.getLevel());
            interview.setTechstack(String.join(",", request.getTechstack()));
            interview.setQuestions(questionsJson);
            interview.setUserId(request.getUserId());
            interview.setFinalized(true);
            interview.setCoverImage(getRandomCoverImage());
            interview.setCreatedAt(LocalDateTime.now());
            interview.setUpdatedAt(LocalDateTime.now());

            // Save to database
            logger.info("💾 About to save interview for user: {}", request.getUserId());
            Interview savedInterview = interviewRepository.save(interview);
            logger.info("✅ Interview saved with ID: {} and questions: {}",
                    savedInterview.getId(), savedInterview.getQuestions());


            return new InterviewResponseDto(savedInterview);

        } catch (Exception e) {
            logger.error("Failed to generate interview for user: {}", request.getUserId(), e);
            throw new RuntimeException("Failed to generate interview: " + e.getMessage());
        }
    }

    private String generateQuestionsWithAI(InterviewRequestDto request) {
        try {
            if (!interviewAIConfig.isConfigured()) {
                logger.warn("AI not configured, using fallback questions");
                return createFallbackQuestionsJson(request);
            }

            String prompt = buildPrompt(request);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            content.put("parts", parts);
            contents.add(content);
            requestBody.put("contents", contents);

            // Generation config for better output
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("topK", 40);
            generationConfig.put("topP", 0.95);
            generationConfig.put("maxOutputTokens", 2048);
            requestBody.put("generationConfig", generationConfig);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String url = interviewAIConfig.getGenerateContentUrl() + "?key=" + interviewAIConfig.getGoogleApiKey();

            logger.info("Calling Gemini API for question generation");
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");

                if (candidates != null && !candidates.isEmpty()) {

                    content = (Map<String, Object>) candidates.get(0).get("content");


                     parts = (List<Map<String, Object>>) content.get("parts");

                    String generatedText = (String) parts.get(0).get("text");

                    // Clean and format the response
                    String cleanedQuestions = cleanGeneratedQuestions(generatedText);

                    logger.info("Questions generated successfully");
                    return cleanedQuestions;
                } else {
                    throw new RuntimeException("No candidates returned from Gemini API");
                }
            } else {
                throw new RuntimeException("Failed to call Gemini API: " + response.getStatusCode());
            }

        } catch (Exception e) {
            logger.error("Failed to generate questions with AI, using fallback", e);
            return createFallbackQuestionsJson(request);
        }
    }

    private String buildPrompt(InterviewRequestDto request) {
        return String.format(
                "Prepare questions for a job interview. " +
                        "The job role is %s. " +
                        "The job experience level is %s. " +
                        "The tech stack used in the job is: %s. " +
                        "The focus between behavioural and technical questions should lean towards: %s. " +
                        "The amount of questions required is: %d. " +
                        "Please return only the questions, without any additional text. Also don't ask for any written type question like writing codes and ask concise and precise question, avoid nesting multiple question in a single one" +
                        "The questions are going to be read by a voice assistant so do not use '/' or '*' or any other special characters which might break the voice assistant. " +
                        "Return the questions formatted exactly like this JSON array: " +
                        "[\"Question 1\", \"Question 2\", \"Question 3\"] " +
                        "Make sure the response is a valid JSON array with proper double quotes.",
                request.getRole(),
                request.getLevel(),
                String.join(", ", request.getTechstack()),
                request.getType(),
                request.getAmount()
        );
    }

    private String cleanGeneratedQuestions(String generatedText) {
        try {
            // Remove any markdown formatting or extra text
            String cleaned = generatedText.trim();

            // Find JSON array in the text
            int startIndex = cleaned.indexOf('[');
            int endIndex = cleaned.lastIndexOf(']');

            if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
                cleaned = cleaned.substring(startIndex, endIndex + 1);
            }

            // Validate JSON format
            try {
                objectMapper.readValue(cleaned, String[].class);
                return cleaned;
            } catch (Exception e) {
                // If JSON parsing fails, create a fallback
                logger.warn("Generated text is not valid JSON, creating fallback questions");
                return createFallbackQuestions();
            }

        } catch (Exception e) {
            logger.error("Error cleaning generated questions", e);
            return createFallbackQuestions();
        }
    }

    private String createFallbackQuestions() {
        List<String> fallbackQuestions = Arrays.asList(
                "Tell me about yourself and your background in this field.",
                "What interests you most about this role?",
                "Describe a challenging project you've worked on recently.",
                "How do you stay updated with the latest technologies?",
                "What are your career goals for the next few years?"
        );

        try {
            return objectMapper.writeValueAsString(fallbackQuestions);
        } catch (Exception e) {
            return "[\"Tell me about yourself\", \"What interests you about this role?\", \"Describe a recent project\"]";
        }
    }

    private String createFallbackQuestionsJson(InterviewRequestDto request) {
        List<String> fallbackQuestions = getFallbackQuestions(request.getType(), request.getAmount());
        try {
            return objectMapper.writeValueAsString(fallbackQuestions);
        } catch (Exception e) {
            logger.error("Failed to create fallback questions JSON", e);
            return createFallbackQuestions();
        }
    }

    private List<String> getFallbackQuestions(String type, int count) {
        List<String> technicalQuestions = Arrays.asList(
                "Explain the difference between synchronous and asynchronous programming.",
                "How do you handle errors in your code?",
                "Describe a challenging technical problem you solved recently.",
                "What are the principles of clean code?",
                "How do you approach debugging complex issues?",
                "Explain the concept of database normalization.",
                "What is the difference between HTTP and HTTPS?",
                "How do you optimize application performance?",
                "Describe your experience with version control systems.",
                "How do you approach testing in your development process?"
        );

        List<String> behavioralQuestions = Arrays.asList(
                "Tell me about a time when you had to work under pressure.",
                "Describe a situation where you had to learn something new quickly.",
                "How do you handle feedback and criticism?",
                "Tell me about a time when you had to work with a difficult team member.",
                "Describe your ideal work environment.",
                "How do you prioritize tasks when everything seems urgent?",
                "Tell me about a mistake you made and how you handled it.",
                "Describe a time when you had to persuade someone to see your point of view.",
                "How do you stay motivated when working on long-term projects?",
                "Tell me about a time when you had to adapt to a significant change."
        );

        List<String> questions = "technical".equalsIgnoreCase(type)
                ? technicalQuestions
                : behavioralQuestions;

        // Shuffle and take the requested count
        Collections.shuffle(questions);
        return questions.subList(0, Math.min(count, questions.size()));
    }

    private String getRandomCoverImage() {
        Random random = new Random();
        return COVER_IMAGES[random.nextInt(COVER_IMAGES.length)];
    }

    public InterviewResponseDto getInterviewById(Long id) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found with ID: " + id));
        return new InterviewResponseDto(interview);
    }

    public InterviewResponseDto getInterviewByIdAndUserId(Long id, Long userId) {
        Interview interview = interviewRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Interview not found or access denied"));
        return new InterviewResponseDto(interview);
    }

    public List<InterviewResponseDto> getInterviewsByUserId(Long userId) {
        List<Interview> interviews = interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return interviews.stream()
                .map(InterviewResponseDto::new)
                .toList();
    }

    public List<InterviewResponseDto> getFinalizedInterviewsByUserId(Long userId) {
        List<Interview> interviews = interviewRepository.findByUserIdAndFinalizedTrueOrderByCreatedAtDesc(userId);
        return interviews.stream()
                .map(InterviewResponseDto::new)
                .toList();
    }

    public List<InterviewResponseDto> getInterviewsByUserIdAndType(Long userId, String type) {
        List<Interview> interviews = interviewRepository.findByUserIdAndType(userId, type);
        return interviews.stream()
                .map(InterviewResponseDto::new)
                .toList();
    }

    public List<InterviewResponseDto> getInterviewsByUserIdAndLevel(Long userId, String level) {
        List<Interview> interviews = interviewRepository.findByUserIdAndLevel(userId, level);
        return interviews.stream()
                .map(InterviewResponseDto::new)
                .toList();
    }

    public void deleteInterview(Long id, Long userId) {
        Interview interview = interviewRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Interview not found or access denied"));
        interviewRepository.delete(interview);
        logger.info("Interview deleted: {} by user: {}", id, userId);
    }

    public Map<String, Object> getInterviewStats(Long userId) {
        List<Interview> userInterviews = interviewRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalInterviews", userInterviews.size());
        stats.put("technicalInterviews", userInterviews.stream()
                .filter(i -> "technical".equals(i.getType())).count());
        stats.put("behavioralInterviews", userInterviews.stream()
                .filter(i -> "behavioral".equals(i.getType())).count());
        stats.put("juniorLevel", userInterviews.stream()
                .filter(i -> "junior".equals(i.getLevel())).count());
        stats.put("midLevel", userInterviews.stream()
                .filter(i -> "mid".equals(i.getLevel())).count());
        stats.put("seniorLevel", userInterviews.stream()
                .filter(i -> "senior".equals(i.getLevel())).count());

        return stats;
    }
    // Add to InterviewService
    public Long getUserIdByUsername(String username) {
        // Implement this based on your User entity/repository
        // Example:
        return userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username))
                .getId();
    }
    public void finalizeInterview(Long id, Long userId) {
        Interview interview = interviewRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Interview not found or access denied"));

        interview.setFinalized(true);
        interview.setUpdatedAt(LocalDateTime.now());
        interviewRepository.save(interview);

        logger.info("Interview {} finalized by user: {}", id, userId);
    }
    public Map<String, Object> getUnifiedStats(Long userId) {
        Map<String, Object> interviewStats = getInterviewStats(userId); // existing distribution stats

        Double avgOverall = interviewFeedbackRepository.getAverageScoreByUserId(userId);
        Double avgTech = interviewFeedbackRepository.getAverageTechnicalByUser(userId);
        Double avgComm = interviewFeedbackRepository.getAverageCommunicationByUser(userId);
        Double avgProb = interviewFeedbackRepository.getAverageProblemSolvingByUser(userId);
        Long fbCount = interviewFeedbackRepository.getFeedbackCount(userId);

        // last feedback date
        String lastFeedbackDate = interviewFeedbackRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .findFirst()
                .map(f -> f.getCreatedAt().toString())
                .orElse(null);

        Map<String,Object> merged = new HashMap<>();
        merged.putAll(interviewStats);
        merged.put("totalFeedbacks", fbCount != null ? fbCount : 0);
        merged.put("averageOverallScore", avgOverall != null ? round1(avgOverall) : 0.0);
        merged.put("averageTechnicalScore", avgTech != null ? round1(avgTech) : 0.0);
        merged.put("averageCommunicationScore", avgComm != null ? round1(avgComm) : 0.0);
        merged.put("averageProblemSolvingScore", avgProb != null ? round1(avgProb) : 0.0);
        merged.put("lastFeedbackDate", lastFeedbackDate);
        // simple improvement trend placeholder: you could compare last two feedbacks
        merged.put("improvementTrend", "+0.0");
        return merged;
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

}