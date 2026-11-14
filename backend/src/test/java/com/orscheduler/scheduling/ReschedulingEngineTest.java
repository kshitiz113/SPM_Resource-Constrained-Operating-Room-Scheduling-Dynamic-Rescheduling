package com.orscheduler.scheduling;

import com.orscheduler.dto.response.RescheduleAlternative;
import com.orscheduler.entity.*;
import com.orscheduler.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReschedulingEngineTest {

    private ReschedulingEngine reschedulingEngine;
    private OperatingRoom room1;
    private OperatingRoom room2;
    private Staff surgeon1;
    private Staff anesthetist1;
    private Staff nurse1;
    private LocalDate scheduleDate;
    private List<RoomOperatingHours> hours;
    private List<StaffShift> shifts;

    @BeforeEach
    void setUp() {
        HardConstraintChecker hardConstraintChecker = new HardConstraintChecker();
        SoftObjectiveScorer softObjectiveScorer = new SoftObjectiveScorer();
        RequestRanker requestRanker = new RequestRanker();
        CandidateSlotGenerator slotGenerator = new CandidateSlotGenerator(hardConstraintChecker, softObjectiveScorer);
        ScheduleValidator validator = new ScheduleValidator(hardConstraintChecker);
        ScheduleDiffCalculator diffCalculator = new ScheduleDiffCalculator();

        SchedulingEngine schedulingEngine = new SchedulingEngine(requestRanker, slotGenerator, validator, softObjectiveScorer);
        reschedulingEngine = new ReschedulingEngine(schedulingEngine, validator, diffCalculator, softObjectiveScorer);

        scheduleDate = LocalDate.of(2026, 10, 20);

        room1 = OperatingRoom.builder().id(1L).name("OR-1").roomType("GENERAL").status(RoomStatus.ACTIVE).capacity(1).build();
        room2 = OperatingRoom.builder().id(2L).name("OR-2").roomType("GENERAL").status(RoomStatus.ACTIVE).capacity(1).build();

        surgeon1 = Staff.builder().id(1L).fullName("Dr. Alice").staffType(StaffType.SURGEON).active(true).build();
        anesthetist1 = Staff.builder().id(2L).fullName("Dr. Charlie").staffType(StaffType.ANESTHETIST).active(true).build();
        nurse1 = Staff.builder().id(3L).fullName("Nurse Dana").staffType(StaffType.NURSE).active(true).build();

        hours = List.of(
                RoomOperatingHours.builder().room(room1).dayOfWeek(2).startTime(LocalTime.of(7, 0)).endTime(LocalTime.of(19, 0)).build(),
                RoomOperatingHours.builder().room(room2).dayOfWeek(2).startTime(LocalTime.of(7, 0)).endTime(LocalTime.of(19, 0)).build()
        );

        shifts = List.of(
                StaffShift.builder().staff(surgeon1).dayOfWeek(2).startTime(LocalTime.of(7, 0)).endTime(LocalTime.of(19, 0)).isLeave(false).build(),
                StaffShift.builder().staff(anesthetist1).dayOfWeek(2).startTime(LocalTime.of(7, 0)).endTime(LocalTime.of(19, 0)).isLeave(false).build(),
                StaffShift.builder().staff(nurse1).dayOfWeek(2).startTime(LocalTime.of(7, 0)).endTime(LocalTime.of(19, 0)).isLeave(false).build()
        );
    }

    @Test
    @DisplayName("Reschedule Emergency Arrival: Generates alternatives with emergency case accommodated")
    void testEmergencyArrivalAlternatives() {
        SurgeryRequest req1 = SurgeryRequest.builder()
                .id(1L)
                .surgeryCode("SURG-001")
                .procedureName("Elective Appendectomy")
                .priority(Priority.ELECTIVE)
                .estimatedDurationMinutes(60)
                .preparationTimeMinutes(15)
                .cleaningTimeMinutes(15)
                .earliestStart(scheduleDate.atTime(8, 0))
                .schedulingDeadline(scheduleDate.atTime(18, 0))
                .build();

        ScheduleEntry entry1 = ScheduleEntry.builder()
                .id(1L)
                .surgeryRequest(req1)
                .operatingRoom(room1)
                .prepStart(scheduleDate.atTime(8, 0))
                .plannedStart(scheduleDate.atTime(8, 15))
                .plannedEnd(scheduleDate.atTime(9, 15))
                .cleanupEnd(scheduleDate.atTime(9, 30))
                .entryStatus(EntryStatus.SCHEDULED)
                .isLocked(false)
                .build();

        ScheduleVersion activeSchedule = ScheduleVersion.builder()
                .id(1L)
                .versionLabel("SCHED-20261020-001")
                .scheduleDate(scheduleDate)
                .entries(new ArrayList<>(List.of(entry1)))
                .build();
        entry1.setScheduleVersion(activeSchedule);

        Disruption disruption = Disruption.builder()
                .id(1L)
                .disruptionType(DisruptionType.EMERGENCY_ARRIVAL)
                .description("Emergency Trauma arrival requiring immediate suite")
                .occurredAt(scheduleDate.atTime(8, 0))
                .build();

        SurgeryRequest emergencySurgery = SurgeryRequest.builder()
                .id(999L)
                .surgeryCode("SURG-EMERGENCY")
                .procedureName("Emergency Trauma Laparotomy")
                .priority(Priority.EMERGENCY)
                .estimatedDurationMinutes(60)
                .preparationTimeMinutes(15)
                .cleaningTimeMinutes(15)
                .earliestStart(scheduleDate.atTime(8, 0))
                .schedulingDeadline(scheduleDate.atTime(12, 0))
                .build();

        List<RescheduleAlternative> alts = reschedulingEngine.generateAlternatives(
                activeSchedule,
                disruption,
                emergencySurgery,
                List.of(room1, room2),
                List.of(surgeon1, anesthetist1, nurse1),
                List.of(),
                hours,
                shifts,
                List.of(),
                3
        );

        assertNotNull(alts, "Alternatives list should not be null");
        assertFalse(alts.isEmpty(), "Engine must generate at least 1 alternative");
        assertEquals(3, alts.size(), "Engine must generate 3 distinct weight profile alternatives");

        // Verify alternatives have valid labels
        assertTrue(alts.stream().anyMatch(a -> a.getLabel().contains("Minimal Displacement")));
        assertTrue(alts.stream().anyMatch(a -> a.getLabel().contains("Compact Reschedule")));
        assertTrue(alts.stream().anyMatch(a -> a.getLabel().contains("Priority Preservation")));
    }

    @Test
    @DisplayName("HC-10: In-progress or locked cases are strictly preserved across all alternatives")
    void testLockedCasesPreserved() {
        SurgeryRequest req1 = SurgeryRequest.builder()
                .id(1L)
                .surgeryCode("SURG-LOCKED")
                .procedureName("In-Progress Craniotomy")
                .priority(Priority.URGENT)
                .estimatedDurationMinutes(90)
                .preparationTimeMinutes(15)
                .cleaningTimeMinutes(15)
                .earliestStart(scheduleDate.atTime(8, 0))
                .schedulingDeadline(scheduleDate.atTime(18, 0))
                .build();

        ScheduleEntry lockedEntry = ScheduleEntry.builder()
                .id(1L)
                .surgeryRequest(req1)
                .operatingRoom(room1)
                .prepStart(scheduleDate.atTime(8, 0))
                .plannedStart(scheduleDate.atTime(8, 15))
                .plannedEnd(scheduleDate.atTime(9, 45))
                .cleanupEnd(scheduleDate.atTime(10, 0))
                .entryStatus(EntryStatus.IN_PROGRESS)
                .isLocked(true)
                .build();

        ScheduleVersion activeSchedule = ScheduleVersion.builder()
                .id(1L)
                .versionLabel("SCHED-20261020-001")
                .scheduleDate(scheduleDate)
                .entries(new ArrayList<>(List.of(lockedEntry)))
                .build();
        lockedEntry.setScheduleVersion(activeSchedule);

        Disruption disruption = Disruption.builder()
                .id(2L)
                .disruptionType(DisruptionType.STAFF_ABSENCE)
                .description("Staff absence reported")
                .occurredAt(scheduleDate.atTime(10, 0))
                .build();

        List<RescheduleAlternative> alts = reschedulingEngine.generateAlternatives(
                activeSchedule,
                disruption,
                null,
                List.of(room1, room2),
                List.of(surgeon1, anesthetist1, nurse1),
                List.of(),
                hours,
                shifts,
                List.of(),
                3
        );

        for (RescheduleAlternative alt : alts) {
            boolean hasLocked = alt.getSchedule().getEntries().stream()
                    .anyMatch(e -> "SURG-LOCKED".equals(e.getSurgeryCode()) && e.getPlannedStart().equals(lockedEntry.getPlannedStart()));
            assertTrue(hasLocked, "Locked in-progress case must remain in place across all alternatives");
        }
    }
}
