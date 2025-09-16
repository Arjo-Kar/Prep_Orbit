package com.preporbit.prep_orbit.controller;
import com.preporbit.prep_orbit.service.UserService;
import com.preporbit.prep_orbit.dto.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class UserController {

   @Autowired
   private UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<StandardResponse> signup(@RequestBody SignupRequest request) {
        StandardResponse response = userService.signup(request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest payload) {
        LoginResponse response = userService.login(payload);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<LoginResponse> verifyEmail(@RequestParam("token") String token) {
        LoginResponse response = userService.verifyEmail(token);
        return ResponseEntity.status(response.getStatus()).body(response);
    }
    @GetMapping("/dashboard-stats")
    public ResponseEntity<DashboardStatsDto> getUserDashboardStats(@RequestParam Long userId) {
        DashboardStatsDto stats = userService.getUserDashboardStats(userId);
        return ResponseEntity.ok(stats);
    }
}