package com.preporbit.prep_orbit.dto;

import java.util.List;

public class CodingChallengeResultDto {
    private boolean allPassed;
    private int totalTestCases;
    private int passedTestCases;
    private List<TestCaseResult> results;

    // Getters and setters
    public boolean isAllPassed() { return allPassed; }
    public void setAllPassed(boolean allPassed) { this.allPassed = allPassed; }

    public int getTotalTestCases() { return totalTestCases; }
    public void setTotalTestCases(int totalTestCases) { this.totalTestCases = totalTestCases; }

    public int getPassedTestCases() { return passedTestCases; }
    public void setPassedTestCases(int passedTestCases) { this.passedTestCases = passedTestCases; }

    public List<TestCaseResult> getResults() { return results; }
    public void setResults(List<TestCaseResult> results) { this.results = results; }

    public static class TestCaseResult {
        private boolean passed;
        private boolean visible;
        private String input;
        private String expectedOutput;
        private String actualOutput;
        private String error;

        // Getters and setters
        public boolean isPassed() { return passed; }
        public void setPassed(boolean passed) { this.passed = passed; }

        public boolean isVisible() { return visible; }
        public void setVisible(boolean visible) { this.visible = visible; }

        public String getInput() { return input; }
        public void setInput(String input) { this.input = input; }

        public String getExpectedOutput() { return expectedOutput; }
        public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }

        public String getActualOutput() { return actualOutput; }
        public void setActualOutput(String actualOutput) { this.actualOutput = actualOutput; }

        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}