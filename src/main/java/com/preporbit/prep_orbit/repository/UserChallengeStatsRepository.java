package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.UserChallengeStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface UserChallengeStatsRepository extends JpaRepository<UserChallengeStats, Long> {

    @Query("SELECT ucs FROM UserChallengeStats ucs WHERE ucs.userId = :userId AND DATE(ucs.createdAt) = :date")
    Optional<UserChallengeStats> findByUserIdAndCreatedAtDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(ucs) FROM UserChallengeStats ucs WHERE ucs.userId = :userId")
    Long countByUserId(@Param("userId") Long userId);
}