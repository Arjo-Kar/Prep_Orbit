package com.preporbit.prep_orbit.service;

import com.preporbit.prep_orbit.dto.LoginRequest;
import com.preporbit.prep_orbit.dto.LoginResponse;
import com.preporbit.prep_orbit.dto.SignupRequest;
import com.preporbit.prep_orbit.dto.StandardResponse;
import com.preporbit.prep_orbit.dto.UserDto;
import com.preporbit.prep_orbit.model.User;
import com.preporbit.prep_orbit.model.VerificationToken;
import com.preporbit.prep_orbit.repository.UserRepository;
import com.preporbit.prep_orbit.repository.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

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
}