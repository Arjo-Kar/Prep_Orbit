package com.preporbit.prep_orbit.dto;

import java.util.List;

public class LiveInterviewRequestDto {
    private String position;
    private String type;
    private String level;
    private Long userId;
    private List<String> strengths;
    private String experience;
    private String profile;

    // getters and setters
    public String getPosition() { return this.position; }
    public void setPosition(String position) { this.position = position; }
    public String getType() { return this.type; }
    public void setType(String type) { this.type = type; }
    public String getLevel() { return this.level; }
    public void setLevel(String level) { this.level = level; }
    public Long getUserId() { return this.userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    public String getProfile() { return profile; }
    public void setProfile(String profile) { this.profile = profile; }
}