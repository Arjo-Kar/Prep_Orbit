package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.QuizQuestionDto;
import com.preporbit.prep_orbit.dto.QuizResultDto;
import com.preporbit.prep_orbit.dto.QuizStartRequestDto;
import com.preporbit.prep_orbit.dto.QuizStartResponseDto;
import com.preporbit.prep_orbit.dto.QuizSubmitRequestDto;
import com.preporbit.prep_orbit.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    @Autowired
    private QuizService quizService;

    // Start a quiz session and return sessionId and questions
    @PostMapping("/start")
    public QuizStartResponseDto startQuiz(@RequestBody QuizStartRequestDto request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        System.out.println("Authenticated as: " + username);
        return quizService.startQuiz(request, username);
    }

    // Get questions for a quiz session
    @GetMapping("/{sessionId}/questions")
    public List<QuizQuestionDto> getQuizQuestions(@PathVariable Long sessionId) {
        return quizService.getQuizQuestions(sessionId);
    }

    // Submit answers for a quiz session
    @PostMapping(value = "/{sessionId}/submit", produces = "application/json")
    public QuizResultDto submitQuiz(@PathVariable Long sessionId,
                                    @RequestBody QuizSubmitRequestDto request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Authenticated as: " + authentication.getName());
        return quizService.submitQuiz(sessionId, request);
    }
}