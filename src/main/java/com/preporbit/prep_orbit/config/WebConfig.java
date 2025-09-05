package com.preporbit.prep_orbit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        // ✅ Added your ngrok URL and other necessary origins
                        .allowedOrigins(
                                "http://localhost:3000", // your current frontend
                                "http://localhost:3001", // backup frontend port
                                "https://5cf353e9e749.ngrok-free.app", // your current ngrok URL
                                "https://api.vapi.ai", // VAPI API calls
                                "https://dashboard.vapi.ai" // VAPI dashboard
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH") // ✅ Added HEAD and PATCH
                        .allowedHeaders("*")
                        .exposedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600); // ✅ Added cache time for preflight requests
            }
        };
    }
}