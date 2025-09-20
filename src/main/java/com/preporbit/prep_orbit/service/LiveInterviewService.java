package com.preporbit.prep_orbit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.speech.v1.SpeechClient;
import com.google.cloud.speech.v1.RecognitionAudio;
import com.google.cloud.speech.v1.RecognitionConfig;
import com.google.cloud.speech.v1.RecognizeResponse;
import com.google.cloud.speech.v1.SpeechRecognitionResult;

import com.google.protobuf.ByteString;
import org.springframework.beans.factory.annotation.Value;

import com.preporbit.prep_orbit.config.GeminiConfig;
import com.preporbit.prep_orbit.dto.*;
import com.preporbit.prep_orbit.model.LiveInterview;
import com.preporbit.prep_orbit.model.InterviewQuestion;
import com.preporbit.prep_orbit.model.InterviewAnswer;
import com.preporbit.prep_orbit.model.User;
import com.preporbit.prep_orbit.repository.LiveInterviewRepository;
import com.preporbit.prep_orbit.repository.InterviewQuestionRepository;
import com.preporbit.prep_orbit.repository.InterviewAnswerRepository;
import com.preporbit.prep_orbit.repository.UserRepository;
import jakarta.annotation.PostConstruct;


import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.MediaType;

import java.io.FileInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.multipart.MultipartFile;
import org.json.JSONObject;
import com.google.cloud.texttospeech.v1beta1.TextToSpeechClient;
import com.google.cloud.texttospeech.v1beta1.TextToSpeechSettings;
import com.google.cloud.texttospeech.v1beta1.SynthesisInput;
import com.google.cloud.texttospeech.v1beta1.VoiceSelectionParams;
import com.google.cloud.texttospeech.v1beta1.AudioConfig;
import com.google.cloud.texttospeech.v1beta1.AudioEncoding;
import com.google.cloud.texttospeech.v1beta1.SynthesizeSpeechResponse;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.MultipartBody;
import okhttp3.MediaType;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
// Google Cloud Speech-to-Text
import com.google.cloud.speech.v1.SpeechSettings;
import com.google.cloud.speech.v1.SpeechClient;

@Service
public class LiveInterviewService {
    @Value("${GOOGLE_API_KEY:}")
    private String googleApiKey;

    @Value("${google.credentials.path:}")
    private String googleCredentialsPath;

    @Value("${openai.api.key}")
    private String openaiApiKey;



    private static final Logger logger = LoggerFactory.getLogger(LiveInterviewService.class);

    @PostConstruct
    public void checkApiKey() {
        logger.info("Loaded GOOGLE_API_KEY: " + googleApiKey);
    }


    private final LiveInterviewRepository liveInterviewRepository;
    private final InterviewQuestionRepository interviewQuestionRepository;
    private final InterviewAnswerRepository interviewAnswerRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;

    public LiveInterviewService(
            LiveInterviewRepository liveInterviewRepository,
            InterviewQuestionRepository interviewQuestionRepository,
            InterviewAnswerRepository interviewAnswerRepository,
            UserRepository userRepository,
            GeminiService geminiService,
            GeminiConfig geminiConfig
    ) {
        this.liveInterviewRepository = liveInterviewRepository;
        this.interviewQuestionRepository = interviewQuestionRepository;
        this.interviewAnswerRepository = interviewAnswerRepository;
        this.userRepository = userRepository;
        this.geminiService = geminiService;
    }

