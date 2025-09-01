package com.preporbit.prep_orbit.repository;

import com.preporbit.prep_orbit.model.UserWeakness;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserWeaknessRepository extends JpaRepository<UserWeakness, Long> {
    Optional<UserWeakness> findByUserIdAndTopic(Long userId, String topic);
    List<UserWeakness> findByUserIdOrderByIncorrectCountDesc(Long userId);
}