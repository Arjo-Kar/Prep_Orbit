package com.preporbit.prep_orbit.controller;

import com.preporbit.prep_orbit.dto.FeedbackTimePointDto;
import com.preporbit.prep_orbit.model.InterviewFeedback;
import com.preporbit.prep_orbit.repository.InterviewFeedbackRepository;
import com.preporbit.prep_orbit.service.InterviewService;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/interviews/analytics")
public class InterviewAnalyticsController {

    private final InterviewFeedbackRepository feedbackRepo;
    private final InterviewService interviewService;

    public InterviewAnalyticsController(InterviewFeedbackRepository feedbackRepo,
                                        InterviewService interviewService) {
        this.feedbackRepo = feedbackRepo;
        this.interviewService = interviewService;
    }

    @GetMapping(value = "/time-series", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String,Object> timeSeries(@RequestParam(defaultValue = "30") int days) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long userId = interviewService.getUserIdByUsername(auth.getName());

        LocalDateTime from = LocalDate.now().minusDays(days - 1L).atStartOfDay();
        LocalDateTime to = LocalDateTime.now();

        List<InterviewFeedback> rows = feedbackRepo.findUserTimeSeries(userId, from, to);

        List<FeedbackTimePointDto> series = new ArrayList<>();
        for (InterviewFeedback f : rows) {
            FeedbackTimePointDto dto = new FeedbackTimePointDto();
            dto.setFeedbackId(f.getId());
            dto.setInterviewId(f.getInterviewId());
            dto.setTimestamp(f.getCreatedAt());
            dto.setOverall(asDouble(f.getOverallScore()));
            dto.setTechnical(asDouble(f.getTechnicalScore()));
            dto.setCommunication(asDouble(f.getCommunicationScore()));
            dto.setProblemSolving(asDouble(f.getProblemSolvingScore()));
            series.add(dto);
        }

        double slope = computeSlope(series);

        Map<String,Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("days", days);
        resp.put("series", series);
        resp.put("trendSlope", slope);
        resp.put("trendLabel", slope > 0.02 ? "improving" : slope < -0.02 ? "declining" : "flat");
        return resp;
    }

    private Double asDouble(Integer i) { return i == null ? null : i.doubleValue(); }

    private double computeSlope(List<FeedbackTimePointDto> points) {
        List<FeedbackTimePointDto> p = points.stream()
                .filter(x -> x.getOverall() != null)
                .toList();
        int n = p.size();
        if (n < 2) return 0.0;
        double sumX=0,sumY=0,sumXY=0,sumX2=0;
        for (int i=0;i<n;i++){
            double x=i;
            double y=p.get(i).getOverall();
            sumX+=x; sumY+=y; sumXY+=x*y; sumX2+=x*x;
        }
        double slope=(n*sumXY - sumX*sumY)/(n*sumX2 - sumX*sumX);
        return Math.round(slope*1000d)/1000d;
    }
}