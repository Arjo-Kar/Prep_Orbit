package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.dto.QuizQuestionDto;
import com.preporbit.prep_orbit.model.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {
    List<UserAnswer> findByIsCorrectFalseAndQuizSession_UserIdAndQuestionIdIn(Long userId, List<Long> questionIds);
}