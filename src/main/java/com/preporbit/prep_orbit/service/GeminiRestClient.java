package com.preporbit.prep_orbit.service;

import okhttp3.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GeminiRestClient {

    private final String apiKey;
    private final String model;
    private final OkHttpClient client = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    // Base API URL
    private static final String GEMINI_API_BASE =
            "https://generativelanguage.googleapis.com/v1/models/";

    public GeminiRestClient(
            @Value("${GOOGLE_API_KEY:}") String apiKey,
            @Value("${resume.ai.model:gemini-1.5-flash}") String model) {

        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("GOOGLE_API_KEY");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GOOGLE_API_KEY not configured: please set it in application.properties or as an environment variable.");
        }
        this.apiKey = apiKey;

        if (model == null || model.isBlank()) {
            this.model = "gemini-1.5-flash"; // default to free version
        } else {
            this.model = model;
        }
    }

    /** Analyze resume using images + prompt */
    public String analyzeResumeImages(BufferedImage[] images, String prompt) throws Exception {
        StringBuilder imageParts = new StringBuilder();
        for (BufferedImage img : images) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            String base64Img = Base64.getEncoder().encodeToString(baos.toByteArray());
            imageParts.append(String.format(
                    "{\"inline_data\": {\"mime_type\": \"image/png\", \"data\": \"%s\"}},", base64Img
            ));
        }
        if (imageParts.length() > 0) imageParts.setLength(imageParts.length() - 1);

        String payload = String.format("""
        {
            "contents": [
                {"parts":[
                    {"text": "%s"},
                    %s
                ]}
            ]
        }
        """, prompt.replace("\"", "\\\""), imageParts);

        Request request = new Request.Builder()
                .url(GEMINI_API_BASE + model + ":generateContent?key=" + apiKey)
                .post(RequestBody.create(payload, MediaType.get("application/json")))
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new RuntimeException("Gemini API error: " + response.code() + " - " + response.body().string());
            }
            return response.body().string();
        }
    }

    /** Text-only resume analysis */
    public String analyzeResumeText(String prompt) throws Exception {
        String payload = String.format("""
        {
            "contents": [{"parts":[{"text": "%s"}]}]
        }
        """, prompt.replace("\"", "\\\""));

        Request request = new Request.Builder()
                .url(GEMINI_API_BASE + model + ":generateContent?key=" + apiKey)
                .post(RequestBody.create(payload, MediaType.get("application/json")))
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new RuntimeException("Gemini API error: " + response.code() + " - " + response.body().string());
            }
            return response.body().string();
        }
    }
}
