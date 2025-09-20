package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.CodingChallengeDto;
import com.preporbit.prep_orbit.dto.GenerateRequest;
import com.preporbit.prep_orbit.model.CodingChallenge;
import com.preporbit.prep_orbit.service.AICodingChallengeGeneratorService;
import com.preporbit.prep_orbit.service.DailyChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.preporbit.prep_orbit.repository.CodingChallengeRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-coding")
public class AICodingChallengeController {

    private final AICodingChallengeGeneratorService aiGenerator;
    private final CodingChallengeRepository codingChallengeRepository;
    private final DailyChallengeService dailyChallengeService;

    public AICodingChallengeController(
            AICodingChallengeGeneratorService aiGenerator,
            CodingChallengeRepository codingChallengeRepository,
            DailyChallengeService dailyChallengeService) {
        this.aiGenerator = aiGenerator;
        this.codingChallengeRepository = codingChallengeRepository;
        this.dailyChallengeService = dailyChallengeService;
    }

    @PostMapping("/generate")
    public CodingChallengeDto generateChallenge(@RequestBody GenerateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Coding generate hit");
        CodingChallengeDto challenge = aiGenerator.generateChallenge(request.getTopics(), request.getDifficulty());
        CodingChallenge model = codingChallengeRepository.save(challenge.toModel());
        challenge.setId(model.getId());
        System.out.println("Generated challenge id: " + challenge.getId());
        return challenge;
    }

    // NEW ENDPOINT: Get today's daily challenge
    @GetMapping("/daily-challenge")
    public Map<String, Object> getDailyChallenge() {
        Map<String, Object> response = new HashMap<>();
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();

            if (userEmail == null) {
                response.put("success", false);
                response.put("challenge", null);
                response.put("message", "User not authenticated");
                return response;
            }

            CodingChallengeDto challenge = dailyChallengeService.getTodaysDailyChallenge(userEmail);

            if (challenge == null) {
                response.put("success", false);
                response.put("challenge", null);
                response.put("message", "Failed to generate daily challenge");
                return response;
            }

            response.put("success", true);
            response.put("challenge", challenge);
            response.put("message", "Daily challenge retrieved successfully");
            return response;

        } catch (Exception e) {
            System.err.println("Error in getDailyChallenge: " + e.getMessage());
            e.printStackTrace();

            response.put("success", false);
            response.put("challenge", null);
            response.put("message", "Failed to get daily challenge: " + e.getMessage());
            return response;
        }
    }
}