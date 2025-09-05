package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.InterviewFeedbackDto;
import com.preporbit.prep_orbit.model.Interview;
import com.preporbit.prep_orbit.model.InterviewFeedback;
import com.preporbit.prep_orbit.repository.InterviewRepository;
import com.preporbit.prep_orbit.service.InterviewFeedbackService;
import com.preporbit.prep_orbit.service.InterviewService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
public class InterviewFeedbackController {

    private static final Logger logger = LoggerFactory.getLogger(InterviewFeedbackController.class);

    @Autowired
    private InterviewFeedbackService feedbackService;

    // ✅ REMOVE this - Interview should not be autowired as a bean
    // @Autowired
    // private Interview interview;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private InterviewService interviewService;

    private String getAuthenticatedUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getName().equals("anonymousUser")) {
            logger.info("🔐 Authenticated user found for feedback: {} at 2025-09-05 17:14:27", authentication.getName());
            return authentication.getName();
        }
        logger.error("❌ User not authenticated for feedback access at 2025-09-05 17:14:27 - Expected: Arjo-Kar");
        throw new RuntimeException("User not authenticated for feedback access - please login as Arjo-Kar");
    }

    @PostMapping("/{interviewId}/feedback")
    public ResponseEntity<Map<String, Object>> generateFeedback(
            @PathVariable Long interviewId,
            @Valid @RequestBody InterviewFeedbackDto feedbackDto) {
        try {
            String authenticatedUsername = getAuthenticatedUsername();

            logger.info("🔄 Generating comprehensive feedback for interview: {} by user: {} at 2025-09-05 17:14:27",
                    interviewId, authenticatedUsername);

            // Enhanced logging of received data
            logger.info("📊 Feedback data received - Transcript messages: {}, Duration: {}, Has responses: {}",
                    feedbackDto.getTranscript() != null ? feedbackDto.getTranscript().size() : 0,
                    feedbackDto.getDuration(),
                    feedbackDto.getResponses() != null);

            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            // Verify interview exists and belongs to authenticated user
            Interview interview = interviewRepository.findByIdAndUserId(interviewId, authenticatedUserId)
                    .orElseThrow(() -> {
                        logger.error("❌ Interview {} not found for user {} at 2025-09-05 17:14:27",
                                interviewId, authenticatedUsername);
                        return new RuntimeException("Interview not found or access denied");
                    });

            logger.info("✅ Interview verified: {} (Role: {}) for user: {} at 2025-09-05 17:14:27",
                    interviewId, interview.getRole(), authenticatedUsername);

            // Set correct IDs from authentication
            feedbackDto.setInterviewId(interviewId);
            feedbackDto.setUserId(authenticatedUserId);

            // ✅ Generate comprehensive feedback
            InterviewFeedback feedback = feedbackService.generateComprehensiveFeedback(feedbackDto);

            // Update interview to mark as having feedback
            interview.setHasFeedback(true);
            interview.setUpdatedAt(LocalDateTime.now());
            Interview updatedInterview = interviewRepository.save(interview);

            logger.info("✅ Interview updated with feedback flag: {} at 2025-09-05 17:14:27",
                    updatedInterview.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Comprehensive feedback generated successfully for " + authenticatedUsername);
            response.put("feedbackId", feedback.getId());
            response.put("feedback", feedback);
            response.put("interviewId", interviewId);
            response.put("hasFeedback", true);
            response.put("analysisComplete", true);
            response.put("timestamp", "2025-09-05 17:14:27");
            response.put("user", authenticatedUsername);

            logger.info("✅ Comprehensive feedback saved successfully with ID: {} for user: {} at 2025-09-05 17:14:27",
                    feedback.getId(), authenticatedUsername);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to generate comprehensive feedback for interview: {} for Arjo-Kar at 2025-09-05 17:14:27",
                    interviewId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to generate comprehensive feedback: " + e.getMessage());
            errorResponse.put("interviewId", interviewId);
            errorResponse.put("timestamp", "2025-09-05 17:14:27");
            errorResponse.put("user", "Arjo-Kar");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ✅ Rest of the methods remain the same, just update timestamps
    @GetMapping("/{interviewId}/feedback/user/{userId}")
    public ResponseEntity<Map<String, Object>> getFeedback(
            @PathVariable Long interviewId,
            @PathVariable Long userId) {
        try {
            String authenticatedUsername = getAuthenticatedUsername();

            logger.info("🔍 Fetching feedback for interview: {} and user: {} by authenticated user: {} at 2025-09-05 17:14:27",
                    interviewId, userId, authenticatedUsername);

            InterviewFeedback feedback = feedbackService.getFeedbackByInterviewAndUser(interviewId, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("feedback", feedback);
            response.put("timestamp", "2025-09-05 17:14:27");
            response.put("user", authenticatedUsername);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch feedback for interview: {} and user: {} for Arjo-Kar at 2025-09-05 17:14:27",
                    interviewId, userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Feedback not found");
            errorResponse.put("timestamp", "2025-09-05 17:14:27");

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @GetMapping("/{interviewId}/feedback")
    public ResponseEntity<Map<String, Object>> getInterviewFeedback(@PathVariable Long interviewId) {
        try {
            String authenticatedUsername = getAuthenticatedUsername();

            logger.info("🔍 Fetching feedback for interview: {} by authenticated user: {} at 2025-09-05 17:14:27",
                    interviewId, authenticatedUsername);

            List<InterviewFeedback> feedbacks = feedbackService.getFeedbackByInterviewId(interviewId);

            if (feedbacks.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "No feedback found for this interview");
                errorResponse.put("timestamp", "2025-09-05 17:14:27");
                errorResponse.put("user", authenticatedUsername);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("feedback", feedbacks.get(0));
            response.put("timestamp", "2025-09-05 17:14:27");
            response.put("user", authenticatedUsername);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch feedback for interview: {} for Arjo-Kar at 2025-09-05 17:14:27", interviewId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Feedback not found");
            errorResponse.put("timestamp", "2025-09-05 17:14:27");

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    // ✅ Other methods with updated timestamps...
    @GetMapping("/feedback/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserFeedbacks(@PathVariable Long userId) {
        try {
            String authenticatedUsername = getAuthenticatedUsername();

            logger.info("📋 Fetching all feedbacks for user: {} by authenticated user: {} at 2025-09-05 17:14:27",
                    userId, authenticatedUsername);

            List<InterviewFeedback> feedbacks = feedbackService.getFeedbackByUserId(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("feedbacks", feedbacks);
            response.put("count", feedbacks.size());
            response.put("timestamp", "2025-09-05 17:14:27");
            response.put("user", authenticatedUsername);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch feedbacks for user: {} for Arjo-Kar at 2025-09-05 17:14:27", userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to fetch feedbacks");
            errorResponse.put("timestamp", "2025-09-05 17:14:27");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/feedback/user/{userId}/average-score")
    public ResponseEntity<Map<String, Object>> getAverageScore(@PathVariable Long userId) {
        try {
            String authenticatedUsername = getAuthenticatedUsername();

            logger.info("📊 Fetching average score for user: {} by authenticated user: {} at 2025-09-05 17:14:27",
                    userId, authenticatedUsername);

            Double averageScore = feedbackService.getAverageScoreByUserId(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("averageScore", averageScore != null ? averageScore : 0.0);
            response.put("timestamp", "2025-09-05 17:14:27");
            response.put("user", authenticatedUsername);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch average score for user: {} for Arjo-Kar at 2025-09-05 17:14:27", userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to fetch average score");
            errorResponse.put("timestamp", "2025-09-05 17:14:27");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/feedback/user/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getFeedbackStats(@PathVariable Long userId) {
        try {
            String authenticatedUsername = getAuthenticatedUsername();

            logger.info("📊 Fetching feedback stats for user: {} by authenticated user: {} at 2025-09-05 17:14:27",
                    userId, authenticatedUsername);

            Map<String, Object> stats = feedbackService.getFeedbackStats(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("stats", stats);
            response.put("timestamp", "2025-09-05 17:14:27");
            response.put("user", authenticatedUsername);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch feedback stats for user: {} for Arjo-Kar at 2025-09-05 17:14:27", userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to fetch feedback stats");
            errorResponse.put("timestamp", "2025-09-05 17:14:27");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}