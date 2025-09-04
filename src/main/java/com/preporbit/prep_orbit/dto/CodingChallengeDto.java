package com.preporbit.prep_orbit.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.preporbit.prep_orbit.model.CodingChallenge;
import com.preporbit.prep_orbit.model.ChallengeTestCase;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CodingChallengeDto {
    private Long id;
    private String title;

    @JsonProperty("problem_statement")
    private String description;

    private int timeLimitMs;
    private int memoryLimitKb;

    @JsonProperty("input_specification")
    private String inputSpec;

    @JsonProperty("output_specification")
    private String outputSpec;

    private List<String> topics;
    private String difficulty;

    @JsonProperty("test_cases")
    private List<TestCaseDto> visibleTestCases;

    // Getters and setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getTimeLimitMs() { return timeLimitMs; }
    public void setTimeLimitMs(int timeLimitMs) { this.timeLimitMs = timeLimitMs; }

    public int getMemoryLimitKb() { return memoryLimitKb; }
    public void setMemoryLimitKb(int memoryLimitKb) { this.memoryLimitKb = memoryLimitKb; }

    public String getInputSpec() { return inputSpec; }
    public void setInputSpec(String inputSpec) { this.inputSpec = inputSpec; }

    public String getOutputSpec() { return outputSpec; }
    public void setOutputSpec(String outputSpec) { this.outputSpec = outputSpec; }

    public List<String> getTopics() { return topics; }
    public void setTopics(List<String> topics) { this.topics = topics; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public List<TestCaseDto> getVisibleTestCases() { return visibleTestCases; }
    public void setVisibleTestCases(List<TestCaseDto> visibleTestCases) { this.visibleTestCases = visibleTestCases; }

    // Convert DTO to Entity model
    public CodingChallenge toModel() {
        CodingChallenge model = new CodingChallenge();
        model.setId(this.id);
        model.setTitle(this.title);
        model.setDescription(this.description);
        model.setTimeLimitMs(this.timeLimitMs);
        model.setMemoryLimitKb(this.memoryLimitKb);
        model.setInputSpec(this.inputSpec);
        model.setOutputSpec(this.outputSpec);
        model.setTopics(this.topics != null && !this.topics.isEmpty() ? this.topics : List.of("arrays", "strings"));
        model.setDifficulty(this.difficulty != null && !this.difficulty.isEmpty() ? this.difficulty : "medium");
        // Convert visibleTestCases to entity test cases
        if (this.visibleTestCases != null) {
            List<ChallengeTestCase> testCases = new ArrayList<>();
            for (TestCaseDto tc : this.visibleTestCases) {
                ChallengeTestCase entityTC = new ChallengeTestCase();
                entityTC.setInput(tc.getInput());
                entityTC.setExpectedOutput(tc.getExpectedOutput());
                entityTC.setVisible(tc.isVisible());
                entityTC.setCodingChallenge(model); // Set parent for bidirectional mapping if needed
                testCases.add(entityTC);
            }
            model.setTestCases(testCases);
        }

        return model;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TestCaseDto {
        public TestCaseDto(){}
        public TestCaseDto(String input, String expectedOutput, boolean visible) {
            this.input = input;
            this.expectedOutput = expectedOutput;
            this.visible = visible;
        }
        @JsonProperty("input")
        private Object input; // Instead of String

        @JsonProperty("expected_output")
        private Object expectedOutput;

        @JsonProperty("visible") // <-- FIXED: should match Gemini output!
        private boolean visible;

        public String getInput() {
            return input == null ? null : input.toString();
        }
        public void setInput(Object input) { this.input = input; }

        public String getExpectedOutput() {
            return expectedOutput == null ? null : expectedOutput.toString();
        }
        public void setExpectedOutput(Object expectedOutput) { this.expectedOutput = expectedOutput; }

        public boolean isVisible() { return visible; }
        public void setVisible(boolean visible) { this.visible = visible; }
    }
}