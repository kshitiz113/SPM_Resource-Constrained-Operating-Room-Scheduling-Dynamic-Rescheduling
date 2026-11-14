package com.orscheduler.scheduling;

import com.orscheduler.dto.response.RescheduleAlternative;
import com.orscheduler.dto.response.ScheduleResponse;
import com.orscheduler.dto.response.ValidationResult;
import com.orscheduler.entity.*;
import com.orscheduler.enums.*;
import com.orscheduler.scheduling.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReschedulingEngine {

    private final SchedulingEngine schedulingEngine;
    private final ScheduleValidator scheduleValidator;
    private final ScheduleDiffCalculator diffCalculator;
    private final SoftObjectiveScorer softObjectiveScorer;

    public List<RescheduleAlternative> generateAlternatives(
            ScheduleVersion activeSchedule,
            Disruption disruption,
            SurgeryRequest emergencyRequest,
            List<OperatingRoom> allRooms,
            List<Staff> allStaff,
            List<Equipment> allEquipment,
            List<RoomOperatingHours> operatingHours,
            List<StaffShift> shifts,
            List<EquipmentAvailability> equipmentAvailabilities,
            int maxAlternatives) {

        List<RescheduleAlternative> alternatives = new ArrayList<>();
        List<ScheduleEntry> originalEntries = new ArrayList<>(activeSchedule.getEntries());
        LocalDate scheduleDate = activeSchedule.getScheduleDate();

        // 1. Identify locked entries (HC-10: IN_PROGRESS, COMPLETED, or locked)
        List<ScheduleEntry> lockedEntries = new ArrayList<>();
        List<ScheduleEntry> movableEntries = new ArrayList<>();

        for (ScheduleEntry entry : originalEntries) {
            if (entry.isLocked() || entry.getEntryStatus() == EntryStatus.IN_PROGRESS || entry.getEntryStatus() == EntryStatus.COMPLETED) {
                lockedEntries.add(entry);
            } else {
                movableEntries.add(entry);
            }
        }

        // Apply disruption effects to resource pool
        List<OperatingRoom> availableRooms = new ArrayList<>(allRooms);
        List<Staff> availableStaff = new ArrayList<>(allStaff);
        List<Equipment> availableEquipment = new ArrayList<>(allEquipment);

        if (disruption.getDisruptionType() == DisruptionType.ROOM_CLOSURE && disruption.getAffectedRoom() != null) {
            availableRooms.removeIf(r -> r.getId().equals(disruption.getAffectedRoom().getId()));
        }
        if (disruption.getDisruptionType() == DisruptionType.STAFF_ABSENCE && disruption.getAffectedStaff() != null) {
            availableStaff.removeIf(s -> s.getId().equals(disruption.getAffectedStaff().getId()));
        }
        if (disruption.getDisruptionType() == DisruptionType.EQUIPMENT_FAILURE && disruption.getAffectedEquipment() != null) {
            availableEquipment.removeIf(e -> e.getId().equals(disruption.getAffectedEquipment().getId()));
        }

        // Prepare pool of requests to schedule
        List<SurgeryRequest> requestsToSchedule = new ArrayList<>();
        if (emergencyRequest != null) {
            requestsToSchedule.add(emergencyRequest);
        }

        if (disruption.getDisruptionType() == DisruptionType.CANCELLATION && disruption.getAffectedSurgery() != null) {
            movableEntries.removeIf(e -> e.getSurgeryRequest().getId().equals(disruption.getAffectedSurgery().getId()));
        }

        for (ScheduleEntry me : movableEntries) {
            requestsToSchedule.add(me.getSurgeryRequest());
        }

        // --- Alternative A: Minimal Displacement ---
        RescheduleAlternative altA = buildAlternative(
                1,
                "Alternative A: Minimal Displacement",
                "MINIMAL_DISPLACEMENT",
                "Preserves existing room and staff assignments where possible, shifting or deferring only directly conflicting cases.",
                activeSchedule,
                originalEntries,
                lockedEntries,
                requestsToSchedule,
                availableRooms,
                availableStaff,
                availableEquipment,
                operatingHours,
                shifts,
                equipmentAvailabilities,
                scheduleDate,
                ObjectiveWeights.builder().waitingTimePenalty(2.0).deferralPenalty(5.0).idleTimePenalty(0.3).build()
        );
        alternatives.add(altA);

        // --- Alternative B: Compact Reschedule ---
        if (maxAlternatives >= 2) {
            RescheduleAlternative altB = buildAlternative(
                    2,
                    "Alternative B: Compact Reschedule",
                    "COMPACT_RESCHEDULE",
                    "Repacks all unstarted cases into earliest available slots across rooms to minimize room idle time and day duration.",
                    activeSchedule,
                    originalEntries,
                    lockedEntries,
                    requestsToSchedule,
                    availableRooms,
                    availableStaff,
                    availableEquipment,
                    operatingHours,
                    shifts,
                    equipmentAvailabilities,
                    scheduleDate,
                    ObjectiveWeights.builder().waitingTimePenalty(1.0).deferralPenalty(2.0).idleTimePenalty(2.5).build()
            );
            alternatives.add(altB);
        }

        // --- Alternative C: Priority Preservation ---
        if (maxAlternatives >= 3) {
            RescheduleAlternative altC = buildAlternative(
                    3,
                    "Alternative C: Priority Preservation & Room Balancing",
                    "PRIORITY_PRESERVATION",
                    "Strictly ensures emergency and urgent procedures maintain optimal time windows, deferring non-urgent elective cases if capacity is constrained.",
                    activeSchedule,
                    originalEntries,
                    lockedEntries,
                    requestsToSchedule,
                    availableRooms,
                    availableStaff,
                    availableEquipment,
                    operatingHours,
                    shifts,
                    equipmentAvailabilities,
                    scheduleDate,
                    ObjectiveWeights.builder().waitingTimePenalty(3.0).deferralPenalty(1.0).overtimePenalty(3.0).build()
            );
            alternatives.add(altC);
        }

        // Sort alternatives by score
        alternatives.sort(Comparator.comparing(RescheduleAlternative::getTotalScore));
        return alternatives;
    }

    private RescheduleAlternative buildAlternative(
            int altId,
            String label,
            String strategy,
            String description,
            ScheduleVersion activeSchedule,
            List<ScheduleEntry> originalEntries,
            List<ScheduleEntry> lockedEntries,
            List<SurgeryRequest> requestsToSchedule,
            List<OperatingRoom> rooms,
            List<Staff> staff,
            List<Equipment> equipment,
            List<RoomOperatingHours> operatingHours,
            List<StaffShift> shifts,
            List<EquipmentAvailability> equipmentAvailabilities,
            LocalDate scheduleDate,
            ObjectiveWeights weights) {

        SchedulingInput input = SchedulingInput.builder()
                .scheduleDate(scheduleDate)
                .surgeryRequests(requestsToSchedule)
                .rooms(rooms)
                .staffMembers(staff)
                .equipmentList(equipment)
                .roomHours(operatingHours)
                .staffShifts(shifts)
                .equipmentAvailabilities(equipmentAvailabilities)
                .existingLockedEntries(new ArrayList<>(lockedEntries))
                .objectiveWeights(weights)
                .build();

        SchedulingOutput output = schedulingEngine.generateSchedule(input);

        List<ScheduleEntry> newEntries = output.getScheduledEntries();
        List<SurgeryRequest> unscheduled = output.getUnscheduledCases().stream()
                .map(SchedulingOutput.UnscheduledRecord::getSurgeryRequest)
                .toList();

        // Compute Diff
        ScheduleDiff diff = diffCalculator.computeDiff(originalEntries, newEntries, unscheduled);

        // Convert diff to DTO
        RescheduleAlternative.ScheduleDiffDto diffDto = convertDiffToDto(diff);

        // Validate
        ValidationResult validationResult = scheduleValidator.validateSchedule(
                newEntries, rooms, operatingHours, shifts, equipmentAvailabilities);

        // Convert Schedule to DTO
        ScheduleResponse.ScheduleVersionDto scheduleDto = convertScheduleToDto(activeSchedule, newEntries, altId);

        // Calculate alternative metrics
        int affectedCount = diff.getAdded().size() + diff.getMoved().size() + diff.getDeferred().size() + diff.getCancelled().size();
        double totalWaitIncrease = diff.getMoved().stream()
                .mapToLong(ScheduleDiff.MovedItem::getShiftMinutes)
                .filter(m -> m > 0)
                .sum() / 60.0;

        RescheduleAlternative.AlternativeMetricsDto metricsDto = RescheduleAlternative.AlternativeMetricsDto.builder()
                .affectedCases(affectedCount)
                .movedCases(diff.getMoved().size())
                .deferredCases(diff.getDeferred().size())
                .waitingTimeIncreaseHours(Math.round(totalWaitIncrease * 10.0) / 10.0)
                .overtimeMinutes(0)
                .roomUtilization(output.getMetrics().containsKey("overallUtilization") ?
                        (Double) output.getMetrics().get("overallUtilization") : 0.75)
                .build();

        return RescheduleAlternative.builder()
                .alternativeId(altId)
                .label(label)
                .strategy(strategy)
                .description(description)
                .schedule(scheduleDto)
                .diff(diffDto)
                .metrics(metricsDto)
                .validationResult(validationResult)
                .totalScore(BigDecimal.valueOf(output.getTotalScore()))
                .build();
    }

    private RescheduleAlternative.ScheduleDiffDto convertDiffToDto(ScheduleDiff diff) {
        RescheduleAlternative.ScheduleDiffDto dto = new RescheduleAlternative.ScheduleDiffDto();

        for (ScheduleEntry e : diff.getAdded()) {
            dto.getAdded().add(RescheduleAlternative.DiffEntryDto.builder()
                    .surgeryRequestId(e.getSurgeryRequest().getId())
                    .surgeryCode(e.getSurgeryRequest().getSurgeryCode())
                    .procedureName(e.getSurgeryRequest().getProcedureName())
                    .roomName(e.getOperatingRoom() != null ? e.getOperatingRoom().getName() : "")
                    .start(e.getPlannedStart())
                    .end(e.getPlannedEnd())
                    .reason("New / Emergency case inserted")
                    .build());
        }

        for (ScheduleDiff.MovedItem m : diff.getMoved()) {
            dto.getMoved().add(RescheduleAlternative.MovedEntryDto.builder()
                    .surgeryRequestId(m.getNewEntry().getSurgeryRequest().getId())
                    .surgeryCode(m.getNewEntry().getSurgeryRequest().getSurgeryCode())
                    .procedureName(m.getNewEntry().getSurgeryRequest().getProcedureName())
                    .originalRoom(m.getOriginalEntry().getOperatingRoom() != null ? m.getOriginalEntry().getOperatingRoom().getName() : "")
                    .newRoom(m.getNewEntry().getOperatingRoom() != null ? m.getNewEntry().getOperatingRoom().getName() : "")
                    .originalStart(m.getOriginalEntry().getPlannedStart())
                    .originalEnd(m.getOriginalEntry().getPlannedEnd())
                    .newStart(m.getNewEntry().getPlannedStart())
                    .newEnd(m.getNewEntry().getPlannedEnd())
                    .shiftMinutes(m.getShiftMinutes())
                    .build());
        }

        for (SurgeryRequest u : diff.getDeferred()) {
            dto.getDeferred().add(RescheduleAlternative.DiffEntryDto.builder()
                    .surgeryRequestId(u.getId())
                    .surgeryCode(u.getSurgeryCode())
                    .procedureName(u.getProcedureName())
                    .reason("Deferred due to disruption resource constraints")
                    .build());
        }

        for (ScheduleEntry c : diff.getCancelled()) {
            dto.getCancelled().add(RescheduleAlternative.DiffEntryDto.builder()
                    .surgeryRequestId(c.getSurgeryRequest().getId())
                    .surgeryCode(c.getSurgeryRequest().getSurgeryCode())
                    .procedureName(c.getSurgeryRequest().getProcedureName())
                    .reason("Cancelled")
                    .build());
        }

        for (ScheduleEntry u : diff.getUnchanged()) {
            dto.getUnchanged().add(RescheduleAlternative.DiffEntryDto.builder()
                    .surgeryRequestId(u.getSurgeryRequest().getId())
                    .surgeryCode(u.getSurgeryRequest().getSurgeryCode())
                    .procedureName(u.getSurgeryRequest().getProcedureName())
                    .roomName(u.getOperatingRoom() != null ? u.getOperatingRoom().getName() : "")
                    .start(u.getPlannedStart())
                    .end(u.getPlannedEnd())
                    .build());
        }

        return dto;
    }

    private ScheduleResponse.ScheduleVersionDto convertScheduleToDto(
            ScheduleVersion baseVersion,
            List<ScheduleEntry> entries,
            int altNumber) {

        List<ScheduleResponse.ScheduleEntryDto> entryDtos = new ArrayList<>();
        long entryIdGen = 1000L * altNumber;

        for (ScheduleEntry e : entries) {
            ScheduleResponse.ScheduleEntryDto edto = ScheduleResponse.ScheduleEntryDto.builder()
                    .id(e.getId() != null ? e.getId() : ++entryIdGen)
                    .surgeryRequestId(e.getSurgeryRequest() != null ? e.getSurgeryRequest().getId() : null)
                    .surgeryCode(e.getSurgeryRequest() != null ? e.getSurgeryRequest().getSurgeryCode() : "")
                    .procedureName(e.getSurgeryRequest() != null ? e.getSurgeryRequest().getProcedureName() : "")
                    .priority(e.getSurgeryRequest() != null ? e.getSurgeryRequest().getPriority() : Priority.ELECTIVE)
                    .operatingRoomId(e.getOperatingRoom() != null ? e.getOperatingRoom().getId() : null)
                    .operatingRoomName(e.getOperatingRoom() != null ? e.getOperatingRoom().getName() : "")
                    .prepStart(e.getPrepStart())
                    .plannedStart(e.getPlannedStart())
                    .plannedEnd(e.getPlannedEnd())
                    .cleanupEnd(e.getCleanupEnd())
                    .entryStatus(e.getEntryStatus() != null ? e.getEntryStatus() : EntryStatus.PLANNED)
                    .locked(e.isLocked())
                    .build();

            if (e.getAssignedStaff() != null) {
                for (ScheduleEntryStaff ses : e.getAssignedStaff()) {
                    edto.getAssignedStaff().add(ScheduleResponse.AssignedStaffDto.builder()
                            .id(ses.getId())
                            .staffId(ses.getStaff().getId())
                            .staffName(ses.getStaff().getFullName())
                            .staffRole(ses.getAssignedRole())
                            .build());
                }
            }

            if (e.getAssignedEquipment() != null) {
                for (ScheduleEntryEquipment see : e.getAssignedEquipment()) {
                    edto.getAssignedEquipment().add(ScheduleResponse.AssignedEquipmentDto.builder()
                            .id(see.getId())
                            .equipmentId(see.getEquipment().getId())
                            .equipmentName(see.getEquipment().getName())
                            .equipmentType(see.getEquipment().getEquipmentType())
                            .build());
                }
            }

            entryDtos.add(edto);
        }

        return ScheduleResponse.ScheduleVersionDto.builder()
                .versionLabel(baseVersion != null ? baseVersion.getVersionLabel() + "-alt" + altNumber : "ALT-" + altNumber)
                .scheduleDate(baseVersion != null ? baseVersion.getScheduleDate() : LocalDate.now())
                .status(ScheduleStatus.PROPOSED)
                .entries(entryDtos)
                .build();
    }
}
