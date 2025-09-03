package com.preporbit.prep_orbit.dto;

public class LoginResponse {
    private int status;
    private String message;
    private String token;
    private UserDto user; // Add this field

    public LoginResponse(int status, String message, String token, UserDto user) {
        this.status = status;
        this.message = message;
        this.token = token;
        this.user = user;
    }

    // If you need a constructor without user for error cases
    public LoginResponse(int status, String message, String token) {
        this.status = status;
        this.message = message;
        this.token = token;
    }

    public int getStatus() {
        return status;
    }
    public void setStatus(int status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }
    public void setToken(String token) {
        this.token = token;
    }

    public UserDto getUser() {
        return user;
    }
    public void setUser(UserDto user) {
        this.user = user;
    }
}