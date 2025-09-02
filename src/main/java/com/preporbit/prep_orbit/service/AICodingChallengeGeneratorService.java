package com.preporbit.prep_orbit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.preporbit.prep_orbit.dto.CodingChallengeDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AICodingChallengeGeneratorService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AICodingChallengeGeneratorService(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    public CodingChallengeDto generateChallenge(List<String> topics, String difficulty) {
        // 1. Build AI prompt
        String prompt = buildPrompt(topics, difficulty);

        // 2. Call Gemini API
        String aiResponse = geminiService.askGemini(prompt);
        if (aiResponse == null || aiResponse.isEmpty()) {
            throw new RuntimeException("AI model overloaded or failed to respond.");
        }

        // 3. Clean AI response and parse to CodingChallengeDto
        try {
            String cleanResponse = aiResponse.trim();
            if (cleanResponse.startsWith("```")) {
                // Remove first line (backticks, possibly 'json')
                cleanResponse = cleanResponse.substring(cleanResponse.indexOf('\n') + 1);
                int lastBackticks = cleanResponse.lastIndexOf("```");
                if (lastBackticks != -1) {
                    cleanResponse = cleanResponse.substring(0, lastBackticks);
                }
            }
            cleanResponse = cleanResponse.trim();

            CodingChallengeDto challenge = objectMapper.readValue(cleanResponse, CodingChallengeDto.class);
            return challenge;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage() + "\nAI Response: " + aiResponse);
        }
    }

    private String buildPrompt(List<String> topics, String difficulty) {
        return "Generate a coding challenge in JSON format with the following requirements:\n"
                + "- Topics: " + String.join(", ", topics) + "\n"
                + "- Difficulty: " + difficulty + "\n"
                + "- Include: problem statement, constraints (time/memory), input specification, output specification, "
                + "and 5 test cases (2 visible, 3 hidden), each with input and expected output and a visible boolean for each test case.\n"
                + "Return only valid JSON for direct deserialization.";
    }
}