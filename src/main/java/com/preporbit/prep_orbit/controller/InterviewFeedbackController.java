package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.InterviewFeedbackDto;
import com.preporbit.prep_orbit.exception.InterviewAccessException;
import com.preporbit.prep_orbit.model.Interview;
import com.preporbit.prep_orbit.model.InterviewFeedback;
import com.preporbit.prep_orbit.repository.InterviewRepository;
import com.preporbit.prep_orbit.service.InterviewFeedbackService;
import com.preporbit.prep_orbit.service.InterviewService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * InterviewFeedbackController
 * Responsibilities:
 *  - Secure, idempotent feedback generation (returns existing if already present)
 *  - Ownership / authorization enforcement
 *  - Retrieval endpoints
 *
 * Dependencies:
 *  - GlobalExceptionHandler (recommended) for consistent JSON error formatting
 *  - Custom exceptions (InterviewAccessException, FeedbackThrottleException) for clarity
 */
@RestController
@RequestMapping("/api/interviews")
public class InterviewFeedbackController {

    private static final Logger logger = LoggerFactory.getLogger(InterviewFeedbackController.class);

    @Autowired private InterviewFeedbackService feedbackService;
    @Autowired private InterviewRepository interviewRepository;
    @Autowired private InterviewService interviewService;

    /* ====================== AUTH / SECURITY ====================== */

