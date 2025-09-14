package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.ResumeAnalysisResponse;
import com.preporbit.prep_orbit.dto.ResumeHistoryDto;
import com.preporbit.prep_orbit.model.ResumeAnalysis;
import com.preporbit.prep_orbit.service.ResumeAnalysisService;
import com.preporbit.prep_orbit.service.PDFToImageService; // Add this import
import io.opencensus.resource.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resume")
public class ResumeAnalysisController {
    @Value("${resume.images.base-dir:./resume-images}")
    private String imagesBaseDir;

    private final ResumeAnalysisService resumeAnalysisService;
    private final PDFToImageService pdfToImageService; // Add this

    @Value("${resume.analysis.max-file-size:50MB}")
    private String maxFileSize;

    public ResumeAnalysisController(ResumeAnalysisService resumeAnalysisService,
                                    PDFToImageService pdfToImageService) { // Add parameter
        this.resumeAnalysisService = resumeAnalysisService;
        this.pdfToImageService = pdfToImageService; // Initialize
    }

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeResume(
            @RequestParam("resume") MultipartFile file) {

        Map<String, Object> response = new HashMap<>();

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();

            System.out.println("📄 Analyzing resume for user: " + userEmail);
            System.out.println("📁 File details: " + file.getOriginalFilename() +
                    ", Size: " + formatFileSize(file.getSize()) +
                    " (" + file.getSize() + " bytes)");

            // Enhanced file validation
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "Please select a file to upload");
                return ResponseEntity.badRequest().body(response);
            }

            // Check file type
            if (!file.getContentType().equals("application/pdf")) {
                System.out.println("❌ Invalid content type: " + file.getContentType());
                response.put("success", false);
                response.put("message", "Only PDF files are supported. Received: " + file.getContentType());
                response.put("supportedFormats", List.of("application/pdf"));
                return ResponseEntity.badRequest().body(response);
            }

            // Dynamic file size validation
            long maxSizeBytes = getMaxFileSizeInBytes();
            if (file.getSize() > maxSizeBytes) {
                String currentSize = formatFileSize(file.getSize());
                response.put("success", false);
                response.put("message", "File size should not exceed " + maxFileSize +
                        ". Current size: " + currentSize);
                response.put("maxSize", maxFileSize);
                response.put("currentSize", currentSize);
                return ResponseEntity.badRequest().body(response);
            }

            System.out.println("✅ File validation passed. Processing file...");

            // Check if file can be converted to images (additional info)
            boolean canConvertToImages = false;
            int imageCount = 0;
            try {
                canConvertToImages = pdfToImageService.canConvertToImages(file);
                if (canConvertToImages) {
                    imageCount = pdfToImageService.getImageCount(file);
                }
                System.out.println("🖼️ Image conversion capability: " + canConvertToImages +
                        " (pages: " + imageCount + ")");
            } catch (Exception e) {
                System.out.println("⚠️ Could not check image conversion: " + e.getMessage());
            }

            // Analyze resume with enhanced capabilities
            ResumeAnalysisResponse analysis = resumeAnalysisService.analyzeResume(file, userEmail);

            // Enhanced response with more metadata
            response.put("success", true);
            response.put("overallScore", analysis.getOverallScore());
            response.put("scores", analysis.getScores());
            response.put("suggestions", analysis.getSuggestions());
            response.put("details", analysis.getDetails());
            response.put("extractedText", analysis.getExtractedText());

            // File processing metadata
            response.put("fileInfo", Map.of(
                    "filename", file.getOriginalFilename(),
                    "size", formatFileSize(file.getSize()),
                    "sizeBytes", file.getSize(),
                    "contentType", file.getContentType(),
                    "canConvertToImages", canConvertToImages,
                    "estimatedPages", imageCount
            ));

            // Analysis metadata
            response.put("analysisInfo", Map.of(
                    "method", analysis.getDetails().getOrDefault("analysisMethod", "unknown"),
                    "isImageBased", analysis.getDetails().getOrDefault("isImageBased", false),
                    "hasImages", analysis.getDetails().getOrDefault("hasImages", false),
                    "processingTime", analysis.getDetails().getOrDefault("processingTimeMs", 0)
            ));

            response.put("maxAllowedSize", maxFileSize);

            System.out.println("🎯 Analysis completed successfully!");
            System.out.println("   📊 Score: " + analysis.getOverallScore());
            System.out.println("   🔍 Method: " + analysis.getDetails().getOrDefault("analysisMethod", "unknown"));
            System.out.println("   ⏱️ Time: " + analysis.getDetails().getOrDefault("processingTimeMs", 0) + "ms");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("💥 Error in resume analysis controller: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error analyzing resume: " + e.getMessage());
            response.put("error_type", e.getClass().getSimpleName());
            response.put("maxAllowedSize", maxFileSize);
            response.put("supportedFormats", List.of("application/pdf"));
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // NEW: Endpoint to check analysis capabilities
    @PostMapping("/check-capabilities")
    public ResponseEntity<Map<String, Object>> checkAnalysisCapabilities(
            @RequestParam("resume") MultipartFile file) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "No file provided");
                return ResponseEntity.badRequest().body(response);
            }

            if (!file.getContentType().equals("application/pdf")) {
                response.put("success", false);
                response.put("message", "Only PDF files are supported");
                return ResponseEntity.badRequest().body(response);
            }

            Map<String, Object> capabilities = new HashMap<>();

            // Check image conversion capability
            boolean canConvertToImages = pdfToImageService.canConvertToImages(file);
            int imageCount = canConvertToImages ? pdfToImageService.getImageCount(file) : 0;

            capabilities.put("canConvertToImages", canConvertToImages);
            capabilities.put("imageCount", imageCount);
            capabilities.put("supportsTextAnalysis", true);
            capabilities.put("supportsImageAnalysis", canConvertToImages);
            capabilities.put("recommendedMethod", canConvertToImages ? "hybrid" : "text-only");

            response.put("success", true);
            response.put("capabilities", capabilities);
            response.put("fileInfo", Map.of(
                    "filename", file.getOriginalFilename(),
                    "size", formatFileSize(file.getSize()),
                    "contentType", file.getContentType()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error checking capabilities: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getUploadConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("maxFileSize", maxFileSize);
        config.put("maxFileSizeBytes", getMaxFileSizeInBytes());
        config.put("supportedFormats", List.of("application/pdf"));
        config.put("supportedExtensions", List.of(".pdf"));
        config.put("features", Map.of(
                "textAnalysis", true,
                "imageAnalysis", true,
                "hybridAnalysis", true,
                "fallbackAnalysis", true
        ));
        return ResponseEntity.ok(config);
    }

    // Convert size string to bytes
    private long getMaxFileSizeInBytes() {
        String sizeStr = maxFileSize.toUpperCase().replace("MB", "").replace("KB", "").replace("GB", "");
        long multiplier = 1024 * 1024; // Default to MB

        if (maxFileSize.toUpperCase().contains("KB")) {
            multiplier = 1024;
        } else if (maxFileSize.toUpperCase().contains("GB")) {
            multiplier = 1024 * 1024 * 1024;
        }

        try {
            return Long.parseLong(sizeStr) * multiplier;
        } catch (NumberFormatException e) {
            return 50 * 1024 * 1024; // Default 50MB
        }
    }

    // Helper method to format file size
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        return String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0));
    }

    // Keep all your existing endpoints (history, stats, etc.) unchanged
    @GetMapping("/history")
    public ResponseEntity<List<ResumeHistoryDto>> getUserHistory(@RequestParam Long userId) {
        List<ResumeAnalysis> analyses = resumeAnalysisService.getAnalysesForUser(userId);

        List<ResumeHistoryDto> dtos = analyses.stream()
                .map(resumeAnalysisService::mapToHistoryDto) // 🔹 use service mapper
                .toList();

        return ResponseEntity.ok(dtos);
    }


    @GetMapping("/analysis/{id}")
    public ResponseEntity<Map<String, Object>> getAnalysisById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();

            ResumeAnalysisResponse analysis = resumeAnalysisService.getAnalysisById(id, userEmail);

            response.put("success", true);
            response.put("analysis", analysis);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error fetching analysis: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        Map<String, Object> response = new HashMap<>();

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();

            Map<String, Object> stats = resumeAnalysisService.getUserAnalysisStats(userEmail);

            response.put("success", true);
            response.putAll(stats);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error fetching user stats: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    @GetMapping("/image/{analysisId}/{page}")
    public ResponseEntity<org.springframework.core.io.Resource> getResumePageImage(
            @PathVariable Long analysisId,
            @PathVariable int page) {
        try {
            // 🔹 Fetch analysis from DB
            ResumeAnalysis analysis = resumeAnalysisService.getAnalysisEntityById(analysisId);
            if (analysis == null) {
                return ResponseEntity.notFound().build();
            }

            Long userId = analysis.getUserId();

            Path path = Paths.get(imagesBaseDir,
                    userId.toString(),
                    analysisId.toString(),
                    "page-" + page + ".png");

            if (!Files.exists(path)) {
                return ResponseEntity.notFound().build();
            }

            org.springframework.core.io.Resource file = new FileSystemResource(path);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(file);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }


}