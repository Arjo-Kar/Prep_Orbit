package com.preporbit.prep_orbit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.preporbit.prep_orbit.dto.*;
import com.preporbit.prep_orbit.model.*;
import com.preporbit.prep_orbit.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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

    public QuizStartResponseDto startQuiz(QuizStartRequestDto request, String username) {
        List<QuizQuestionDto> aiQuestions = generateQuestionsFromGemini(request.getTopics(), request.getNumQuestions());

        QuizSession session = new QuizSession();
        session.setUsername(username);
        session.setTopics(String.join(",", request.getTopics()));
        session.setStartedAt(LocalDateTime.now());
        quizSessionRepo.save(session);

        // Assign topic if missing from Gemini output
        List<QuizQuestion> entities = new ArrayList<>();
        for (int i = 0; i < aiQuestions.size(); i++) {
            QuizQuestionDto q = aiQuestions.get(i);
            QuizQuestion entity = new QuizQuestion();
            entity.setQuestionText(q.getQuestionText());
            entity.setChoices(q.getChoices() != null ? String.join(",", q.getChoices()) : null);
            entity.setCorrectAnswer(q.getCorrectAnswer());

            // Assign topic from Gemini output or fallback to provided topics (round-robin)
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

    // Generates questions using Gemini AI (customize prompt for technical MCQ)
    private List<QuizQuestionDto> generateQuestionsFromGemini(List<String> topics, int numQuestions) {
        String prompt = "Generate " + numQuestions + " technical MCQ questions on these topics: " +
                String.join(", ", topics) +
                ". Each question should have 4 options (A, B, C, D), specify the correct answer as a letter, and include a 'topic' field using one of the provided topics for each question, in JSON format.";

        String geminiResponse = geminiService.askGemini(prompt);

        // Strip markdown code block if present
        if (geminiResponse != null && geminiResponse.startsWith("```")) {
            int start = geminiResponse.indexOf("\n") + 1;
            int end = geminiResponse.lastIndexOf("```");
            if (start > 0 && end > start) {
                geminiResponse = geminiResponse.substring(start, end).trim();
            }
        }

        if (geminiResponse == null || geminiResponse.isEmpty()) {
            return new ArrayList<>();
        }

        ObjectMapper mapper = new ObjectMapper();
        try {
            return mapper.readValue(geminiResponse, new com.fasterxml.jackson.core.type.TypeReference<List<QuizQuestionDto>>() {});
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini response: " + e.getMessage());
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

        // Get the currently authenticated username
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String loggedInUsername = authentication.getName();

        // Check ownership
        if (!session.getUsername().equals(loggedInUsername)) {
            throw new AccessDeniedException("You do not have access to this quiz session.");
        }

        List<FeedbackDto> feedbackList = new ArrayList<>();
        int correct = 0;
        List<UserAnswer> persistedAnswers = new ArrayList<>();

        // Gather user answers and topics for session-level analysis
        List<String> userAnswers = new ArrayList<>();
        List<String> topics = new ArrayList<>();

        for (UserAnswerDto dto : request.getAnswers()) {
            QuizQuestion question = quizQuestionRepo.findById(dto.getQuestionId())
                    .orElseThrow(() -> new IllegalArgumentException("Question ID not found: " + dto.getQuestionId()));
            boolean isCorrect = dto.getUserAnswer().equalsIgnoreCase(question.getCorrectAnswer());
            String feedbackMsg = isCorrect ? "Correct" : "Incorrect; Correct: " + question.getCorrectAnswer();

            if (isCorrect) correct++;

            // Generate a hint for each question using Gemini
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
            fdto.setHint(hint); // Set the hint
            feedbackList.add(fdto);

            userAnswers.add(dto.getUserAnswer());
            topics.add(question.getTopic());
        }
        userAnswerRepo.saveAll(persistedAnswers);

        // Session-level feedback: strengths, weaknesses, suggestions
        String sessionPrompt = "Topics: " + String.join(", ", topics) + "\n"
                + "User Answers: " + String.join(" | ", userAnswers) + "\n"
                + "Based on these answers and topics, list the user's key strengths, weaknesses, and suggestions for improvement as JSON arrays. " +
                "The topic with the highest incorrect and skipped questions should be marked as weakness too. Also remember the strong zones in a session should be the one with highest correct. " +
                "In suggestions tell me to overcome the weakness and relevant topics with the weak zones. Keep these all as concise as possible." +
                "Example:\n"
                + "{ \"strengths\": [\"...\"], \"weaknesses\": [\"...\"], \"suggestions\": [\"...\"] }";
        String sessionFeedback = "";
        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        try {
            sessionFeedback = geminiService.askGemini(sessionPrompt);
            String cleanedJson = stripMarkdownCodeBlock(sessionFeedback); // <-- Use utility here
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(cleanedJson);
            strengths = mapper.convertValue(node.get("strengths"), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
            weaknesses = mapper.convertValue(node.get("weaknesses"), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
            suggestions = mapper.convertValue(node.get("suggestions"), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
        } catch (Exception e) {
            System.err.println("Session feedback parse error: " + e.getMessage());
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

    // Retrieve questions by sessionId
    public List<QuizQuestionDto> getQuizQuestions(Long sessionId) {
        List<QuizQuestion> questions = quizQuestionRepo.findByQuizSessionId(sessionId);
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
}