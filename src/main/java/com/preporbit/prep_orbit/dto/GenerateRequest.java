package com.preporbit.prep_orbit.dto;

import java.util.List;

public class GenerateRequest {
    private List<String> topics;
    private String difficulty;

    // Getters and setters
    public List<String> getTopics() {
        return topics;
    }
    public void setTopics(List<String> topics) {
        this.topics = topics;
    }
    public String getDifficulty() {
        return difficulty;
    }
    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }
}