package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.InterviewFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewFeedbackRepository extends JpaRepository<InterviewFeedback, Long> {

    Optional<InterviewFeedback> findByInterviewIdAndUserId(Long interviewId, Long userId);

    List<InterviewFeedback> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<InterviewFeedback> findByInterviewId(Long interviewId);

    @Query("SELECT AVG(f.overallScore) FROM InterviewFeedback f WHERE f.userId = :userId")
    Double getAverageScoreByUserId(@Param("userId") Long userId);

    @Query("SELECT f FROM InterviewFeedback f WHERE f.userId = :userId AND f.overallScore >= :minScore ORDER BY f.createdAt DESC")
    List<InterviewFeedback> findByUserIdAndMinScore(@Param("userId") Long userId, @Param("minScore") Integer minScore);

    @Query("SELECT COUNT(f) FROM InterviewFeedback f WHERE f.userId = :userId")
    Long countFeedbackByUserId(@Param("userId") Long userId);
    @Query("SELECT avg(f.communicationScore) FROM InterviewFeedback f WHERE f.userId = :userId")
    Double getAverageCommunicationByUser(Long userId);

    @Query("SELECT avg(f.problemSolvingScore) FROM InterviewFeedback f WHERE f.userId = :userId")
    Double getAverageProblemSolvingByUser(Long userId);

    @Query("SELECT count(f) FROM InterviewFeedback f WHERE f.userId = :userId")
    Long getFeedbackCount(Long userId);
    @Query("SELECT avg(f.technicalScore) FROM InterviewFeedback f WHERE f.userId = :userId")
    Double getAverageTechnicalByUser(Long userId);
}