package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.User;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
     Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // If you want to fetch user by ID (the primary key)
    Optional<User> findById(Long id);



    // If you ever add a username field:
    // Optional<User> findByUsername(String username);
}