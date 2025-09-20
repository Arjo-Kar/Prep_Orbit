package com.preporbit.prep_orbit.dto;

public class QuestionDto {
    private Long id;
    private String question;
    private String expectedAnswer;

    public void setId(Long id) {
        this.id = id;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getQuestion() {
        return question;
    }

    public Long getId() {
        return id;
    }

    public void setExpectedAnswer(String expectedAnswer) {
        this.expectedAnswer = expectedAnswer;
    }
}