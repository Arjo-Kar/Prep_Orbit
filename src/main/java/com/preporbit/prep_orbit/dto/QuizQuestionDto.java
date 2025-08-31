package com.preporbit.prep_orbit.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

/**
 * DTO for Quiz Questions, robust to various Gemini output formats.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuizQuestionDto {
    private Long id;

    @JsonAlias({"questionText", "question"})
    private String questionText;

    // Handles arrays, comma-separated strings, and objects with keys "A", "B", "C", "D"
    @JsonAlias({"choices", "options"})
    @JsonDeserialize(using = ChoicesDeserializer.class)
    private String[] choices;

    private String topic;

    // Accepts multiple aliases for correct answer field
    @JsonAlias({"correctAnswer", "correct_answer", "answer", "correct"})
    private String correctAnswer;

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String[] getChoices() { return choices; }
    public void setChoices(String[] choices) { this.choices = choices; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
}