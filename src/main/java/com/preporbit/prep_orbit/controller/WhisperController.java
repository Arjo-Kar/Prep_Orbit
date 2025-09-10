package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.service.WhisperService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

@RestController
@RequestMapping("/api/whisper")
public class WhisperController {

    @Autowired
    private WhisperService whisperService;

    @PostMapping("/transcribe")
    public ResponseEntity<String> transcribe(@RequestParam("file") MultipartFile file) throws IOException {
        File tempFile = File.createTempFile("upload-", ".mp3");
        file.transferTo(tempFile);

        String transcription = whisperService.transcribeAudio(tempFile);

        // Delete the temp file after use
        tempFile.delete();

        return ResponseEntity.ok(transcription);
    }
}
