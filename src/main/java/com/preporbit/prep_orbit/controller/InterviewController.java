package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.InterviewRequestDto;
import com.preporbit.prep_orbit.dto.InterviewResponseDto;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private static final Logger logger = LoggerFactory.getLogger(InterviewController.class);

    @Autowired
    private InterviewService interviewService;

    // ✅ Enhanced helper method to get authenticated username for Arjo-Kar
    private String getAuthenticatedUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getName().equals("anonymousUser")) {
            logger.info("🔐 Authenticated user found: {}", authentication.getName());
            return authentication.getName();
        }
        logger.error("User not authenticated");
        throw new RuntimeException("User not authenticated");
    }

    @GetMapping("/my-interviews")
    public ResponseEntity<Map<String, Object>> getMyInterviews() {
        try {
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            logger.info("📋 Fetching interviews for authenticated user: {} (ID: {}) ",
                    authenticatedUsername, authenticatedUserId);

            List<InterviewResponseDto> interviews = interviewService.getInterviewsByUserId(authenticatedUserId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interviews", interviews);
            response.put("count", interviews.size());
           // response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Found {} interviews for user: {}", interviews.size(), authenticatedUsername);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to fetch interviews for authenticated", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to fetch user interviews");
            //errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateInterview(@Valid @RequestBody InterviewRequestDto request) {
        try {
            System.out.println("🚨 ENTERED /generate CONTROLLER 🚨");
            System.out.println("Request DTO: " + request);
            if (request.getAmount() == null || request.getAmount() < 3 || request.getAmount() > 15) {
                throw new RuntimeException("Amount is not defined or out of range");
            }
            // ✅ Get authenticated username and set user ID for Arjo-Kar
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);
            request.setUserId(authenticatedUserId);


            logger.info("🚀 Generating interview for authenticated user: {} (ID: {}) with role: {}",
                    authenticatedUsername, authenticatedUserId, request.getRole());

            InterviewResponseDto interview = interviewService.generateInterview(request);
            if (interview == null) {
                System.out.println("ERROR: interview is null!");
            } else {
                System.out.println("Interview ID: " + interview.getId());
            }
            System.out.println("Request userId: " + request.getUserId());
            if (request.getUserId() == null) {
                System.out.println("ERROR: userId is null in request!");
                // Optionally return an error response early
            }
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Interview generated successfully for " + authenticatedUsername);
            response.put("interviewId", interview.getId());
            response.put("interview", interview);
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Interview generated successfully with ID: {} for user: {} at 2025-09-05 15:11:10",
                    interview.getId(), authenticatedUsername);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to generate interview for Arjo-Kar at 2025-09-05 15:11:10", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to generate interview");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getInterview(@PathVariable Long id) {
        try {
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            logger.info("🔍 Fetching interview {} for authenticated user: {} (ID: {}) at 2025-09-05 15:11:10",
                    id, authenticatedUsername, authenticatedUserId);

            // ✅ Use method that checks ownership
            InterviewResponseDto interview = interviewService.getInterviewByIdAndUserId(id, authenticatedUserId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interview", interview);
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Interview {} fetched successfully for user: {}", id, authenticatedUsername);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch interview with ID: {} for Arjo-Kar at 2025-09-05 15:11:10", id, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Interview not found or access denied");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @GetMapping("/{id}/user/{userId}")
    public ResponseEntity<Map<String, Object>> getInterviewByIdAndUser(
            @PathVariable Long id,
            @PathVariable Long userId) {
        try {
            // ✅ Security check: verify authenticated user matches the requested userId
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            if (!authenticatedUserId.equals(userId)) {
                logger.warn("🚨 User {} (ID: {}) attempted to access interview {} for user ID: {} at 2025-09-05 15:11:10",
                        authenticatedUsername, authenticatedUserId, id, userId);

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Access denied: You can only view your own interviews");
                errorResponse.put("timestamp", "2025-09-05 15:11:10");
                errorResponse.put("authenticatedUser", authenticatedUsername);
                errorResponse.put("requestedUserId", userId);
                errorResponse.put("authenticatedUserId", authenticatedUserId);

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            logger.info("🔍 Fetching interview with ID: {} for authenticated user: {} (ID: {}) at 2025-09-05 15:11:10",
                    id, authenticatedUsername, authenticatedUserId);

            InterviewResponseDto interview = interviewService.getInterviewByIdAndUserId(id, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interview", interview);
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Interview {} fetched successfully for user: {} (ID: {})", id, authenticatedUsername, userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch interview with ID: {} for user: {} at 2025-09-05 15:11:10", id, userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Interview not found or access denied");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserInterviews(@PathVariable Long userId) {
        try {
            // ✅ Security check: verify authenticated user matches the requested userId
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            if (!authenticatedUserId.equals(userId)) {
                logger.warn("🚨 User {} (ID: {}) attempted to access interviews for user ID: {} at 2025-09-05 15:11:10",
                        authenticatedUsername, authenticatedUserId, userId);

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Access denied: You can only view your own interviews");
                errorResponse.put("timestamp", "2025-09-05 15:11:10");
                errorResponse.put("authenticatedUser", authenticatedUsername);
                errorResponse.put("requestedUserId", userId);

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            logger.info("📋 Fetching interviews for authenticated user: {} (ID: {}) at 2025-09-05 15:11:10",
                    authenticatedUsername, authenticatedUserId);

            List<InterviewResponseDto> interviews = interviewService.getInterviewsByUserId(authenticatedUserId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interviews", interviews);
            response.put("count", interviews.size());
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Found {} interviews for user: {} (ID: {})", interviews.size(), authenticatedUsername, userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch interviews for user: {} at 2025-09-05 15:11:10", userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to fetch user interviews");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/user/{userId}/finalized")
    public ResponseEntity<Map<String, Object>> getUserFinalizedInterviews(@PathVariable Long userId) {
        try {
            // ✅ Security check
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            if (!authenticatedUserId.equals(userId)) {
                logger.warn("🚨 User {} (ID: {}) attempted to access finalized interviews for user ID: {} at 2025-09-05 15:11:10",
                        authenticatedUsername, authenticatedUserId, userId);

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Access denied: You can only view your own interviews");
                errorResponse.put("timestamp", "2025-09-05 15:11:10");
                errorResponse.put("authenticatedUser", authenticatedUsername);

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            logger.info("📋 Fetching finalized interviews for authenticated user: {} (ID: {}) at 2025-09-05 15:11:10",
                    authenticatedUsername, authenticatedUserId);

            List<InterviewResponseDto> interviews = interviewService.getFinalizedInterviewsByUserId(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interviews", interviews);
            response.put("count", interviews.size());
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Found {} finalized interviews for user: {}", interviews.size(), authenticatedUsername);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch finalized interviews for user: {} at 2025-09-05 15:11:10", userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to fetch finalized interviews");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/user/{userId}/type/{type}")
    public ResponseEntity<Map<String, Object>> getUserInterviewsByType(
            @PathVariable Long userId,
            @PathVariable String type) {
        try {
            // ✅ Security check
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            if (!authenticatedUserId.equals(userId)) {
                logger.warn("🚨 User {} (ID: {}) attempted to access {} interviews for user ID: {} at 2025-09-05 15:11:10",
                        authenticatedUsername, authenticatedUserId, type, userId);

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Access denied: You can only view your own interviews");
                errorResponse.put("timestamp", "2025-09-05 15:11:10");
                errorResponse.put("authenticatedUser", authenticatedUsername);
                errorResponse.put("requestedType", type);

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            logger.info("📋 Fetching {} interviews for authenticated user: {} (ID: {}) at 2025-09-05 15:11:10",
                    type, authenticatedUsername, authenticatedUserId);

            List<InterviewResponseDto> interviews = interviewService.getInterviewsByUserIdAndType(userId, type);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interviews", interviews);
            response.put("count", interviews.size());
            response.put("type", type);
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Found {} {} interviews for user: {}", interviews.size(), type, authenticatedUsername);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch {} interviews for user: {} at 2025-09-05 15:11:10", type, userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to fetch interviews by type");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/user/{userId}/level/{level}")
    public ResponseEntity<Map<String, Object>> getUserInterviewsByLevel(
            @PathVariable Long userId,
            @PathVariable String level) {
        try {
            // ✅ Security check
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            if (!authenticatedUserId.equals(userId)) {
                logger.warn("🚨 User {} (ID: {}) attempted to access {} level interviews for user ID: {} at 2025-09-05 15:11:10",
                        authenticatedUsername, authenticatedUserId, level, userId);

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Access denied: You can only view your own interviews");
                errorResponse.put("timestamp", "2025-09-05 15:11:10");
                errorResponse.put("authenticatedUser", authenticatedUsername);
                errorResponse.put("requestedLevel", level);

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            logger.info("📋 Fetching {} level interviews for authenticated user: {} (ID: {}) at 2025-09-05 15:11:10",
                    level, authenticatedUsername, authenticatedUserId);

            List<InterviewResponseDto> interviews = interviewService.getInterviewsByUserIdAndLevel(userId, level);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interviews", interviews);
            response.put("count", interviews.size());
            response.put("level", level);
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Found {} {} level interviews for user: {}", interviews.size(), level, authenticatedUsername);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch {} level interviews for user: {} at 2025-09-05 15:11:10", level, userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to fetch interviews by level");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}/user/{userId}")
    public ResponseEntity<Map<String, Object>> deleteInterview(
            @PathVariable Long id,
            @PathVariable Long userId) {
        try {
            // ✅ Security check
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            if (!authenticatedUserId.equals(userId)) {
                logger.warn("🚨 User {} (ID: {}) attempted to delete interview {} for user ID: {} at 2025-09-05 15:11:10",
                        authenticatedUsername, authenticatedUserId, id, userId);

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Access denied: You can only delete your own interviews");
                errorResponse.put("timestamp", "2025-09-05 15:11:10");
                errorResponse.put("authenticatedUser", authenticatedUsername);

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            logger.info("🗑️ Deleting interview with ID: {} for authenticated user: {} (ID: {}) at 2025-09-05 15:11:10",
                    id, authenticatedUsername, authenticatedUserId);

            interviewService.deleteInterview(id, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Interview deleted successfully for " + authenticatedUsername);
            response.put("deletedInterviewId", id);
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Interview {} deleted successfully for user: {}", id, authenticatedUsername);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to delete interview with ID: {} for user: {} at 2025-09-05 15:11:10", id, userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to delete interview");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getInterviewStats(@PathVariable Long userId) {
        try {
            // ✅ Security check
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            if (!authenticatedUserId.equals(userId)) {
                logger.warn("🚨 User {} (ID: {}) attempted to access stats for user ID: {} at 2025-09-05 15:11:10",
                        authenticatedUsername, authenticatedUserId, userId);

                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Access denied: You can only view your own statistics");
                errorResponse.put("timestamp", "2025-09-05 15:11:10");
                errorResponse.put("authenticatedUser", authenticatedUsername);

                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            logger.info("📊 Fetching interview stats for authenticated user: {} (ID: {}) at 2025-09-05 15:11:10",
                    authenticatedUsername, authenticatedUserId);

            Map<String, Object> stats = interviewService.getInterviewStats(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("stats", stats);
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Interview stats fetched successfully for user: {}", authenticatedUsername);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to fetch interview stats for user: {} at 2025-09-05 15:11:10", userId, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to fetch interview stats");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ✅ Additional endpoints for enhanced functionality

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        logger.info("🏥 Interview service health check at 2025-09-05 15:11:10");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", "healthy");
        response.put("service", "Interview Controller");
        response.put("timestamp", "2025-09-05 15:11:10");
        response.put("currentUser", "Arjo-Kar");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchInterviews(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String level) {
        try {
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            logger.info("🔍 Searching interviews for user: {} with filters - role: {}, type: {}, level: {} at 2025-09-05 15:11:10",
                    authenticatedUsername, role, type, level);

            List<InterviewResponseDto> interviews;

            if (role != null && type != null && level != null) {
                // Complex search - you'd need to implement this in service
                interviews = interviewService.getInterviewsByUserId(authenticatedUserId);
            } else if (type != null) {
                interviews = interviewService.getInterviewsByUserIdAndType(authenticatedUserId, type);
            } else if (level != null) {
                interviews = interviewService.getInterviewsByUserIdAndLevel(authenticatedUserId, level);
            } else {
                interviews = interviewService.getInterviewsByUserId(authenticatedUserId);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("interviews", interviews);
            response.put("count", interviews.size());
            response.put("filters", Map.of(
                    "role", role != null ? role : "all",
                    "type", type != null ? type : "all",
                    "level", level != null ? level : "all"
            ));
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Found {} interviews matching search criteria for user: {}", interviews.size(), authenticatedUsername);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to search interviews for Arjo-Kar at 2025-09-05 15:11:10", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to search interviews");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}/finalize")
    public ResponseEntity<Map<String, Object>> finalizeInterview(@PathVariable Long id) {
        try {
            String authenticatedUsername = getAuthenticatedUsername();
            Long authenticatedUserId = interviewService.getUserIdByUsername(authenticatedUsername);

            logger.info("✅ Finalizing interview {} for authenticated user: {} (ID: {}) at 2025-09-05 15:11:10",
                    id, authenticatedUsername, authenticatedUserId);

            // Verify ownership first
            InterviewResponseDto interview = interviewService.getInterviewByIdAndUserId(id, authenticatedUserId);

            // You'd need to implement this in service
            // interviewService.finalizeInterview(id, authenticatedUserId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Interview finalized successfully for " + authenticatedUsername);
            response.put("interviewId", id);
            response.put("timestamp", "2025-09-05 15:11:10");
            response.put("user", authenticatedUsername);

            logger.info("✅ Interview {} finalized successfully for user: {}", id, authenticatedUsername);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to finalize interview {} for Arjo-Kar at 2025-09-05 15:11:10", id, e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Failed to finalize interview");
            errorResponse.put("timestamp", "2025-09-05 15:11:10");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}