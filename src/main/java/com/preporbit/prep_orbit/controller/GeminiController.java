package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

@RestController
@RequestMapping("api/gemini")
//@RequiredArgsConstructor
public class GeminiController {
    private final GeminiService geminiService;

    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/ask")
    public String askGeminiapi(@RequestBody String prompt){
        System.out.println("gemini hit");
        return geminiService.askGemini(prompt);
    }
    @PostMapping("/chat")
    public ResponseEntity<String> chat(
            @RequestParam(value = "prompt", required = false) String prompt,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        try {
            BufferedImage bufferedImage = null;
            if (image != null && !image.isEmpty()) {
                bufferedImage = ImageIO.read(image.getInputStream());
            }

            String result;
            if (prompt != null && !prompt.isEmpty() && bufferedImage != null) {
                result = geminiService.analyzeResume(prompt, new BufferedImage[]{bufferedImage});
            } else if (prompt != null && !prompt.isEmpty()) {
                result = geminiService.askGemini(prompt);
            } else if (bufferedImage != null) {
                result = geminiService.analyzeResumeImages(new BufferedImage[]{bufferedImage});
            } else {
                result = "No input provided.";
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Gemini analysis failed.");
        }
    }
}
