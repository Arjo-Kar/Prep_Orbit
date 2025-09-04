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
        return "Generate an interview standard coding challenge in JSON format with the following requirements:\n"
                + "- \"title\": string\n"
                + "- \"difficulty\": string; must be one of \"easy\", \"medium\", \"hard\"; this field must always be present\n"
                + "- \"topics\": array of strings; must be present and non-empty\n"
                + "- \"problem_statement\": string; clear description\n"
                + "- \"constraints\": array of strings\n"
                + "- \"input_specification\": PLAIN string; do not use object or array; this field must always be present\n"
                + "- \"output_specification\": PLAIN string; do not use object or array; this field must always be present\n"
                + "- \"test_cases\": array of 5 objects; each object must have:\n"
                + "    - \"input\": string\n"
                + "    - \"expected_output\": string\n"
                + "    - \"visible\": boolean (true/false; first 2 should be true, last 3 false)\n"
                + "Do NOT include any markdown, comments, code blocks, or extra text before or after the JSON.\n"
                + "Return ONLY valid JSON, with all fields populated and NO null or missing fields.\n"
                + "Example format:\n"
                + "{\n"
                + "  \"title\": \"Sample Challenge\",\n"
                + "  \"difficulty\": \"medium\",\n"
                + "  \"topics\": [\"arrays\", \"strings\"],\n"
                + "  \"problem_statement\": \"...\",\n"
                + "  \"constraints\": [\"...\", \"...\"],\n"
                + "  \"input_specification\": \"...\",\n"
                + "  \"output_specification\": \"...\",\n"
                + "  \"test_cases\": [\n"
                + "    {\"input\": \"input1\", \"expected_output\": \"output1\", \"visible\": true},\n"
                + "    {\"input\": \"input2\", \"expected_output\": \"output2\", \"visible\": true},\n"
                + "    {\"input\": \"input3\", \"expected_output\": \"output3\", \"visible\": false},\n"
                + "    {\"input\": \"input4\", \"expected_output\": \"output4\", \"visible\": false},\n"
                + "    {\"input\": \"input5\", \"expected_output\": \"output5\", \"visible\": false}\n"
                + "  ]\n"
                + "}\n";
    }
}