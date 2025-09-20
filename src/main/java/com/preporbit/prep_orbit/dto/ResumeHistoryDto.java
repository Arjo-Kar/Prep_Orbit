package com.preporbit.prep_orbit.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ResumeHistoryDto {
    private Long id;
    private String filename;
    private Integer overallScore;
    private LocalDateTime createdAt;
    private String summary;       // 🔹 extracted summary
    private List<String> pageImages; // 🔹 list of resume page URLs

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public Integer getOverallScore() { return overallScore; }
    public void setOverallScore(Integer overallScore) { this.overallScore = overallScore; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public List<String> getPageImages() { return pageImages; }
    public void setPageImages(List<String> pageImages) { this.pageImages = pageImages; }

    public void setAnalysisId(Long id) {
        this.id = id;
    }
}
