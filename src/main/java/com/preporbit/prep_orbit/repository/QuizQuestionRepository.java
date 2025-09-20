package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByQuizSession_Id(Long sessionId);

    @Query("SELECT qq.id FROM QuizQuestion qq WHERE qq.topic IN :topics")
    List<Long> findIdsByTopicIn(@Param("topics") List<String> weakTopics);
}