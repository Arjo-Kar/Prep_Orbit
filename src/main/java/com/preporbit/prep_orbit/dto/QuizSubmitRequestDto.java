package com.preporbit.prep_orbit.dto;

import java.util.List;

public class QuizSubmitRequestDto {
    private List<UserAnswerDto> answers;

    public List<UserAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<UserAnswerDto> answers) {
        this.answers = answers;
    }
}