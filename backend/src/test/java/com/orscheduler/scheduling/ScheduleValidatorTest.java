package com.orscheduler.scheduling;

import com.orscheduler.entity.*;
import com.orscheduler.enums.EntryStatus;
import com.orscheduler.enums.Priority;
import com.orscheduler.enums.RoomStatus;
import com.orscheduler.enums.StaffType;
import com.orscheduler.dto.response.ValidationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ScheduleValidatorTest {

    private ScheduleValidator validator;
    private OperatingRoom room1;
    private OperatingRoom room2;
    private Staff surgeon1;
    private Staff surgeon2;
    private Staff anesthetist1;
    private LocalDate scheduleDate;

    @BeforeEach
    void setUp() {
        HardConstraintChecker hardConstraintChecker = new HardConstraintChecker();
        validator = new ScheduleValidator(hardConstraintChecker);

        scheduleDate = LocalDate.of(2026, 10, 20);

        room1 = OperatingRoom.builder().id(1L).name("OR-1").roomType("GENERAL").status(RoomStatus.ACTIVE).capacity(1).build();
        room2 = OperatingRoom.builder().id(2L).name("OR-2").roomType("ORTHO").status(RoomStatus.ACTIVE).capacity(1).build();

        surgeon1 = Staff.builder().id(1L).fullName("Dr. Alice").staffType(StaffType.SURGEON).active(true).build();
        surgeon2 = Staff.builder().id(2L).fullName("Dr. Bob").staffType(StaffType.SURGEON).active(true).build();
        anesthetist1 = Staff.builder().id(3L).fullName("Dr. Charlie").staffType(StaffType.ANESTHETIST).active(true).build();
    }

    @Test
    @DisplayName("HC-01 Validation: Room collision with overlapping clean/prep buffer fails validation")
    void testRoomCollisionValidation() {
        ScheduleEntry entry1 = ScheduleEntry.builder()
                .id(1L)
                .operatingRoom(room1)
                .prepStart(scheduleDate.atTime(8, 0))
                .plannedStart(scheduleDate.atTime(8, 20))
                .plannedEnd(scheduleDate.atTime(10, 0))
                .cleanupEnd(scheduleDate.atTime(10, 20))
                .entryStatus(EntryStatus.SCHEDULED)
                .build();

        // Entry 2 prep starts before entry 1 cleanup ends (10:10 < 10:20)
        ScheduleEntry entry2 = ScheduleEntry.builder()
                .id(2L)
                .operatingRoom(room1)
                .prepStart(scheduleDate.atTime(10, 10))
                .plannedStart(scheduleDate.atTime(10, 30))
                .plannedEnd(scheduleDate.atTime(12, 0))
                .cleanupEnd(scheduleDate.atTime(12, 20))
                .entryStatus(EntryStatus.SCHEDULED)
                .build();

        ValidationResult result = validator.validate(List.of(entry1, entry2), List.of(), List.of(), List.of(), List.of());
        assertFalse(result.isValid(), "Overlapping entries in same room must violate HC-01");
        assertTrue(result.getHardViolations().stream().anyMatch(v -> "HC-01".equals(v.getConstraintId())));
    }

    @Test
    @DisplayName("HC-02 Validation: Staff double-booking across distinct rooms fails validation")
    void testStaffCollisionValidation() {
        ScheduleEntry entry1 = ScheduleEntry.builder()
                .id(1L)
                .operatingRoom(room1)
                .prepStart(scheduleDate.atTime(8, 0))
                .plannedStart(scheduleDate.atTime(8, 20))
                .plannedEnd(scheduleDate.atTime(10, 0))
                .cleanupEnd(scheduleDate.atTime(10, 20))
                .entryStatus(EntryStatus.SCHEDULED)
                .assignedStaff(new ArrayList<>())
                .build();

        ScheduleEntryStaff ses1 = ScheduleEntryStaff.builder()
                .scheduleEntry(entry1)
                .staff(surgeon1)
                .assignedRole(StaffType.SURGEON)
                .build();
        entry1.getAssignedStaff().add(ses1);

        // Entry 2 in Room 2 overlaps time and also assigns surgeon1
        ScheduleEntry entry2 = ScheduleEntry.builder()
                .id(2L)
                .operatingRoom(room2)
                .prepStart(scheduleDate.atTime(9, 0))
                .plannedStart(scheduleDate.atTime(9, 20))
                .plannedEnd(scheduleDate.atTime(11, 0))
                .cleanupEnd(scheduleDate.atTime(11, 20))
                .entryStatus(EntryStatus.SCHEDULED)
                .assignedStaff(new ArrayList<>())
                .build();

        ScheduleEntryStaff ses2 = ScheduleEntryStaff.builder()
                .scheduleEntry(entry2)
                .staff(surgeon1)
                .assignedRole(StaffType.SURGEON)
                .build();
        entry2.getAssignedStaff().add(ses2);

        ValidationResult result = validator.validate(List.of(entry1, entry2), List.of(), List.of(), List.of(), List.of());
        assertFalse(result.isValid(), "Double-booked staff member across rooms must violate HC-02");
        assertTrue(result.getHardViolations().stream().anyMatch(v -> "HC-02".equals(v.getConstraintId())));
    }

    @Test
    @DisplayName("Valid Schedule: Independent non-overlapping cases in active rooms pass validation")
    void testValidSchedulePasses() {
        ScheduleEntry entry1 = ScheduleEntry.builder()
                .id(1L)
                .operatingRoom(room1)
                .prepStart(scheduleDate.atTime(8, 0))
                .plannedStart(scheduleDate.atTime(8, 20))
                .plannedEnd(scheduleDate.atTime(10, 0))
                .cleanupEnd(scheduleDate.atTime(10, 20))
                .entryStatus(EntryStatus.SCHEDULED)
                .assignedStaff(new ArrayList<>())
                .build();

        ScheduleEntry entry2 = ScheduleEntry.builder()
                .id(2L)
                .operatingRoom(room1)
                .prepStart(scheduleDate.atTime(10, 30))
                .plannedStart(scheduleDate.atTime(10, 50))
                .plannedEnd(scheduleDate.atTime(12, 30))
                .cleanupEnd(scheduleDate.atTime(12, 50))
                .entryStatus(EntryStatus.SCHEDULED)
                .assignedStaff(new ArrayList<>())
                .build();

        ValidationResult result = validator.validate(List.of(entry1, entry2), List.of(), List.of(), List.of(), List.of());
        assertTrue(result.isValid(), "Non-overlapping entries with sufficient turnover must be valid");
        assertTrue(result.getHardViolations().isEmpty());
    }
}
