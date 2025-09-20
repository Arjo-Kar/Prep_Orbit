package com.preporbit.prep_orbit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
public class WhisperService {

    @Value("${openai.api.key}")
    private String openaiApiKey;

    private static final String OPENAI_WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
    private final OkHttpClient client = new OkHttpClient();

    public String transcribeAudio(File audioFile) {
        try {
            RequestBody requestBody = new MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart(
                            "file",
                            audioFile.getName(),
                            RequestBody.create(audioFile, MediaType.parse("audio/mpeg"))
                    )
                    .addFormDataPart("model", "whisper-1")
                    .build();

            Request request = new Request.Builder()
                    .url(OPENAI_WHISPER_URL)
                    .header("Authorization", "Bearer " + openaiApiKey)
                    .post(requestBody)
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new RuntimeException("OpenAI Whisper API failed: " + response.code() + " - " + response.body().string());
                }

                ObjectMapper mapper = new ObjectMapper();
                JsonNode jsonResponse = mapper.readTree(response.body().string());
                return jsonResponse.get("text").asText();
            }
        } catch (IOException e) {
            throw new RuntimeException("Error calling Whisper API", e);
        }
    }
}
