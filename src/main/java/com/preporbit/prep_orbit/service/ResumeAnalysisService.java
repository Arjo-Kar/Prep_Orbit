package com.preporbit.prep_orbit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.util.Value;
import com.preporbit.prep_orbit.dto.ResumeAnalysisResponse;
import com.preporbit.prep_orbit.dto.ResumeHistoryDto;
import com.preporbit.prep_orbit.model.ResumeAnalysis;
import com.preporbit.prep_orbit.model.User;
import com.preporbit.prep_orbit.repository.ResumeAnalysisRepository;
import com.preporbit.prep_orbit.repository.UserRepository;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

/**
 * ResumeAnalysisService (completed version)
 * Features:
 *  - Multi-pass text extraction
 *  - Lazy PDF → image rendering
 *  - (OCR hook disabled by default)
 *  - AI (text) + fallback image analysis path
 *  - Fallback & diagnostic sanitization
 *  - Consistent details metadata
 */
@Service
@Transactional
public class ResumeAnalysisService {
    @Value("${resume.images.base-dir:./resume-images}")
    private String imagesBaseDir;


    /* ===================== CONFIG FLAGS ===================== */
    private static final boolean ENABLE_OCR = false;               // Hook point if you add Tess4J later
    private static final int    MAX_IMAGE_PAGES = 5;               // Cap pages converted to images
    private static final int    IMAGE_DPI = 200;                   // Balance clarity and performance
    private static final int    MIN_TEXT_LENGTH = 100;             // Meaningful threshold (characters)
    private static final int    MIN_WORDS = 20;
// Meaningful threshold (words)

    /* ===================== DEPENDENCIES ===================== */
    private final GeminiService geminiService;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeAnalysisService(GeminiService geminiService,
                                 ResumeAnalysisRepository resumeAnalysisRepository,
                                 UserRepository userRepository) {
        this.geminiService = geminiService;
        this.resumeAnalysisRepository = resumeAnalysisRepository;
        this.userRepository = userRepository;
    }

    /* ===================== PUBLIC ENTRY ===================== */
    public ResumeAnalysisResponse analyzeResume(MultipartFile file, String userEmail) throws IOException {
        final long start = System.currentTimeMillis();
        System.out.println("=== ▶ START Resume Analysis: " + file.getOriginalFilename() + " ===");

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Smart text extraction (without images first)
        ExtractionResult extraction = extractTextSmart(file);
        boolean textMeaningful = isTextMeaningful(extraction.extractedText);

        // 2. Decide analysis path (possibly render images lazily)
        AnalysisPlan plan = decideAnalysisPath(textMeaningful, extraction.imagePagesAvailable, extraction.extractedText);

        // 3. If plan needs images but we have none yet, convert now
        BufferedImage[] images = null;
        if (plan.requiresImages && extraction.images == null) {
            extraction.images = renderImages(file, MAX_IMAGE_PAGES);
        }
        images = extraction.images;

        // 4. Perform analysis
        ResumeAnalysisResponse response;
        try {
            switch (plan.method) {
                case "text" -> response = performTextAnalysis(extraction.extractedText);
                case "image" -> response = performImageAnalysis(images);
                default -> response = createEnhancedFallbackAnalysis(extraction.extractedText);
            }
        } catch (Exception e) {
            System.err.println("❌ Unexpected failure in analysis path: " + e.getMessage());
            response = createEnhancedFallbackAnalysis(extraction.extractedText);
            plan.method = "fallback";
        }

        // 5. Sanitize extracted text (remove diagnostic phrases)
        // 5. Sanitize extracted text
        String finalExtracted = sanitizeExtractedText(
                (response.getExtractedText() == null || response.getExtractedText().isBlank())
                        ? extraction.extractedText : response.getExtractedText()
        );

// 6. Enrich details
        Map<String, Object> details = ensureDetails(response);
        addCommonDetails(details, plan.method, images, finalExtracted, System.currentTimeMillis() - start);

// 6b. Generate summary and attach it
        String summary = generateResumeSummary(finalExtracted);
        details.put("summary", summary);

// 7. Persist
        ResumeAnalysis saved = saveAnalysis(user.getId(), file, response, finalExtracted,
                (long) details.getOrDefault("processingTimeMs", 0L));

        details.put("analysisId", saved.getId());


        System.out.printf("=== ✅ DONE (method=%s, score=%d, textChars=%d, time=%dms) ===%n",
                plan.method,
                response.getOverallScore(),
                finalExtracted == null ? 0 : finalExtracted.length(),
                details.get("processingTimeMs"));

        return response;
    }
    private String generateResumeSummary(String extractedText) {
        if (extractedText == null || extractedText.isBlank()) return "";

        String prompt = "Summarize this resume in 3–4 sentences. " +
                "Highlight candidate's skills, experience, and education. " +
                "Resume:\n" + extractedText.substring(0, Math.min(3000, extractedText.length()));

        try {
            String aiRaw = geminiService.askGemini(prompt);
            if (aiRaw == null || aiRaw.isBlank()) return "";
            return cleanAIResponse(aiRaw);
        } catch (Exception e) {
            System.err.println("⚠️ Summary generation failed: " + e.getMessage());
            return "";
        }
    }

