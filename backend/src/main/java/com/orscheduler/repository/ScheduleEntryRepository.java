package com.orscheduler.repository;

import com.orscheduler.entity.ScheduleEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduleEntryRepository extends JpaRepository<ScheduleEntry, Long> {
    List<ScheduleEntry> findByScheduleVersionId(Long scheduleVersionId);

    @Query("SELECT se FROM ScheduleEntry se WHERE se.scheduleVersion.id = :versionId " +
           "AND se.operatingRoom.id = :roomId " +
           "AND se.prepStart < :end AND se.cleanupEnd > :start")
    List<ScheduleEntry> findRoomConflicts(
            @Param("versionId") Long versionId,
            @Param("roomId") Long roomId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT se FROM ScheduleEntry se JOIN se.assignedStaff ses " +
           "WHERE se.scheduleVersion.id = :versionId " +
           "AND ses.staff.id = :staffId " +
           "AND se.plannedStart < :end AND se.plannedEnd > :start")
    List<ScheduleEntry> findStaffConflicts(
            @Param("versionId") Long versionId,
            @Param("staffId") Long staffId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT se FROM ScheduleEntry se JOIN se.assignedEquipment see " +
           "WHERE se.scheduleVersion.id = :versionId " +
           "AND see.equipment.id = :equipmentId " +
           "AND se.plannedStart < :end AND se.plannedEnd > :start")
    List<ScheduleEntry> findEquipmentConflicts(
            @Param("versionId") Long versionId,
            @Param("equipmentId") Long equipmentId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
