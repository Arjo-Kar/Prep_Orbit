package com.preporbit.prep_orbit.dto;

import java.util.List;

public class QuizStartResponseDto {
    private Long sessionId;
    private List<QuizQuestionDto> questions;

    // Constructors, getters, setters
    public QuizStartResponseDto() {}

    public QuizStartResponseDto(Long sessionId, List<QuizQuestionDto> questions) {
        this.sessionId = sessionId;
        this.questions = questions;
    }

    public Long getSessionId() {
        return sessionId;
    }
    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public List<QuizQuestionDto> getQuestions() {
        return questions;
    }
    public void setQuestions(List<QuizQuestionDto> questions) {
        this.questions = questions;
    }
}