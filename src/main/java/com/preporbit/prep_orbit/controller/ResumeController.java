package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.ResumeRequest;
import com.preporbit.prep_orbit.service.ResumeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }


    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> getResumeData(
            @RequestBody ResumeRequest resumeRequest
    ) throws IOException {

        System.out.println("Get Resume data hit");
        Map<String, Object> stringObjectMap = resumeService.generateResumeResponse(resumeRequest.userDescription());
        return new ResponseEntity<>(stringObjectMap, HttpStatus.OK);

    }


}