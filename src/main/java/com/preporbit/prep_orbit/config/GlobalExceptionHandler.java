package com.preporbit.prep_orbit.config;

import com.preporbit.prep_orbit.exception.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private Map<String,Object> baseBody(String message) {
        Map<String,Object> m = new HashMap<>();
        m.put("timestamp", OffsetDateTime.now().toString());
        m.put("error", message);
        return m;
    }

    @ExceptionHandler(FeedbackThrottleException.class)
    public ResponseEntity<Map<String,Object>> handleThrottle(FeedbackThrottleException ex) {
        log.warn("Throttle: {}", ex.getMessage());
        Map<String,Object> body = baseBody(ex.getMessage());
        body.put("code", "THROTTLED");
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(body);
    }

    @ExceptionHandler(InterviewAccessException.class)
    public ResponseEntity<Map<String,Object>> handleAccess(InterviewAccessException ex) {
        Map<String,Object> body = baseBody(ex.getMessage());
        body.put("code", "ACCESS_DENIED");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(FeedbackAlreadyExistsException.class)
    public ResponseEntity<Map<String,Object>> handleExists(FeedbackAlreadyExistsException ex) {
        Map<String,Object> body = baseBody(ex.getMessage());
        body.put("code", "ALREADY_EXISTS");
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String,Object>> handleRuntime(RuntimeException ex, WebRequest req) {
        log.error("Unhandled runtime exception", ex);
        Map<String,Object> body = baseBody(ex.getMessage());
        body.put("code", "INTERNAL_ERROR");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}