    // Helper: Get User object from userId
    private User getUserFromUserId(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    // Create interview for authenticated user
    public LiveInterview createLiveInterview(LiveInterviewRequestDto dto, Long userId) {
        User user = getUserFromUserId(userId);
        if (user == null) return null;
        LiveInterview liveInterview = new LiveInterview();
        liveInterview.setPosition(dto.getPosition());
        liveInterview.setType(dto.getType());
        liveInterview.setLevel(dto.getLevel());
        liveInterview.setUsername(user.getUsername());
        liveInterview.setUserId(userId);

        liveInterview.setStrengths(dto.getStrengths());
        liveInterview.setExperience(dto.getExperience());
        liveInterview.setProfile(dto.getProfile());

        return liveInterviewRepository.save(liveInterview);
    }

    // List all interviews for authenticated user
    public List<LiveInterview> getAllLiveInterviewsForUser(Long userId) {
        User user = getUserFromUserId(userId);
        if (user == null) return new ArrayList<>();
        return liveInterviewRepository.findByUserId(userId);
    }

    // Get interview by id, only if it belongs to the authenticated user
    public LiveInterview getLiveInterviewByIdForUser(Long id, Long userId) {
        LiveInterview interview = liveInterviewRepository.findById(id).orElse(null);
        if (interview != null && interview.getUserId().equals(userId)) {
            return interview;
        }
        return null;
    }

    // Get questions for a live interview for authenticated user
    public List<QuestionDto> getQuestionsForLiveInterviewForUser(Long liveInterviewId, Long userId) {
        LiveInterview interview = liveInterviewRepository.findById(liveInterviewId).orElse(null);
        if (interview == null || !interview.getUserId().equals(userId)) {
            logger.error("Interview not found or does not belong to user. liveInterviewId={}, userId={}", liveInterviewId, userId);
            return new ArrayList<>();
        }
        List<InterviewQuestion> questions = interviewQuestionRepository.findByLiveInterviewId(liveInterviewId);
        logger.info("Questions fetched for interview {}: {}", liveInterviewId, questions);
        List<QuestionDto> dtos = new ArrayList<>();
        for (InterviewQuestion q : questions) {
            QuestionDto dto = new QuestionDto();
            dto.setId(q.getId());
            dto.setQuestion(q.getQuestion());
            dto.setExpectedAnswer(q.getExpectedAnswer());
            dtos.add(dto);
        }
        logger.info("Fetched questions for liveInterviewId={}: {}", liveInterviewId, dtos.stream().map(QuestionDto::getQuestion).toList());
        return dtos;
    }

    // Generate questions for an interview for authenticated user
    public List<QuestionDto> generateQuestionsForUser(QuestionGenerationRequestDto dto, Long liveInterviewId, Long userId) {
        LiveInterview interview = liveInterviewRepository.findById(liveInterviewId).orElse(null);
        if (interview == null || !interview.getUserId().equals(userId)) {
            logger.error("Interview not found or does not belong to user. liveInterviewId={}, userId={}", liveInterviewId, userId);
            return new ArrayList<>();
        }

        String prompt = String.format(
                "Generate 5 interview questions for a %s (%s, %s level). Respond ONLY with a JSON array of objects, each object with 'question' and 'expected_answer' fields. Example: [{\"question\": \"What is a hash map?\", \"expected_answer\": \"A hash map is ...\"}]",
                dto.getPosition(), dto.getType(), dto.getLevel()
        );
        logger.info("Generating questions with prompt: {}", prompt);

        String geminiResponse = geminiService.askGemini(prompt);
        logger.info("Gemini response: {}", geminiResponse);

        // Remove markdown code block if present
        String cleanedResponse = geminiResponse.trim();
        if (cleanedResponse.startsWith("```") || cleanedResponse.startsWith("`")) {
            cleanedResponse = cleanedResponse.replaceAll("(?s)```json|```|`", "").trim();
        }
        // Remove leading/trailing newlines
        cleanedResponse = cleanedResponse.replaceAll("^\\s+", "").replaceAll("\\s+$", "");

        List<QuestionDto> questionDtos = new ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();

        boolean parsedJson = false;
        try {
            List<Map<String, String>> questions = mapper.readValue(cleanedResponse, List.class);
            for (Map<String, String> qObj : questions) {
                String questionText = qObj.get("question");
                String expectedAnswer = qObj.get("expected_answer");
                if (questionText != null && !questionText.trim().isEmpty()) {
                    InterviewQuestion question = new InterviewQuestion();
                    question.setLiveInterview(interview);
                    question.setQuestion(questionText.trim());
                    question.setExpectedAnswer(expectedAnswer != null ? expectedAnswer.trim() : null);
                    InterviewQuestion saved = interviewQuestionRepository.save(question);

                    QuestionDto dtoObj = new QuestionDto();
                    dtoObj.setId(saved.getId());
                    dtoObj.setQuestion(saved.getQuestion());
                    dtoObj.setExpectedAnswer(saved.getExpectedAnswer());
                    questionDtos.add(dtoObj);
                }
            }
            parsedJson = true;
        } catch (Exception e) {
            logger.error("Failed to parse Gemini JSON response, trying fallback.", e);
        }

        // Fallback: parse the response line by line if JSON parsing fails
        if (!parsedJson) {
            String[] lines = cleanedResponse.split("\n");
            for (String line : lines) {
                // Try to extract lines that look like questions
                String q = line.trim();
                if (q.startsWith("\"")) q = q.substring(1);
                if (q.endsWith("\"")) q = q.substring(0, q.length() - 1);
                if (q.endsWith(",")) q = q.substring(0, q.length() - 1);
                if (!q.isEmpty() && !q.startsWith("[") && !q.startsWith("]") && !q.equals(",")) {
                    InterviewQuestion question = new InterviewQuestion();
                    question.setLiveInterview(interview);
                    question.setQuestion(q);
                    // In fallback, expectedAnswer is unknown
                    question.setExpectedAnswer(null);
                    InterviewQuestion saved = interviewQuestionRepository.save(question);

                    QuestionDto dtoObj = new QuestionDto();
                    dtoObj.setId(saved.getId());
                    dtoObj.setQuestion(saved.getQuestion());
                    dtoObj.setExpectedAnswer(saved.getExpectedAnswer());
                    questionDtos.add(dtoObj);
                }
            }
        }

        logger.info("All generated questions: {}", questionDtos.stream().map(QuestionDto::getQuestion).toList());
        return questionDtos;
    }

    // Get answers for a live interview for authenticated user
    public List<InterviewAnswer> getAnswersForLiveInterviewForUser(Long liveInterviewId, Long userId) {
        LiveInterview interview = liveInterviewRepository.findById(liveInterviewId).orElse(null);
        if (interview == null) {
            logger.warn("LiveInterview {} not found for user {}", liveInterviewId, userId);
            return new ArrayList<>();
        }
        if (!interview.getUserId().equals(userId)) {
            logger.warn("Access denied: user {} tried to access interview {} owned by {}", userId, liveInterviewId, interview.getUserId());
            return new ArrayList<>();
        }

        List<InterviewAnswer> answers =
                interviewAnswerRepository.findByLiveInterview_IdAndUserIdOrderByIdAsc(liveInterviewId, userId);

        logger.debug("Fetched {} answers for liveInterview={} user={}", answers.size(), liveInterviewId, userId);
        return answers;
    }

    // Submit answer for a question for authenticated user
    public InterviewAnswer submitAnswerForUser(AnswerSubmissionDto dto, Long userId) {
        LiveInterview interview = liveInterviewRepository.findById(dto.getLiveInterviewId()).orElse(null);
        if (interview == null || !interview.getUserId().equals(userId)) {
            return null;
        }
        InterviewQuestion question = interviewQuestionRepository.findById(dto.getQuestionId()).orElse(null);
        if (question == null) {
            return null;
        }
        InterviewAnswer answer = new InterviewAnswer();
        answer.setLiveInterview(interview);
        answer.setQuestion(question);
        answer.setUserId(userId);
        answer.setAnswer(dto.getAnswer());
        answer.setCorrectAns(question.getExpectedAnswer());
        return interviewAnswerRepository.save(answer);
    }
    //Fetching all feedbacks from a user
    // In LiveInterviewService.java
    public List<InterviewAnswer> getAllAnswersWithFeedbackForUser(Long userId) {
        // Fetch all InterviewAnswers for the user, where feedback is not null
        return interviewAnswerRepository.findByUserIdAndFeedbackIsNotNullOrderByIdDesc(userId);
    }
    //Final feedback for live interview
    public List<LiveInterviewFeedbackDto> getAllLiveInterviewFeedbacksForUser(Long userId) {
        List<LiveInterview> interviews = liveInterviewRepository.findByUserId(userId);
        List<LiveInterviewFeedbackDto> result = new ArrayList<>();
        for (LiveInterview interview : interviews) {
            List<InterviewAnswer> answers = interviewAnswerRepository.findByLiveInterview_IdAndUserIdOrderByIdAsc(interview.getId(), userId);
            List<LiveInterviewFeedbackDto.QaFeedback> qaList = new ArrayList<>();
            for (InterviewAnswer ans : answers) {
                LiveInterviewFeedbackDto.QaFeedback qa = new LiveInterviewFeedbackDto.QaFeedback();
                qa.setQuestion(ans.getQuestion() != null ? ans.getQuestion().getQuestion() : null);
                qa.setExpectedAnswer(ans.getQuestion() != null ? ans.getQuestion().getExpectedAnswer() : null);
                qa.setUserAnswer(ans.getAnswer());
                qa.setFeedback(ans.getFeedback());
                qa.setRating(ans.getRating());
                qa.setSuggestion(ans.getSuggestion());
                qaList.add(qa);
            }
            LiveInterviewFeedbackDto sessionDto = new LiveInterviewFeedbackDto();
            sessionDto.setInterviewId(interview.getId());
            sessionDto.setPosition(interview.getPosition());
            sessionDto.setType(interview.getType());
            sessionDto.setLevel(interview.getLevel());
            sessionDto.setAnswers(qaList);
            result.add(sessionDto);
        }
        return result;
    }

    // Generate feedback for a submitted answer for authenticated user
    // Replace ONLY the generateFeedbackForUser method and add the helper parseRatingFlexible + maybe logging.
// Keep the rest of the class intact.

    // Generate feedback for a submitted answer for authenticated user

    public LiveFeedbackDto generateFeedbackForUser(Long answerId, Long userId) {
        InterviewAnswer answer = interviewAnswerRepository.findById(answerId).orElse(null);
        if (answer == null || !answer.getLiveInterview().getUserId().equals(userId)) {
            return null;
        }

        String prompt = String.format(
                "Evaluate the interview answer. Compare expected vs user answer. " +
                        "Consider minor typos acceptable. Provide concise feedback (<=3 lines), an integer rating 1-10, " +
                        "and 1 short improvement suggestion. Respond ONLY with JSON:\n" +
                        "{\"feedback\":\"...\",\"rating\":7,\"suggestion\":\"...\"}\n" +
                        "Question: %s\nExpected Answer: %s\nUser's Answer: %s",
                safeStr(answer.getQuestion().getQuestion()),
                safeStr(answer.getCorrectAns()),
                safeStr(answer.getAnswer())
        );

        String geminiResponse = geminiService.askGemini(prompt);
        logger.debug("Raw Gemini response for answerId {}: {}", answerId, geminiResponse);

        String raw = geminiResponse == null ? "" : geminiResponse.trim();

        // Strip code fences & isolate JSON
        String cleaned = raw
                .replaceAll("```json", "")
                .replaceAll("```", "")
                .replaceAll("`", "")
                .trim();

        int jsStart = cleaned.indexOf('{');
        int jsEnd = cleaned.lastIndexOf('}');
        String jsonCandidate = (jsStart != -1 && jsEnd > jsStart)
                ? cleaned.substring(jsStart, jsEnd + 1).trim()
                : null;

        String feedbackText = "";
        Integer ratingValue = null;
        String suggestion = "";

        ObjectMapper mapper = new ObjectMapper();

        // 1. Try JSON parse
        if (jsonCandidate != null) {
            try {
                JsonNode node = mapper.readTree(jsonCandidate);
                feedbackText = node.hasNonNull("feedback") ? node.get("feedback").asText().trim() : "";
                if (node.has("rating")) {
                    JsonNode rNode = node.get("rating");
                    if (rNode.isNumber()) ratingValue = rNode.asInt();
                    else if (rNode.isTextual()) ratingValue = parseRatingFlexible(rNode.asText());
                }
                suggestion = node.hasNonNull("suggestion") ? node.get("suggestion").asText().trim() : "";
            } catch (Exception e) {
                logger.debug("JSON parse failed, falling back. {}", e.getMessage());
            }
        }

        // 2. Regex extraction if rating missing
        if (ratingValue == null) {
            // "rating": 8
            var m = java.util.regex.Pattern.compile("\"rating\"\\s*:\\s*(\\d{1,2})").matcher(cleaned);
            if (m.find()) {
                ratingValue = Integer.parseInt(m.group(1));
            }
        }
        if (ratingValue == null) {
            // Rating: 8/10 or Rating - 8
            var m2 = java.util.regex.Pattern.compile("(?i)rating\\s*[:\\-]?\\s*(\\d{1,2})(?:\\s*/\\s*10)?").matcher(cleaned);
            if (m2.find()) {
                ratingValue = Integer.parseInt(m2.group(1));
            }
        }

        // 3. Suggestion fallback
        if (suggestion.isEmpty()) {
            var sm = java.util.regex.Pattern.compile("\"suggestion\"\\s*:\\s*\"([^\"]+)\"").matcher(cleaned);
            if (sm.find()) {
                suggestion = sm.group(1).trim();
            } else {
                var sm2 = java.util.regex.Pattern.compile("(?i)suggestion\\s*:\\s*(.+)").matcher(cleaned);
                if (sm2.find()) suggestion = sm2.group(1).trim();
            }
        }

        // 4. Feedback fallback
        if (feedbackText.isEmpty()) {
            var fm = java.util.regex.Pattern.compile("\"feedback\"\\s*:\\s*\"([^\"]+)\"").matcher(cleaned);
            if (fm.find()) {
                feedbackText = fm.group(1).trim();
            } else {
                // As a last resort, take first 500 chars of cleaned text (avoid dumping whole model output)
                feedbackText = cleaned.length() > 500 ? cleaned.substring(0, 500) : cleaned;
            }
        }

        // 5. Clamp rating
        if (ratingValue != null) {
            if (ratingValue < 0) ratingValue = 0;
            if (ratingValue > 10) ratingValue = 10;
        }

        logger.info("Parsed feedback for answerId {} -> rating={} suggestion='{}'", answerId, ratingValue, suggestion);

        // Persist WITHOUT forcing 0 if null (store null so we know parse failed)
        answer.setFeedback(feedbackText);
        if (ratingValue != null) {
            answer.setRating(ratingValue);
        }
        answer.setSuggestion(suggestion);
        interviewAnswerRepository.save(answer);

        LiveFeedbackDto dto = new LiveFeedbackDto();
        dto.setQuestion(answer.getQuestion().getQuestion());
        dto.setCorrectAns(answer.getCorrectAns());
        dto.setUserAns(answer.getAnswer());
        dto.setFeedback(feedbackText);
        dto.setRating(ratingValue != null ? ratingValue : 0); // Frontend expects a number; 0 means “unrated” now
        dto.setSuggestion(suggestion);

        return dto;
    }

    private Integer parseRatingFlexible(String raw) {
        if (raw == null) return null;
        var m = java.util.regex.Pattern.compile("(\\d{1,2})").matcher(raw);
        if (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                if (val >= 0 && val <= 10) return val;
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private String safeStr(Object o) {
        return o == null ? "" : o.toString();
    }

    public byte[] textToSpeechGoogle(String text) {
        try {
            GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream(googleCredentialsPath));
            TextToSpeechSettings settings = TextToSpeechSettings.newBuilder()
                    .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
                    .build();

            try (TextToSpeechClient client = TextToSpeechClient.create(settings)) {
                SynthesisInput input = SynthesisInput.newBuilder().setText(text).build();

                VoiceSelectionParams voice = VoiceSelectionParams.newBuilder()
                        .setLanguageCode("en-US")
                        .build();

                AudioConfig audioConfig = AudioConfig.newBuilder()
                        .setAudioEncoding(AudioEncoding.MP3)
                        .build();

                SynthesizeSpeechResponse response = client.synthesizeSpeech(input, voice, audioConfig);
                return response.getAudioContent().toByteArray();
            }
        } catch (Exception e) {
            throw new RuntimeException("Error calling Google TTS API: " + e.getMessage(), e);
        }
    }
    public String transcribeAudioWithWhisper(MultipartFile audioFile) {
        try {
            // Save audio to temp file
            File tempFile = File.createTempFile("upload-", ".mp3");
            audioFile.transferTo(tempFile);

            // Build Python command
            String pythonPath = "/Users/arjo/whisper-env/bin/python3";
            String scriptPath = new File("python/whisper_transcribe.py").getAbsolutePath();

            ProcessBuilder pb = new ProcessBuilder(pythonPath, scriptPath, tempFile.getAbsolutePath());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Capture output
            InputStream is = process.getInputStream();
            String output = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            String[] lines = output.split("\n");

// Remove known warning lines and empty lines
            String transcript = "";
            for (String line : lines) {
                line = line.trim();
                if (
                        !line.isEmpty() &&
                                !line.contains("FP16 is not supported on CPU; using FP32 instead") &&
                                !line.startsWith("WARNING") &&
                                !line.startsWith("UserWarning") &&
                                !line.startsWith("Traceback")
                ) {
                    transcript = line; // last valid line will be the transcript
                }
            }

            process.waitFor();
            tempFile.delete();
            return transcript.trim();
        } catch (Exception e) {
            throw new RuntimeException("Error transcribing audio locally with Whisper", e);
        }
    }


    public LiveFeedbackDto getStoredFeedbackForUser(Long answerId, Long userId) {
        InterviewAnswer ans = interviewAnswerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found"));
        // Check userId matches
        // Build LiveFeedbackDto from stored fields only
        LiveFeedbackDto dto = new LiveFeedbackDto();
        dto.setQuestion(ans.getQuestion().getQuestion());
        dto.setCorrectAns(ans.getCorrectAns());
        dto.setUserAns(ans.getAnswer());
        dto.setFeedback(ans.getFeedback()); // <-- stored feedback
        dto.setRating(ans.getRating());     // <-- stored rating
        dto.setSuggestion(ans.getSuggestion()); // <-- stored suggestion if available
        return dto;
    }
}