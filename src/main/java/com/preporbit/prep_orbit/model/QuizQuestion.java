package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;

@Entity
public class QuizQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 2000)
    private String questionText;

    @Column(length = 1000)
    private String choices; // comma separated
    private String correctAnswer;
    private String topic;

    @ManyToOne
    private QuizSession quizSession;

    public void toString(Object questionText) {
    }

    public String getQuestionText() {
        return this.questionText;
    }

    public String getChoices() {
        return this.choices;
    }

    public void setChoices(String s) {
        this.choices = s;
    }

    public String getTopic() {
        return this.topic;
    }

    public Long getId() {
        return this.id;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public void setQuizSession(QuizSession session) {
        this.quizSession = session;
    }

    public String getCorrectAnswer() {
        return this.correctAnswer;
    }

    public void setQuestionText(String questionText) {
        this.questionText =questionText;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    // Getters and setters...
}