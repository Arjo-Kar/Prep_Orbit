package com.preporbit.prep_orbit.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class InterviewRequestDto {

    @NotBlank(message = "Role is required")
    @Size(min = 2, max = 100, message = "Role must be between 2 and 100 characters")
    private String role;

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "technical|behavioral|mixed", message = "Type must be 'technical', 'behavioral', or 'mixed'")
    private String type;

    @NotBlank(message = "Level is required")
    @Pattern(regexp = "junior|mid|senior", message = "Level must be 'junior', 'mid', or 'senior'")
    private String level;

    @NotEmpty(message = "Tech stack is required")
    private List<String> techstack;

    @NotNull(message = "Amount is required")
    @Min(value = 3, message = "Minimum 3 questions required")
    @Max(value = 15, message = "Maximum 15 questions allowed")
    private Integer amount;

    @NotNull(message = "User ID is required")
    private Long userId;

    // Constructors
    public InterviewRequestDto() {}

    public InterviewRequestDto(String role, String type, String level,
                               List<String> techstack, Integer amount, Long userId) {
        this.role = role;
        this.type = type;
        this.level = level;
        this.techstack = techstack;
        this.amount = amount;
        this.userId = userId;
    }

    // Getters and Setters
    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public List<String> getTechstack() {
        return techstack;
    }

    public void setTechstack(List<String> techstack) {
        this.techstack = techstack;
    }

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}