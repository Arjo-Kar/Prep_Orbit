package com.preporbit.prep_orbit.dto;

import java.util.List;
import java.util.Map;

public class ResumeAnalysisResponse {
    private Long id;
    private int overallScore;
    private Map<String, Integer> scores;
    private List<Suggestion> suggestions;
    private String extractedText;
    private Map<String, Object> details;
    private List<String> pageImages;  // ✅ add this

    // Default constructor
    public ResumeAnalysisResponse() {}

    public static class Suggestion {
        private String title;
        private String description;
        private String category;
        private String severity;

        public Suggestion() {}

        public Suggestion(String title, String description, String category, String severity) {
            this.title = title;
            this.description = description;
            this.category = category;
            this.severity = severity;
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
    }

    // Existing getters & setters...
    public int getOverallScore() { return overallScore; }
    public void setOverallScore(int overallScore) { this.overallScore = overallScore; }

    public Map<String, Integer> getScores() { return scores; }
    public void setScores(Map<String, Integer> scores) { this.scores = scores; }

    public List<Suggestion> getSuggestions() { return suggestions; }
    public void setSuggestions(List<Suggestion> suggestions) { this.suggestions = suggestions; }

    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }

    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }

    // ✅ New getter & setter
    public List<String> getPageImages() { return pageImages; }
    public void setPageImages(List<String> pageImages) { this.pageImages = pageImages; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
