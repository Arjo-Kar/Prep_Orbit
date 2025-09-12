package com.preporbit.prep_orbit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.preporbit.prep_orbit.config.InterviewAIConfig;
import com.preporbit.prep_orbit.dto.InterviewFeedbackDto;
import com.preporbit.prep_orbit.exception.FeedbackThrottleException;
import com.preporbit.prep_orbit.model.InterviewFeedback;
import com.preporbit.prep_orbit.repository.InterviewFeedbackRepository;
import com.preporbit.prep_orbit.repository.InterviewRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.*;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * InterviewFeedbackService
 *
 * Features:
 *  - Idempotent-friendly (controller enforces existing-first)
 *  - Throttle enforcement per interviewId
 *  - Transcript sanitization (remove system prompt echoes & duplicates)
 *  - Optional truncation for large transcripts
 *  - Gemini AI integration (comprehensive + fallback)
 *  - Score normalization (1–10)
 */
@Service
public class InterviewFeedbackService {

    private static final Logger logger = LoggerFactory.getLogger(InterviewFeedbackService.class);

    /* Limits & thresholds */
    private static final int MAX_TRANSCRIPT_CHARS = 12000;
    private static final int MIN_THROTTLE_INTERVAL_SECONDS = 10;
    private static final int MAX_STRENGTHS_LENGTH = 5000;
    private static final int MAX_IMPROVEMENTS_LENGTH = 5000;
    private static final int MAX_FEEDBACK_LENGTH = 12000;

    /* Throttle map: interviewId -> last invocation timestamp */
    private final Map<Long, LocalDateTime> lastGeneration = new ConcurrentHashMap<>();

    @Autowired private InterviewFeedbackRepository feedbackRepository;
    @Autowired private InterviewRepository interviewRepository;
    @Autowired private InterviewAIConfig interviewAIConfig;
    @Autowired @Qualifier("interviewRestTemplate") private RestTemplate restTemplate;
    @Autowired private ObjectMapper objectMapper;

    /* ====================== PUBLIC API ====================== */

    /**
     * Generate "basic" feedback (not used by controller right now but kept for future use).
     */
    public InterviewFeedback generateFeedback(@Valid InterviewFeedbackDto feedbackDto) {
        throttle(feedbackDto.getInterviewId());
        validateInterviewExists(feedbackDto.getInterviewId());

        InterviewFeedback feedback = upsertFeedback(feedbackDto);

        List<InterviewFeedbackDto.TranscriptMessage> sanitized =
                sanitizeTranscript(feedbackDto.getTranscript());
        sanitized = truncateTranscriptIfNeeded(sanitized);
        feedback.setTranscript(convertTranscriptToJson(sanitized));

        Map<String, Object> aiFeedback = generateAIFeedback(sanitized);
        applyFeedbackMap(feedback, aiFeedback);

        InterviewFeedback saved = feedbackRepository.save(feedback);
        logPersistResult(saved, aiFeedback, false);
        return saved;
    }

    /**
     * Generate comprehensive feedback (primary path).
     */
    public InterviewFeedback generateComprehensiveFeedback(@Valid InterviewFeedbackDto feedbackDto) {
        throttle(feedbackDto.getInterviewId());
        validateInterviewExists(feedbackDto.getInterviewId());

        logger.info("📥 Comprehensive generation start interviewId={} userId={} rawTranscriptCount={}",
                feedbackDto.getInterviewId(),
                feedbackDto.getUserId(),
                feedbackDto.getTranscript() == null ? 0 : feedbackDto.getTranscript().size());

        if (feedbackDto.getTranscript() == null || feedbackDto.getTranscript().isEmpty()) {
            logger.warn("⚠️ Empty transcript provided (fallback will still produce output)");
        }

        InterviewFeedback feedback = upsertFeedback(feedbackDto);

        List<InterviewFeedbackDto.TranscriptMessage> sanitized =
                sanitizeTranscript(feedbackDto.getTranscript());
        sanitized = truncateTranscriptIfNeeded(sanitized);

        int approxChars = sanitized.stream()
                .mapToInt(m -> m.getContent() == null ? 0 : m.getContent().length()).sum();

        logger.info("🧼 Sanitized transcript messages={} approxChars={} firstSnippet='{}'",
                sanitized.size(),
                approxChars,
                sanitized.isEmpty() ? "" :
                        sanitized.get(0).getContent().substring(0,
                                Math.min(120, sanitized.get(0).getContent().length()))
        );

        feedback.setTranscript(convertTranscriptToJson(sanitized));

        Map<String, Object> aiFeedback = generateComprehensiveAIFeedback(feedbackDto, sanitized);
        applyFeedbackMap(feedback, aiFeedback);

        InterviewFeedback saved = feedbackRepository.save(feedback);
        logPersistResult(saved, aiFeedback, true);
        return saved;
    }

