package com.preporbit.prep_orbit.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.preporbit.prep_orbit.model.Interview;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;

import java.time.LocalDateTime;
import java.util.List;


public class InterviewResponseDto {
    private static final Logger logger = (Logger) LoggerFactory.getLogger(InterviewResponseDto.class);

    private Long id;
    private String role;
    private String type;
    private String level;
    private List<String> techstack;
    private List<String> questions;
    private Boolean finalized;
    private String coverImage;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // Constructors
    public InterviewResponseDto() {}

    public InterviewResponseDto(Interview interview) {
        this.id = interview.getId();
        this.role = interview.getRole();
        this.type = interview.getType();
        this.level = interview.getLevel();
        this.techstack = parseCommaSeparated(interview.getTechstack());
        this.questions = parseQuestions(interview.getQuestions());
        this.finalized = interview.getFinalized();
        this.coverImage = interview.getCoverImage();
        this.createdAt = interview.getCreatedAt();
        this.updatedAt = interview.getUpdatedAt();
    }

    private List<String> parseCommaSeparated(String input) {
        if (input == null || input.trim().isEmpty()) {
            return List.of();
        }
        return List.of(input.split(","));
    }

    // Replace lines 44-55 with this:
    private List<String> parseQuestions(String questionsJson) {
        if (questionsJson == null || questionsJson.trim().isEmpty()) {
            return List.of();
        }
        try {
            // ✅ Use ObjectMapper for proper JSON parsing
            ObjectMapper mapper = new ObjectMapper();
            String[] questionsArray = mapper.readValue(questionsJson, String[].class);
            return List.of(questionsArray);
        } catch (Exception e) {
            logger.warn("Failed to parse questions JSON: {}, error: {}", questionsJson, e.getMessage());
            return List.of("Unable to load questions - please contact support");
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public List<String> getTechstack() {
        return techstack;
    }

    public void setTechstack(List<String> techstack) {
        this.techstack = techstack;
    }

    public List<String> getQuestions() {
        return questions;
    }

    public void setQuestions(List<String> questions) {
        this.questions = questions;
    }

    public Boolean getFinalized() {
        return finalized;
    }

    public void setFinalized(Boolean finalized) {
        this.finalized = finalized;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}