package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;

@Entity
public class ChallengeTestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "coding_challenge_id")
    private CodingChallenge codingChallenge;

    @Column(length = 1000)
    private String input;

    @Column(length = 1000)
    private String expectedOutput;

    private boolean isVisible; // true if test case is shown to user

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CodingChallenge getCodingChallenge() { return codingChallenge; }
    public void setCodingChallenge(CodingChallenge codingChallenge) { this.codingChallenge = codingChallenge; }

    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }

    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }

    public boolean isVisible() { return isVisible; }
    public void setVisible(boolean visible) { isVisible = visible; }
}