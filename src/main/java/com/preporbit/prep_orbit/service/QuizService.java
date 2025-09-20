package com.preporbit.prep_orbit.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.preporbit.prep_orbit.dto.*;
import com.preporbit.prep_orbit.model.*;
import com.preporbit.prep_orbit.repository.*;
import com.preporbit.prep_orbit.util.JsonUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuizService {

    @Autowired
    private GeminiService geminiService;
    @Autowired
    private QuizSessionRepository quizSessionRepo;
    @Autowired
    private QuizQuestionRepository quizQuestionRepo;
    @Autowired
    private UserAnswerRepository userAnswerRepo;
    @Autowired
    private UserWeaknessService userWeaknessService;
    @Autowired
    private UserRepository userRepository;

    public QuizStartResponseDto startQuiz(QuizStartRequestDto request, String username) {
        Long userId = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
        List<QuizQuestionDto> aiQuestions = generateQuestionsFromGemini(request.getTopics(), request.getNumQuestions());

        QuizSession session = new QuizSession();
        session.setUsername(username);
        session.setUserId(userId);
        session.setTopics(String.join(",", request.getTopics()));
        session.setStartedAt(LocalDateTime.now());
        quizSessionRepo.save(session);

        List<QuizQuestion> entities = new ArrayList<>();
        for (int i = 0; i < aiQuestions.size(); i++) {
            QuizQuestionDto q = aiQuestions.get(i);
            QuizQuestion entity = new QuizQuestion();
            entity.setQuestionText(q.getQuestionText());
            entity.setChoices(q.getChoices() != null ? String.join(",", q.getChoices()) : null);
            entity.setCorrectAnswer(q.getCorrectAnswer());
            String assignedTopic = q.getTopic();
            if (assignedTopic == null || assignedTopic.isEmpty()) {
                assignedTopic = request.getTopics().get(i % request.getTopics().size());
            }
            entity.setTopic(assignedTopic);
            entity.setQuizSession(session);
            entities.add(entity);
        }
        quizQuestionRepo.saveAll(entities);

        List<QuizQuestionDto> responseQuestions = entities.stream().map(q -> {
            QuizQuestionDto dto = new QuizQuestionDto();
            dto.setId(q.getId());
            dto.setQuestionText(q.getQuestionText());
            dto.setChoices(q.getChoices() != null ? q.getChoices().split(",") : null);
            dto.setCorrectAnswer(q.getCorrectAnswer());
            dto.setTopic(q.getTopic());
            return dto;
        }).collect(Collectors.toList());

        QuizStartResponseDto response = new QuizStartResponseDto();
        response.setSessionId(session.getId());
        response.setQuestions(responseQuestions);

        return response;
    }

    private List<QuizQuestionDto> generateQuestionsFromGemini(List<String> topics, int numQuestions) {
        String prompt =
                "Generate " + numQuestions + " technical MCQ questions on these topics: " +
                        String.join(", ", topics) + ".\n\n" +
                        "Requirements:\n" +
                        "- Exactly 4 options per question.\n" +
                        "- The \"choices\" field MUST be ONE string made by joining the four option texts with the delimiter \",,,\" in A,,,B,,,C,,,D order.\n" +
                        "- Do NOT prefix options with \"A)\", \"B)\", etc.\n" +
                        "- Do NOT include the delimiter sequence \",,,\" inside any option text.\n" +
                        "- \"correctAnswer\" must be one of \"A\", \"B\", \"C\", or \"D\".\n" +
                        "- \"topic\" must be one of the provided topics for each question.\n" +
                        "- Return ONLY a valid JSON array. No extra text, no markdown, no comments.\n\n" +
                        "Output format (schema, not an example of content):\n" +
                        "[\n" +
                        "  {\n" +
                        "    \"questionText\": \"…\",\n" +
                        "    \"choices\": \"option A text,,,option B text,,,option C text,,,option D text\",\n" +
                        "    \"correctAnswer\": \"A\",\n" +
                        "    \"topic\": \"…\"\n" +
                        "  }\n" +
                        "]";

        String geminiResponse = geminiService.askGemini(prompt);

        geminiResponse = stripMarkdownCodeBlock(geminiResponse);

        if (geminiResponse == null || geminiResponse.isEmpty() || !geminiResponse.trim().startsWith("[")) {
            System.err.println("Gemini did not return JSON. Raw response: " + geminiResponse);
            return new ArrayList<>();
        }

        ObjectMapper mapper = new ObjectMapper();
        try {
            return mapper.readValue(geminiResponse, new TypeReference<List<QuizQuestionDto>>() {});
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini response: " + e.getMessage() + "\nRaw response: " + geminiResponse);
            return new ArrayList<>();
        }
    }

    private String stripMarkdownCodeBlock(String input) {
        if (input == null) return "";
        input = input.trim();
        if (input.startsWith("```")) {
            int start = input.indexOf("\n") + 1;
            int end = input.lastIndexOf("```");
            if (start > 0 && end > start) {
                return input.substring(start, end).trim();
            }
        }
        return input;
    }

    public QuizResultDto submitQuiz(Long sessionId, QuizSubmitRequestDto request) throws AccessDeniedException {
        QuizSession session = quizSessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session ID not found: " + sessionId));
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String loggedInUsername = authentication.getName();
        if (!Objects.equals(session.getUsername(), loggedInUsername)) {
            throw new AccessDeniedException("You do not have access to this quiz session.");
        }

        List<FeedbackDto> feedbackList = new ArrayList<>();
        int correct = 0;
        List<UserAnswer> persistedAnswers = new ArrayList<>();
        List<String> userAnswers = new ArrayList<>();
        List<String> topics = new ArrayList<>();
        List<String> incorrectTopics = new ArrayList<>();

        for (UserAnswerDto dto : request.getAnswers()) {
            QuizQuestion question = quizQuestionRepo.findById(dto.getQuestionId())
                    .orElseThrow(() -> new IllegalArgumentException("Question ID not found: " + dto.getQuestionId()));
            boolean isCorrect = dto.getUserAnswer().equalsIgnoreCase(question.getCorrectAnswer());
            String feedbackMsg = isCorrect ? "Correct" : "Incorrect; Correct: " + question.getCorrectAnswer();

            if (isCorrect) correct++;
            else incorrectTopics.add(question.getTopic());

            String hintPrompt = "Question: " + question.getQuestionText() + "\n"
                    + "Correct Answer: " + question.getCorrectAnswer() + "\n"
                    + "User Answer: " + dto.getUserAnswer() + "\n"
                    + "Provide a helpful hint or explanation for this question based on the user's answer. Keep it as concise as possible and never exceeds five sentences";
            String hint = "";
            try {
                hint = geminiService.askGemini(hintPrompt);
            } catch (Exception e) {
                System.err.println("Failed to get hint from Gemini: " + e.getMessage());
                hint = "No hint available.";
            }

            UserAnswer ua = new UserAnswer();
            ua.setQuestionId(question.getId());
            ua.setUserAnswer(dto.getUserAnswer());
            ua.setIsCorrect(isCorrect);
            ua.setFeedback(feedbackMsg);
            ua.setQuizSession(session);
            persistedAnswers.add(ua);

            FeedbackDto fdto = new FeedbackDto();
            fdto.setQuestionId(question.getId());
            fdto.setCorrect(isCorrect);
            fdto.setFeedback(feedbackMsg);
            fdto.setHint(hint);
            feedbackList.add(fdto);

            userAnswers.add(dto.getUserAnswer());
            topics.add(question.getTopic());
        }
        userAnswerRepo.saveAll(persistedAnswers);

        if (!incorrectTopics.isEmpty()) {
            Long userId = session.getUserId();
            if (userId == null) {
                userId = userRepository.findByEmail(session.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found"))
                        .getId();
            }
            userWeaknessService.updateUserWeaknesses(userId, incorrectTopics);
        }

        String sessionPrompt = "Topics: " + String.join(", ", topics) + "\n"
                + "User Answers: " + String.join(" | ", userAnswers) + "\n"
                + "Based on these answers and topics, list the user's key strengths, weaknesses, and suggestions for improvement as JSON arrays. "
                + "The topic with the highest incorrect and skipped questions should be marked as weakness too. "
                + "Strong zones should be the one with highest correct. "
                + "In suggestions, tell me how to overcome the weaknesses and relevant topics for the weak zones. "
                + "Reply ONLY with a single JSON object and DO NOT write any explanation or text outside the JSON. "
                + "Example output:\n"
                + "{ \"strengths\": [\"...\"], \"weaknesses\": [\"...\"], \"suggestions\": [\"...\"] }";

        String sessionFeedback = "";
        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        try {
            sessionFeedback = geminiService.askGemini(sessionPrompt);
            String cleanedJson = stripMarkdownCodeBlock(sessionFeedback);
            cleanedJson = JsonUtils.extractFirstJsonObject(cleanedJson);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(cleanedJson);
            strengths = mapper.convertValue(node.get("strengths"), new TypeReference<List<String>>() {});
            weaknesses = mapper.convertValue(node.get("weaknesses"), new TypeReference<List<String>>() {});
            suggestions = mapper.convertValue(node.get("suggestions"), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            System.err.println("Session feedback parse error: " + e.getMessage());
            System.err.println("Raw Gemini output: " + sessionFeedback);
            strengths = new ArrayList<>();
            weaknesses = new ArrayList<>();
            suggestions = new ArrayList<>();
        }

        double accuracy = 100.0 * correct / request.getAnswers().size();
        session.setScore(correct);
        session.setAccuracy(accuracy);
        quizSessionRepo.save(session);

        QuizResultDto result = new QuizResultDto();
        result.setScore(correct);
        result.setAccuracy(accuracy);
        result.setFeedback(feedbackList);
        result.setStrengths(strengths);
        result.setWeaknesses(weaknesses);
        result.setSuggestions(suggestions);

        return result;
    }

    public List<QuizQuestionDto> getQuizQuestions(Long sessionId) {
        List<QuizQuestion> questions = quizQuestionRepo.findByQuizSession_Id(sessionId);
        return questions.stream().map(q -> {
            QuizQuestionDto dto = new QuizQuestionDto();
            dto.setId(q.getId());
            dto.setQuestionText(q.getQuestionText());
            dto.setChoices(q.getChoices() != null ? q.getChoices().split(",") : null);
            dto.setCorrectAnswer(q.getCorrectAnswer());
            dto.setTopic(q.getTopic());
            return dto;
        }).collect(Collectors.toList());
    }

    public QuizStartResponseDto practiceWeakAreas(Long userId, String email, int numQuestions) {
        List<UserWeakness> weaknesses = userWeaknessService.getWeaknessesForUser(userId);
        List<String> weakTopics = weaknesses.stream()
                .map(UserWeakness::getTopic)
                .limit(3)
                .collect(Collectors.toList());

        List<Long> weakQuestionIds = quizQuestionRepo.findIdsByTopicIn(weakTopics);

        List<UserAnswer> oldIncorrectAnswers = userAnswerRepo.findByIsCorrectFalseAndQuizSession_UserIdAndQuestionIdIn(userId, weakQuestionIds);

        List<QuizQuestionDto> oldIncorrectQuestions = oldIncorrectAnswers.stream().map(ua -> {
            QuizQuestion question = quizQuestionRepo.findById(ua.getQuestionId()).orElse(null);
            if (question == null) return null;
            QuizQuestionDto dto = new QuizQuestionDto();
            dto.setId(question.getId());
            dto.setQuestionText(question.getQuestionText());
            dto.setChoices(question.getChoices().split(","));
            dto.setCorrectAnswer(question.getCorrectAnswer());
            dto.setTopic(question.getTopic());
            return dto;
        }).filter(Objects::nonNull).collect(Collectors.toList());

        List<QuizQuestionDto> aiQuestions = generateQuestionsFromGemini(weakTopics, numQuestions);

        List<QuizQuestionDto> allQuestions = new ArrayList<>();
        allQuestions.addAll(oldIncorrectQuestions);
        allQuestions.addAll(aiQuestions);

        Collections.shuffle(allQuestions);

        QuizSession quizSession = new QuizSession();
        quizSession.setUserId(userId);
        quizSession.setUsername(email);
        quizSession.setStartedAt(LocalDateTime.now());
        quizSession.setTopics(String.join(",", weakTopics));
        quizSessionRepo.save(quizSession);

        List<QuizQuestion> questionEntities = new ArrayList<>();
        for (QuizQuestionDto dto : allQuestions) {
            QuizQuestion question = new QuizQuestion();
            question.setQuestionText(dto.getQuestionText());
            question.setChoices(String.join(",", dto.getChoices()));
            question.setCorrectAnswer(dto.getCorrectAnswer());
            question.setTopic(dto.getTopic());
            question.setQuizSession(quizSession);
            questionEntities.add(question);
        }
        quizQuestionRepo.saveAll(questionEntities);

        List<QuizQuestionDto> responseQuestions = questionEntities.stream().map(q -> {
            QuizQuestionDto dto = new QuizQuestionDto();
            dto.setId(q.getId());
            dto.setQuestionText(q.getQuestionText());
            dto.setChoices(q.getChoices().split(",,,"));
            dto.setCorrectAnswer(q.getCorrectAnswer());
            dto.setTopic(q.getTopic());
            return dto;
        }).collect(Collectors.toList());

        QuizStartResponseDto response = new QuizStartResponseDto();
        response.setSessionId(quizSession.getId());
        response.setQuestions(responseQuestions);

        return response;
    }
}