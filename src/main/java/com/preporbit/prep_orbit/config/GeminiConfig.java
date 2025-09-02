package com.preporbit.prep_orbit.config;

import com.google.api.client.util.Value;
import com.google.genai.Client;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GeminiConfig {
    @Value("${google.api.key}")
    private String apiKey;

    @Bean
    public Client geminiClient() {
        return new Client();
    }
}
