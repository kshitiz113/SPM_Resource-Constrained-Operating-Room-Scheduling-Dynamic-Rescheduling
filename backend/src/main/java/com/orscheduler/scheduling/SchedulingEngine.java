package com.orscheduler.scheduling;

import com.orscheduler.entity.*;
import com.orscheduler.enums.EntryStatus;
import com.orscheduler.scheduling.model.CandidateSlot;
import com.orscheduler.scheduling.model.ConstraintViolation;
import com.orscheduler.scheduling.model.SchedulingInput;
import com.orscheduler.scheduling.model.SchedulingOutput;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulingEngine {

    private final RequestRanker requestRanker;
    private final CandidateSlotGenerator candidateSlotGenerator;
    private final ScheduleValidator scheduleValidator;
    private final SoftObjectiveScorer softObjectiveScorer;

    public SchedulingOutput generateSchedule(SchedulingInput input) {
        log.info("Starting deterministic schedule generation for date: {}", input.getScheduleDate());

        LocalDate scheduleDate = input.getScheduleDate();
        LocalDateTime referenceTime = LocalDateTime.of(scheduleDate, LocalTime.of(7, 0));

        // Initialize entries with existing locked entries (completed, in-progress, or fixed)
        List<ScheduleEntry> currentEntries = new ArrayList<>();
        if (input.getExistingLockedEntries() != null) {
            currentEntries.addAll(input.getExistingLockedEntries());
        }

        // Rank surgery requests deterministically
        List<SurgeryRequest> rankedRequests = requestRanker.rankRequests(input.getSurgeryRequests(), referenceTime);

        List<SchedulingOutput.UnscheduledRecord> unscheduledCases = new ArrayList<>();

        for (SurgeryRequest request : rankedRequests) {
            List<CandidateSlot> feasibleSlots = candidateSlotGenerator.generateFeasibleSlots(
                    request,
                    scheduleDate,
                    input.getRooms(),
                    input.getStaffMembers(),
                    input.getEquipmentList(),
                    input.getRoomHours(),
                    input.getStaffShifts(),
                    input.getEquipmentAvailabilities(),
                    currentEntries,
                    input.getObjectiveWeights()
            );

            if (feasibleSlots.isEmpty()) {
                String reason = determineInfeasibilityReason(request, scheduleDate, input, currentEntries);
                log.warn("Surgery request {} could not be scheduled: {}", request.getSurgeryCode(), reason);
                unscheduledCases.add(new SchedulingOutput.UnscheduledRecord(request, reason));
            } else {
                // Best scoring slot is first
                CandidateSlot bestSlot = feasibleSlots.get(0);
                ScheduleEntry entry = createScheduleEntry(request, bestSlot);
                currentEntries.add(entry);
                log.debug("Assigned surgery {} to room {} from {} to {}",
                        request.getSurgeryCode(), bestSlot.getRoom().getName(), bestSlot.getPlannedStart(), bestSlot.getPlannedEnd());
            }
        }

        // Validate complete schedule independently
        var validationResult = scheduleValidator.validateSchedule(
                currentEntries,
                input.getRooms(),
                input.getRoomHours(),
                input.getStaffShifts(),
                input.getEquipmentAvailabilities()
        );

        // Convert violations
        List<ConstraintViolation> violations = new ArrayList<>();
        for (var v : validationResult.getViolations()) {
            violations.add(ConstraintViolation.builder()
                    .constraintId(v.getConstraintId())
                    .message(v.getMessage())
                    .entityType(v.getEntityType())
                    .entityId(v.getEntityId())
                    .severity(v.getSeverity())
                    .build());
        }

        // Calculate overall score
        List<SurgeryRequest> unscheduledRequests = unscheduledCases.stream()
                .map(SchedulingOutput.UnscheduledRecord::getSurgeryRequest)
                .toList();

        double totalScore = softObjectiveScorer.calculateOverallScheduleScore(
                currentEntries,
                unscheduledRequests,
                input.getRooms(),
                input.getStaffShifts(),
                input.getObjectiveWeights(),
                scheduleDate
        );

        // Calculate analytics metrics
        Map<String, Object> metrics = calculateMetrics(currentEntries, unscheduledCases, input.getRooms());

        return SchedulingOutput.builder()
                .scheduledEntries(currentEntries)
                .unscheduledCases(unscheduledCases)
                .violations(violations)
                .warnings(validationResult.getWarnings())
                .totalScore(totalScore)
                .metrics(metrics)
                .build();
    }

    private ScheduleEntry createScheduleEntry(SurgeryRequest request, CandidateSlot slot) {
        ScheduleEntry entry = ScheduleEntry.builder()
                .surgeryRequest(request)
                .operatingRoom(slot.getRoom())
                .prepStart(slot.getPrepStart())
                .plannedStart(slot.getPlannedStart())
                .plannedEnd(slot.getPlannedEnd())
                .cleanupEnd(slot.getCleanupEnd())
                .entryStatus(EntryStatus.PLANNED)
                .isLocked(false)
                .assignedStaff(new ArrayList<>())
                .assignedEquipment(new ArrayList<>())
                .build();

        if (slot.getAssignedStaff() != null) {
            for (CandidateSlot.StaffAssignment sa : slot.getAssignedStaff()) {
                ScheduleEntryStaff ses = ScheduleEntryStaff.builder()
                        .scheduleEntry(entry)
                        .staff(sa.getStaff())
                        .assignedRole(sa.getRole())
                        .build();
                entry.getAssignedStaff().add(ses);
            }
        }

        if (slot.getAssignedEquipment() != null) {
            for (CandidateSlot.EquipmentAssignment ea : slot.getAssignedEquipment()) {
                ScheduleEntryEquipment see = ScheduleEntryEquipment.builder()
                        .scheduleEntry(entry)
                        .equipment(ea.getEquipment())
                        .build();
                entry.getAssignedEquipment().add(see);
            }
        }

        return entry;
    }

    private String determineInfeasibilityReason(
            SurgeryRequest request,
            LocalDate scheduleDate,
            SchedulingInput input,
            List<ScheduleEntry> currentEntries) {

        if (input.getRooms() == null || input.getRooms().isEmpty()) {
            return "No operating rooms available";
        }
        if (request.getSchedulingDeadline() != null && request.getSchedulingDeadline().isBefore(LocalDateTime.of(scheduleDate, LocalTime.of(7, 0)))) {
            return "Scheduling deadline already passed: " + request.getSchedulingDeadline();
        }
        if (request.getEarliestStart() != null && request.getEarliestStart().isAfter(LocalDateTime.of(scheduleDate, LocalTime.of(21, 0)))) {
            return "Earliest start date is after target schedule date: " + request.getEarliestStart();
        }

        return "No feasible room and staff combination available within operating hours without constraint violation";
    }

    private Map<String, Object> calculateMetrics(
            List<ScheduleEntry> entries,
            List<SchedulingOutput.UnscheduledRecord> unscheduled,
            List<OperatingRoom> rooms) {

        Map<String, Object> metrics = new HashMap<>();
        int scheduledCount = entries.size();
        int unscheduledCount = unscheduled.size();
        int totalSurgeries = scheduledCount + unscheduledCount;

        metrics.put("totalSurgeries", totalSurgeries);
        metrics.put("scheduledCount", scheduledCount);
        metrics.put("unscheduledCount", unscheduledCount);

        double totalWaitHours = 0.0;
        for (ScheduleEntry e : entries) {
            if (e.getSurgeryRequest().getRequestedAt() != null) {
                long waitMin = Duration.between(e.getSurgeryRequest().getRequestedAt(), e.getPlannedStart()).toMinutes();
                totalWaitHours += Math.max(0, waitMin / 60.0);
            }
        }
        double avgWaitingHours = scheduledCount > 0 ? (totalWaitHours / scheduledCount) : 0.0;
        metrics.put("avgWaitingHours", Math.round(avgWaitingHours * 10.0) / 10.0);

        // Room utilization
        Map<String, Double> roomUtilization = new HashMap<>();
        double totalOccupiedMin = 0.0;
        double totalAvailMin = (rooms != null ? rooms.size() : 1) * 12.0 * 60.0; // 12-hour day basis

        if (rooms != null) {
            for (OperatingRoom r : rooms) {
                long roomOccupiedMin = entries.stream()
                        .filter(e -> e.getOperatingRoom() != null && e.getOperatingRoom().getId().equals(r.getId()))
                        .mapToLong(e -> Duration.between(e.getPrepStart(), e.getCleanupEnd()).toMinutes())
                        .sum();
                totalOccupiedMin += roomOccupiedMin;
                double util = Math.min(1.0, roomOccupiedMin / (12.0 * 60.0));
                roomUtilization.put(r.getName(), Math.round(util * 100.0) / 100.0);
            }
        }
        metrics.put("roomUtilization", roomUtilization);
        metrics.put("overallUtilization", Math.round(Math.min(1.0, totalOccupiedMin / Math.max(1, totalAvailMin)) * 100.0) / 100.0);

        return metrics;
    }
}
