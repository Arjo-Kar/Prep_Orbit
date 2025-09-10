package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.AnswerSubmissionDto;
import com.preporbit.prep_orbit.dto.LiveFeedbackDto;
import com.preporbit.prep_orbit.model.InterviewAnswer;
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
@RequestMapping("/api/interview/answers")
public class InterviewAnswerController {

    @Autowired
    private LiveInterviewService liveInterviewService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/live-interview/{liveInterviewId}")
    public List<InterviewAnswer> getAnswersByLiveInterview(@PathVariable Long liveInterviewId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);
        return liveInterviewService.getAnswersForLiveInterviewForUser(liveInterviewId, userId);
    }

    @PostMapping
    public InterviewAnswer submitAnswer(@RequestBody AnswerSubmissionDto dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);
        return liveInterviewService.submitAnswerForUser(dto, userId);
    }

    @GetMapping("/{answerId}/feedback")
    public LiveFeedbackDto getFeedbackForAnswer(@PathVariable Long answerId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);
        return liveInterviewService.generateFeedbackForUser(answerId, userId);
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