    private String getAuthenticatedUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return auth.getName();
        }
        throw new InterviewAccessException("User not authenticated");
    }

    /* ====================== FEEDBACK GENERATION ====================== */

    /**
     * Idempotent feedback generation endpoint.
     * If feedback already exists for (interviewId, user), returns existing record.
     */
    @PostMapping("/{interviewId}/feedback")
    public ResponseEntity<Map<String,Object>> generateFeedback(@PathVariable Long interviewId,
                                                               @Valid @RequestBody InterviewFeedbackDto feedbackDto) {

        String username = getAuthenticatedUsername();
        Long userId = interviewService.getUserIdByUsername(username);

        logger.info("🔄 Feedback POST interviewId={} user={} transcriptCount={}",
                interviewId,
                username,
                feedbackDto.getTranscript() == null ? 0 : feedbackDto.getTranscript().size());

        // Ownership check
        Interview interview = interviewRepository.findByIdAndUserId(interviewId, userId)
                .orElseThrow(() -> new InterviewAccessException("Interview not found or access denied"));

        // Idempotency: return existing feedback if present
        if (feedbackService.feedbackExists(interviewId, userId)) {
            InterviewFeedback existing = feedbackService.getExisting(interviewId, userId).get();
            logger.info("♻️ Returning existing feedback id={} interviewId={}", existing.getId(), interviewId);

            Map<String,Object> body = new HashMap<>();
            body.put("success", true);
            body.put("message", "Feedback already exists");
            body.put("feedbackId", existing.getId());
            body.put("feedback", existing);
            body.put("interviewId", interviewId);
            body.put("hasFeedback", true);
            body.put("analysisComplete", true);
            body.put("timestamp", OffsetDateTime.now().toString());
            return ResponseEntity.ok(body);
        }

        // Force correct IDs (ignore client-passed values)
        feedbackDto.setInterviewId(interviewId);
        feedbackDto.setUserId(userId);

        InterviewFeedback saved = feedbackService.generateComprehensiveFeedback(feedbackDto);

        // Mark interview
        interview.setHasFeedback(true);
        interview.setUpdatedAt(LocalDateTime.now());
        interviewRepository.save(interview);

        Map<String,Object> body = new HashMap<>();
        body.put("success", true);
        body.put("message", "Comprehensive feedback generated");
        body.put("feedbackId", saved.getId());
        body.put("feedback", saved);
        body.put("interviewId", interviewId);
        body.put("hasFeedback", true);
        body.put("analysisComplete", true);
        body.put("timestamp", OffsetDateTime.now().toString());
        return ResponseEntity.ok(body);
    }

    /* ====================== RETRIEVAL ====================== */

    /**
     * Get feedback for an interview (first record).
     */
    @GetMapping("/{interviewId}/feedback")
    public ResponseEntity<Map<String,Object>> getInterviewFeedback(@PathVariable Long interviewId) {
        String username = getAuthenticatedUsername();
        Long userId = interviewService.getUserIdByUsername(username);

        // Ownership check (prevents enumeration)
        interviewRepository.findByIdAndUserId(interviewId, userId)
                .orElseThrow(() -> new InterviewAccessException("Interview not found or access denied"));

        List<InterviewFeedback> list = feedbackService.getFeedbackByInterviewId(interviewId);
        if (list.isEmpty()) {
            Map<String,Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "No feedback found for this interview");
            err.put("timestamp", OffsetDateTime.now().toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        Map<String,Object> body = new HashMap<>();
        body.put("success", true);
        body.put("feedback", list.get(0));
        body.put("timestamp", OffsetDateTime.now().toString());
        return ResponseEntity.ok(body);
    }

    /**
     * Get feedback for an interview + explicit user (not strictly needed if using authenticated context).
     * Kept for completeness / possible admin extension.
     */
    @GetMapping("/{interviewId}/feedback/user/{userId}")
    public ResponseEntity<Map<String,Object>> getFeedbackForUser(@PathVariable Long interviewId,
                                                                 @PathVariable Long userId) {
        String username = getAuthenticatedUsername();
        Long authUserId = interviewService.getUserIdByUsername(username);
        if (!authUserId.equals(userId)) {
            throw new InterviewAccessException("Access denied: You can only view your own feedback");
        }

        InterviewFeedback feedback = feedbackService.getFeedbackByInterviewAndUser(interviewId, userId);

        Map<String,Object> body = new HashMap<>();
        body.put("success", true);
        body.put("feedback", feedback);
        body.put("timestamp", OffsetDateTime.now().toString());
        return ResponseEntity.ok(body);
    }

    /**
     * All feedback entries for a user (sorted newest first).
     */
    @GetMapping("/feedback/user/{userId}")
    public ResponseEntity<Map<String,Object>> getUserFeedbacks(@PathVariable Long userId) {
        String username = getAuthenticatedUsername();
        Long authUserId = interviewService.getUserIdByUsername(username);
        if (!authUserId.equals(userId)) {
            throw new InterviewAccessException("Access denied: You can only view your own feedback list");
        }

        List<InterviewFeedback> feedbacks = feedbackService.getFeedbackByUserId(userId);
        Map<String,Object> body = new HashMap<>();
        body.put("success", true);
        body.put("feedbacks", feedbacks);
        body.put("count", feedbacks.size());
        body.put("timestamp", OffsetDateTime.now().toString());
        return ResponseEntity.ok(body);
    }

    /**
     * Average overall score for user.
     */
    @GetMapping("/feedback/user/{userId}/average-score")
    public ResponseEntity<Map<String,Object>> getAverageScore(@PathVariable Long userId) {
        String username = getAuthenticatedUsername();
        Long authUserId = interviewService.getUserIdByUsername(username);
        if (!authUserId.equals(userId)) {
            throw new InterviewAccessException("Access denied: You can only view your own averages");
        }
        Double avg = feedbackService.getAverageScoreByUserId(userId);
        Map<String,Object> body = new HashMap<>();
        body.put("success", true);
        body.put("averageScore", avg != null ? avg : 0.0);
        body.put("timestamp", OffsetDateTime.now().toString());
        return ResponseEntity.ok(body);
    }

    /**
     * Aggregated feedback stats (averages of component scores).
     */
    @GetMapping("/feedback/user/{userId}/stats")
    public ResponseEntity<Map<String,Object>> getFeedbackStats(@PathVariable Long userId) {
        String username = getAuthenticatedUsername();
        Long authUserId = interviewService.getUserIdByUsername(username);
        if (!authUserId.equals(userId)) {
            throw new InterviewAccessException("Access denied: You can only view your own stats");
        }
        Map<String,Object> stats = feedbackService.getFeedbackStats(userId);
        Map<String,Object> body = new HashMap<>();
        body.put("success", true);
        body.put("stats", stats);
        body.put("timestamp", OffsetDateTime.now().toString());
        return ResponseEntity.ok(body);
    }
}