package com.preporbit.prep_orbit.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class InterviewAIConfig {

    @Value("${GOOGLE_API_KEY:}")
    private String googleApiKey;

    @Value("${interview.ai.model:gemini-2.0-flash-001}")
    private String aiModel;

    @Value("${interview.ai.api.url:https://generativelanguage.googleapis.com/v1beta/models}")
    private String apiBaseUrl;

    @Bean(name = "interviewRestTemplate")
    public RestTemplate interviewRestTemplate() {
        return new RestTemplate();
    }

    public String getGoogleApiKey() {
        String key = (googleApiKey != null && !googleApiKey.isBlank())
                ? googleApiKey
                : System.getenv("GOOGLE_API_KEY");

        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                    "GOOGLE_API_KEY not configured for interview module: please set it in application.properties or as an environment variable."
            );
        }
        return key;
    }

    public String getAiModel() {
        return aiModel;
    }

    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    public String getGenerateContentUrl() {
        return apiBaseUrl + "/" + aiModel + ":generateContent";
    }

    public boolean isConfigured() {
        try {
            getGoogleApiKey();
            return true;
        } catch (IllegalStateException e) {
            return false;
        }
    }
}