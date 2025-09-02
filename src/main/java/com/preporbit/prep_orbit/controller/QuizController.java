package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.*;
import com.preporbit.prep_orbit.model.UserWeakness;
import com.preporbit.prep_orbit.repository.UserRepository;
import com.preporbit.prep_orbit.repository.UserWeaknessRepository;
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
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserWeaknessRepository userWeaknessRepository;


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
    @GetMapping("/user/{userId}/weaknesses")
    public List<UserWeakness> getUserWeaknesses(@PathVariable Long userId) {
        return userWeaknessRepository.findByUserIdOrderByIncorrectCountDesc(userId);
    }
    @PostMapping("/weak-areas")
    public QuizStartResponseDto practiceWeakAreas(@RequestBody PractiseRequestDto request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Authenticated as: " + authentication.getName());
        String email = authentication.getName();
        Long userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
        return quizService.practiceWeakAreas(userId, request.getNumQuestions());
    }
}

/*
const url = 'https://judge0-ce.p.rapidapi.com/submissions/batch?base64_encoded=true';
const options = {
	method: 'POST',
	headers: {
		'x-rapidapi-key': 'f5e382a05bmsh595fddadf76002dp1d7b3ajsnd54ed1519f7d',
		'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
		'Content-Type': 'application/json'
	},
	body: {
		submissions: [
			{
				language_id: 46,
				source_code: 'ZWNobyBoZWxsbyBmcm9tIEJhc2gK'
			},
			{
				language_id: 71,
				source_code: 'cHJpbnQoImhlbGxvIGZyb20gUHl0aG9uIikK'
			},
			{
				language_id: 72,
				source_code: 'cHV0cygiaGVsbG8gZnJvbSBSdWJ5IikK'
			}
		]
	}
};

try {
	const response = await fetch(url, options);
	const result = await response.text();
	console.log(result);
} catch (error) {
	console.error(error);
}

const url = 'https://judge0-ce.p.rapidapi.com/submissions/batch?tokens=dce7bbc5-a8c9-4159-a28f-ac264e48c371%2C1ed737ca-ee34-454d-a06f-bbc73836473e%2C9670af73-519f-4136-869c-340086d406db&base64_encoded=true&fields=*';
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': 'f5e382a05bmsh595fddadf76002dp1d7b3ajsnd54ed1519f7d',
		'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
	}
};

try {
	const response = await fetch(url, options);
	const result = await response.text();
	console.log(result);
} catch (error) {
	console.error(error);
}
 */