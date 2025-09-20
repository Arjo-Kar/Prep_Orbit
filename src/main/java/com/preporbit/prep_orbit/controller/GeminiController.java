package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
}
