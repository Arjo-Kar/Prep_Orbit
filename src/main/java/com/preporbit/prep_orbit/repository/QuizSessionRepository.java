package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.QuizSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Date;
import java.util.List;

public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {
    int countByUserId(Long userId);
    @Query("SELECT AVG(q.score) FROM QuizSession q WHERE q.userId = :userId")
    Double averageScoreByUserId(@Param("userId") Long userId);


    @Query("SELECT q.startedAt FROM QuizSession q WHERE q.userId = :userId")
    List<LocalDateTime> getActivityDates(@Param("userId") Long userId);

    @Query("SELECT avg(q.accuracy) from QuizSession q where q.userId = :userId")
    Double averageAccuracyByUserId(@Param("userId") Long userId);



}