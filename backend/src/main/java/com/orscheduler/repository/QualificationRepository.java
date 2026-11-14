package com.orscheduler.repository;

import com.orscheduler.entity.Qualification;
import com.orscheduler.enums.QualificationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QualificationRepository extends JpaRepository<Qualification, Long> {
    Optional<Qualification> findByName(String name);
    boolean existsByName(String name);
    List<Qualification> findByCategory(QualificationCategory category);
}
