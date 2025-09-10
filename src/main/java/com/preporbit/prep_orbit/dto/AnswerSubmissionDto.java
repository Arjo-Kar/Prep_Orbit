package com.preporbit.prep_orbit.dto;

public class AnswerSubmissionDto {
    private Long liveInterviewId;
    private Long questionId;
    private Long userId;
    private String answer;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public Long getLiveInterviewId() {
        return liveInterviewId;
    }

    public void setLiveInterviewId(Long liveInterviewId) {
        this.liveInterviewId = liveInterviewId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }
}