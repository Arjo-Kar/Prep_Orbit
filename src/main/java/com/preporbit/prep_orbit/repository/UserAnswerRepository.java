package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {}