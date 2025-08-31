package com.preporbit.prep_orbit.dto;

public class FeedbackDto {
    private Long questionId;
    private boolean correct;
    private String feedback;

    // Getter and setter for questionId
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long questionId) { this.questionId = questionId; }

    // Getter and setter for correct
    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }

    // Getter and setter for feedback
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}