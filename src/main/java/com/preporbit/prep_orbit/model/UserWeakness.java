package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;


import java.time.LocalDateTime;

@Entity
@Table(name = "user_weakness")
public class UserWeakness {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getIncorrectCount() {
        return incorrectCount;
    }

    public void setIncorrectCount(Integer incorrectCount) {
        this.incorrectCount = incorrectCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    private Long userId;
    private String topic;
    private Integer incorrectCount;
    private LocalDateTime lastUpdated;

    public UserWeakness() {}

    public UserWeakness(Long userId, String topic, Integer incorrectCount, LocalDateTime lastUpdated) {
        this.userId = userId;
        this.topic = topic;
        this.incorrectCount = incorrectCount;
        this.lastUpdated = lastUpdated;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    // getters and setters
}