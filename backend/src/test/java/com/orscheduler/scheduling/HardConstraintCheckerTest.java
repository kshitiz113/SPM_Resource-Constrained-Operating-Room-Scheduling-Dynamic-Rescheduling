package com.orscheduler.scheduling;

import com.orscheduler.entity.*;
import com.orscheduler.enums.EquipmentStatus;
import com.orscheduler.enums.Priority;
import com.orscheduler.enums.RoomStatus;
import com.orscheduler.enums.StaffType;
import com.orscheduler.scheduling.model.CandidateSlot;
import com.orscheduler.scheduling.model.ConstraintViolation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class HardConstraintCheckerTest {

    private HardConstraintChecker checker;
    private OperatingRoom room1;
    private OperatingRoom room2;
    private Staff surgeon1;
    private Staff surgeon2;
    private Equipment laparoscope;
    private LocalDate scheduleDate;

    @BeforeEach
    void setUp() {
        checker = new HardConstraintChecker();
        scheduleDate = LocalDate.of(2026, 10, 20);

        room1 = OperatingRoom.builder()
                .id(1L)
                .name("OR-1")
                .status(RoomStatus.ACTIVE)
                .build();

        room2 = OperatingRoom.builder()
                .id(2L)
                .name("OR-2")
                .status(RoomStatus.CLOSED)
                .build();

        surgeon1 = Staff.builder()
                .id(1L)
                .fullName("Dr. Alice")
                .staffType(StaffType.SURGEON)
                .active(true)
                .build();

        surgeon2 = Staff.builder()
                .id(2L)
                .fullName("Dr. Bob")
                .staffType(StaffType.SURGEON)
                .active(true)
                .build();

        laparoscope = Equipment.builder()
                .id(1L)
                .name("Laparoscopic Tower")
                .status(EquipmentStatus.AVAILABLE)
                .build();
    }

    @Test
    @DisplayName("TC-01: Room overlap conflict detected (HC-01)")
    void testRoomOverlapConflict() {
        LocalDateTime start1 = LocalDateTime.of(scheduleDate, LocalTime.of(8, 0));
        LocalDateTime end1 = LocalDateTime.of(scheduleDate, LocalTime.of(10, 0));
        LocalDateTime prep1 = start1.minusMinutes(15);
        LocalDateTime clean1 = end1.plusMinutes(20);

        ScheduleEntry existing = ScheduleEntry.builder()
                .id(101L)
                .operatingRoom(room1)
                .prepStart(prep1)
                .plannedStart(start1)
                .plannedEnd(end1)
                .cleanupEnd(clean1)
                .surgeryRequest(SurgeryRequest.builder().id(1L).surgeryCode("SURG-001").build())
                .build();

        // Candidate slot overlapping existing entry's room interval
        LocalDateTime start2 = LocalDateTime.of(scheduleDate, LocalTime.of(9, 30));
        LocalDateTime end2 = LocalDateTime.of(scheduleDate, LocalTime.of(11, 0));

        CandidateSlot candidate = CandidateSlot.builder()
                .room(room1)
                .prepStart(start2.minusMinutes(15))
                .plannedStart(start2)
                .plannedEnd(end2)
                .cleanupEnd(end2.plusMinutes(20))
                .assignedStaff(List.of(new CandidateSlot.StaffAssignment(surgeon2, StaffType.SURGEON)))
                .assignedEquipment(List.of())
                .build();

        SurgeryRequest req2 = SurgeryRequest.builder()
                .id(2L)
                .surgeryCode("SURG-002")
                .build();

        List<ConstraintViolation> violations = checker.checkCandidate(
                req2, candidate, List.of(existing), List.of(), List.of(), List.of());

        assertFalse(violations.isEmpty(), "Should detect room collision violation");
        assertTrue(violations.stream().anyMatch(v -> "HC-01".equals(v.getConstraintId())));
    }

    @Test
    @DisplayName("TC-02: Surgeon assigned to overlapping surgeries detected (HC-02)")
    void testStaffOverlapConflict() {
        LocalDateTime start1 = LocalDateTime.of(scheduleDate, LocalTime.of(8, 0));
        LocalDateTime end1 = LocalDateTime.of(scheduleDate, LocalTime.of(10, 0));

        ScheduleEntry existing = ScheduleEntry.builder()
                .id(101L)
                .operatingRoom(room1)
                .prepStart(start1.minusMinutes(15))
                .plannedStart(start1)
                .plannedEnd(end1)
                .cleanupEnd(end1.plusMinutes(20))
                .surgeryRequest(SurgeryRequest.builder().id(1L).surgeryCode("SURG-001").build())
                .assignedStaff(new ArrayList<>())
                .build();

        existing.getAssignedStaff().add(ScheduleEntryStaff.builder()
                .staff(surgeon1)
                .assignedRole(StaffType.SURGEON)
                .build());

        // New candidate in different room, but same surgeon at overlapping time
        OperatingRoom room3 = OperatingRoom.builder().id(3L).name("OR-3").status(RoomStatus.ACTIVE).build();
        LocalDateTime start2 = LocalDateTime.of(scheduleDate, LocalTime.of(9, 0));
        LocalDateTime end2 = LocalDateTime.of(scheduleDate, LocalTime.of(10, 30));

        CandidateSlot candidate = CandidateSlot.builder()
                .room(room3)
                .prepStart(start2.minusMinutes(15))
                .plannedStart(start2)
                .plannedEnd(end2)
                .cleanupEnd(end2.plusMinutes(20))
                .assignedStaff(List.of(new CandidateSlot.StaffAssignment(surgeon1, StaffType.SURGEON)))
                .assignedEquipment(List.of())
                .build();

        SurgeryRequest req2 = SurgeryRequest.builder().id(2L).surgeryCode("SURG-002").build();

        List<ConstraintViolation> violations = checker.checkCandidate(
                req2, candidate, List.of(existing), List.of(), List.of(), List.of());

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> "HC-02".equals(v.getConstraintId())));
    }

    @Test
    @DisplayName("TC-03: Equipment double-booking detected (HC-03)")
    void testEquipmentOverlapConflict() {
        LocalDateTime start1 = LocalDateTime.of(scheduleDate, LocalTime.of(8, 0));
        LocalDateTime end1 = LocalDateTime.of(scheduleDate, LocalTime.of(10, 0));

        ScheduleEntry existing = ScheduleEntry.builder()
                .id(101L)
                .operatingRoom(room1)
                .prepStart(start1.minusMinutes(15))
                .plannedStart(start1)
                .plannedEnd(end1)
                .cleanupEnd(end1.plusMinutes(20))
                .surgeryRequest(SurgeryRequest.builder().id(1L).surgeryCode("SURG-001").build())
                .assignedStaff(new ArrayList<>())
                .assignedEquipment(new ArrayList<>())
                .build();

        existing.getAssignedEquipment().add(ScheduleEntryEquipment.builder()
                .equipment(laparoscope)
                .build());

        OperatingRoom room3 = OperatingRoom.builder().id(3L).name("OR-3").status(RoomStatus.ACTIVE).build();
        LocalDateTime start2 = LocalDateTime.of(scheduleDate, LocalTime.of(9, 0));
        LocalDateTime end2 = LocalDateTime.of(scheduleDate, LocalTime.of(10, 30));

        CandidateSlot candidate = CandidateSlot.builder()
                .room(room3)
                .prepStart(start2.minusMinutes(15))
                .plannedStart(start2)
                .plannedEnd(end2)
                .cleanupEnd(end2.plusMinutes(20))
                .assignedStaff(List.of(new CandidateSlot.StaffAssignment(surgeon2, StaffType.SURGEON)))
                .assignedEquipment(List.of(new CandidateSlot.EquipmentAssignment(laparoscope)))
                .build();

        SurgeryRequest req2 = SurgeryRequest.builder().id(2L).surgeryCode("SURG-002").build();

        List<ConstraintViolation> violations = checker.checkCandidate(
                req2, candidate, List.of(existing), List.of(), List.of(), List.of());

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> "HC-03".equals(v.getConstraintId())));
    }

    @Test
    @DisplayName("TC-05: Cleaning buffer overlap detected (HC-01/HC-06)")
    void testCleaningBufferOverlap() {
        LocalDateTime start1 = LocalDateTime.of(scheduleDate, LocalTime.of(8, 0));
        LocalDateTime end1 = LocalDateTime.of(scheduleDate, LocalTime.of(10, 0));
        LocalDateTime clean1 = end1.plusMinutes(30); // Cleaning until 10:30

        ScheduleEntry existing = ScheduleEntry.builder()
                .id(101L)
                .operatingRoom(room1)
                .prepStart(start1.minusMinutes(15))
                .plannedStart(start1)
                .plannedEnd(end1)
                .cleanupEnd(clean1)
                .surgeryRequest(SurgeryRequest.builder().id(1L).surgeryCode("SURG-001").build())
                .build();

        // Second surgery prep starts at 10:15 (during cleaning of surgery 1)
        LocalDateTime start2 = LocalDateTime.of(scheduleDate, LocalTime.of(10, 30));
        LocalDateTime prep2 = start2.minusMinutes(15); // 10:15
        LocalDateTime end2 = start2.plusMinutes(60);

        CandidateSlot candidate = CandidateSlot.builder()
                .room(room1)
                .prepStart(prep2)
                .plannedStart(start2)
                .plannedEnd(end2)
                .cleanupEnd(end2.plusMinutes(15))
                .assignedStaff(List.of(new CandidateSlot.StaffAssignment(surgeon2, StaffType.SURGEON)))
                .assignedEquipment(List.of())
                .build();

        SurgeryRequest req2 = SurgeryRequest.builder().id(2L).surgeryCode("SURG-002").build();

        List<ConstraintViolation> violations = checker.checkCandidate(
                req2, candidate, List.of(existing), List.of(), List.of(), List.of());

        assertFalse(violations.isEmpty(), "Buffer overlap should produce HC-01 room violation");
        assertTrue(violations.stream().anyMatch(v -> "HC-01".equals(v.getConstraintId())));
    }

    @Test
    @DisplayName("TC-12: Closed room rejected (HC-12)")
    void testClosedRoomRejected() {
        LocalDateTime start = LocalDateTime.of(scheduleDate, LocalTime.of(9, 0));
        CandidateSlot candidate = CandidateSlot.builder()
                .room(room2) // room2 is CLOSED
                .prepStart(start.minusMinutes(15))
                .plannedStart(start)
                .plannedEnd(start.plusMinutes(60))
                .cleanupEnd(start.plusMinutes(75))
                .assignedStaff(List.of(new CandidateSlot.StaffAssignment(surgeon1, StaffType.SURGEON)))
                .assignedEquipment(List.of())
                .build();

        SurgeryRequest req = SurgeryRequest.builder().id(1L).surgeryCode("SURG-001").build();

        List<ConstraintViolation> violations = checker.checkCandidate(
                req, candidate, List.of(), List.of(), List.of(), List.of());

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> "HC-12".equals(v.getConstraintId())));
    }
}
