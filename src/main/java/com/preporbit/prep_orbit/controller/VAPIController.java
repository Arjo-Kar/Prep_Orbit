package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.InterviewRequestDto;
import com.preporbit.prep_orbit.dto.InterviewResponseDto;
import com.preporbit.prep_orbit.service.InterviewService;
import com.preporbit.prep_orbit.service.LiveInterviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vapi")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "https://api.vapi.ai", "https://dashboard.vapi.ai", "https://1a066ab80207.ngrok-free.app"})
public class VAPIController {

    private static final Logger logger = LoggerFactory.getLogger(VAPIController.class);

    @Autowired
    private InterviewService interviewService;

    @Autowired
    private LiveInterviewService liveInterviewService;

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleVAPIWebhook(@RequestBody Map<String, Object> payload) {
        try {
            logger.info("VAPI Webhook received: {}", payload);

            String messageType = (String) payload.get("message");

            if ("function-call".equals(messageType)) {
                return handleFunctionCall(payload);
            }

            return ResponseEntity.ok(Map.of("status", "success"));

        } catch (Exception e) {
            logger.error("Error handling VAPI webhook", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/interview/generate")
    public ResponseEntity<Map<String, Object>> generateInterviewFromVAPI(@RequestBody Map<String, Object> vapiData) {
        try {
            logger.info("🎤 VAPI Interview Generation Request: {}", vapiData);

            // Extract data from VAPI request
            String role = (String) vapiData.get("role");
            String type = (String) vapiData.get("type");
            String level = (String) vapiData.get("level");
            String techstackString = (String) vapiData.get("techstack");
            Object amountObj = vapiData.get("amount");
            Object userIdObj = vapiData.get("userId");

            // Validate required fields
            if (role == null || role.trim().isEmpty()) {
                throw new RuntimeException("Role is required");
            }

            // Parse amount
            int amount = 5;
            if (amountObj != null) {
                try {
                    if (amountObj instanceof String) {
                        amount = Integer.parseInt((String) amountObj);
                    } else if (amountObj instanceof Integer) {
                        amount = (Integer) amountObj;
                    }
                } catch (Exception e) {
                    logger.warn("Invalid amount: {}, using default: 5", amountObj);
                }
            }

            // Parse userId
            Long userId = 1L;
            if (userIdObj != null) {
                try {
                    if (userIdObj instanceof String) {
                        userId = Long.parseLong((String) userIdObj);
                    } else if (userIdObj instanceof Integer) {
                        userId = ((Integer) userIdObj).longValue();
                    } else if (userIdObj instanceof Long) {
                        userId = (Long) userIdObj;
                    }
                } catch (Exception e) {
                    logger.warn("Invalid userId: {}, using default: 1", userIdObj);
                }
            }

            // Parse techstack
            String[] techstackArray = {};
            if (techstackString != null && !techstackString.trim().isEmpty()) {
                techstackArray = techstackString.split(",");
                for (int i = 0; i < techstackArray.length; i++) {
                    techstackArray[i] = techstackArray[i].trim();
                }
            }

            // Create interview request
            InterviewRequestDto request = new InterviewRequestDto();
            request.setRole(role);
            request.setType(type != null ? type : "technical");
            request.setLevel(level != null ? level : "mid");
            request.setTechstack(Arrays.asList(techstackArray));
            request.setAmount(amount);
            request.setUserId(userId);

            logger.info("🚀 Generating interview: Role={}, Type={}, Level={}, Amount={}, UserId={}",
                    request.getRole(), request.getType(), request.getLevel(),
                    request.getAmount(), request.getUserId());

            // Generate interview using your existing service
            InterviewResponseDto interview = interviewService.generateInterview(request);

            logger.info("✅ Interview generated successfully with ID: {}", interview.getId());

            // ✅ Return VAPI-compatible response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("Perfect! I've generated your %d-question %s interview for the %s position. Interview ID: %s",
                    amount, type, role, interview.getId()));
            response.put("interviewId", interview.getId());
            response.put("questionCount", amount);

            // ✅ VAPI expects these fields for workflow variables
            response.put("role", role);
            response.put("type", type);
            response.put("level", level);
            response.put("amount", String.valueOf(amount));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Failed to generate interview from VAPI", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Sorry, there was an error generating your interview. Please try again.");

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    private ResponseEntity<Map<String, Object>> handleFunctionCall(Map<String, Object> payload) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> functionCall = (Map<String, Object>) payload.get("functionCall");

            if (functionCall != null && "generateInterview".equals(functionCall.get("name"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> parameters = (Map<String, Object>) functionCall.get("parameters");

                return generateInterviewFromVAPI(parameters);
            }

            return ResponseEntity.ok(Map.of("status", "function not supported"));

        } catch (Exception e) {
            logger.error("Error handling function call", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("service", "vapi-webhook");
        response.put("timestamp", System.currentTimeMillis());
        response.put("user", "Arjo-Kar");
        return ResponseEntity.ok(response);
    }


}