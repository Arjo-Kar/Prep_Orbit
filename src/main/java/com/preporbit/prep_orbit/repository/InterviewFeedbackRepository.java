package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.InterviewFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewFeedbackRepository extends JpaRepository<InterviewFeedback, Long> {

    Optional<InterviewFeedback> findByInterviewIdAndUserId(Long interviewId, Long userId);

    List<InterviewFeedback> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<InterviewFeedback> findByInterviewId(Long interviewId);

    @Query("SELECT AVG(f.overallScore) FROM InterviewFeedback f WHERE f.userId = :userId AND f.overallScore IS NOT NULL")
    Double getAverageScoreByUserId(@Param("userId") Long userId);

    @Query("SELECT AVG(f.communicationScore) FROM InterviewFeedback f WHERE f.userId = :userId AND f.communicationScore IS NOT NULL")
    Double getAverageCommunicationByUser(@Param("userId") Long userId);

    @Query("SELECT AVG(f.problemSolvingScore) FROM InterviewFeedback f WHERE f.userId = :userId AND f.problemSolvingScore IS NOT NULL")
    Double getAverageProblemSolvingByUser(@Param("userId") Long userId);

    @Query("SELECT AVG(f.technicalScore) FROM InterviewFeedback f WHERE f.userId = :userId AND f.technicalScore IS NOT NULL")
    Double getAverageTechnicalByUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(f) FROM InterviewFeedback f WHERE f.userId = :userId")
    Long getFeedbackCount(@Param("userId") Long userId);

    // Time series (optionally restrict window)
    @Query("""
           SELECT f FROM InterviewFeedback f
           WHERE f.userId = :userId
             AND (:from IS NULL OR f.createdAt >= :from)
             AND (:to IS NULL OR f.createdAt <= :to)
           ORDER BY f.createdAt ASC
           """)
    List<InterviewFeedback> findUserTimeSeries(@Param("userId") Long userId,
                                               @Param("from") LocalDateTime from,
                                               @Param("to") LocalDateTime to);
}