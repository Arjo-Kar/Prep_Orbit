package com.preporbit.prep_orbit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class InterviewAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Integer rating;
    @Column(name = "answer", columnDefinition = "TEXT")
    private String answer;

    @Column(name = "correct_ans", columnDefinition = "TEXT")
    private String correctAns;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;


    @ManyToOne
    @JoinColumn(name = "question_id")
    @JsonIgnore
    private InterviewQuestion question;

    @ManyToOne
    @JoinColumn(name = "live_interview_id")
    @JsonIgnore
    private LiveInterview liveInterview;

    public InterviewAnswer() {}

    // Standard getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getCorrectAns() {
        return correctAns;
    }

    public void setCorrectAns(String correctAns) {
        this.correctAns = correctAns;
    }

    public InterviewQuestion getQuestion() {
        return question;
    }

    public void setQuestion(InterviewQuestion question) {
        this.question = question;
    }

    public LiveInterview getLiveInterview() {
        return liveInterview;
    }

    public void setLiveInterview(LiveInterview liveInterview) {
        this.liveInterview = liveInterview;
    }
}