    public boolean feedbackExists(Long interviewId, Long userId) {
        return feedbackRepository.findByInterviewIdAndUserId(interviewId, userId).isPresent();
    }

    public Optional<InterviewFeedback> getExisting(Long interviewId, Long userId) {
        return feedbackRepository.findByInterviewIdAndUserId(interviewId, userId);
    }

    public InterviewFeedback getFeedbackByInterviewAndUser(Long interviewId, Long userId) {
        return feedbackRepository.findByInterviewIdAndUserId(interviewId, userId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
    }

    public List<InterviewFeedback> getFeedbackByUserId(Long userId) {
        return feedbackRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Double getAverageScoreByUserId(Long userId) {
        return feedbackRepository.getAverageScoreByUserId(userId);
    }

    public Map<String, Object> getFeedbackStats(Long userId) {
        List<InterviewFeedback> list = feedbackRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFeedbacks", list.size());
        if (!list.isEmpty()) {
            stats.put("averageOverallScore", round2(list.stream().mapToInt(InterviewFeedback::getOverallScore).average().orElse(0)));
            stats.put("averageCommunicationScore", round2(list.stream().mapToInt(InterviewFeedback::getCommunicationScore).average().orElse(0)));
            stats.put("averageTechnicalScore", round2(list.stream().mapToInt(InterviewFeedback::getTechnicalScore).average().orElse(0)));
            stats.put("averageProblemSolvingScore", round2(list.stream().mapToInt(InterviewFeedback::getProblemSolvingScore).average().orElse(0)));
        } else {
            stats.put("averageOverallScore", 0.0);
            stats.put("averageCommunicationScore", 0.0);
            stats.put("averageTechnicalScore", 0.0);
            stats.put("averageProblemSolvingScore", 0.0);
        }
        return stats;
    }

    public List<InterviewFeedback> getFeedbackByInterviewId(Long interviewId) {
        logger.info("🔍 Fetching feedback list for interview ID: {}", interviewId);
        return feedbackRepository.findByInterviewId(interviewId);
    }

    /* ====================== THROTTLING ====================== */

    private void throttle(Long interviewId) {
        if (interviewId == null) return;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last = lastGeneration.get(interviewId);
        if (last != null) {
            long seconds = Duration.between(last, now).getSeconds();
            if (seconds < MIN_THROTTLE_INTERVAL_SECONDS) {
                throw new FeedbackThrottleException(
                        "Feedback generation throttled. Retry in " +
                                (MIN_THROTTLE_INTERVAL_SECONDS - seconds) + "s");
            }
        }
        lastGeneration.put(interviewId, now);
    }

    /* ====================== CORE LOGIC HELPERS ====================== */

    private void validateInterviewExists(Long interviewId) {
        if (interviewId == null || !interviewRepository.existsById(interviewId)) {
            throw new RuntimeException("Interview not found: " + interviewId);
        }
    }

    private InterviewFeedback upsertFeedback(InterviewFeedbackDto dto) {
        Optional<InterviewFeedback> existing =
                feedbackRepository.findByInterviewIdAndUserId(dto.getInterviewId(), dto.getUserId());

        InterviewFeedback feedback;
        if (existing.isPresent()) {
            feedback = existing.get();
            logger.info("♻️ Updating existing feedback id={}", feedback.getId());
        } else {
            feedback = new InterviewFeedback();
            feedback.setInterviewId(dto.getInterviewId());
            feedback.setUserId(dto.getUserId());
            feedback.setCreatedAt(LocalDateTime.now());
        }
        feedback.setUpdatedAt(LocalDateTime.now());
        return feedback;
    }

    private void applyFeedbackMap(InterviewFeedback entity, Map<String, Object> map) {
        entity.setFeedback(sanitizeLength(safeStr(map.get("feedback")), MAX_FEEDBACK_LENGTH));
        entity.setOverallScore(normScore(map.get("overallScore"), 7));
        entity.setCommunicationScore(normScore(map.get("communicationScore"), 7));
        entity.setTechnicalScore(normScore(map.get("technicalScore"), 7));
        entity.setProblemSolvingScore(normScore(map.get("problemSolvingScore"), 7));
        entity.setStrengths(sanitizeLength(safeStr(map.get("strengths")), MAX_STRENGTHS_LENGTH));
        entity.setImprovements(sanitizeLength(safeStr(map.get("improvements")), MAX_IMPROVEMENTS_LENGTH));
    }

    private void logPersistResult(InterviewFeedback saved, Map<String, Object> aiFeedback, boolean comprehensive) {
        logger.info("✅ {} feedback saved: id={} fallback={} overallScore={}",
                comprehensive ? "Comprehensive" : "Basic",
                saved.getId(),
                aiFeedback.get("fallback"),
                saved.getOverallScore());
    }

    /* ====================== SANITIZATION & TRUNCATION ====================== */

    private List<InterviewFeedbackDto.TranscriptMessage> sanitizeTranscript(List<InterviewFeedbackDto.TranscriptMessage> original) {
        if (original == null) return List.of();
        List<InterviewFeedbackDto.TranscriptMessage> cleaned = new ArrayList<>();
        String signature = "you are an ai interview assistant conducting a strictly sequential interview";

        for (InterviewFeedbackDto.TranscriptMessage m : original) {
            if (m.getContent() == null) continue;
            String lower = m.getContent().toLowerCase();

            // Remove system prompt echoes / rule dumps
            if (lower.contains(signature)) continue;
            int ruleHits = 0;
            if (lower.contains("you have exactly")) ruleHits++;
            if (lower.contains("wait for the user")) ruleHits++;
            if (lower.contains("do not restate")) ruleHits++;
            if (lower.contains("interview complete. generating feedback now")) ruleHits++;
            if (ruleHits >= 2) continue;

            // Merge duplicates (same role + same normalized content)
            if (!cleaned.isEmpty()) {
                InterviewFeedbackDto.TranscriptMessage last = cleaned.get(cleaned.size() - 1);
                if (last.getRole().equals(m.getRole()) &&
                        last.getContent().trim().equalsIgnoreCase(m.getContent().trim())) {
                    continue;
                }
            }
            cleaned.add(m);
        }
        return cleaned;
    }

    private List<InterviewFeedbackDto.TranscriptMessage> truncateTranscriptIfNeeded(List<InterviewFeedbackDto.TranscriptMessage> msgs) {
        int total = msgs.stream().mapToInt(m -> m.getContent() != null ? m.getContent().length() : 0).sum();
        if (total <= MAX_TRANSCRIPT_CHARS) return msgs;

        logger.warn("✂️ Truncating transcript ({} chars > {} limit)", total, MAX_TRANSCRIPT_CHARS);

        int target = MAX_TRANSCRIPT_CHARS;
        int firstBlockChars = (int) (target * 0.6);
        int tailBlockChars  = (int) (target * 0.2);

        List<InterviewFeedbackDto.TranscriptMessage> head = new ArrayList<>();
        List<InterviewFeedbackDto.TranscriptMessage> tail = new ArrayList<>();

        int acc = 0;
        for (InterviewFeedbackDto.TranscriptMessage m : msgs) {
            int len = m.getContent() == null ? 0 : m.getContent().length();
            if (acc + len > firstBlockChars) break;
            head.add(m);
            acc += len;
        }

        acc = 0;
        for (int i = msgs.size() - 1; i >= 0; i--) {
            InterviewFeedbackDto.TranscriptMessage m = msgs.get(i);
            int len = m.getContent() == null ? 0 : m.getContent().length();
            if (acc + len > tailBlockChars) break;
            tail.add(0, m);
            acc += len;
        }

        InterviewFeedbackDto.TranscriptMessage marker =
                new InterviewFeedbackDto.TranscriptMessage(
                        "system",
                        "[Transcript truncated for analysis due to length]"
                );

        List<InterviewFeedbackDto.TranscriptMessage> merged = new ArrayList<>();
        merged.addAll(head);
        merged.add(marker);
        merged.addAll(tail);
        return merged;
    }

    /* ====================== PROMPT BUILDERS ====================== */

    private String buildBasicPrompt(List<InterviewFeedbackDto.TranscriptMessage> transcript) {
        StringBuilder transcriptText = new StringBuilder();
        for (InterviewFeedbackDto.TranscriptMessage message : transcript) {
            transcriptText.append(message.getRole()).append(": ").append(message.getContent()).append("\n");
        }
        return
                "Analyze this job interview transcript and provide detailed feedback.\n" +
                        "Return ONLY valid JSON with keys:\n" +
                        "{ \"feedback\": \"...\", \"overallScore\":7, \"communicationScore\":7, \"technicalScore\":6, \"problemSolvingScore\":7, \"strengths\":\"...\", \"improvements\":\"...\" }\n" +
                        "Scores are integers 1-10.\n\n" +
                        "Transcript:\n" + transcriptText;
    }

    private String buildComprehensivePrompt(InterviewFeedbackDto dto,
                                            List<InterviewFeedbackDto.TranscriptMessage> sanitized) {

        StringBuilder transcriptBlock = new StringBuilder();
        sanitized.forEach(m ->
                transcriptBlock.append(m.getRole()).append(": ").append(m.getContent()).append("\n")
        );

        StringBuilder responsesBlock = new StringBuilder();
        if (dto.getResponses() != null) {
            dto.getResponses().forEach(r -> {
                responsesBlock.append("Q").append(r.getQuestionNumber()).append(": ").append(r.getQuestion()).append("\n");
                responsesBlock.append("A").append(r.getQuestionNumber()).append(": ").append(r.getAnswer()).append("\n");
            });
        }

        return
                "You are an expert technical + behavioral interview evaluator.\n" +
                        "Return ONLY JSON (no markdown, no commentary). Schema:\n" +
                        "{ \"feedback\": \"3-6 sentences\", \"overallScore\":7, \"communicationScore\":7, \"technicalScore\":7, \"problemSolvingScore\":7, \"strengths\": \"lines\", \"improvements\": \"lines\" }\n" +
                        "Scores must be integers 1-10. Use newlines between bullet-like lines.\n\n" +
                        "CONTEXT:\n" +
                        "- TotalQuestions: " + nz(dto.getTotalQuestions()) + "\n" +
                        "- TotalAnswers: " + nz(dto.getTotalAnswers()) + "\n" +
                        "- DurationSeconds: " + nz(dto.getDuration()) + "\n" +
                        "- Metadata: " + dto.getInterviewMetadata() + "\n\n" +
                        "TRANSCRIPT:\n" + transcriptBlock + "\n" +
                        "QUESTION_ANSWER_PAIRS:\n" + responsesBlock + "\n" +
                        "Return ONLY the JSON object.";
    }

    /* ====================== AI FEEDBACK GENERATION ====================== */

    private Map<String, Object> generateAIFeedback(List<InterviewFeedbackDto.TranscriptMessage> transcript) {
        if (!interviewAIConfig.isConfigured()) {
            logger.warn("AI not configured; using BASIC fallback feedback");
            return createFallbackFeedback(true);
        }
        String prompt = buildBasicPrompt(transcript);
        Map<String, Object> parsed = callGemini(prompt);
        if (parsed == null) return createFallbackFeedback(true);
        parsed.put("fallback", false);
        return parsed;
    }

    private Map<String, Object> generateComprehensiveAIFeedback(InterviewFeedbackDto dto,
                                                                List<InterviewFeedbackDto.TranscriptMessage> sanitized) {
        if (!interviewAIConfig.isConfigured()) {
            logger.warn("AI not configured; using COMPREHENSIVE fallback feedback");
            return createComprehensiveFallbackFeedback(dto, true);
        }
        String prompt = buildComprehensivePrompt(dto, sanitized);
        Map<String, Object> parsed = callGemini(prompt);
        if (parsed == null) return createComprehensiveFallbackFeedback(dto, true);

        parsed.put("fallback", false);
        parsed.put("overallScore", normScore(parsed.get("overallScore"), 7));
        parsed.put("communicationScore", normScore(parsed.get("communicationScore"), 7));
        parsed.put("technicalScore", normScore(parsed.get("technicalScore"), 7));
        parsed.put("problemSolvingScore", normScore(parsed.get("problemSolvingScore"), 7));

        return parsed;
    }

    /* ====================== GEMINI CALL + PARSE ====================== */

    private enum AIErrorType { NOT_CONFIGURED, TRANSPORT, EMPTY_CANDIDATES, PARSE_ERROR }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callGemini(String prompt) {
        long start = System.currentTimeMillis();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            content.put("parts", List.of(part));
            requestBody.put("contents", List.of(content));

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.6);
            generationConfig.put("topK", 40);
            generationConfig.put("topP", 0.9);
            generationConfig.put("maxOutputTokens", 1536);
            requestBody.put("generationConfig", generationConfig);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String url = interviewAIConfig.getGenerateContentUrl() + "?key=" + interviewAIConfig.getGoogleApiKey();

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            long elapsed = System.currentTimeMillis() - start;

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                logAIError(AIErrorType.TRANSPORT, "Status=" + response.getStatusCode());
                return null;
            }

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                logAIError(AIErrorType.EMPTY_CANDIDATES, "No candidates");
                return null;
            }

