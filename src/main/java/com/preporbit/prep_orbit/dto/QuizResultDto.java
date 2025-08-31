package com.preporbit.prep_orbit.dto;

import java.util.List;

public class QuizResultDto {
    private int score;
    private double accuracy;
    private List<FeedbackDto> feedback;

    // Getters and setters:
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public double getAccuracy() { return accuracy; }
    public void setAccuracy(double accuracy) { this.accuracy = accuracy; }
    public List<FeedbackDto> getFeedback() { return feedback; }
    public void setFeedback(List<FeedbackDto> feedback) { this.feedback = feedback; }
}