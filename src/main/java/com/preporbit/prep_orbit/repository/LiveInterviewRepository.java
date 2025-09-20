package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.LiveInterview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LiveInterviewRepository extends JpaRepository<LiveInterview, Long> {
    //List<LiveInterview> findByUsername(String username);

    List<LiveInterview> findByUserId(Long userId);
    // You can add custom queries if needed
}