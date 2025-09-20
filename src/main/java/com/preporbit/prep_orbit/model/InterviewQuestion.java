package com.preporbit.prep_orbit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class InterviewQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "question", columnDefinition = "TEXT")
    private String question;

    @ManyToOne
    @JoinColumn(name = "live_interview_id")
    @JsonIgnore
    private LiveInterview liveInterview;

    @Column(name = "expected_answer", columnDefinition = "TEXT")
    private String expectedAnswer; // <-- ADD THIS FIELD


    public InterviewQuestion() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public LiveInterview getLiveInterview() {
        return liveInterview;
    }

    public void setLiveInterview(LiveInterview liveInterview) {
        this.liveInterview = liveInterview;
    }
    public String getExpectedAnswer() {
        return expectedAnswer;
    }
    public void setExpectedAnswer(String expectedAnswer) {
        this.expectedAnswer = expectedAnswer;
    }
}