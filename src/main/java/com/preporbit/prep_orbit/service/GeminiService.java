package com.preporbit.prep_orbit.service;

import com.google.genai.Client;
import com.google.genai.errors.ServerException;
import com.google.genai.types.GenerateContentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
public class GeminiService {
    private final Client client;

    public GeminiService(Client client) {
        this.client = client;
    }

    public String askGemini(String prompt){
        System.out.println("Service hit");
        try {
            GenerateContentResponse response =
                    client.models.generateContent(
                            "gemini-2.5-flash",
                            prompt,
                            null);

            return response.text();
        } catch (ServerException e) {
            // Log error
            System.err.println("Gemini API overloaded: " + e.getMessage());
            // You can either return a user-friendly message, or null/empty string
            return null; // Or: "AI model overloaded, try again later."
        }
    }
}