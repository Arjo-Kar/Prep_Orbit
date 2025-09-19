package com.preporbit.prep_orbit.service;

import com.preporbit.prep_orbit.dto.CodingChallengeDto;
import com.preporbit.prep_orbit.dto.CodingChallengeSubmissionDto;
import com.preporbit.prep_orbit.dto.CodingChallengeResultDto;
import com.preporbit.prep_orbit.model.ChallengeTestCase;
import com.preporbit.prep_orbit.model.CodingChallenge;
import com.preporbit.prep_orbit.model.User;
import com.preporbit.prep_orbit.model.UserChallengeStats;
import com.preporbit.prep_orbit.repository.CodingChallengeRepository;
import com.preporbit.prep_orbit.repository.ChallengeTestCaseRepository;
import com.preporbit.prep_orbit.repository.UserChallengeStatsRepository;
import com.preporbit.prep_orbit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class CodingChallengeService {
    private final CodingChallengeRepository challengeRepo;
    private final ChallengeTestCaseRepository testCaseRepo;
    private final Judge0Service judge0Service; // You should have this service for code evaluation
    private final UserRepository userRepository;
    private final UserChallengeStatsRepository userChallengeStatsRepository;

    public CodingChallengeService(CodingChallengeRepository challengeRepo, ChallengeTestCaseRepository testCaseRepo, Judge0Service judge0Service, UserRepository userRepository, UserChallengeStatsRepository userChallengeStatsRepository) {
        this.challengeRepo = challengeRepo;
        this.testCaseRepo = testCaseRepo;
        this.judge0Service = judge0Service;
        this.userRepository = userRepository;
        this.userChallengeStatsRepository = userChallengeStatsRepository;
    }

    public CodingChallengeDto getChallenge(Long id) {
        CodingChallenge challenge = challengeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        List<ChallengeTestCase> visibleCases = testCaseRepo.findByCodingChallengeIdAndIsVisible(id, true);

        List<CodingChallengeDto.TestCaseDto> visibleTestCases = visibleCases.stream().map(tc -> {
            CodingChallengeDto.TestCaseDto dto = new CodingChallengeDto.TestCaseDto();
            dto.setInput(tc.getInput());
            dto.setExpectedOutput(tc.getExpectedOutput());
            dto.setVisible(tc.isVisible());
            return dto;
        }).collect(Collectors.toList());

        CodingChallengeDto dto = new CodingChallengeDto();
        dto.setId(challenge.getId());
        dto.setTitle(challenge.getTitle());
        dto.setDescription(challenge.getDescription());
        dto.setTimeLimitMs(challenge.getTimeLimitMs());
        dto.setMemoryLimitKb(challenge.getMemoryLimitKb());
        dto.setInputSpec(challenge.getInputSpec());
        dto.setOutputSpec(challenge.getOutputSpec());
        dto.setTopics((challenge.getTopics() != null && !challenge.getTopics().isEmpty()) ? challenge.getTopics() : List.of("arrays", "strings"));
        dto.setDifficulty((challenge.getDifficulty() != null && !challenge.getDifficulty().isEmpty()) ? challenge.getDifficulty() : "medium");
        dto.setVisibleTestCases(visibleTestCases);

        return dto;
    }

    public CodingChallengeResultDto evaluateSubmission(Long challengeId, CodingChallengeSubmissionDto submission) {
        CodingChallenge challenge = challengeRepo.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        List<ChallengeTestCase> allTestCases = challenge.getTestCases();

        CodingChallengeResultDto resultDto = new CodingChallengeResultDto();
        AtomicInteger passed = new AtomicInteger();

        List<CodingChallengeResultDto.TestCaseResult> testCaseResults = allTestCases.stream().map(tc -> {
            // Use Judge0Service to execute code for each test case
            System.out.println("Source Code: " + submission.getSourceCode());
            System.out.println("LangID: " + submission.getLanguageId());
            System.out.println("TC: " + submission.getStdin());
            System.out.println("Tc2 :" + tc.getInput());

            String actualOutput = judge0Service.executeCode(
                    submission.getSourceCode(),
                    submission.getLanguageId(),
                    tc.getInput()
            );
            System.out.println(actualOutput);
            CodingChallengeResultDto.TestCaseResult tcResult = new CodingChallengeResultDto.TestCaseResult();
            tcResult.setInput(tc.getInput());
            tcResult.setExpectedOutput(tc.getExpectedOutput());
            tcResult.setActualOutput(actualOutput);
            tcResult.setVisible(tc.isVisible());
            System.out.println("Actual Output: " + actualOutput);
            System.out.println("Expected Output: " + tc.getExpectedOutput());
            boolean isPassed = actualOutput != null && actualOutput.trim().equals(tc.getExpectedOutput().trim());
            tcResult.setPassed(isPassed);
            tcResult.setError(isPassed ? null : "Output mismatch");
            if (isPassed) passed.getAndIncrement();
            return tcResult;
        }).collect(Collectors.toList());

        resultDto.setResults(testCaseResults);
        resultDto.setTotalTestCases(allTestCases.size());
        resultDto.setPassedTestCases(passed.get());
        resultDto.setAllPassed(passed.get() == allTestCases.size());
        Long userId = getCurrentUserId(); // <-- You need to implement this helper (see below)
        // 2. Find today's UserChallengeStats record
        if (userId != null) {
            Optional<UserChallengeStats> statsOpt = userChallengeStatsRepository.findByUserIdAndChallengeId(userId, challengeId);
            UserChallengeStats stats = statsOpt.orElse(null);
            if (stats != null && !stats.isSolved()) {
                stats.setSolved(resultDto.isAllPassed());
                userChallengeStatsRepository.save(stats);
            } else {

            }
        }

        return resultDto;
    }

    // NEW: Evaluate only visible test cases (for "Run" action)
    public CodingChallengeResultDto evaluateSubmissionVisible(Long challengeId, CodingChallengeSubmissionDto submission) {
        CodingChallenge challenge = challengeRepo.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        // Fetch only visible test cases
        List<ChallengeTestCase> visibleCases = testCaseRepo.findByCodingChallengeIdAndIsVisible(challengeId, true);

        CodingChallengeResultDto resultDto = new CodingChallengeResultDto();
        AtomicInteger passed = new AtomicInteger();

        List<CodingChallengeResultDto.TestCaseResult> testCaseResults = visibleCases.stream().map(tc -> {
            System.out.println("RUN (visible only) - Source Code: " + submission.getSourceCode());
            System.out.println("RUN (visible only) - LangID: " + submission.getLanguageId());
            System.out.println("RUN (visible only) - Test Input: " + tc.getInput());

            String actualOutput = judge0Service.executeCode(
                    submission.getSourceCode(),
                    submission.getLanguageId(),
                    tc.getInput()
            );

            CodingChallengeResultDto.TestCaseResult tcResult = new CodingChallengeResultDto.TestCaseResult();
            tcResult.setInput(tc.getInput());
            tcResult.setExpectedOutput(tc.getExpectedOutput());
            tcResult.setActualOutput(actualOutput);
            tcResult.setVisible(true);

            boolean isPassed = actualOutput != null && actualOutput.trim().equals(tc.getExpectedOutput().trim());
            tcResult.setPassed(isPassed);
            tcResult.setError(isPassed ? null : "Output mismatch");
            if (isPassed) passed.getAndIncrement();
            return tcResult;
        }).collect(Collectors.toList());

        resultDto.setResults(testCaseResults);
        resultDto.setTotalTestCases(visibleCases.size());
        resultDto.setPassedTestCases(passed.get());
        resultDto.setAllPassed(passed.get() == visibleCases.size());

        return resultDto;
    }
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        return user != null ? user.getId() : null;
    }
}