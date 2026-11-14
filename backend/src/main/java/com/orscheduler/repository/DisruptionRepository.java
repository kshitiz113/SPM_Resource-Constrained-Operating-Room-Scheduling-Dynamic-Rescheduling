package com.orscheduler.repository;

import com.orscheduler.entity.Disruption;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisruptionRepository extends JpaRepository<Disruption, Long> {
    Page<Disruption> findByAffectedScheduleVersionId(Long scheduleVersionId, Pageable pageable);
}
