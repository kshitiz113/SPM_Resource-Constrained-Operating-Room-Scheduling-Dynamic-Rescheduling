package com.orscheduler.scheduling;

import com.orscheduler.entity.*;
import com.orscheduler.enums.EntryStatus;
import com.orscheduler.enums.Priority;
import com.orscheduler.enums.RoomStatus;
import com.orscheduler.enums.StaffType;
import com.orscheduler.scheduling.model.ObjectiveWeights;
import com.orscheduler.scheduling.model.SchedulingInput;
import com.orscheduler.scheduling.model.SchedulingOutput;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SchedulingEngineTest {

    private SchedulingEngine engine;
    private OperatingRoom room1;
    private OperatingRoom room2;
    private Staff surgeon1;
    private Staff surgeon2;
    private Staff anesthetist1;
    private Staff nurse1;
    private LocalDate scheduleDate;

    @BeforeEach
    void setUp() {
        HardConstraintChecker hardConstraintChecker = new HardConstraintChecker();
        SoftObjectiveScorer softObjectiveScorer = new SoftObjectiveScorer();
        RequestRanker requestRanker = new RequestRanker();
        CandidateSlotGenerator slotGenerator = new CandidateSlotGenerator(hardConstraintChecker, softObjectiveScorer);
        ScheduleValidator validator = new ScheduleValidator(hardConstraintChecker);

        engine = new SchedulingEngine(requestRanker, slotGenerator, validator, softObjectiveScorer);

        scheduleDate = LocalDate.of(2026, 10, 20);

        room1 = OperatingRoom.builder().id(1L).name("OR-1").roomType("GENERAL").status(RoomStatus.ACTIVE).capacity(1).build();
        room2 = OperatingRoom.builder().id(2L).name("OR-2").roomType("ORTHO").status(RoomStatus.ACTIVE).capacity(1).build();

        surgeon1 = Staff.builder().id(1L).fullName("Dr. Alice").staffType(StaffType.SURGEON).active(true).build();
        surgeon2 = Staff.builder().id(2L).fullName("Dr. Bob").staffType(StaffType.SURGEON).active(true).build();
        anesthetist1 = Staff.builder().id(3L).fullName("Dr. Charlie").staffType(StaffType.ANESTHETIST).active(true).build();
        nurse1 = Staff.builder().id(4L).fullName("Nurse Dana").staffType(StaffType.NURSE).active(true).build();
    }

    @Test
    @DisplayName("TC-01: Deterministic schedule generates valid assignments without collisions")
    void testBasicScheduleGeneration() {
        SurgeryRequest req1 = SurgeryRequest.builder()
                .id(1L)
                .surgeryCode("SURG-001")
                .procedureName("Laparoscopic Cholecystectomy")
                .priority(Priority.URGENT)
                .estimatedDurationMinutes(60)
                .preparationTimeMinutes(15)
                .cleaningTimeMinutes(15)
                .requestedAt(LocalDateTime.of(2026, 10, 19, 8, 0))
                .preferredRoom(room1)
                .build();

        SurgeryRequest req2 = SurgeryRequest.builder()
                .id(2L)
                .surgeryCode("SURG-002")
                .procedureName("Hernia Repair")
                .priority(Priority.ELECTIVE)
                .estimatedDurationMinutes(60)
                .preparationTimeMinutes(15)
                .cleaningTimeMinutes(15)
                .requestedAt(LocalDateTime.of(2026, 10, 19, 9, 0))
                .preferredRoom(room1)
                .build();

        SchedulingInput input = SchedulingInput.builder()
                .scheduleDate(scheduleDate)
                .surgeryRequests(List.of(req1, req2))
                .rooms(List.of(room1, room2))
                .staffMembers(List.of(surgeon1, surgeon2, anesthetist1, nurse1))
                .objectiveWeights(ObjectiveWeights.builder().build())
                .build();

        SchedulingOutput output = engine.generateSchedule(input);

        assertNotNull(output);
        assertTrue(output.isValid(), "Schedule must satisfy all hard constraints");
        assertEquals(2, output.getScheduledEntries().size(), "Both surgeries should be scheduled");
        assertTrue(output.getUnscheduledCases().isEmpty());

        ScheduleEntry entry1 = output.getScheduledEntries().get(0);
        ScheduleEntry entry2 = output.getScheduledEntries().get(1);

        // Verify no overlap if in same room
        if (entry1.getOperatingRoom().getId().equals(entry2.getOperatingRoom().getId())) {
            assertFalse(
                    entry1.getPrepStart().isBefore(entry2.getCleanupEnd()) &&
                            entry1.getCleanupEnd().isAfter(entry2.getPrepStart()),
                    "Room occupancy intervals must not overlap"
            );
        }
    }

    @Test
    @DisplayName("TC-06: Emergency requests receive priority slot over elective cases")
    void testEmergencyPriorityPrecedence() {
        SurgeryRequest elective = SurgeryRequest.builder()
                .id(1L)
                .surgeryCode("SURG-ELECTIVE")
                .procedureName("Cosmetic Repair")
                .priority(Priority.ELECTIVE)
                .estimatedDurationMinutes(120)
                .requestedAt(LocalDateTime.of(2026, 10, 18, 8, 0))
                .build();

        SurgeryRequest emergency = SurgeryRequest.builder()
                .id(2L)
                .surgeryCode("SURG-EMERGENCY")
                .procedureName("Acute Trauma Laparotomy")
                .priority(Priority.EMERGENCY)
                .estimatedDurationMinutes(120)
                .requestedAt(LocalDateTime.of(2026, 10, 20, 6, 0))
                .build();

        SchedulingInput input = SchedulingInput.builder()
                .scheduleDate(scheduleDate)
                .surgeryRequests(List.of(elective, emergency))
                .rooms(List.of(room1))
                .staffMembers(List.of(surgeon1, anesthetist1, nurse1))
                .build();

        SchedulingOutput output = engine.generateSchedule(input);

        assertEquals(2, output.getScheduledEntries().size());
        ScheduleEntry firstScheduled = output.getScheduledEntries().get(0);
        assertEquals("SURG-EMERGENCY", firstScheduled.getSurgeryRequest().getSurgeryCode(),
                "Emergency request must be placed at the earliest available slot ahead of elective");
    }

    @Test
    @DisplayName("TC-07: Infeasible surgery reported as unscheduled with detailed reason")
    void testInfeasibleCaseReported() {
        // Request with impossibly short deadline
        SurgeryRequest req = SurgeryRequest.builder()
                .id(1L)
                .surgeryCode("SURG-EXPIRED")
                .procedureName("Late Procedure")
                .priority(Priority.ELECTIVE)
                .estimatedDurationMinutes(180)
                .earliestStart(LocalDateTime.of(scheduleDate, LocalTime.of(8, 0)))
                .schedulingDeadline(LocalDateTime.of(scheduleDate, LocalTime.of(8, 30))) // Cannot fit 180 min
                .build();

        SchedulingInput input = SchedulingInput.builder()
                .scheduleDate(scheduleDate)
                .surgeryRequests(List.of(req))
                .rooms(List.of(room1))
                .staffMembers(List.of(surgeon1, anesthetist1, nurse1))
                .build();

        SchedulingOutput output = engine.generateSchedule(input);

        assertEquals(0, output.getScheduledEntries().size());
        assertEquals(1, output.getUnscheduledCases().size());
        assertNotNull(output.getUnscheduledCases().get(0).getReason());
    }

    @Test
    @DisplayName("TC-09: Locked entries (in-progress/completed) are preserved")
    void testLockedEntriesPreserved() {
        LocalDateTime start = LocalDateTime.of(scheduleDate, LocalTime.of(8, 0));
        ScheduleEntry lockedEntry = ScheduleEntry.builder()
                .id(999L)
                .operatingRoom(room1)
                .prepStart(start.minusMinutes(15))
                .plannedStart(start)
                .plannedEnd(start.plusMinutes(90))
                .cleanupEnd(start.plusMinutes(105))
                .entryStatus(EntryStatus.IN_PROGRESS)
                .isLocked(true)
                .surgeryRequest(SurgeryRequest.builder().id(99L).surgeryCode("SURG-LOCKED").build())
                .assignedStaff(new ArrayList<>())
                .build();

        lockedEntry.getAssignedStaff().add(ScheduleEntryStaff.builder().staff(surgeon1).assignedRole(StaffType.SURGEON).build());

        SurgeryRequest newReq = SurgeryRequest.builder()
                .id(1L)
                .surgeryCode("SURG-NEW")
                .procedureName("New Surgery")
                .priority(Priority.URGENT)
                .estimatedDurationMinutes(60)
                .build();

        SchedulingInput input = SchedulingInput.builder()
                .scheduleDate(scheduleDate)
                .surgeryRequests(List.of(newReq))
                .rooms(List.of(room1))
                .staffMembers(List.of(surgeon1, anesthetist1, nurse1))
                .existingLockedEntries(List.of(lockedEntry))
                .build();

        SchedulingOutput output = engine.generateSchedule(input);

        // Locked entry must still be in the schedule at its exact time
        boolean lockedPresent = output.getScheduledEntries().stream()
                .anyMatch(e -> "SURG-LOCKED".equals(e.getSurgeryRequest().getSurgeryCode()) &&
                        e.getPlannedStart().equals(start));

        assertTrue(lockedPresent, "Locked in-progress entry must be preserved untouched");
    }
}
