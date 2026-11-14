package com.orscheduler.repository;

import com.orscheduler.entity.ScheduleVersion;
import com.orscheduler.enums.ScheduleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleVersionRepository extends JpaRepository<ScheduleVersion, Long> {
    Optional<ScheduleVersion> findByVersionLabel(String versionLabel);

    @Query("SELECT sv FROM ScheduleVersion sv WHERE sv.scheduleDate = :date AND sv.status = :status")
    List<ScheduleVersion> findByDateAndStatus(
            @Param("date") LocalDate date,
            @Param("status") ScheduleStatus status);

    @Query("SELECT sv FROM ScheduleVersion sv WHERE sv.scheduleDate = :date AND sv.status = 'PUBLISHED'")
    Optional<ScheduleVersion> findPublishedByDate(@Param("date") LocalDate date);

    @Query("SELECT sv FROM ScheduleVersion sv WHERE sv.scheduleDate = :date AND sv.status = 'PUBLISHED'")
    Optional<ScheduleVersion> findActiveScheduleForDate(@Param("date") LocalDate date);

    Page<ScheduleVersion> findByScheduleDate(LocalDate date, Pageable pageable);
    Page<ScheduleVersion> findByScheduleDateAndStatus(LocalDate date, ScheduleStatus status, Pageable pageable);
    Page<ScheduleVersion> findByScheduleDateOrderByVersionNumberDesc(LocalDate date, Pageable pageable);

    @Query("SELECT COALESCE(MAX(sv.versionNumber), 0) FROM ScheduleVersion sv WHERE sv.scheduleDate = :date")
    int findMaxVersionNumberByDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(MAX(sv.versionNumber), 0) FROM ScheduleVersion sv WHERE sv.scheduleDate = :date")
    Optional<Integer> findMaxVersionNumberForDate(@Param("date") LocalDate date);

    List<ScheduleVersion> findByScheduleDateAndStatusIn(LocalDate date, List<ScheduleStatus> statuses);

    @Query("SELECT sv FROM ScheduleVersion sv WHERE sv.scheduleDate BETWEEN :startDate AND :endDate")
    List<ScheduleVersion> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
