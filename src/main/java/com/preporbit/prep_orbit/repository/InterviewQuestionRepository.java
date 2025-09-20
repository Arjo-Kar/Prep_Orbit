package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findByLiveInterviewId(Long liveInterviewId);
}