package com.preporbit.prep_orbit.service;

import com.preporbit.prep_orbit.dto.FeedbackTimePointDto;
import com.preporbit.prep_orbit.repository.InterviewFeedbackRepository;
import com.preporbit.prep_orbit.model.InterviewFeedback;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class InterviewAnalyticsService {

    private final InterviewFeedbackRepository feedbackRepository;

    public InterviewAnalyticsService(InterviewFeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public List<FeedbackTimePointDto> getFeedbackSeries(Long userId, int days) {
        LocalDateTime from = days > 0 ? LocalDate.now().minusDays(days - 1L).atStartOfDay() : null;
        LocalDateTime to = LocalDateTime.now();

        List<InterviewFeedback> rows =
                feedbackRepository.findUserTimeSeries(userId, from, to);

        List<FeedbackTimePointDto> out = new ArrayList<>();
        for (InterviewFeedback f : rows) {
            FeedbackTimePointDto dto = new FeedbackTimePointDto();
            dto.setFeedbackId(f.getId());
            dto.setInterviewId(f.getInterviewId());
            dto.setTimestamp(f.getCreatedAt());
            dto.setOverall(toDouble(f.getOverallScore()));
            dto.setTechnical(toDouble(f.getTechnicalScore()));
            dto.setCommunication(toDouble(f.getCommunicationScore()));
            dto.setProblemSolving(toDouble(f.getProblemSolvingScore()));
            out.add(dto);
        }
        return out;
    }

    public double computeSlope(List<FeedbackTimePointDto> points) {
        // simple least squares on index vs overall
        var filtered = points.stream()
                .filter(p -> p.getOverall() != null)
                .toList();
        int n = filtered.size();
        if (n < 2) return 0.0;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            double x = i;
            double y = filtered.get(i).getOverall();
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }
        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return Math.round(slope * 1000.0) / 1000.0;
    }

    private Double toDouble(Integer i) {
        return i == null ? null : i.doubleValue();
    }
}