            Map<String, Object> candContent = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> outParts = (List<Map<String, Object>>) candContent.get("parts");
            if (outParts == null || outParts.isEmpty()) {
                logAIError(AIErrorType.EMPTY_CANDIDATES, "No parts in candidate");
                return null;
            }

            String generatedText = (String) outParts.get(0).get("text");
            Map<String, Object> parsed = parseFeedbackResponse(generatedText);
            if (parsed == null) {
                logAIError(AIErrorType.PARSE_ERROR, "Parse returned null");
                return null;
            }

            Object usage = response.getBody().get("usageMetadata");
            logger.info("🧠 AI call success in {}ms (usageMetadata={})", elapsed, usage);
            return parsed;

        } catch (Exception e) {
            logAIError(AIErrorType.TRANSPORT, e.getMessage());
            return null;
        }
    }

    private void logAIError(AIErrorType type, String detail) {
        logger.error("❌ AI Error [{}]: {}", type, detail);
    }

    private Map<String, Object> parseFeedbackResponse(String generatedText) {
        try {
            if (generatedText == null) return null;
            String trimmed = generatedText.trim();
            int start = trimmed.indexOf('{');
            int end = trimmed.lastIndexOf('}');
            if (start != -1 && end != -1 && end > start) {
                trimmed = trimmed.substring(start, end + 1);
            }
            return objectMapper.readValue(trimmed, Map.class);
        } catch (Exception e) {
            logger.error("Failed to parse AI JSON", e);
            return null;
        }
    }

    /* ====================== FALLBACK GENERATORS ====================== */

    private Map<String, Object> createFallbackFeedback(boolean basic) {
        Map<String, Object> fb = new HashMap<>();
        fb.put("feedback", basic
                ? "Thank you for completing the interview. Unable to generate detailed AI feedback right now."
                : "Fallback: Detailed analysis pending. The interview transcript has been recorded.");
        fb.put("overallScore", 7);
        fb.put("communicationScore", 7);
        fb.put("technicalScore", 7);
        fb.put("problemSolvingScore", 7);
        fb.put("strengths", "Good engagement; Maintained structure");
        fb.put("improvements", "Provide deeper technical specifics; Elaborate on problem-solving steps");
        fb.put("fallback", true);
        return fb;
    }

    private Map<String, Object> createComprehensiveFallbackFeedback(InterviewFeedbackDto dto, boolean flag) {
        Map<String, Object> fb = createFallbackFeedback(false);
        fb.put("feedback", "Fallback comprehensive feedback.\nQuestions: " + nz(dto.getTotalQuestions()) +
                " Answers: " + nz(dto.getTotalAnswers()) + " Duration(s): " + nz(dto.getDuration()));
        fb.put("fallback", true);
        return fb;
    }

    /* ====================== UTILITIES ====================== */

    private String convertTranscriptToJson(List<InterviewFeedbackDto.TranscriptMessage> transcript) {
        try {
            return objectMapper.writeValueAsString(transcript != null ? transcript : List.of());
        } catch (Exception e) {
            logger.error("Failed to serialize transcript", e);
            return "[]";
        }
    }

    private int normScore(Object val, int def) {
        if (val == null) return def;
        try {
            if (val instanceof Number n) return clampScore(n.intValue());
            if (val instanceof String s) return clampScore(Integer.parseInt(s.trim()));
        } catch (Exception ignored) {}
        return def;
    }

    private int clampScore(int v) { return Math.min(10, Math.max(1, v)); }

    private String safeStr(Object o) { return o == null ? "" : o.toString(); }

    private String nz(Object o) { return o == null ? "0" : o.toString(); }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    private String sanitizeLength(String text, int max) {
        if (text == null) return "";
        if (text.length() <= max) return text;
        return text.substring(0, max) + "...(truncated)";
    }
}