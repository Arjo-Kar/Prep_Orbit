package com.preporbit.prep_orbit.dto;

public class LiveInterviewRequestDto {
    private String position;
    private String type;
    private String level;
    private Long userId;

    public String getPosition() {
        return this.position;
    }

    public String getType() {
        return this.type;
    }

    public String getLevel() {
        return this.level;
    }

    public Long getUserId() {
        return this.userId;
    }
    // getters and setters
}