package com.preporbit.prep_orbit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class InterviewFeedbackDto {

    @NotNull(message = "Interview ID is required")
    private Long interviewId;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotEmpty(message = "Transcript is required")
    private List<TranscriptMessage> transcript;

    private String feedback;

    // ✅ Add missing fields for comprehensive feedback
    private List<QuestionResponse> responses;
    private Integer duration;
    private Integer totalQuestions;
    private Integer totalAnswers;
    private Map<String, Object> interviewMetadata;

    @Min(value = 1, message = "Score must be between 1 and 10")
    @Max(value = 10, message = "Score must be between 1 and 10")
    private Integer overallScore;

    @Min(value = 1, message = "Score must be between 1 and 10")
    @Max(value = 10, message = "Score must be between 1 and 10")
    private Integer communicationScore;

    @Min(value = 1, message = "Score must be between 1 and 10")
    @Max(value = 10, message = "Score must be between 1 and 10")
    private Integer technicalScore;

    @Min(value = 1, message = "Score must be between 1 and 10")
    @Max(value = 10, message = "Score must be between 1 and 10")
    private Integer problemSolvingScore;

    private String strengths;
    private String improvements;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // ✅ Fix this method - it was incomplete
    public List<QuestionResponse> getResponses() {
        return responses;
    }

    public void setResponses(List<QuestionResponse> responses) {
        this.responses = responses;
    }

    // ✅ Add missing getters and setters
    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getTotalAnswers() {
        return totalAnswers;
    }

    public void setTotalAnswers(Integer totalAnswers) {
        this.totalAnswers = totalAnswers;
    }

    public Map<String, Object> getInterviewMetadata() {
        return interviewMetadata;
    }

    public void setInterviewMetadata(Map<String, Object> interviewMetadata) {
        this.interviewMetadata = interviewMetadata;
    }

    // ✅ Add QuestionResponse inner class
    public static class QuestionResponse {
        private Integer questionNumber;
        private String question;
        private String answer;
        private String timestamp;

        public QuestionResponse() {}

        public QuestionResponse(Integer questionNumber, String question, String answer, String timestamp) {
            this.questionNumber = questionNumber;
            this.question = question;
            this.answer = answer;
            this.timestamp = timestamp;
        }

        // Getters and setters
        public Integer getQuestionNumber() { return questionNumber; }
        public void setQuestionNumber(Integer questionNumber) { this.questionNumber = questionNumber; }

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }

        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }

    // Inner class for transcript messages
    public static class TranscriptMessage {
        @NotBlank(message = "Role is required")
        private String role;

        @NotBlank(message = "Content is required")
        private String content;

        private String timestamp;

        public TranscriptMessage() {}

        public TranscriptMessage(String role, String content) {
            this.role = role;
            this.content = content;
        }

        public TranscriptMessage(String role, String content, String timestamp) {
            this.role = role;
            this.content = content;
            this.timestamp = timestamp;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }

    // Constructors
    public InterviewFeedbackDto() {}

    // Existing getters and setters...
    public Long getInterviewId() {
        return interviewId;
    }

    public void setInterviewId(Long interviewId) {
        this.interviewId = interviewId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<TranscriptMessage> getTranscript() {
        return transcript;
    }

    public void setTranscript(List<TranscriptMessage> transcript) {
        this.transcript = transcript;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public Integer getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(Integer overallScore) {
        this.overallScore = overallScore;
    }

    public Integer getCommunicationScore() {
        return communicationScore;
    }

    public void setCommunicationScore(Integer communicationScore) {
        this.communicationScore = communicationScore;
    }

    public Integer getTechnicalScore() {
        return technicalScore;
    }

    public void setTechnicalScore(Integer technicalScore) {
        this.technicalScore = technicalScore;
    }

    public Integer getProblemSolvingScore() {
        return problemSolvingScore;
    }

    public void setProblemSolvingScore(Integer problemSolvingScore) {
        this.problemSolvingScore = problemSolvingScore;
    }

    public String getStrengths() {
        return strengths;
    }

    public void setStrengths(String strengths) {
        this.strengths = strengths;
    }

    public String getImprovements() {
        return improvements;
    }

    public void setImprovements(String improvements) {
        this.improvements = improvements;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}