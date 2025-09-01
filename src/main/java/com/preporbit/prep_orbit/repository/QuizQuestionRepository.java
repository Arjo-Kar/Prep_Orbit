package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByQuizSession_Id(Long sessionId);

    List<Long> findIdsByTopicIn(List<String> weakTopics);
}