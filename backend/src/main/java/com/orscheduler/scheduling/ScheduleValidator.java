package com.orscheduler.scheduling;

import com.orscheduler.dto.response.ValidationResult;
import com.orscheduler.entity.*;
import com.orscheduler.enums.EquipmentStatus;
import com.orscheduler.enums.RoomStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class ScheduleValidator {

    private final HardConstraintChecker hardConstraintChecker;

    public ValidationResult validateSchedule(
            List<ScheduleEntry> entries,
            List<OperatingRoom> rooms,
            List<RoomOperatingHours> operatingHours,
            List<StaffShift> shifts,
            List<EquipmentAvailability> equipmentAvailabilities) {

        List<ValidationResult.ConstraintViolationDto> violations = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (entries == null || entries.isEmpty()) {
            warnings.add("Schedule contains no entries.");
            return ValidationResult.builder()
                    .valid(true)
                    .violations(violations)
                    .warnings(warnings)
                    .build();
        }

        // 1. Verify individual entries
        for (ScheduleEntry entry : entries) {
            LocalDateTime prep = entry.getPrepStart();
            LocalDateTime start = entry.getPlannedStart();
            LocalDateTime end = entry.getPlannedEnd();
            LocalDateTime clean = entry.getCleanupEnd();
            OperatingRoom room = entry.getOperatingRoom();
            SurgeryRequest req = entry.getSurgeryRequest();

            // HC-06: Buffer sequence
            if (prep == null || start == null || end == null || clean == null ||
                    prep.isAfter(start) || start.isAfter(end) || end.isAfter(clean)) {
                violations.add(ValidationResult.ConstraintViolationDto.builder()
                        .constraintId("HC-06")
                        .message("Invalid time sequence for surgery " + (req != null ? req.getSurgeryCode() : "unknown"))
                        .entityType("ScheduleEntry")
                        .entityId(entry.getId())
                        .severity("HARD")
                        .build());
            }

            // HC-12: Room status
            if (room != null && room.getStatus() != RoomStatus.ACTIVE) {
                violations.add(ValidationResult.ConstraintViolationDto.builder()
                        .constraintId("HC-12")
                        .message("Room " + room.getName() + " is " + room.getStatus())
                        .entityType("OperatingRoom")
                        .entityId(room.getId())
                        .severity("HARD")
                        .build());
            }

            // HC-05: Window bounds
            if (req != null) {
                if (req.getEarliestStart() != null && start != null && start.isBefore(req.getEarliestStart())) {
                    violations.add(ValidationResult.ConstraintViolationDto.builder()
                            .constraintId("HC-05")
                            .message("Surgery " + req.getSurgeryCode() + " starts before earliest start: " + req.getEarliestStart())
                            .entityType("SurgeryRequest")
                            .entityId(req.getId())
                            .severity("HARD")
                            .build());
                }
                if (req.getSchedulingDeadline() != null && end != null && end.isAfter(req.getSchedulingDeadline())) {
                    violations.add(ValidationResult.ConstraintViolationDto.builder()
                            .constraintId("HC-05")
                            .message("Surgery " + req.getSurgeryCode() + " finishes after deadline: " + req.getSchedulingDeadline())
                            .entityType("SurgeryRequest")
                            .entityId(req.getId())
                            .severity("HARD")
                            .build());
                }
            }

            // HC-09: Qualifications
            if (req != null && req.getRequiredQualifications() != null && !req.getRequiredQualifications().isEmpty()) {
                Set<Long> held = new HashSet<>();
                if (entry.getAssignedStaff() != null) {
                    for (ScheduleEntryStaff ses : entry.getAssignedStaff()) {
                        if (ses.getStaff().getQualifications() != null) {
                            for (StaffQualification sq : ses.getStaff().getQualifications()) {
                                held.add(sq.getQualification().getId());
                            }
                        }
                    }
                }
                for (SurgeryRequiredQualification rq : req.getRequiredQualifications()) {
                    if (!held.contains(rq.getQualification().getId())) {
                        violations.add(ValidationResult.ConstraintViolationDto.builder()
                                .constraintId("HC-09")
                                .message("Assigned staff lacks required qualification " + rq.getQualification().getName() + " for " + req.getSurgeryCode())
                                .entityType("Qualification")
                                .entityId(rq.getQualification().getId())
                                .severity("HARD")
                                .build());
                    }
                }
            }
        }

        // 2. Pairwise conflict checks (HC-01, HC-02, HC-03)
        int n = entries.size();
        for (int i = 0; i < n; i++) {
            ScheduleEntry e1 = entries.get(i);
            for (int j = i + 1; j < n; j++) {
                ScheduleEntry e2 = entries.get(j);

                // HC-01: Room collision
                if (e1.getOperatingRoom() != null && e2.getOperatingRoom() != null &&
                        e1.getOperatingRoom().getId().equals(e2.getOperatingRoom().getId())) {
                    if (hardConstraintChecker.intervalsOverlap(e1.getPrepStart(), e1.getCleanupEnd(), e2.getPrepStart(), e2.getCleanupEnd())) {
                        violations.add(ValidationResult.ConstraintViolationDto.builder()
                                .constraintId("HC-01")
                                .message("Room conflict between " + getCode(e1)
                                        + " and " + getCode(e2) + " in " + (e1.getOperatingRoom() != null ? e1.getOperatingRoom().getName() : "room"))
                                .entityType("OperatingRoom")
                                .entityId(e1.getOperatingRoom() != null ? e1.getOperatingRoom().getId() : null)
                                .severity("HARD")
                                .build());
                    }
                }

                // HC-02: Staff collision
                if (e1.getAssignedStaff() != null && e2.getAssignedStaff() != null) {
                    for (ScheduleEntryStaff s1 : e1.getAssignedStaff()) {
                        for (ScheduleEntryStaff s2 : e2.getAssignedStaff()) {
                            if (s1.getStaff() != null && s2.getStaff() != null && s1.getStaff().getId().equals(s2.getStaff().getId())) {
                                if (hardConstraintChecker.intervalsOverlap(e1.getPlannedStart(), e1.getPlannedEnd(), e2.getPlannedStart(), e2.getPlannedEnd())) {
                                    violations.add(ValidationResult.ConstraintViolationDto.builder()
                                            .constraintId("HC-02")
                                            .message("Staff conflict: " + s1.getStaff().getFullName() + " double-booked between "
                                                    + getCode(e1) + " and " + getCode(e2))
                                            .entityType("Staff")
                                            .entityId(s1.getStaff().getId())
                                            .severity("HARD")
                                            .build());
                                }
                            }
                        }
                    }
                }

                // HC-03: Equipment collision
                if (e1.getAssignedEquipment() != null && e2.getAssignedEquipment() != null) {
                    for (ScheduleEntryEquipment eq1 : e1.getAssignedEquipment()) {
                        for (ScheduleEntryEquipment eq2 : e2.getAssignedEquipment()) {
                            if (eq1.getEquipment() != null && eq2.getEquipment() != null && eq1.getEquipment().getId().equals(eq2.getEquipment().getId())) {
                                if (hardConstraintChecker.intervalsOverlap(e1.getPlannedStart(), e1.getPlannedEnd(), e2.getPlannedStart(), e2.getPlannedEnd())) {
                                    violations.add(ValidationResult.ConstraintViolationDto.builder()
                                            .constraintId("HC-03")
                                            .message("Equipment conflict: " + eq1.getEquipment().getName() + " double-booked between "
                                                    + getCode(e1) + " and " + getCode(e2))
                                            .entityType("Equipment")
                                            .entityId(eq1.getEquipment().getId())
                                            .severity("HARD")
                                            .build());
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Operational warnings (room utilization, idle gaps)
        if (rooms != null) {
            for (OperatingRoom room : rooms) {
                long totalRoomOccupancyMin = entries.stream()
                        .filter(e -> e.getOperatingRoom() != null && e.getOperatingRoom().getId().equals(room.getId()))
                        .mapToLong(e -> Duration.between(e.getPrepStart(), e.getCleanupEnd()).toMinutes())
                        .sum();

                double hoursOccupied = totalRoomOccupancyMin / 60.0;
                if (hoursOccupied < 4.0 && room.getStatus() == RoomStatus.ACTIVE) {
                    warnings.add("Room " + room.getName() + " has low utilization (" + String.format("%.1f", hoursOccupied) + " hours occupied).");
                }
            }
        }

        return ValidationResult.builder()
                .valid(violations.isEmpty())
                .violations(violations)
                .warnings(warnings)
                .build();
    }

    public ValidationResult validate(
            List<ScheduleEntry> entries,
            List<OperatingRoom> rooms,
            List<RoomOperatingHours> operatingHours,
            List<StaffShift> shifts,
            List<EquipmentAvailability> equipmentAvailabilities) {
        return validateSchedule(entries, rooms, operatingHours, shifts, equipmentAvailabilities);
    }

    private String getCode(ScheduleEntry e) {
        if (e == null) return "Unknown";
        if (e.getSurgeryRequest() != null && e.getSurgeryRequest().getSurgeryCode() != null) {
            return e.getSurgeryRequest().getSurgeryCode();
        }
        return "Entry-" + (e.getId() != null ? e.getId() : "new");
    }
}
