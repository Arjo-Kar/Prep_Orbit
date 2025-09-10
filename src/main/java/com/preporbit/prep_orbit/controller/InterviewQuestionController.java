package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.QuestionDto;
import com.preporbit.prep_orbit.dto.QuestionGenerationRequestDto;
import com.preporbit.prep_orbit.model.User;
import com.preporbit.prep_orbit.repository.UserRepository;
import com.preporbit.prep_orbit.service.LiveInterviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/interview/questions")
public class InterviewQuestionController {

    @Autowired
    private LiveInterviewService liveInterviewService;
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/live-interview/{liveInterviewId}")
    public List<QuestionDto> getQuestionsByLiveInterview(@PathVariable Long liveInterviewId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);
        return liveInterviewService.getQuestionsForLiveInterviewForUser(liveInterviewId, userId);
    }

    @PostMapping("/generate/{liveInterviewId}")
    public List<QuestionDto> generateQuestions(@PathVariable Long liveInterviewId,
                                               @RequestBody QuestionGenerationRequestDto dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);
        return liveInterviewService.generateQuestionsForUser(dto, liveInterviewId, userId);
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            return userOpt.get().getId();
        }
        throw new RuntimeException("User not found for email: " + email);
    }
}