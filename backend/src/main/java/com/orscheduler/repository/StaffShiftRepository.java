package com.orscheduler.repository;

import com.orscheduler.entity.StaffShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffShiftRepository extends JpaRepository<StaffShift, Long> {
    List<StaffShift> findByStaffId(Long staffId);

    @Query("SELECT s FROM StaffShift s WHERE " +
           "(s.isLeave = true AND s.effectiveFrom <= :date AND (s.effectiveTo IS NULL OR s.effectiveTo >= :date)) OR " +
           "(s.isLeave = false AND " +
           "((s.isRecurring = true AND s.dayOfWeek = :dayOfWeek) OR " +
           "(s.isRecurring = false AND s.effectiveFrom <= :date AND (s.effectiveTo IS NULL OR s.effectiveTo >= :date))))")
    List<StaffShift> findActiveShiftsForDate(
            @Param("dayOfWeek") int dayOfWeek,
            @Param("date") LocalDate date);

    @Query("SELECT s FROM StaffShift s WHERE s.staff.id = :staffId AND " +
           "s.isRecurring = true AND s.dayOfWeek = :dayOfWeek AND " +
           "s.isLeave = false AND " +
           "(s.effectiveFrom IS NULL OR s.effectiveFrom <= :date) AND " +
           "(s.effectiveTo IS NULL OR s.effectiveTo >= :date)")
    List<StaffShift> findActiveRecurringShifts(
            @Param("staffId") Long staffId,
            @Param("dayOfWeek") int dayOfWeek,
            @Param("date") LocalDate date);

    @Query("SELECT s FROM StaffShift s WHERE s.staff.id = :staffId AND " +
           "s.isLeave = true AND " +
           "s.effectiveFrom <= :date AND s.effectiveTo >= :date")
    List<StaffShift> findLeaveOnDate(
            @Param("staffId") Long staffId,
            @Param("date") LocalDate date);
}
