package com.preporbit.prep_orbit.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.List;

@Entity
public class LiveInterview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String position;
    private String type; // e.g., technical, behavioral, mixed
    private String level; // e.g., junior, mid, senior
    private Long userId;

    @OneToMany(mappedBy = "liveInterview", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<InterviewQuestion> questions;

    // ...getters and setters...

    public List<InterviewQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<InterviewQuestion> questions) {
        this.questions = questions;
    }

    public String getLevel() {
        return level;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getPosition() {
        return position;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUsername(String username) {
    }



}