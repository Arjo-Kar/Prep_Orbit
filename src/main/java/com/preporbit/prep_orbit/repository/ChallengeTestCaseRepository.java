package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.ChallengeTestCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChallengeTestCaseRepository extends JpaRepository<ChallengeTestCase, Long> {
    List<ChallengeTestCase> findByCodingChallengeIdAndIsVisible(Long challengeId, boolean isVisible);
}