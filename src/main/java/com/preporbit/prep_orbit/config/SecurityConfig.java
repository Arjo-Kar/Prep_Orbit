package com.preporbit.prep_orbit.config;

import com.preporbit.prep_orbit.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtService jwtService;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✅ Updated with current ngrok URL for Arjo-Kar at 2025-09-05 15:04:06
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
                "https://api.vapi.ai",
                "https://dashboard.vapi.ai",
                "https://*.ngrok-free.app",
                "https://d8adc0d2d46e.ngrok-free.app" // ✅ Your current ngrok URL

        ));

        // ✅ Allow all HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));

        // ✅ Allow all headers including ngrok headers
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // ✅ Allow credentials (needed for JWT tokens)
        configuration.setAllowCredentials(true);

        // ✅ Expose headers for frontend
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers",
                "ngrok-skip-browser-warning" // ✅ Add ngrok header
        ));

        // ✅ Set max age for preflight cache
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // ✅ Public endpoints - no authentication required
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll() // ✅ Added API prefix
                        .requestMatchers("/health", "/actuator/**").permitAll()

                        // ✅ Allow OPTIONS requests for CORS preflight
                        .requestMatchers("OPTIONS", "/**").permitAll()

                        // ✅ VAPI webhook endpoints (no auth needed for webhooks)
                        .requestMatchers("/api/vapi/webhook").permitAll()
                        .requestMatchers("/api/vapi/health").permitAll()

                        // ✅ Interview endpoints - REQUIRE AUTHENTICATION for Arjo-Kar
                        .requestMatchers("/api/interviews/**").authenticated()
                        .requestMatchers("/api/vapi/interview/generate").authenticated()

                        // ✅ All other endpoints require authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new com.preporbit.prep_orbit.config.JwtAuthenticationFilter(jwtService),
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class
                );
        return http.build();
    }
}