package com.preporbit.prep_orbit.dto;

import java.util.List;

public class QuizResultDto {
    private int score;
    private double accuracy;
    private List<FeedbackDto> feedback;

    // New fields for session-level feedback
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> suggestions;

    // Getters and setters:
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public double getAccuracy() { return accuracy; }
    public void setAccuracy(double accuracy) { this.accuracy = accuracy; }

    public List<FeedbackDto> getFeedback() { return feedback; }
    public void setFeedback(List<FeedbackDto> feedback) { this.feedback = feedback; }

    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }

    public List<String> getWeaknesses() { return weaknesses; }
    public void setWeaknesses(List<String> weaknesses) { this.weaknesses = weaknesses; }

    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }
}