package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    List<Interview> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Interview> findByUserIdAndFinalizedTrueOrderByCreatedAtDesc(Long userId);

    Optional<Interview> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COUNT(i) FROM Interview i WHERE i.userId = :userId AND i.createdAt >= :startDate")
    Long countUserInterviewsInPeriod(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT i FROM Interview i WHERE i.userId = :userId AND i.type = :type ORDER BY i.createdAt DESC")
    List<Interview> findByUserIdAndType(@Param("userId") Long userId, @Param("type") String type);

    @Query("SELECT i FROM Interview i WHERE i.userId = :userId AND i.level = :level ORDER BY i.createdAt DESC")
    List<Interview> findByUserIdAndLevel(@Param("userId") Long userId, @Param("level") String level);

    List<Interview> findByFinalizedTrueOrderByCreatedAtDesc();

    @Query("SELECT COUNT(i) FROM Interview i WHERE i.finalized = true")
    Long countFinalizedInterviews();
}