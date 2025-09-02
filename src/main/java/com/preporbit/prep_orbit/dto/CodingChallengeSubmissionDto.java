package com.preporbit.prep_orbit.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CodingChallengeSubmissionDto {
    @JsonProperty("source_code")
    private String sourceCode;

    @JsonProperty("language_id")
    private int languageId;

    @JsonProperty("stdin")
    private String stdin;

    // Getters and setters
    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }

    public int getLanguageId() { return languageId; }
    public void setLanguageId(int languageId) { this.languageId = languageId; }

    public String getStdin() { return stdin; }
    public void setStdin(String stdin) { this.stdin = stdin; }
}