package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.InterviewAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterviewAnswerRepository extends JpaRepository<InterviewAnswer, Long> {
    List<InterviewAnswer> findByLiveInterviewId(Long liveInterviewId);
}