package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class QuizSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Add userId for relationship to users table
    private Long userId;

    @Column(nullable = false)
    private String username;
    private String topics;
    private LocalDateTime startedAt;
    private Integer score;
    private Double accuracy;

    @OneToMany(mappedBy = "quizSession", cascade = CascadeType.ALL)
    private List<QuizQuestion> questions;

    @OneToMany(mappedBy = "quizSession", cascade = CascadeType.ALL)
    private List<UserAnswer> answers;

    // --- Getters and Setters ---

    public Long getId() {
        return this.id;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return this.username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getTopics() {
        return this.topics;
    }

    public void setTopics(String topics) {
        this.topics = topics;
    }

    public LocalDateTime getStartedAt() {
        return this.startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public Integer getScore() {
        return this.score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Double getAccuracy() {
        return this.accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    public List<QuizQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuizQuestion> questions) {
        this.questions = questions;
    }

    public List<UserAnswer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<UserAnswer> answers) {
        this.answers = answers;
    }
}