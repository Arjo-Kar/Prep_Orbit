package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class QuizSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String topics;
    private LocalDateTime startedAt;
    private Integer score;
    private Double accuracy;

    @OneToMany(mappedBy = "quizSession", cascade = CascadeType.ALL)
    private List<QuizQuestion> questions;

    @OneToMany(mappedBy = "quizSession", cascade = CascadeType.ALL)
    private List<UserAnswer> answers;

    public void setUsername(String username) {
        this.username = username;
    }

    public void setTopics(String join) {
        this.topics = join;
    }

    public void setStartedAt(LocalDateTime now) {
        this.startedAt = now;
    }

    public Long getId() {
        return this.id;
    }

    public void setScore(int correct) {
        this.score = correct;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    public Object getUsername() {
        return this.username;
    }

    // Getters and setters...
}