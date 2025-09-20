package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_challenge_stats")
public class UserChallengeStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "challenge_id", nullable = false)
    private Long challengeId;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "solved", nullable = false)
    private boolean solved = false;

    // Default constructor
    public UserChallengeStats() {}

    // Constructor with parameters
    public UserChallengeStats(Long userId, Long challengeId) {
        this.userId = userId;
        this.challengeId = challengeId;
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.generatedAt = now;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (generatedAt == null) {
            generatedAt = now;
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getChallengeId() { return challengeId; }
    public void setChallengeId(Long challengeId) { this.challengeId = challengeId; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public boolean isSolved() { return solved; }
    public void setSolved(boolean solved) { this.solved = solved; }

    @Override
    public String toString() {
        return "UserChallengeStats{" +
                "id=" + id +
                ", userId=" + userId +
                ", challengeId=" + challengeId +
                ", createdAt=" + createdAt +
                '}';
    }
}