    /**
     * Completed implementation: create a richer fallback when upstream AI or extraction fails.
     * This is invoked when:
     *  - AI path throws
     *  - Image/text decision returns "fallback"
     *  - We explicitly catch an unrecoverable error
     */
    private ResumeAnalysisResponse createEnhancedFallbackAnalysis(String extractedText) {
        ResumeAnalysisResponse resp = new ResumeAnalysisResponse();

        boolean hasAnyText = extractedText != null && !extractedText.isBlank();
        int baseScore = hasAnyText ? 48 : 25;
        resp.setOverallScore(baseScore);

        Map<String, Integer> scores = new HashMap<>();
        if (hasAnyText) {
            // Use basic heuristics so user still gets some guidance
            scores.putAll(performBasicAnalysis(extractedText));
            // Slightly cap because it's fallback/not full AI
            scores.replaceAll((k, v) -> Math.min(v, 80));
        } else {
            // Synthetic minimal distribution
            scores.put("content", 20);
            scores.put("contact", 30);
            scores.put("skills", 35);
            scores.put("experience", 30);
            scores.put("education", 45);
            scores.put("formatting", 40);
            scores.put("keywords", 30);
            scores.put("structure", 38);
        }
        resp.setScores(scores);

        List<ResumeAnalysisResponse.Suggestion> suggestions = new ArrayList<>();
        if (!hasAnyText) {
            suggestions.add(new ResumeAnalysisResponse.Suggestion(
                    "No Selectable Text Detected",
                    "The PDF appears to contain non-extractable or image-based content. Export directly from a text editor (Word, Google Docs) instead of scanning.",
                    "Format",
                    "high"
            ));
            suggestions.add(new ResumeAnalysisResponse.Suggestion(
                    "Provide Text-Based Resume",
                    "Use a digital format so ATS systems and AI can analyze keywords, sections, and accomplishments accurately.",
                    "Format",
                    "high"
            ));
        } else {
            suggestions.add(new ResumeAnalysisResponse.Suggestion(
                    "Partial (Fallback) Analysis",
                    "A full AI analysis was not completed. Re-run later to obtain comprehensive insights and deeper keyword evaluation.",
                    "System",
                    "medium"
            ));
        }
        suggestions.add(new ResumeAnalysisResponse.Suggestion(
                "Ensure Core Sections",
                "Include clear sections: Summary, Skills, Experience/Projects, Education, and Contact Info. Label them distinctly.",
                "Structure",
                "medium"
        ));
        resp.setSuggestions(suggestions);

        Map<String, Object> details = createDetails(extractedText);
        details.put("analysisMethod", "fallback");
        details.put("isImageBased", !hasAnyText);
        details.put("fallbackReason", hasAnyText ? "ai_unavailable" : "no_selectable_text");
        resp.setDetails(details);

        // We do NOT store a diagnostic sentence as extracted text:
        resp.setExtractedText(hasAnyText ? extractedText : "");

        return resp;
    }

