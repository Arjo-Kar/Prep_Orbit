package com.preporbit.prep_orbit.config;

import com.google.genai.Client;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GeminiConfig {

    @Value("${GOOGLE_API_KEY:}")
    private String apiKey;

    @Bean
    public Client geminiClient() {
        String key = (apiKey != null && !apiKey.isBlank())
                ? apiKey
                : System.getenv("GOOGLE_API_KEY");

        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                    "GOOGLE_API_KEY not configured: please set it in application.properties or as an environment variable."
            );
        }

        System.out.println("DEBUG: Initializing Gemini Client via builder with API key.");

        return Client.builder()
                .apiKey(key)
                .build();
    }
}
