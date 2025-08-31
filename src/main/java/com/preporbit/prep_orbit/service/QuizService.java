package com.preporbit.prep_orbit.service;

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


    public QuizResultDto submitQuiz(Long sessionId, QuizSubmitRequestDto request) throws AccessDeniedException {
        QuizSession session = quizSessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session ID not found: " + sessionId));

        // Get the currently authenticated username
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String loggedInUsername = authentication.getName();
        System.out.println("Session owner: " + session.getUsername());
        System.out.println("Logged in user: " + loggedInUsername);

        // Check ownership
        if (!session.getUsername().equals(loggedInUsername)) {
            throw new AccessDeniedException("You do not have access to this quiz session.");
        }

        List<FeedbackDto> feedbackList = new ArrayList<>();
        int correct = 0;
        List<UserAnswer> persistedAnswers = new ArrayList<>();

        for (UserAnswerDto dto : request.getAnswers()) {
            QuizQuestion question = quizQuestionRepo.findById(dto.getQuestionId())
                    .orElseThrow(() -> new IllegalArgumentException("Question ID not found: " + dto.getQuestionId()));
            boolean isCorrect = dto.getUserAnswer().equalsIgnoreCase(question.getCorrectAnswer());
            String feedbackMsg = isCorrect ? "Correct" : "Incorrect; Correct: " + question.getCorrectAnswer();

            if (isCorrect) correct++;

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
            feedbackList.add(fdto);
        }
        userAnswerRepo.saveAll(persistedAnswers);

        double accuracy = 100.0 * correct / request.getAnswers().size();
        session.setScore(correct);
        session.setAccuracy(accuracy);
        quizSessionRepo.save(session);

        QuizResultDto result = new QuizResultDto();
        result.setScore(correct);
        result.setAccuracy(accuracy);
        result.setFeedback(feedbackList);

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