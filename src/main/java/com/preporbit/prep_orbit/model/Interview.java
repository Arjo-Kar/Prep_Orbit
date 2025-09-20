package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String type; // "technical" or "behavioral"

    @Column(nullable = false)
    private String level; // "junior", "mid", "senior"

    @Column(columnDefinition = "TEXT")
    private String techstack;

    @Column(columnDefinition = "TEXT")
    private String questions; // JSON array of questions

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Boolean finalized = false;

    // ✅ Added missing hasFeedback field
    @Column(name = "has_feedback", nullable = false)
    private Boolean hasFeedback = false;

    @Column(name = "cover_image")
    private String coverImage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Interview() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.finalized = false;
        this.hasFeedback = false; // ✅ Initialize hasFeedback
    }

    public Interview(String role, String type, String level, String techstack,
                     String questions, Long userId, String coverImage) {
        this();
        this.role = role;
        this.type = type;
        this.level = level;
        this.techstack = techstack;
        this.questions = questions;
        this.userId = userId;
        this.coverImage = coverImage;
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

    public String getTechstack() {
        return techstack;
    }

    public void setTechstack(String techstack) {
        this.techstack = techstack;
    }

    public String getQuestions() {
        return questions;
    }

    public void setQuestions(String questions) {
        this.questions = questions;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Boolean getFinalized() {
        return finalized;
    }

    public void setFinalized(Boolean finalized) {
        this.finalized = finalized;
    }

    // ✅ Added getter and setter for hasFeedback
    public Boolean getHasFeedback() {
        return hasFeedback;
    }

    public void setHasFeedback(Boolean hasFeedback) {
        this.hasFeedback = hasFeedback;
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

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ✅ Added toString method for debugging
    @Override
    public String toString() {
        return "Interview{" +
                "id=" + id +
                ", role='" + role + '\'' +
                ", type='" + type + '\'' +
                ", level='" + level + '\'' +
                ", userId=" + userId +
                ", finalized=" + finalized +
                ", hasFeedback=" + hasFeedback +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}