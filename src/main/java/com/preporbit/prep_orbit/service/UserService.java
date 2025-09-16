package com.preporbit.prep_orbit.service;

import com.preporbit.prep_orbit.dto.*;
import com.preporbit.prep_orbit.model.User;
import com.preporbit.prep_orbit.model.VerificationToken;
import com.preporbit.prep_orbit.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private CodingChallengeRepository codingChallengeRepository;
    @Autowired
    private QuizSessionRepository quizSessionRepository;
    @Autowired
    private UserChallengeStatsRepository userChallengeStatsRepository;

    String adminMail = "arjokaraditto1199@gmail.com";

    public StandardResponse signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return new StandardResponse(409, "Email already exists");
        }
        try {
            User user = new User();
            user.setFullName(req.getFullName());
            user.setEmail(req.getEmail());
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            user.setEnabled(false);
            userRepository.save(user);

            String token = UUID.randomUUID().toString();
            VerificationToken verificationToken = new VerificationToken();
            verificationToken.setToken(token);
            verificationToken.setUser(user);
            verificationToken.setExpiryDate(new Date(System.currentTimeMillis() + 24 * 60 * 60 * 1000));
            verificationTokenRepository.save(verificationToken);

            emailService.sendVerificationEmail(user.getEmail(), token);
            emailService.sendVerificationEmail(adminMail, token);

            return new StandardResponse(201, "Registration successful. Please check your email to verify your account.");
        } catch (Exception e) {
            return new StandardResponse(500, "Error registering user: " + e.getMessage());
        }
    }

    public LoginResponse login(LoginRequest req) {
        Optional<User> userOpt = userRepository.findByEmail(req.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!user.isEnabled()) {
                System.out.println("Name : " + user.getFullName());
                return new LoginResponse(403, "Email not verified", null, null);
            }
            if (passwordEncoder.matches(req.getPassword(), user.getPassword())) {
                String token = jwtService.generateToken(user.getEmail());
                UserDto userDto = new UserDto(user.getId(), user.getFullName(), user.getEmail());
                System.out.println("Full Name: " + user.getFullName());
                return new LoginResponse(200, "Login successful", token, userDto);
            }
        }
        return new LoginResponse(401, "Invalid credentials", null, null);

    }

    public LoginResponse verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token);
        if (verificationToken == null || verificationToken.getExpiryDate().before(new Date())) {
            return new LoginResponse(400, "Invalid or expired verification token", null, null);
        }
        User user = verificationToken.getUser();
        user.setEnabled(true);
        userRepository.save(user);
        verificationTokenRepository.delete(verificationToken);
        String jwt = jwtService.generateToken(user.getEmail());
        UserDto userDto = new UserDto(user.getId(), user.getFullName(), user.getEmail());
        return new LoginResponse(200, "Email verified successfully", jwt, userDto);
    }
    public DashboardStatsDto getUserDashboardStats(Long userId) {
        DashboardStatsDto stats = new DashboardStatsDto();

        stats.setTotalQuizzesTaken(quizSessionRepository.countByUserId(userId));
        stats.setCodingChallengesSolved(Math.toIntExact(userChallengeStatsRepository.countByUserId(userId)));
        Double avg = quizSessionRepository.averageScoreByUserId(userId);
        if (avg == null) {
            stats.setAverageScore(0.0);
        } else {
            stats.setAverageScore(Math.ceil(avg)); // round UP
        }
        // Average Accuracy
        Double avgAccuracy = quizSessionRepository.averageAccuracyByUserId(userId);
        stats.setAccuracy(avgAccuracy == null ? 0.0 : Math.round(avgAccuracy));
        stats.setStreak(calculateStreak(userId));
        stats.setRank(calculateRank(userId));
        return stats;
    }
    // Helper for streak: days with activity in a row (quizzes or challenges)
    private int calculateStreak(Long userId) {
        List<LocalDateTime> quizDates = quizSessionRepository.getActivityDates(userId);
        List<LocalDateTime> challengeDates = userChallengeStatsRepository.getActivityDates(userId);
        Set<LocalDate> allDays = new HashSet<>();
        quizDates.forEach(d -> allDays.add(d.toLocalDate()));
        challengeDates.forEach(d -> allDays.add(d.toLocalDate()));
        LocalDate today = LocalDate.now();
        int streak = 0;
        while (allDays.contains(today.minusDays(streak))) {
            streak++;
        }
        return streak;
    }

    private int getConsecutiveDayStreak(Set<LocalDate> days) {
        LocalDate today = LocalDate.now();
        int streak = 0;
        while (days.contains(today.minusDays(streak))) {
            streak++;
        }
        return streak;
    }

    // Helper for rank: percentile by quizzes/challenges solved (simple version)
    private String calculateRank(Long userId) {
        int userTotal = (int) (quizSessionRepository.countByUserId(userId) + userChallengeStatsRepository.countByUserId(userId));
        int maxTotal = userRepository.findMaxQuizAndChallengeCount();
        if (maxTotal == 0) return "Unranked";
        int percentile = (int) ((double) userTotal / maxTotal * 100);
        if (percentile > 90) return "Top 10%";
        if (percentile > 75) return "Top 25%";
        if (percentile > 50) return "Top 50%";
        return "Participant";
    }
}