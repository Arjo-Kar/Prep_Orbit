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
        if (interview == null || !interview.getUserId().equals(userId)) {
            return new ArrayList<>();
        }
        return interviewAnswerRepository.findByLiveInterviewId(liveInterviewId);
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

    // Generate feedback for a submitted answer for authenticated user
    public LiveFeedbackDto generateFeedbackForUser(Long answerId, Long userId) {
        InterviewAnswer answer = interviewAnswerRepository.findById(answerId).orElse(null);
        if (answer == null || !answer.getLiveInterview().getUserId().equals(userId)) {
            return null;
        }
        String prompt = String.format(
                "For the following interview question, compare the user's answer with the expected answer. While Comparing if you find any typo or grammatical or spelling mistake consider the most nearby one it was supposed to be and then evaluate." +
                        "Give a very concise feedback, a very short feedback within at most 3 lines. a numerical rating out of 10, and 1-2 precise improvement suggestions. " +
                        "Respond in JSON format: {\"feedback\": \"...\", \"rating\": 8, \"suggestion\": \"...\"}\n" +
                        "Question: %s\nExpected Answer: %s\nUser's Answer: %s",
                answer.getQuestion().getQuestion(),
                answer.getCorrectAns(),
                answer.getAnswer()
        );

        String geminiResponse = geminiService.askGemini(prompt);

        String feedbackText = "";
        Integer ratingValue = null;
        String suggestion = "";

        if (geminiResponse != null && geminiResponse.trim().startsWith("{")) {
            // Parse JSON response
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode node = mapper.readTree(geminiResponse);
                feedbackText = node.has("feedback") ? node.get("feedback").asText() : "";
                ratingValue = node.has("rating") ? node.get("rating").asInt() : null;
                suggestion = node.has("suggestion") ? node.get("suggestion").asText() : "";
            } catch (Exception e) {
                feedbackText = geminiResponse;
            }
        } else if (geminiResponse != null) {
            // Fallback: parse lines
            String[] lines = geminiResponse.split("\n");
            for (String line : lines) {
                if (line.trim().toLowerCase().startsWith("rating:")) {
                    String ratingStr = line.replaceAll("[^0-9]", "");
                    if (!ratingStr.isEmpty()) {
                        try {
                            ratingValue = Integer.parseInt(ratingStr.length() > 2 ? ratingStr.substring(0, ratingStr.length() - 2) : ratingStr);
                        } catch (NumberFormatException e) {
                            ratingValue = null;
                        }
                    }
                } else if (line.trim().toLowerCase().startsWith("feedback:")) {
                    feedbackText = line.substring(line.indexOf(":") + 1).trim();
                } else if (line.trim().toLowerCase().startsWith("suggestion:")) {
                    suggestion = line.substring(line.indexOf(":") + 1).trim();
                }
            }
            if (feedbackText.isEmpty()) {
                feedbackText = geminiResponse;
            }
        }

        // Persist feedback, rating, and suggestion to InterviewAnswer if desired
        answer.setFeedback(feedbackText);
        answer.setRating(ratingValue != null ? ratingValue : 0);
        // If you have a suggestion field in InterviewAnswer, set it here
        interviewAnswerRepository.save(answer);

        LiveFeedbackDto dto = new LiveFeedbackDto();
        dto.setQuestion(answer.getQuestion().getQuestion());
        dto.setCorrectAns(answer.getCorrectAns());
        dto.setUserAns(answer.getAnswer());
        dto.setFeedback(feedbackText);
        dto.setRating(ratingValue != null ? ratingValue : 0);
        dto.setSuggestion(suggestion);

        return dto;
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




}