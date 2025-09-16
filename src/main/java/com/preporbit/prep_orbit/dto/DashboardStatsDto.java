package com.preporbit.prep_orbit.dto;

public class DashboardStatsDto {
    private int totalQuizzesTaken;
    private int codingChallengesSolved;
    private int streak;
    private String rank;
    private int weeklyTarget;
    private double averageScore;
    private double accuracy;

    public double getAccuracy() { return accuracy; }
    public void setAccuracy(double accuracy) { this.accuracy = accuracy; }

    public int getTotalQuizzesTaken() {
        return totalQuizzesTaken;
    }

    public void setTotalQuizzesTaken(int totalQuizzesTaken) {
        this.totalQuizzesTaken = totalQuizzesTaken;
    }

    public void setAverageScore(double averageScoreForUser) {
        this.averageScore = averageScoreForUser;
    }

    public void setWeeklyTarget(int i) {
        this.weeklyTarget = i;
    }

    public void setCodingChallengesSolved(int o) {
        this.codingChallengesSolved = o;
    }

    public void setStreak(int streak) {
        this.streak = streak;
    }

    public void setRank(String rank) {
        this.rank = rank;
    }
    public int getCodingChallengesSolved() { return codingChallengesSolved; }
    public int getStreak() { return streak; }
    public String getRank() { return rank; }
    public int getWeeklyTarget() { return weeklyTarget; }
    public double getAverageScore() { return averageScore; }

// Constructors, getters, setters

}