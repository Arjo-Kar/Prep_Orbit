package com.preporbit.prep_orbit.service;

import com.preporbit.prep_orbit.model.UserWeakness;
import com.preporbit.prep_orbit.repository.UserWeaknessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
@Service
public class UserWeaknessService {

    @Autowired
    private UserWeaknessRepository weaknessRepo;

    public void updateUserWeaknesses(Long userId, List<String> weakTopics) {
        for (String topic : weakTopics) {
            UserWeakness uw = weaknessRepo.findByUserIdAndTopic(userId, topic)
                    .orElse(new UserWeakness(userId, topic, 0, LocalDateTime.now()));

            uw.setIncorrectCount(uw.getIncorrectCount() + 1);
            uw.setLastUpdated(LocalDateTime.now());
            weaknessRepo.save(uw);
        }
    }

    public List<UserWeakness> getWeaknessesForUser(Long userId) {
        return weaknessRepo.findByUserIdOrderByIncorrectCountDesc(userId);
    }
}