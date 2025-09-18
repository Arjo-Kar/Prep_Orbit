package com.preporbit.prep_orbit.dto;

import java.util.List;


public class LiveInterviewFeedbackDto {
    private Long interviewId;
    private String position;
    private String type;
    private String level;
    private List<QaFeedback> answers;

    // Getters and Setters
    public Long getInterviewId() { return interviewId; }
    public void setInterviewId(Long interviewId) { this.interviewId = interviewId; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public List<QaFeedback> getAnswers() { return answers; }
    public void setAnswers(List<QaFeedback> answers) { this.answers = answers; }

    // Nested Q&A Feedback class
    public static class QaFeedback {
        private String question;
        private String expectedAnswer;
        private String userAnswer;
        private String feedback;
        private Integer rating;
        private String suggestion;

        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }

        public String getExpectedAnswer() { return expectedAnswer; }
        public void setExpectedAnswer(String expectedAnswer) { this.expectedAnswer = expectedAnswer; }

        public String getUserAnswer() { return userAnswer; }
        public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }

        public String getFeedback() { return feedback; }

        public String getSuggestion() {
            return suggestion;
        }

        public void setSuggestion(String suggestion) {
            this.suggestion = suggestion;
        }

        public void setFeedback(String feedback) { this.feedback = feedback; }

        public Integer getRating() { return rating; }
        public void setRating(Integer rating) { this.rating = rating;
        }
    }
}