package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;

@Entity
public class UserAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long questionId;
    @Column(length = 1000)
    private String userAnswer;
    private Boolean isCorrect;
    private String feedback;

    @ManyToOne
    private QuizSession quizSession;

    public void setQuestionId(Long id) {
        this.questionId = id;
    }

    public void setUserAnswer(String userAnswer) {
        this.userAnswer = userAnswer;
    }

    public void setIsCorrect(boolean isCorrect) {
        this.isCorrect = isCorrect;
    }

    public void setFeedback(String feedbackMsg) {
        this.feedback = feedbackMsg;
    }

    public void setQuizSession(QuizSession session) {
        this.quizSession = quizSession;
    }

    public Long getQuestionId() {
        return this.questionId;
    }

    // Getters and setters...
}