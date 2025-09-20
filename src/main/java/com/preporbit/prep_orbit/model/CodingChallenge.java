package com.preporbit.prep_orbit.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class CodingChallenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(length = 4000)
    private String description;

    private int timeLimitMs;
    private int memoryLimitKb;

    @Column(length = 2000)
    private String inputSpec;

    @Column(length = 2000)
    private String outputSpec;

    @OneToMany(mappedBy = "codingChallenge", cascade = CascadeType.ALL)
    private List<ChallengeTestCase> testCases;

    private String difficulty;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "challenge_topics", joinColumns = @JoinColumn(name = "challenge_id"))
    @Column(name = "topic")
    private List<String> topics;

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

    public List<ChallengeTestCase> getTestCases() { return testCases; }
    public void setTestCases(List<ChallengeTestCase> testCases) { this.testCases = testCases; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public List<String> getTopics() { return topics; }
    public void setTopics(List<String> topics) { this.topics = topics; }
}