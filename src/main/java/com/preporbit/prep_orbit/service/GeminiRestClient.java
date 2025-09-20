package com.preporbit.prep_orbit.service;

import okhttp3.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Base64;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GeminiRestClient {

    private final String apiKey;
    private final String model;
    private final OkHttpClient client;
    private final ObjectMapper mapper = new ObjectMapper();

    // Base API URL
    private static final String GEMINI_API_BASE =
            "https://generativelanguage.googleapis.com/v1/models/";

    public GeminiRestClient(
            @Value("${GOOGLE_API_KEY:}") String apiKey,
            @Value("${resume.ai.model:gemini-2.5-flash}") String model) {

        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("GOOGLE_API_KEY");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GOOGLE_API_KEY not configured.");
        }
        this.apiKey = apiKey;

        if (model == null || model.isBlank()) {
            this.model = "gemini-2.5-flash"; // default
        } else {
            this.model = model;
        }

        // Custom timeouts (important for image analysis)
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .readTimeout(180, TimeUnit.SECONDS) // allow long responses
                .build();
    }

    /** Core request executor with retry */
    private String executeWithRetry(Request request) throws Exception {
        int maxRetries = 5;
        int attempt = 0;

        while (true) {
            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    return response.body().string();
                } else if ((response.code() == 503 || response.code() == 504) && attempt < maxRetries) {
                    long wait = (long) Math.pow(2, attempt) * 1000; // exponential backoff
                    Thread.sleep(wait);
                    attempt++;
                } else {
                    throw new RuntimeException("Gemini API error: " + response.code() + " - " + response.body().string());
                }
            } catch (java.net.SocketTimeoutException e) {
                if (attempt < maxRetries) {
                    long wait = (long) Math.pow(2, attempt) * 1000;
                    Thread.sleep(wait);
                    attempt++;
                } else {
                    throw new RuntimeException("Gemini API timeout after retries", e);
                }
            }
        }
    }

    /** Analyze resume using images + prompt */
    public String analyzeResumeImages(BufferedImage[] images, String prompt) throws Exception {
        StringBuilder imageParts = new StringBuilder();
        for (BufferedImage img : images) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            // 👉 Tip: downscale & compress images before sending to reduce payload
            ImageIO.write(img, "jpg", baos); // use JPEG instead of PNG
            String base64Img = Base64.getEncoder().encodeToString(baos.toByteArray());
            imageParts.append(String.format(
                    "{\"inline_data\": {\"mime_type\": \"image/jpeg\", \"data\": \"%s\"}},", base64Img
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

        return executeWithRetry(request);
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

        return executeWithRetry(request);
    }
}