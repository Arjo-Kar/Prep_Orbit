package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
     Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // If you want to fetch user by ID (the primary key)
    Optional<User> findById(Long id);

    @Query("SELECT MAX((SELECT COUNT(q) FROM QuizSession q WHERE q.userId = u.id) + (SELECT COUNT(c) FROM UserChallengeStats c WHERE c.userId = u.id)) FROM User u")
    int findMaxQuizAndChallengeCount();


    // If you ever add a username field:
    // Optional<User> findByUsername(String username);
}