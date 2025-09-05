package com.preporbit.prep_orbit.config;

import com.preporbit.prep_orbit.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        String method = request.getMethod();

        // ✅ Skip JWT validation for public endpoints
        if (isPublicEndpoint(requestURI, method)) {
            logger.info("🌐 Public endpoint accessed: {} {} at 2025-09-05 15:04:06", method, requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            try {
                if (jwtService.validateToken(token)) {
                    String username = jwtService.extractUsername(token);

                    logger.info("🔐 Authenticating user: {} for {} {} at 2025-09-05 15:04:06",
                            username, method, requestURI);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    username,
                                    null,
                                    Collections.singleton(new SimpleGrantedAuthority("USER"))
                            );
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    logger.info("✅ User {} authenticated successfully for interview access", username);
                } else {
                    logger.warn("❌ Invalid JWT token for Arjo-Kar at 2025-09-05 15:04:06");
                    sendUnauthorizedResponse(response, "Invalid JWT token");
                    return;
                }
            } catch (Exception e) {
                logger.error("❌ JWT validation error for Arjo-Kar: {}", e.getMessage());
                sendUnauthorizedResponse(response, "JWT validation failed");
                return;
            }
        } else {
            // ✅ No token provided for protected endpoint
            logger.warn("🔒 No JWT token provided for protected endpoint: {} {} for user Arjo-Kar", method, requestURI);
            sendUnauthorizedResponse(response, "Authentication token required");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String requestURI, String method) {
        // ✅ Public endpoints that don't require authentication
        return requestURI.startsWith("/auth/") ||
                requestURI.startsWith("/api/auth/") ||
                requestURI.startsWith("/health") ||
                requestURI.startsWith("/actuator/") ||
                requestURI.startsWith("/api/vapi/webhook") ||
                requestURI.startsWith("/api/vapi/health") ||
                "OPTIONS".equals(method);
    }

    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(String.format(
                "{\n" +
                        "  \"success\": false,\n" +
                        "  \"error\": \"Unauthorized\",\n" +
                        "  \"message\": \"%s\",\n" +
                        "  \"timestamp\": \"2025-09-05 15:04:06\",\n" +
                        "  \"user\": \"Arjo-Kar\",\n" +
                        "  \"required\": \"Valid JWT token in Authorization header\"\n" +
                        "}",
                message
        ));
    }
}