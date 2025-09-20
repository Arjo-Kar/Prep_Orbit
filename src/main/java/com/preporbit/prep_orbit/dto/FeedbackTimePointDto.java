package com.preporbit.prep_orbit.dto;

import java.time.LocalDateTime;

public class FeedbackTimePointDto {
    private Long feedbackId;
    private Long interviewId;
    private LocalDateTime timestamp;
    private Double overall;
    private Double technical;
    private Double communication;
    private Double problemSolving;
    // getters/setters ...
    public Long getFeedbackId() { return feedbackId; }
    public void setFeedbackId(Long feedbackId) { this.feedbackId = feedbackId; }
    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public Double getOverall() { return overall; }
    public void setOverall(Double overall) { this.overall = overall; }
    public Double getTechnical() { return technical; }
    public void setTechnical(Double technical) { this.technical = technical; }
    public Double getCommunication() { return communication; }
    public void setCommunication(Double communication) { this.communication = communication; }
    public Double getProblemSolving() { return problemSolving; }
    public void setProblemSolving(Double problemSolving) { this.problemSolving = problemSolving; }
}