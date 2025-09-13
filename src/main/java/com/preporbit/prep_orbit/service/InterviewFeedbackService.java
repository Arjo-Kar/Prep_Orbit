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
import java.util.stream.Collectors;

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
    private static final int DEFAULT_NEUTRAL_SCORE = 5; //
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

        InterviewFeedback feedback = upsertFeedback(feedbackDto);

        List<InterviewFeedbackDto.TranscriptMessage> sanitized =
                sanitizeTranscript(feedbackDto.getTranscript());
        sanitized = truncateTranscriptIfNeeded(sanitized);

        Map<String, Object> metrics = computeMetrics(feedbackDto, sanitized); // *** NEW

        feedback.setTranscript(convertTranscriptToJson(sanitized));

        Map<String, Object> aiFeedback = generateComprehensiveAIFeedback(feedbackDto, sanitized, metrics); // *** CHANGED signature
        applyHeuristicCaps(aiFeedback, metrics); // *** NEW heuristic enforcement
        applyFeedbackMap(feedback, aiFeedback);

        // Optionally store metrics summary inside feedback text (append)


        InterviewFeedback saved = feedbackRepository.save(feedback);
        logPersistResult(saved, aiFeedback, true);
        return saved;
    }
    private Map<String, Object> computeMetrics(InterviewFeedbackDto dto,
                                               List<InterviewFeedbackDto.TranscriptMessage> sanitized) {
        Map<String, Object> m = new HashMap<>();
        if (sanitized == null || sanitized.isEmpty()) {
            m.put("userAnswerCount", 0);
            m.put("assistantQuestionCount", 0);
            m.put("avgAnswerLen", 0);
            m.put("coveragePct", 0);
            m.put("expectedQuestions", dto.getTotalQuestions() != null ? dto.getTotalQuestions() : 0);
            return m;
        }

        int assistantQuestions = 0;
        int userAnswers = 0;
        List<Integer> userLengths = new ArrayList<>();

        for (int i = 0; i < sanitized.size(); i++) {
            InterviewFeedbackDto.TranscriptMessage msg = sanitized.get(i);
            String role = msg.getRole() == null ? "" : msg.getRole().toLowerCase();
            String content = msg.getContent() == null ? "" : msg.getContent().trim();
            if ("assistant".equals(role) && content.endsWith("?")) {
                assistantQuestions++;
                // Find next user message before another assistant
                for (int j = i + 1; j < sanitized.size(); j++) {
                    InterviewFeedbackDto.TranscriptMessage next = sanitized.get(j);
                    if ("assistant".equalsIgnoreCase(next.getRole())) break;
                    if ("user".equalsIgnoreCase(next.getRole())) {
                        String ans = next.getContent() == null ? "" : next.getContent().trim();
                        if (!ans.isEmpty()) {
                            userAnswers++;
                            userLengths.add(ans.length());
                        }
                        break;
                    }
                }
            }
        }

        double avgLen = userLengths.stream().mapToInt(Integer::intValue).average().orElse(0);
        int expected = dto.getTotalQuestions() != null
                ? dto.getTotalQuestions()
                : assistantQuestions;
        int coveragePct = expected == 0
                ? 0
                : (int)Math.round((100.0 * userAnswers) / Math.max(1, expected));

        m.put("assistantQuestionCount", assistantQuestions);
        m.put("userAnswerCount", userAnswers);
        m.put("avgAnswerLen", (int)Math.round(avgLen));
        m.put("expectedQuestions", expected);
        m.put("coveragePct", coveragePct);
        return m;
    }
    private void applyHeuristicCaps(Map<String, Object> scores, Map<String, Object> metrics) {
        int coverage = ((Number) metrics.getOrDefault("coveragePct", 0)).intValue();
        int avgLen = ((Number) metrics.getOrDefault("avgAnswerLen", 0)).intValue();
        int userAns = ((Number) metrics.getOrDefault("userAnswerCount", 0)).intValue();
        int expected = ((Number) metrics.getOrDefault("expectedQuestions", 0)).intValue();

        // Cap logic:
        // 1. If coverage < 50% or user answered less than half of expected -> all <= 4
        if (expected > 0 && (coverage < 50 || userAns * 2 < expected)) {
            cap(scores, 4, "coverage<50%");
        }
        // 2. If avg answer length < 35 chars -> technical & problem solving <= 5
        if (avgLen < 35) {
            capField(scores, "technicalScore", 5, "short answers");
            capField(scores, "problemSolvingScore", 5, "short answers");
        }
        // 3. If avg answer length < 20 -> overall <= 5
        if (avgLen < 20) {
            capField(scores, "overallScore", 5, "very short answers");
        }
        // 4. If no user answers -> everything = 3 (minimal)
        if (userAns == 0) {
            cap(scores, 3, "no answers");
        }
    }

    private void cap(Map<String,Object> scores, int max, String reason) {
        for (String k : List.of("overallScore","communicationScore","technicalScore","problemSolvingScore")) {
            Object v = scores.get(k);
            if (v instanceof Number n && n.intValue() > max) {
                scores.put(k, max);
            }
        }
        scores.put("capReason", reason);
    }

    private void capField(Map<String,Object> scores, String field, int max, String reason) {
        Object v = scores.get(field);
        if (v instanceof Number n && n.intValue() > max) {
            scores.put(field, max);
            scores.put("capReason", reason);
        }
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
                                            List<InterviewFeedbackDto.TranscriptMessage> sanitized,
                                            Map<String,Object> metrics) {
        String transcriptBlock = sanitized.stream()
                .map(m -> m.getRole() + ": " + m.getContent())
                .collect(Collectors.joining("\n"));

        StringBuilder responsesBlock = new StringBuilder();
        if (dto.getResponses() != null) {
            dto.getResponses().forEach(r -> {
                responsesBlock.append("Q").append(r.getQuestionNumber()).append(": ").append(r.getQuestion()).append("\n");
                responsesBlock.append("A").append(r.getQuestionNumber()).append(": ").append(r.getAnswer()).append("\n");
            });
        }

        int expected = (Integer) metrics.getOrDefault("expectedQuestions", 0);
        int answered = (Integer) metrics.getOrDefault("userAnswerCount", 0);
        int avgLen = (Integer) metrics.getOrDefault("avgAnswerLen", 0);
        int coverage = (Integer) metrics.getOrDefault("coveragePct", 0);

        String rubric =
                "SCORING RUBRIC (MANDATORY):\n" +
                        "- Start all scores at 10 then subtract penalties.\n" +
                        "- Coverage (answered/expected): " + answered + "/" + expected + " (" + coverage + "%)\n" +
                        "  * coverage < 50% => overallScore <= 4\n" +
                        "  * 50-69% => overallScore <= 6\n" +
                        "- Avg answer length (chars): " + avgLen + "\n" +
                        "  * avgLen < 20 => technicalScore & problemSolvingScore <= 4\n" +
                        "  * 20-34 => technicalScore & problemSolvingScore <= 6\n" +
                        "- If answers are generic/no detail (e.g. 'I don't know', 'maybe', 'yes/no') reduce technical & problemSolving by 2–4.\n" +
                        "- Use entire 1–10 range. 10 is exceptional depth + clarity. 5 is neutral/average. 3 is weak/superficial.\n" +
                        "- Do NOT inflate scores when data is sparse.\n";

        return
                "You are an interview evaluator. Return ONLY JSON with keys:\n" +
                        "{ \"feedback\":\"3-6 sentences summary\", \"overallScore\":5, \"communicationScore\":5, \"technicalScore\":5, \"problemSolvingScore\":5, \"strengths\":\"lines\", \"improvements\":\"lines\" }\n" +
                        "Each score MUST be integer 1–10 and obey the rubric constraints. If constraints force a cap, apply it.\n\n" +
                        rubric + "\n" +
                        "TRANSCRIPT:\n" + transcriptBlock + "\n\n" +
                        "DO NOT output raw numeric coverage percentages, character counts, or phrases like 'avgAnswerLen' in the feedback text.\n" +
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
                                                                List<InterviewFeedbackDto.TranscriptMessage> sanitized,
                                                                Map<String, Object> metrics) {
        if (!interviewAIConfig.isConfigured()) {
            logger.warn("AI not configured; using COMPREHENSIVE fallback feedback");
            Map<String, Object> fb = createComprehensiveFallbackFeedback(dto, true);
            fb.putAll(metrics);
            return fb;
        }
        String prompt = buildComprehensivePrompt(dto, sanitized, metrics); // *** CHANGED
        Map<String, Object> parsed = callGemini(prompt);
        if (parsed == null) {
            Map<String,Object> fb = createComprehensiveFallbackFeedback(dto, true);
            fb.putAll(metrics);
            return fb;
        }

        parsed.put("fallback", false);
        parsed.put("overallScore", normScore(parsed.get("overallScore"), DEFAULT_NEUTRAL_SCORE)); // *** CHANGED default
        parsed.put("communicationScore", normScore(parsed.get("communicationScore"), DEFAULT_NEUTRAL_SCORE));
        parsed.put("technicalScore", normScore(parsed.get("technicalScore"), DEFAULT_NEUTRAL_SCORE));
        parsed.put("problemSolvingScore", normScore(parsed.get("problemSolvingScore"), DEFAULT_NEUTRAL_SCORE));
        parsed.putAll(metrics); // expose metrics
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
                ? "Preliminary (fallback) feedback due to AI unavailable."
                : "Fallback comprehensive feedback (analysis pending).");
        fb.put("overallScore", DEFAULT_NEUTRAL_SCORE);
        fb.put("communicationScore", DEFAULT_NEUTRAL_SCORE);
        fb.put("technicalScore", DEFAULT_NEUTRAL_SCORE);
        fb.put("problemSolvingScore", DEFAULT_NEUTRAL_SCORE);
        fb.put("strengths", "Engaged; Maintained basic structure");
        fb.put("improvements", "Provide deeper technical specifics; Expand problem-solving rationale");
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