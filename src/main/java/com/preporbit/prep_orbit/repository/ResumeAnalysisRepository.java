package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.ResumeAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, Long> {

    // Find all analyses for a specific user
    List<ResumeAnalysis> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Find user's latest analysis
    Optional<ResumeAnalysis> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    // Find analyses within date range
    @Query("SELECT ra FROM ResumeAnalysis ra WHERE ra.userId = :userId AND ra.createdAt BETWEEN :startDate AND :endDate ORDER BY ra.createdAt DESC")
    List<ResumeAnalysis> findByUserIdAndDateRange(@Param("userId") Long userId,
                                                  @Param("startDate") LocalDateTime startDate,
                                                  @Param("endDate") LocalDateTime endDate);

    // Count total analyses for user
    Long countByUserId(Long userId);

    // Find analyses with score above threshold
    @Query("SELECT ra FROM ResumeAnalysis ra WHERE ra.userId = :userId AND ra.overallScore >= :minScore ORDER BY ra.createdAt DESC")
    List<ResumeAnalysis> findByUserIdAndScoreAbove(@Param("userId") Long userId, @Param("minScore") Integer minScore);

    // Calculate average score for user
    @Query("SELECT AVG(ra.overallScore) FROM ResumeAnalysis ra WHERE ra.userId = :userId")
    Double calculateAverageScoreByUserId(@Param("userId") Long userId);

    // Find user's best analysis
    @Query("SELECT ra FROM ResumeAnalysis ra WHERE ra.userId = :userId ORDER BY ra.overallScore DESC")
    Optional<ResumeAnalysis> findBestAnalysisByUserId(@Param("userId") Long userId);

    // Get improvement trend (last 5 analyses)
    @Query("SELECT ra FROM ResumeAnalysis ra WHERE ra.userId = :userId ORDER BY ra.createdAt DESC")
    List<ResumeAnalysis> findRecentAnalysesForTrend(@Param("userId") Long userId);

    // Find analyses by filename pattern
    List<ResumeAnalysis> findByUserIdAndFilenameContainingIgnoreCase(Long userId, String filenamePattern);

    // Get monthly statistics - Fixed for PostgreSQL
    @Query(value = "SELECT EXTRACT(MONTH FROM ra.created_at) as month, COUNT(ra.*) as count, AVG(ra.overall_score) as avgScore " +
            "FROM resume_analyses ra WHERE ra.user_id = :userId AND EXTRACT(YEAR FROM ra.created_at) = :year " +
            "GROUP BY EXTRACT(MONTH FROM ra.created_at) ORDER BY month", nativeQuery = true)
    List<Object[]> getMonthlyStatistics(@Param("userId") Long userId, @Param("year") Integer year);

    // Check if user has analyzed resume today - Fixed query
    @Query("SELECT CASE WHEN COUNT(ra) > 0 THEN true ELSE false END FROM ResumeAnalysis ra WHERE ra.userId = :userId AND ra.createdAt >= :startOfDay AND ra.createdAt < :endOfDay")
    Boolean hasAnalyzedToday(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    List<ResumeAnalysis> findByUserId(Long userId);
}