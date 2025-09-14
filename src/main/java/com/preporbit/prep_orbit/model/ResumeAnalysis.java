package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resume_analyses")
public class ResumeAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "overall_score", nullable = false)
    private Integer overallScore;

    @Column(name = "content_score")
    private Integer contentScore;

    @Column(name = "formatting_score")
    private Integer formattingScore;

    @Column(name = "keywords_score")
    private Integer keywordsScore;

    @Column(name = "structure_score")
    private Integer structureScore;

    @Column(name = "contact_score")
    private Integer contactScore;

    @Column(name = "skills_score")
    private Integer skillsScore;

    @Column(name = "experience_score")
    private Integer experienceScore;

    @Column(name = "education_score")
    private Integer educationScore;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(name = "suggestions", columnDefinition = "TEXT")
    private String suggestionsJson; // Store as JSON string

    @Column(name = "analysis_details", columnDefinition = "TEXT")
    private String analysisDetailsJson; // Store as JSON string

    @Column(name = "page_images", columnDefinition = "TEXT")
    private String pageImagesJson; // Store as JSON array of image URLs

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "has_contact_info")
    private Boolean hasContactInfo;

    @Column(name = "has_skills_section")
    private Boolean hasSkillsSection;

    @Column(name = "has_experience")
    private Boolean hasExperience;

    @Column(name = "has_education")
    private Boolean hasEducation;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "analysis_version")
    private String analysisVersion = "1.0";

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    // Thumbnail of first page
    @Lob
    @Column(name = "first_page_image")
    private byte[] firstPageImage;

    @Column(name = "first_page_mime", length = 50)
    private String firstPageMime;

    @Column(name = "first_page_width")
    private Integer firstPageWidth;

    @Column(name = "first_page_height")
    private Integer firstPageHeight;

    // Default constructor
    public ResumeAnalysis() {}

    public ResumeAnalysis(Long userId, String filename) {
        this.userId = userId;
        this.filename = filename;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public Integer getOverallScore() { return overallScore; }
    public void setOverallScore(Integer overallScore) { this.overallScore = overallScore; }

    public Integer getContentScore() { return contentScore; }
    public void setContentScore(Integer contentScore) { this.contentScore = contentScore; }

    public Integer getFormattingScore() { return formattingScore; }
    public void setFormattingScore(Integer formattingScore) { this.formattingScore = formattingScore; }

    public Integer getKeywordsScore() { return keywordsScore; }
    public void setKeywordsScore(Integer keywordsScore) { this.keywordsScore = keywordsScore; }

    public Integer getStructureScore() { return structureScore; }
    public void setStructureScore(Integer structureScore) { this.structureScore = structureScore; }

    public Integer getContactScore() { return contactScore; }
    public void setContactScore(Integer contactScore) { this.contactScore = contactScore; }

    public Integer getSkillsScore() { return skillsScore; }
    public void setSkillsScore(Integer skillsScore) { this.skillsScore = skillsScore; }

    public Integer getExperienceScore() { return experienceScore; }
    public void setExperienceScore(Integer experienceScore) { this.experienceScore = experienceScore; }

    public Integer getEducationScore() { return educationScore; }
    public void setEducationScore(Integer educationScore) { this.educationScore = educationScore; }

    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }

    public String getSuggestionsJson() { return suggestionsJson; }
    public void setSuggestionsJson(String suggestionsJson) { this.suggestionsJson = suggestionsJson; }

    public String getAnalysisDetailsJson() { return analysisDetailsJson; }
    public void setAnalysisDetailsJson(String analysisDetailsJson) { this.analysisDetailsJson = analysisDetailsJson; }

    public String getPageImagesJson() { return pageImagesJson; }
    public void setPageImagesJson(String pageImagesJson) { this.pageImagesJson = pageImagesJson; }

    public Integer getWordCount() { return wordCount; }
    public void setWordCount(Integer wordCount) { this.wordCount = wordCount; }

    public Boolean getHasContactInfo() { return hasContactInfo; }
    public void setHasContactInfo(Boolean hasContactInfo) { this.hasContactInfo = hasContactInfo; }

    public Boolean getHasSkillsSection() { return hasSkillsSection; }
    public void setHasSkillsSection(Boolean hasSkillsSection) { this.hasSkillsSection = hasSkillsSection; }

    public Boolean getHasExperience() { return hasExperience; }
    public void setHasExperience(Boolean hasExperience) { this.hasExperience = hasExperience; }

    public Boolean getHasEducation() { return hasEducation; }
    public void setHasEducation(Boolean hasEducation) { this.hasEducation = hasEducation; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getAnalysisVersion() { return analysisVersion; }
    public void setAnalysisVersion(String analysisVersion) { this.analysisVersion = analysisVersion; }

    public Long getProcessingTimeMs() { return processingTimeMs; }
    public void setProcessingTimeMs(Long processingTimeMs) { this.processingTimeMs = processingTimeMs; }

    public byte[] getFirstPageImage() { return firstPageImage; }
    public void setFirstPageImage(byte[] firstPageImage) { this.firstPageImage = firstPageImage; }

    public String getFirstPageMime() { return firstPageMime; }
    public void setFirstPageMime(String firstPageMime) { this.firstPageMime = firstPageMime; }

    public Integer getFirstPageWidth() { return firstPageWidth; }
    public void setFirstPageWidth(Integer firstPageWidth) { this.firstPageWidth = firstPageWidth; }

    public Integer getFirstPageHeight() { return firstPageHeight; }
    public void setFirstPageHeight(Integer firstPageHeight) { this.firstPageHeight = firstPageHeight; }

    @Override
    public String toString() {
        return "ResumeAnalysis{" +
                "id=" + id +
                ", userId=" + userId +
                ", filename='" + filename + '\'' +
                ", overallScore=" + overallScore +
                ", createdAt=" + createdAt +
                '}';
    }
}
