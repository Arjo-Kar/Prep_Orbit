package com.preporbit.prep_orbit.service;

import java.io.IOException;
import java.util.Map;

public interface ResumeService {

    Map<String, Object> generateResumeResponse(String userResumeDescription) throws IOException;
}
