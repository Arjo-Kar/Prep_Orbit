package com.preporbit.prep_orbit.dto;

import java.time.LocalDate;

public class InterviewTimePointDto {
    private Long interviewId;
    private LocalDate date;
    private double overallScore;
    private Double technicalScore;
    private Double communicationScore;
    private Double problemSolvingScore;
    private int questionCount;

    public void setInterviewId(Long id) {
        this.interviewId = id;
    }



    public void setOverallScore(double round) {
        this.overallScore = round;
    }

    public void setTechnicalScore(Double o) {
        this.technicalScore = o;
    }

    // getters & setters
}