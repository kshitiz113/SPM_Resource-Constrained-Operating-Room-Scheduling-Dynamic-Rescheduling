package com.orscheduler.repository;

import com.orscheduler.entity.EquipmentAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EquipmentAvailabilityRepository extends JpaRepository<EquipmentAvailability, Long> {
    List<EquipmentAvailability> findByEquipmentId(Long equipmentId);

    @Query("SELECT ea FROM EquipmentAvailability ea WHERE ea.equipment.id = :equipmentId AND " +
           "ea.unavailableFrom < :end AND ea.unavailableTo > :start")
    List<EquipmentAvailability> findConflicts(
            @Param("equipmentId") Long equipmentId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT ea FROM EquipmentAvailability ea WHERE ea.unavailableTo >= :fromDateTime")
    List<EquipmentAvailability> findByUnavailableToGreaterThanEqual(@Param("fromDateTime") LocalDateTime fromDateTime);

    default List<EquipmentAvailability> findByUnavailableToGreaterThanEqual(java.time.LocalDate date) {
        return findByUnavailableToGreaterThanEqual(date != null ? date.atStartOfDay() : LocalDateTime.now());
    }
}
