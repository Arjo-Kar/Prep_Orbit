package com.preporbit.prep_orbit.service;

import com.preporbit.prep_orbit.dto.CodingChallengeDto;
import com.preporbit.prep_orbit.model.CodingChallenge;
import com.preporbit.prep_orbit.model.User;
import com.preporbit.prep_orbit.model.UserChallengeStats;
import com.preporbit.prep_orbit.repository.UserRepository;
import com.preporbit.prep_orbit.repository.CodingChallengeRepository;
import com.preporbit.prep_orbit.repository.UserChallengeStatsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class DailyChallengeService {

    private final UserChallengeStatsRepository userChallengeStatsRepository;
    private final UserRepository userRepository;
    private final CodingChallengeRepository codingChallengeRepository;
    private final AICodingChallengeGeneratorService aiGenerator;

    // Default topics and difficulty for daily challenges
    private static final List<String> DEFAULT_TOPICS = Arrays.asList("arrays", "strings", "algorithms");
    private static final String DEFAULT_DIFFICULTY = "medium";

    public DailyChallengeService(
            UserChallengeStatsRepository userChallengeStatsRepository,
            UserRepository userRepository,
            CodingChallengeRepository codingChallengeRepository,
            AICodingChallengeGeneratorService aiGenerator) {
        this.userChallengeStatsRepository = userChallengeStatsRepository;
        this.userRepository = userRepository;
        this.codingChallengeRepository = codingChallengeRepository;
        this.aiGenerator = aiGenerator;
    }

    @Transactional
    public CodingChallengeDto getTodaysDailyChallenge(String userEmail) {
        try {
            System.out.println("=== Getting daily challenge for user: " + userEmail + " ===");

            // 1. Get user by email
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

            System.out.println("Found user with ID: " + user.getId());

            LocalDate today = LocalDate.now();
            System.out.println("Checking for existing challenge on date: " + today);

            // 2. Check if user already has a challenge generated today
            Optional<UserChallengeStats> existingStats = userChallengeStatsRepository
                    .findByUserIdAndCreatedAtDate(user.getId(), today);

            if (existingStats.isPresent()) {
                System.out.println("Found existing challenge for today: " + existingStats.get().getChallengeId());
                // Return existing challenge
                Long challengeId = existingStats.get().getChallengeId();
                CodingChallenge challenge = codingChallengeRepository.findById(challengeId)
                        .orElseThrow(() -> new RuntimeException("Challenge not found with ID: " + challengeId));
                return convertToDto(challenge);
            }

            // 3. Generate new challenge for today
            System.out.println("No existing challenge found, generating new one...");
            return generateAndSaveNewDailyChallenge(user);

        } catch (Exception e) {
            System.err.println("Error in getTodaysDailyChallenge: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get daily challenge: " + e.getMessage(), e);
        }
    }

    @Transactional
    private CodingChallengeDto generateAndSaveNewDailyChallenge(User user) {
        try {
            System.out.println("=== Generating new challenge for user ID: " + user.getId() + " ===");

            // Generate new challenge using AI
            CodingChallengeDto challengeDto = aiGenerator.generateChallenge(DEFAULT_TOPICS, DEFAULT_DIFFICULTY);

            if (challengeDto == null) {
                throw new RuntimeException("AI service returned null challenge");
            }

            System.out.println("Generated challenge DTO: " + challengeDto.getTitle());

            // Save to coding_challenges table
            CodingChallenge codingChallenge = codingChallengeRepository.save(challengeDto.toModel());
            challengeDto.setId(codingChallenge.getId());

            System.out.println("Saved challenge with ID: " + codingChallenge.getId());

            // Create user_challenge_stats record using constructor
            UserChallengeStats stats = new UserChallengeStats(user.getId(), codingChallenge.getId());

            System.out.println("About to save UserChallengeStats: " + stats);

            UserChallengeStats savedStats = userChallengeStatsRepository.save(stats);
            System.out.println("Successfully saved user challenge stats with ID: " + savedStats.getId());

            return challengeDto;

        } catch (Exception e) {
            System.err.println("=== Error in generateAndSaveNewDailyChallenge ===");
            System.err.println("Error message: " + e.getMessage());
            System.err.println("Error class: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate daily challenge: " + e.getMessage(), e);
        }
    }

    private CodingChallengeDto convertToDto(CodingChallenge challenge) {
        try {
            CodingChallengeDto dto = new CodingChallengeDto();
            dto.setId(challenge.getId());
            dto.setTitle(challenge.getTitle());
            dto.setDescription(challenge.getDescription());
            dto.setTimeLimitMs(challenge.getTimeLimitMs());
            dto.setMemoryLimitKb(challenge.getMemoryLimitKb());
            dto.setInputSpec(challenge.getInputSpec());
            dto.setOutputSpec(challenge.getOutputSpec());
            dto.setTopics(challenge.getTopics() != null ? challenge.getTopics() : DEFAULT_TOPICS);
            dto.setDifficulty(challenge.getDifficulty() != null ? challenge.getDifficulty() : DEFAULT_DIFFICULTY);
            return dto;
        } catch (Exception e) {
            System.err.println("Error converting challenge to DTO: " + e.getMessage());
            throw new RuntimeException("Failed to convert challenge to DTO", e);
        }
    }

    public Long getUserChallengesCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userChallengeStatsRepository.countByUserId(user.getId());
    }
}