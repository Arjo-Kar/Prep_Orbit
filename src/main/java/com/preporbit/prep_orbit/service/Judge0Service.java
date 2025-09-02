package com.preporbit.prep_orbit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class Judge0Service {

    @Value("${judge0.api.key}")
    private String apiKey;

    private static final String JUDGE0_URL = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";

    public String executeCode(String sourceCode, int languageId, String stdin) {
        System.out.println("Loaded API Key: " + apiKey);

        if (sourceCode == null || sourceCode.trim().isEmpty()) {
            return "Error: Source code can't be blank.";
        }
        if (languageId <= 0) {
            return "Error: Language ID must be a valid Judge0 language id.";
        }

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-RapidAPI-Key", apiKey);
        headers.set("X-RapidAPI-Host", "judge0-ce.p.rapidapi.com");
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Log headers for debugging
        headers.forEach((key, value) -> System.out.println("Header: " + key + " -> " + value));

        // Build payload as a Map
        Map<String, Object> body = new HashMap<>();
        body.put("source_code", sourceCode);
        body.put("language_id", languageId);
        body.put("stdin", stdin);

        // Serialize payload to JSON
        String jsonBody;
        try {
            ObjectMapper mapper = new ObjectMapper();
            jsonBody = mapper.writeValueAsString(body);
            System.out.println("Serialized body: " + jsonBody);
        } catch (Exception e) {
            e.printStackTrace();
            return "Error: Failed to serialize payload.";
        }

        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(JUDGE0_URL, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object output = response.getBody().get("stdout");
                return output != null ? output.toString() : "";
            } else if (response.getBody() != null && response.getBody().get("stderr") != null) {
                return "Error: " + response.getBody().get("stderr").toString();
            } else {
                return "Error: Unable to execute code.";
            }
        } catch (HttpClientErrorException ex) {
            // Log full response for debugging
            System.out.println("HTTP Error: " + ex.getStatusCode());
            System.out.println("Response Body: " + ex.getResponseBodyAsString());
            return "Error: " + ex.getStatusCode() + " - " + ex.getResponseBodyAsString();
        } catch (Exception ex) {
            ex.printStackTrace();
            return "Error: Unexpected exception - " + ex.getMessage();
        }
    }
}