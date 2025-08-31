package com.preporbit.prep_orbit.dto;

import java.util.List;

public class QuizStartRequestDto {
    private List<String> topics;
    private Integer numQuestions;

    public List<String> getTopics() {
        return this.topics;
    }

    public int getNumQuestions() {
        return this.numQuestions;
    }
    // Getters and setters...
}