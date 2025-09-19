package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.CodingChallenge;
import com.preporbit.prep_orbit.model.UserChallengeStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface UserChallengeStatsRepository extends JpaRepository<UserChallengeStats, Long> {

    @Query("SELECT ucs FROM UserChallengeStats ucs WHERE ucs.userId = :userId AND DATE(ucs.createdAt) = :date")
    Optional<UserChallengeStats> findByUserIdAndCreatedAtDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(ucs) FROM UserChallengeStats ucs WHERE ucs.userId = :userId")
    Long countByUserId(@Param("userId") Long userId);

    @Query("SELECT u.createdAt FROM UserChallengeStats u WHERE u.userId = :userId")
    List<LocalDateTime> getActivityDates(@Param("userId") Long userId);

    @Query("SELECT COUNT(ucs) FROM UserChallengeStats ucs WHERE ucs.userId = :userId AND ucs.solved = true")
    Long countByUserIdAndSolvedTrue(@Param("userId") Long userId);

    @Query("SELECT ucs FROM UserChallengeStats ucs WHERE ucs.userId = :userId AND ucs.challengeId = :challengeId")
    Optional<UserChallengeStats> findByUserIdAndChallengeId(@Param("userId") Long userId, @Param("challengeId") Long challengeId);

    // Returns the latest UserChallengeStats for a user (by createdAt descending)
    Optional<UserChallengeStats> findTopByUserIdOrderByCreatedAtDesc(Long userId);
}