    public ResumeAnalysis getAnalysisEntityById(Long analysisId) {
        return resumeAnalysisRepository.findById(analysisId).orElse(null);
    }
    public ResumeHistoryDto mapToHistoryDto(ResumeAnalysis entity) {
        ResumeHistoryDto dto = new ResumeHistoryDto();
        dto.setId(entity.getId());
        dto.setFilename(entity.getFilename());
        dto.setOverallScore(entity.getOverallScore());
        dto.setCreatedAt(entity.getCreatedAt());

        try {
            if (entity.getAnalysisDetailsJson() != null) {
                JsonNode details = objectMapper.readTree(entity.getAnalysisDetailsJson());
                if (details.has("summary")) {
                    dto.setSummary(details.get("summary").asText());
                }
                if (details.has("pageImages")) {
                    List<String> imgs = new ArrayList<>();
                    details.get("pageImages").forEach(n -> imgs.add(n.asText()));
                    dto.setPageImages(imgs);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return dto;
    }
    public List<ResumeAnalysis> getAnalysesForUser(Long userId) {
        return resumeAnalysisRepository.findByUserId(userId);
    }



    /* ===================== EXTRACTION ===================== */

    private static class ExtractionResult {
        String extractedText;
        boolean imagePagesAvailable;
        BufferedImage[] images; // only populated if rendering early (we delay by default)
    }

    private ExtractionResult extractTextSmart(MultipartFile file) {
        ExtractionResult result = new ExtractionResult();
        result.extractedText = "";
        result.imagePagesAvailable = false;

        System.out.println("🔍 Extracting text (multi-pass) from " + file.getOriginalFilename());

        try (InputStream is = file.getInputStream(); PDDocument doc = PDDocument.load(is)) {
            int totalPages = doc.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);

            // Pass 1: try normal PDFBox extraction
            String raw = stripper.getText(doc);
            if (raw != null && raw.trim().length() >= 40) {
                result.extractedText = raw.trim();
            } else {
                // Pass 2: page-by-page accumulate
                StringBuilder sb = new StringBuilder();
                for (int p = 1; p <= totalPages; p++) {
                    stripper.setStartPage(p);
                    stripper.setEndPage(p);
                    String pt = stripper.getText(doc);
                    if (pt != null && !pt.isBlank()) sb.append(pt).append('\n');
                }
                if (sb.toString().trim().length() >= 40) {
                    result.extractedText = sb.toString().trim();
                }
            }

            result.imagePagesAvailable = totalPages > 0;

            System.out.println("   ↳ Extracted length: " + result.extractedText.length() +
                    ", pages: " + totalPages);

            // Pass 3: OCR fallback (only if enabled and no text found)
            if (ENABLE_OCR && (result.extractedText.isBlank() || result.extractedText.length() < 40)) {
                System.out.println("🔎 No text found, running OCR on pages...");
                PDFRenderer renderer = new PDFRenderer(doc);
                StringBuilder ocrText = new StringBuilder();
                ITesseract tesseract = new Tesseract();
                // Point this to your tessdata folder
                tesseract.setDatapath("/usr/share/tesseract-ocr/4.00/tessdata");
                tesseract.setLanguage("eng");

                int total = Math.min(totalPages, MAX_IMAGE_PAGES);
                for (int i = 0; i < total; i++) {
                    try {
                        BufferedImage img = renderer.renderImageWithDPI(i, IMAGE_DPI, ImageType.RGB);
                        String pageText = tesseract.doOCR(img);
                        if (pageText != null && !pageText.isBlank()) {
                            ocrText.append(pageText).append("\n");
                        }
                    } catch (Exception pe) {
                        System.err.println("⚠️ OCR error on page " + (i + 1) + ": " + pe.getMessage());
                    }
                }

                if (ocrText.toString().trim().length() >= 40) {
                    result.extractedText = ocrText.toString().trim();
                    System.out.println("✅ OCR extracted length: " + result.extractedText.length());
                } else {
                    System.out.println("⚠️ OCR produced insufficient text, falling back to images.");
                }
            }

        } catch (Exception e) {
            System.err.println("⚠️ PDF extraction error: " + e.getMessage());
        }
        return result;
    }

    private BufferedImage[] renderImages(MultipartFile file, int maxPages) {
        System.out.println("🖼 Rendering images (lazy)...");
        List<BufferedImage> list = new ArrayList<>();
        try (InputStream is = file.getInputStream(); PDDocument doc = PDDocument.load(is)) {
            PDFRenderer renderer = new PDFRenderer(doc);
            int total = Math.min(doc.getNumberOfPages(), maxPages);
            for (int i = 0; i < total; i++) {
                try {
                    BufferedImage img = renderer.renderImageWithDPI(i, IMAGE_DPI, ImageType.RGB);
                    list.add(img);
                } catch (Exception pe) {
                    System.err.println("   ↳ Page " + (i + 1) + " render error: " + pe.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Image rendering failed: " + e.getMessage());
        }
        System.out.println("   ↳ Rendered pages: " + list.size());
        return list.toArray(new BufferedImage[0]);
    }

    /* ===================== ANALYSIS PATH DECISION ===================== */

    private static class AnalysisPlan {
        String method;          // "text", "image", "fallback"
        boolean requiresImages;
    }

    private AnalysisPlan decideAnalysisPath(boolean textMeaningful,
                                            boolean imageAvailableFlag,
                                            String extractedText) {
        AnalysisPlan plan = new AnalysisPlan();
        if (textMeaningful) {
            plan.method = "text";
            plan.requiresImages = false;
        } else if (imageAvailableFlag) {
            plan.method = "image";
            plan.requiresImages = true;
        } else {
            plan.method = "fallback";
            plan.requiresImages = false;
        }
        System.out.printf("📌 Decision: method=%s (textMeaningful=%s, imagesPossible=%s, extractedLen=%d)%n",
                plan.method, textMeaningful, imageAvailableFlag,
                extractedText == null ? 0 : extractedText.length());
        return plan;
    }

    /* ===================== TEXT ANALYSIS ===================== */

    private ResumeAnalysisResponse performTextAnalysis(String text) {
        System.out.println("📝 Performing text-based analysis...");
        try {
            String aiRaw = geminiService.analyzeResume(text, null);
            if (aiRaw == null || aiRaw.isBlank()) {
                System.out.println("   ↳ Empty AI response – combining with basic analysis.");
                return combineBasicAndFallbackAI(text);
            }
            ResumeAnalysisResponse aiParsed = parseAI(aiRaw);
            Map<String, Integer> basic = performBasicAnalysis(text);
            return enhanceWithBasic(aiParsed, basic, text);
        } catch (Exception e) {
            System.err.println("   ↳ Text analysis failed: " + e.getMessage());
            return combineBasicAndFallbackAI(text);
        }
    }

    private ResumeAnalysisResponse combineBasicAndFallbackAI(String text) {
        Map<String, Integer> basic = performBasicAnalysis(text);
        ResumeAnalysisResponse fallbackAI = performAIAnalysis(text); // may itself fallback
        Map<String, Integer> merged = new HashMap<>(basic);
        if (fallbackAI.getScores() != null) merged.putAll(fallbackAI.getScores());

        int overall = fallbackAI.getOverallScore() > 0
                ? fallbackAI.getOverallScore()
                : merged.values().stream().mapToInt(Integer::intValue).sum() / merged.size();

        ResumeAnalysisResponse resp = new ResumeAnalysisResponse();
        resp.setOverallScore(overall);
        resp.setScores(merged);
        resp.setSuggestions(
                fallbackAI.getSuggestions() != null && !fallbackAI.getSuggestions().isEmpty()
                        ? fallbackAI.getSuggestions()
                        : generateBasicSuggestions(basic)
        );
        resp.setExtractedText(text);
        resp.setDetails(createDetails(text));
        return resp;
    }

    /* ===================== IMAGE ANALYSIS ===================== */

    private ResumeAnalysisResponse performImageAnalysis(BufferedImage[] images) {
        System.out.println("🖼 Performing image-based analysis...");
        if (images == null || images.length == 0) {
            System.out.println("   ↳ No images available, returning image fallback.");
            return createImageAnalysisFallback();
        }
        try {
            // TODO: Ensure GeminiService.analyzeResume actually sends images properly (base64 parts).
            String aiRaw = geminiService.analyzeResume("", images);
            if (aiRaw == null || aiRaw.isBlank()) {
                System.out.println("   ↳ Empty AI image response, fallback.");
                return createImageAnalysisFallback();
            }
            return parseAI(aiRaw);
        } catch (Exception e) {
            System.err.println("   ↳ Image analysis failed: " + e.getMessage());
            return createImageAnalysisFallback();
        }
    }

    /* ===================== AI / PARSING HELPERS ===================== */

    private ResumeAnalysisResponse parseAI(String raw) throws IOException {
        if (raw == null || raw.isBlank()) return createFallbackAnalysis();

        try {
            JsonNode root = objectMapper.readTree(raw);

            // If Gemini raw response with candidates → unwrap inner JSON string
            if (root.has("candidates")) {
                JsonNode textNode = root
                        .path("candidates").get(0)
                        .path("content").path("parts").get(0)
                        .path("text");
                if (!textNode.isMissingNode()) {
                    String innerJson = cleanAIResponse(textNode.asText());
                    return objectMapper.readValue(innerJson, ResumeAnalysisResponse.class);
                }
            }

            // Else assume response is already in expected JSON format
            String cleaned = cleanAIResponse(raw);
            if (cleaned.isBlank()) cleaned = "{}";
            return objectMapper.readValue(cleaned, ResumeAnalysisResponse.class);

        } catch (Exception e) {
            System.err.println("⚠️ AI JSON parse error -> fallback: " + e.getMessage());
            return createFallbackAnalysis();
        }
    }


    private ResumeAnalysisResponse enhanceWithBasic(ResumeAnalysisResponse ai,
                                                    Map<String, Integer> basicScores,
                                                    String text) {
        if (ai.getScores() == null || ai.getScores().isEmpty()) {
            ai.setScores(basicScores);
        }
        if (ai.getExtractedText() == null || ai.getExtractedText().isBlank()) {
            ai.setExtractedText(text);
        }
        if (ai.getDetails() == null) {
            ai.setDetails(createDetails(text));
        }
        if (ai.getOverallScore() <= 0 && ai.getScores() != null && !ai.getScores().isEmpty()) {
            ai.setOverallScore(
                    ai.getScores().values().stream().mapToInt(Integer::intValue).sum() / ai.getScores().size()
            );
        }
        return ai;
    }

    /* ===================== SANITIZATION ===================== */

    private String sanitizeExtractedText(String txt) {
        if (txt == null) return "";
        String lc = txt.toLowerCase();
        if (lc.contains("fallback analysis") ||
                lc.contains("unable to extract") ||
                lc.contains("image analysis completed") ||
                lc.contains("processed using image recognition")) {
            return ""; // store empty so UI can decide to show fallback notice
        }
        if (txt.length() > 120_000) {
            return txt.substring(0, 120_000);
        }
        return txt;
    }

    /* ===================== MEANINGFULNESS ===================== */

    private boolean isTextMeaningful(String text) {
        if (text == null) return false;
        String clean = text.replaceAll("\\s+", " ").trim();
        if (clean.length() < MIN_TEXT_LENGTH) return false;
        int wordCount = clean.split("\\s+").length;
        if (wordCount < MIN_WORDS) return false;
        boolean hasAlpha = clean.matches(".*[A-Za-z]{3,}.*");
        boolean hasResumeTokens = clean.toLowerCase()
                .matches(".*(education|experience|skills|email|phone|linkedin|github|project).*");
        return hasAlpha && hasResumeTokens;
    }

    /* ===================== DETAILS ENRICHMENT ===================== */

    private Map<String, Object> ensureDetails(ResumeAnalysisResponse resp) {
        if (resp.getDetails() == null) {
            resp.setDetails(new HashMap<>());
        }
        return resp.getDetails();
    }

    private void addCommonDetails(Map<String, Object> details,
                                  String method,
                                  BufferedImage[] images,
                                  String extractedText,
                                  long processingMs) {
        details.put("analysisMethod", method);
        details.put("isImageBased", "image".equals(method));
        details.put("hasTextContent", extractedText != null && !extractedText.isBlank());
        details.put("imagePages", images == null ? 0 : images.length);
        details.put("processingTimeMs", processingMs);
        if (!details.containsKey("wordCount")) {
            details.put("wordCount", extractedText == null ? 0 : extractedText.split("\\s+").length);
        }
    }

    /* ===================== SAVE ===================== */

    @Transactional

    private ResumeAnalysis saveAnalysis(Long userId,
                                        MultipartFile file,
                                        ResumeAnalysisResponse analysis,
                                        String extractedText,
                                        long processingTimeMs) {
        try {
            // 1. Create entity with basic info
            ResumeAnalysis entity = new ResumeAnalysis(userId, file.getOriginalFilename());
            entity.setFileSize(file.getSize());
            entity.setOverallScore(analysis.getOverallScore());
            entity.setExtractedText(extractedText);
            entity.setProcessingTimeMs(processingTimeMs);

            // Save scores
            Map<String, Integer> scores = analysis.getScores();
            if (scores != null) {
                entity.setContentScore(scores.getOrDefault("content", 0));
                entity.setFormattingScore(scores.getOrDefault("formatting", 0));
                entity.setKeywordsScore(scores.getOrDefault("keywords", 0));
                entity.setStructureScore(scores.getOrDefault("structure", 0));
                entity.setContactScore(scores.getOrDefault("contact", 0));
                entity.setSkillsScore(scores.getOrDefault("skills", 0));
                entity.setExperienceScore(scores.getOrDefault("experience", 0));
                entity.setEducationScore(scores.getOrDefault("education", 0));
            }

            if (analysis.getSuggestions() != null) {
                entity.setSuggestionsJson(objectMapper.writeValueAsString(analysis.getSuggestions()));
            }

            // 2. Save once to generate ID
            ResumeAnalysis savedEntity = resumeAnalysisRepository.save(entity);

            // 3. Use ID to create folder path
            String baseDir = imagesBaseDir + "/" + userId + "/" + savedEntity.getId();
            Files.createDirectories(Paths.get(baseDir));

            List<String> pageUrls = new ArrayList<>();

            // 4. Render images and update entity
            try (InputStream is = file.getInputStream(); PDDocument doc = PDDocument.load(is)) {
                PDFRenderer renderer = new PDFRenderer(doc);
                int total = Math.min(doc.getNumberOfPages(), MAX_IMAGE_PAGES);

                for (int i = 0; i < total; i++) {
                    BufferedImage img = renderer.renderImageWithDPI(i, IMAGE_DPI, ImageType.RGB);
                    String filenameOut = "page-" + (i + 1) + ".png";
                    File outFile = new File(baseDir, filenameOut);
                    ImageIO.write(img, "png", outFile);

                    String url = "/api/resume/image/" + savedEntity.getId() + "/" + (i + 1);
                    pageUrls.add(url);

                    if (i == 0) {
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        ImageIO.write(img, "png", baos);
                        savedEntity.setFirstPageImage(baos.toByteArray());
                        savedEntity.setFirstPageMime("image/png");
                        savedEntity.setFirstPageWidth(img.getWidth());
                        savedEntity.setFirstPageHeight(img.getHeight());
                    }
                }
            }

            // 5. Update details + page images
            Map<String, Object> details = analysis.getDetails() == null
                    ? new HashMap<>()
                    : new HashMap<>(analysis.getDetails());
            details.put("pageImages", pageUrls);

            savedEntity.setAnalysisDetailsJson(objectMapper.writeValueAsString(details));
            savedEntity.setPageImagesJson(objectMapper.writeValueAsString(pageUrls));

            // 6. Save again with images
            ResumeAnalysis finalEntity = resumeAnalysisRepository.save(savedEntity);

            System.out.println("💾 Saved analysis ID=" + finalEntity.getId() + " with " + pageUrls.size() + " page images");

            return finalEntity;
        } catch (Exception e) {
            throw new RuntimeException("Failed to save analysis: " + e.getMessage(), e);
        }
    }



    /* ===================== HISTORY / RETRIEVAL ===================== */

    public List<ResumeAnalysisResponse> getUserAnalysisHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<ResumeAnalysis> list = resumeAnalysisRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return list.stream().map(this::convertToResponse).toList();
    }

    public ResumeAnalysisResponse getAnalysisById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ResumeAnalysis entity = resumeAnalysisRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));
        if (!entity.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }
        return convertToResponse(entity);
    }

    public Map<String, Object> getUserAnalysisStats(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> stats = new HashMap<>();
        Long total = resumeAnalysisRepository.countByUserId(user.getId());
        Double avg = resumeAnalysisRepository.calculateAverageScoreByUserId(user.getId());
        Optional<ResumeAnalysis> best = resumeAnalysisRepository.findBestAnalysisByUserId(user.getId());

        stats.put("totalAnalyses", total == null ? 0L : total);
        stats.put("averageScore", avg == null ? 0 : avg.intValue());
        stats.put("bestScore", best.map(ResumeAnalysis::getOverallScore).orElse(0));

        List<ResumeAnalysis> trend = resumeAnalysisRepository.findRecentAnalysesForTrend(user.getId());
        if (trend != null && trend.size() >= 2) {
            int latest = trend.get(0).getOverallScore();
            int previous = trend.get(1).getOverallScore();
            stats.put("improvementTrend", latest > previous ? "improving" :
                    latest < previous ? "declining" : "stable");
            stats.put("improvementPoints", latest - previous);
        } else {
            stats.put("improvementTrend", "insufficient_data");
            stats.put("improvementPoints", 0);
        }

        LocalDate today = LocalDate.now();
        Boolean hasToday = resumeAnalysisRepository.hasAnalyzedToday(
                user.getId(),
                today.atStartOfDay(),
                today.plusDays(1).atStartOfDay()
        );
        stats.put("hasAnalyzedToday", hasToday != null && hasToday);
        return stats;
    }

    private ResumeAnalysisResponse convertToResponse(ResumeAnalysis entity) {
        try {
            ResumeAnalysisResponse resp = new ResumeAnalysisResponse();
            resp.setOverallScore(entity.getOverallScore() == null ? 0 : entity.getOverallScore());
            resp.setExtractedText(entity.getExtractedText());

            Map<String, Integer> scores = new HashMap<>();
            scores.put("content", safeInt(entity.getContentScore()));
            scores.put("formatting", safeInt(entity.getFormattingScore()));
            scores.put("keywords", safeInt(entity.getKeywordsScore()));
            scores.put("structure", safeInt(entity.getStructureScore()));
            scores.put("contact", safeInt(entity.getContactScore()));
            scores.put("skills", safeInt(entity.getSkillsScore()));
            scores.put("experience", safeInt(entity.getExperienceScore()));
            scores.put("education", safeInt(entity.getEducationScore()));
            resp.setScores(scores);

            if (entity.getSuggestionsJson() != null && !entity.getSuggestionsJson().isBlank()) {
                try {
                    List<ResumeAnalysisResponse.Suggestion> sug =
                            objectMapper.readValue(entity.getSuggestionsJson(),
                                    objectMapper.getTypeFactory()
                                            .constructCollectionType(List.class, ResumeAnalysisResponse.Suggestion.class));
                    resp.setSuggestions(sug);
                } catch (Exception ex) {
                    resp.setSuggestions(new ArrayList<>());
                }
            } else {
                resp.setSuggestions(new ArrayList<>());
            }

            Map<String, Object> details = new HashMap<>();
            if (entity.getAnalysisDetailsJson() != null && !entity.getAnalysisDetailsJson().isBlank()) {
                try {
                    details.putAll(objectMapper.readValue(entity.getAnalysisDetailsJson(), Map.class));
                } catch (Exception ignore) { }
            }
            details.put("analysisId", entity.getId());
            details.put("filename", entity.getFilename());
            details.put("fileSize", entity.getFileSize());
            details.put("createdAt", entity.getCreatedAt());
            details.put("processingTimeMs", entity.getProcessingTimeMs());
            resp.setDetails(details);

            return resp;
        } catch (Exception e) {
            throw new RuntimeException("convertToResponse failed: " + e.getMessage(), e);
        }
    }

    private int safeInt(Integer v) { return v == null ? 0 : v; }

    /* ===================== BASIC SCORING ===================== */

    private Map<String, Integer> performBasicAnalysis(String text) {
        Map<String, Integer> map = new HashMap<>();
        try {
            map.put("content", calculateLengthScore(text));
            map.put("contact", calculateContactScore(text));
            map.put("skills", calculateSkillsScore(text));
            map.put("experience", calculateExperienceScore(text));
            map.put("education", calculateEducationScore(text));
            map.put("formatting", 72);
            map.put("keywords", 64);
            map.put("structure", 70);
        } catch (Exception e) {
            map.put("content", 50);
            map.put("contact", 50);
            map.put("skills", 50);
            map.put("experience", 50);
            map.put("education", 50);
            map.put("formatting", 50);
            map.put("keywords", 50);
            map.put("structure", 50);
        }
        return map;
    }

    private List<ResumeAnalysisResponse.Suggestion> generateBasicSuggestions(Map<String, Integer> scores) {
        List<ResumeAnalysisResponse.Suggestion> out = new ArrayList<>();
        if (scores.getOrDefault("contact", 0) < 80) {
            out.add(new ResumeAnalysisResponse.Suggestion(
                    "Add Complete Contact Info",
                    "Include email, phone, LinkedIn, and GitHub (if relevant).",
                    "Contact", "high"
            ));
        }
        if (scores.getOrDefault("skills", 0) < 70) {
            out.add(new ResumeAnalysisResponse.Suggestion(
                    "Strengthen Skills Section",
                    "Add specific tools, frameworks, and quantify proficiency if possible.",
                    "Skills", "medium"
            ));
        }
        if (scores.getOrDefault("experience", 0) < 60) {
            out.add(new ResumeAnalysisResponse.Suggestion(
                    "Add Experience/Projects",
                    "List internships or projects with impact statements (metrics, outcomes).",
                    "Experience", "medium"
            ));
        }
        return out;
    }

    private Map<String, Object> createDetails(String text) {
        Map<String, Object> d = new HashMap<>();
        if (text == null || text.isBlank()) {
            d.put("wordCount", 0);
            d.put("hasContactInfo", false);
            d.put("hasSkillsSection", false);
            d.put("hasExperience", false);
            d.put("hasEducation", false);
        } else {
            d.put("wordCount", text.split("\\s+").length);
            d.put("hasContactInfo", text.contains("@"));
            String lower = text.toLowerCase();
            d.put("hasSkillsSection", lower.contains("skills"));
            d.put("hasExperience", lower.contains("experience"));
            d.put("hasEducation", lower.contains("education"));
        }
        return d;
    }

    /* ===================== AI FALLBACKS ===================== */

    private ResumeAnalysisResponse createFallbackAnalysis() {
        ResumeAnalysisResponse r = new ResumeAnalysisResponse();
        r.setOverallScore(60);
        Map<String, Integer> s = new HashMap<>();
        s.put("content", 60);
        s.put("structure", 58);
        s.put("formatting", 62);
        s.put("keywords", 55);
        s.put("contact", 55);
        s.put("skills", 60);
        s.put("experience", 55);
        s.put("education", 65);
        r.setScores(s);
        r.setSuggestions(List.of(
                new ResumeAnalysisResponse.Suggestion(
                        "AI Limited",
                        "Fallback heuristic analysis used. Try again later for deeper insights.",
                        "System", "low"
                )
        ));
        r.setDetails(new HashMap<>());
        r.setExtractedText("");
        return r;
    }

    private ResumeAnalysisResponse createImageAnalysisFallback() {
        ResumeAnalysisResponse r = new ResumeAnalysisResponse();
        r.setOverallScore(45);
        Map<String, Integer> s = new HashMap<>();
        s.put("content", 40);
        s.put("contact", 50);
        s.put("skills", 45);
        s.put("experience", 40);
        s.put("education", 58);
        s.put("formatting", 50);
        s.put("keywords", 35);
        s.put("structure", 45);
        r.setScores(s);
        r.setSuggestions(List.of(
                new ResumeAnalysisResponse.Suggestion(
                        "Image-Based Only",
                        "This appears to be image or non-selectable text. Upload a text-based PDF for richer analysis.",
                        "Format", "medium"
                ),
                new ResumeAnalysisResponse.Suggestion(
                        "Improve Clarity",
                        "Ensure high contrast and no blurring to enable OCR or text extraction.",
                        "Format", "low"
                )
        ));
        Map<String, Object> d = new HashMap<>();
        d.put("analysisMethod", "image_fallback");
        d.put("isImageBased", true);
        d.put("wordCount", 0);
        d.put("hasContactInfo", false);
        d.put("hasSkillsSection", false);
        d.put("hasExperience", false);
        d.put("hasEducation", false);
        d.put("fallbackReason", "no_selectable_text");
        r.setDetails(d);
        r.setExtractedText(""); // keep empty
        return r;
    }

    /* ===================== METRIC CALCULATORS ===================== */

    private int calculateLengthScore(String text) {
        if (text == null || text.isBlank()) return 0;
        int words = text.split("\\s+").length;
        if (words >= 300 && words <= 800) return 100;
        if (words >= 200 && words <= 1000) return 80;
        if (words >= 100 && words <= 1200) return 60;
        return 40;
    }

    private int calculateContactScore(String text) {
        if (text == null) return 0;
        int sc = 0;
        if (Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b").matcher(text).find()) sc += 40;
        if (Pattern.compile("\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b").matcher(text).find()) sc += 30;
        String lower = text.toLowerCase();
        if (lower.contains("linkedin")) sc += 15;
        if (lower.contains("github")) sc += 15;
        return Math.min(sc, 100);
    }

    private int calculateSkillsScore(String text) {
        if (text == null) return 0;
        String l = text.toLowerCase();
        if (l.contains("skills") || l.contains("technical")) return 90;
        if (l.contains("java") || l.contains("python") || l.contains("javascript")) return 70;
        return 50;
    }

    private int calculateExperienceScore(String text) {
        if (text == null) return 0;
        String l = text.toLowerCase();
        if (l.contains("experience") && l.contains("work")) return 90;
        if (l.contains("internship") || l.contains("project")) return 70;
        return 50;
    }

    private int calculateEducationScore(String text) {
        if (text == null) return 0;
        String l = text.toLowerCase();
        if (l.contains("education") || l.contains("university") || l.contains("degree")) return 90;
        return 60;
    }

    /* ===================== PROMPT BUILD / CLEAN ===================== */

    private ResumeAnalysisResponse performAIAnalysis(String resumeText) {
        try {
            String prompt = buildAnalysisPrompt(resumeText);
            String ai = geminiService.askGemini(prompt);
            if (ai == null || ai.isBlank()) return createFallbackAnalysis();
            return parseAI(ai);
        } catch (Exception e) {
            return createFallbackAnalysis();
        }
    }

    private String buildAnalysisPrompt(String resumeText) {
        return "Analyze this resume and return ONLY JSON with structure: " +
                "{overallScore,scores:{content,formatting,keywords,structure,contact,skills,experience,education}," +
                "suggestions:[{title,description,category,severity}],details:{wordCount,hasContactInfo,hasSkillsSection,hasExperience,hasEducation},extractedText}.\n" +
                "If short or sparse, produce conservative scores.\n" +
                "Resume (first 2000 chars):\n" +
                resumeText.substring(0, Math.min(2000, resumeText.length()));
    }

    private String cleanAIResponse(String response) {
        if (response == null) return "";
        String c = response.trim();
        if (c.startsWith("```")) {
            int firstNl = c.indexOf('\n');
            if (firstNl > -1) c = c.substring(firstNl + 1);
            int lastTicks = c.lastIndexOf("```");
            if (lastTicks > -1) c = c.substring(0, lastTicks);
        }
        int fb = c.indexOf('{');
        if (fb > 0) c = c.substring(fb);
        int lb = c.lastIndexOf('}');
        if (lb > 0 && lb < c.length() - 1) c = c.substring(0, lb + 1);
        return c.trim();
    }
}