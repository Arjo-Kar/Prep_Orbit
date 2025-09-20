package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.CodingChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CodingChallengeRepository extends JpaRepository<CodingChallenge, Long> {
    List<CodingChallenge> findByDifficulty(String difficulty);
    List<CodingChallenge> findByTitleContainingIgnoreCase(String keyword);

}