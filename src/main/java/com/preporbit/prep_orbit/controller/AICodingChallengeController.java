package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.CodingChallengeDto;
import com.preporbit.prep_orbit.dto.GenerateRequest;
import com.preporbit.prep_orbit.model.CodingChallenge;
import com.preporbit.prep_orbit.service.AICodingChallengeGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.preporbit.prep_orbit.repository.CodingChallengeRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-coding")

public class AICodingChallengeController {

    private final AICodingChallengeGeneratorService aiGenerator;
    private final CodingChallengeRepository codingChallengeRepository;

    public AICodingChallengeController(AICodingChallengeGeneratorService aiGenerator, CodingChallengeRepository codingChallengeRepository) {
        this.aiGenerator = aiGenerator;
        this.codingChallengeRepository = codingChallengeRepository;
    }


    @PostMapping("/generate")
    public CodingChallengeDto generateChallenge(@RequestBody GenerateRequest request) {
        CodingChallengeDto challenge = aiGenerator.generateChallenge(request.getTopics(), request.getDifficulty());
        CodingChallenge model = codingChallengeRepository.save(challenge.toModel()); // Your mapping here
        challenge.setId(model.getId());
        return challenge;
    }
}