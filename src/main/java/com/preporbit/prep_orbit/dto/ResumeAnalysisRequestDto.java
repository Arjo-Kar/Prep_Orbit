package com.preporbit.prep_orbit.dto;

import org.springframework.web.multipart.MultipartFile;

public class ResumeAnalysisRequestDto {
    private MultipartFile resume;

    public MultipartFile getResume() { return resume; }
    public void setResume(MultipartFile resume) { this.resume = resume; }
}