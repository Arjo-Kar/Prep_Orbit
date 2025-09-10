package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.LiveInterviewRequestDto;
import com.preporbit.prep_orbit.model.LiveInterview;
import com.preporbit.prep_orbit.model.User;
import com.preporbit.prep_orbit.repository.UserRepository;
import com.preporbit.prep_orbit.service.LiveInterviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/live-interviews")
public class LiveInterviewController {


    @Autowired
    private LiveInterviewService liveInterviewService;

    @Autowired
    private UserRepository userRepository;
    private static final Logger logger = LoggerFactory.getLogger(LiveInterviewService.class);
    @PostMapping
    public LiveInterview createLiveInterview(@RequestBody LiveInterviewRequestDto dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication); // utility function below
        return liveInterviewService.createLiveInterview(dto, userId);
    }

    @GetMapping
    public List<LiveInterview> getAllLiveInterviews() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);
        return liveInterviewService.getAllLiveInterviewsForUser(userId);
    }

    @GetMapping("/{id}")
    public LiveInterview getLiveInterview(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);
        return liveInterviewService.getLiveInterviewByIdForUser(id, userId);
    }

    // Utility function to extract userId from Authentication (adjust for your JWT claims)
    private Long getUserIdFromAuthentication(Authentication authentication) {
        String email = authentication.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            return userOpt.get().getId();
        }
        throw new RuntimeException("User not found for email: " + email);
    }

    @PostMapping("/transcribe")
    public ResponseEntity<?> transcribeAudio(@RequestParam("file") MultipartFile file) {
        try {
            String transcript = liveInterviewService.transcribeAudioWithWhisper(file);
            return ResponseEntity.ok(Map.of("transcript", transcript));
        } catch (Exception e) {
            e.printStackTrace(); // log full error
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/tts")
    public ResponseEntity<byte[]> textToSpeechGoogle(@RequestBody Map<String, String> request) {
        try {
            String text = request.get("text");
            byte[] audio = liveInterviewService.textToSpeechGoogle(text);
            return ResponseEntity.ok()
                    .header("Content-Type", "audio/mpeg")
                    .body(audio);
        } catch (Exception e) {
            logger.error("Error during TTS", e);
            return ResponseEntity.status(500).body(null);
        }
    }

}