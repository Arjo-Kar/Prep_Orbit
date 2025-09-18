package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.CodingChallengeDto;
import com.preporbit.prep_orbit.dto.CodingChallengeResultDto;
import com.preporbit.prep_orbit.dto.CodingChallengeSubmissionDto;
import com.preporbit.prep_orbit.service.CodingChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/coding")


public class CodingChallengeController {

    private final CodingChallengeService codingChallengeService;

    public CodingChallengeController(CodingChallengeService codingChallengeService) {
        this.codingChallengeService = codingChallengeService;
    }

    @GetMapping("/challenge/{id}")
    public CodingChallengeDto getChallenge(@PathVariable Long id) {
        return codingChallengeService.getChallenge(id);
    }
    @PostMapping("/challenge/{id}/submit")
    public CodingChallengeResultDto submitSolution(
            @PathVariable Long id,
            @RequestBody CodingChallengeSubmissionDto submission
    ) {
        return codingChallengeService.evaluateSubmission(id, submission);
    }
    @PostMapping("/challenge/{id}/run")
    public CodingChallengeResultDto runSolution(
            @PathVariable Long id,
            @RequestBody CodingChallengeSubmissionDto submission
    ) {
        return codingChallengeService.evaluateSubmissionVisible(id, submission);
    }
}