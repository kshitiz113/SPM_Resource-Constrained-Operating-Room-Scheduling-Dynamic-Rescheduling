package com.orscheduler.scheduling;

import com.orscheduler.entity.*;
import com.orscheduler.enums.EquipmentStatus;
import com.orscheduler.enums.RoomStatus;
import com.orscheduler.enums.StaffType;
import com.orscheduler.scheduling.model.CandidateSlot;
import com.orscheduler.scheduling.model.ConstraintViolation;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Component
public class HardConstraintChecker {

    /**
     * Checks if a candidate slot for a given surgery request satisfies all hard constraints.
     */
    public List<ConstraintViolation> checkCandidate(
            SurgeryRequest request,
            CandidateSlot candidate,
            List<ScheduleEntry> currentEntries,
            List<RoomOperatingHours> operatingHours,
            List<StaffShift> shifts,
            List<EquipmentAvailability> equipmentAvailabilities) {

        List<ConstraintViolation> violations = new ArrayList<>();

        OperatingRoom room = candidate.getRoom();
        LocalDateTime prepStart = candidate.getPrepStart();
        LocalDateTime plannedStart = candidate.getPlannedStart();
        LocalDateTime plannedEnd = candidate.getPlannedEnd();
        LocalDateTime cleanupEnd = candidate.getCleanupEnd();
        LocalDate scheduleDate = plannedStart.toLocalDate();

        // HC-06: Buffer integrity
        if (prepStart.isAfter(plannedStart) || plannedStart.isAfter(plannedEnd) || plannedEnd.isAfter(cleanupEnd)) {
            violations.add(ConstraintViolation.builder()
                    .constraintId("HC-06")
                    .message("Time buffer sequence violated: prep <= start < end <= cleanup required")
                    .entityType("SurgeryRequest")
                    .entityId(request.getId())
                    .build());
        }

        // HC-12: Room status active
        if (room == null || room.getStatus() != RoomStatus.ACTIVE) {
            violations.add(ConstraintViolation.builder()
                    .constraintId("HC-12")
                    .message("Operating room " + (room != null ? room.getName() : "null") + " is not ACTIVE")
                    .entityType("OperatingRoom")
                    .entityId(room != null ? room.getId() : null)
                    .build());
        }

        // HC-08: Room operating hours
        if (room != null) {
            boolean withinRoomHours = checkRoomOperatingHours(room, scheduleDate, prepStart.toLocalTime(), cleanupEnd.toLocalTime(), operatingHours);
            if (!withinRoomHours) {
                violations.add(ConstraintViolation.builder()
                        .constraintId("HC-08")
                        .message("Surgery interval [prep: " + prepStart.toLocalTime() + ", cleanup: " + cleanupEnd.toLocalTime()
                                + "] exceeds operating hours for room " + room.getName())
                        .entityType("OperatingRoom")
                        .entityId(room.getId())
                        .build());
            }
        }

        // HC-05: Eligible window [earliestStart, schedulingDeadline]
        if (request.getEarliestStart() != null && plannedStart.isBefore(request.getEarliestStart())) {
            violations.add(ConstraintViolation.builder()
                    .constraintId("HC-05")
                    .message("Planned start " + plannedStart + " is before earliest start " + request.getEarliestStart())
                    .entityType("SurgeryRequest")
                    .entityId(request.getId())
                    .build());
        }
        if (request.getSchedulingDeadline() != null && plannedEnd.isAfter(request.getSchedulingDeadline())) {
            violations.add(ConstraintViolation.builder()
                    .constraintId("HC-05")
                    .message("Planned end " + plannedEnd + " is after scheduling deadline " + request.getSchedulingDeadline())
                    .entityType("SurgeryRequest")
                    .entityId(request.getId())
                    .build());
        }

        // HC-01: Room overlap against current entries
        for (ScheduleEntry existing : currentEntries) {
            if (existing.getOperatingRoom() != null && existing.getOperatingRoom().getId().equals(room.getId())) {
                if (intervalsOverlap(prepStart, cleanupEnd, existing.getPrepStart(), existing.getCleanupEnd())) {
                    violations.add(ConstraintViolation.builder()
                            .constraintId("HC-01")
                            .message("Room overlap with existing entry " + existing.getSurgeryRequest().getSurgeryCode()
                                    + " in room " + room.getName())
                            .entityType("OperatingRoom")
                            .entityId(room.getId())
                            .build());
                    break;
                }
            }
        }

        // HC-02: Staff overlap
        for (CandidateSlot.StaffAssignment sa : candidate.getAssignedStaff()) {
            Staff staff = sa.getStaff();
            for (ScheduleEntry existing : currentEntries) {
                if (existing.getAssignedStaff() != null) {
                    for (ScheduleEntryStaff existingStaff : existing.getAssignedStaff()) {
                        if (existingStaff.getStaff().getId().equals(staff.getId())) {
                            if (intervalsOverlap(plannedStart, plannedEnd, existing.getPlannedStart(), existing.getPlannedEnd())) {
                                violations.add(ConstraintViolation.builder()
                                        .constraintId("HC-02")
                                        .message("Staff conflict for " + staff.getFullName() + " with existing surgery "
                                                + existing.getSurgeryRequest().getSurgeryCode())
                                        .entityType("Staff")
                                        .entityId(staff.getId())
                                        .build());
                                break;
                            }
                        }
                    }
                }
            }

            // HC-07: Staff shift & absence check
            boolean onShift = checkStaffShift(staff, scheduleDate, plannedStart.toLocalTime(), plannedEnd.toLocalTime(), shifts);
            if (!onShift) {
                violations.add(ConstraintViolation.builder()
                        .constraintId("HC-07")
                        .message("Staff member " + staff.getFullName() + " is not on active duty or is on leave during ["
                                + plannedStart.toLocalTime() + " - " + plannedEnd.toLocalTime() + "]")
                        .entityType("Staff")
                        .entityId(staff.getId())
                        .build());
            }
        }

        // HC-03: Equipment overlap & HC-11 Equipment maintenance
        for (CandidateSlot.EquipmentAssignment ea : candidate.getAssignedEquipment()) {
            Equipment eq = ea.getEquipment();

            // Status check
            if (eq.getStatus() == EquipmentStatus.MAINTENANCE || eq.getStatus() == EquipmentStatus.DECOMMISSIONED) {
                violations.add(ConstraintViolation.builder()
                        .constraintId("HC-11")
                        .message("Equipment " + eq.getName() + " is under " + eq.getStatus())
                        .entityType("Equipment")
                        .entityId(eq.getId())
                        .build());
            }

            // Explicit maintenance windows
            if (equipmentAvailabilities != null) {
                for (EquipmentAvailability eaWindow : equipmentAvailabilities) {
                    if (eaWindow.getEquipment().getId().equals(eq.getId())) {
                        if (intervalsOverlap(plannedStart, plannedEnd, eaWindow.getUnavailableFrom(), eaWindow.getUnavailableTo())) {
                            violations.add(ConstraintViolation.builder()
                                    .constraintId("HC-11")
                                    .message("Equipment " + eq.getName() + " is scheduled for maintenance: " + eaWindow.getReason())
                                    .entityType("Equipment")
                                    .entityId(eq.getId())
                                    .build());
                            break;
                        }
                    }
                }
            }

            // Overlap check
            for (ScheduleEntry existing : currentEntries) {
                if (existing.getAssignedEquipment() != null) {
                    for (ScheduleEntryEquipment existingEq : existing.getAssignedEquipment()) {
                        if (existingEq.getEquipment().getId().equals(eq.getId())) {
                            if (intervalsOverlap(plannedStart, plannedEnd, existing.getPlannedStart(), existing.getPlannedEnd())) {
                                violations.add(ConstraintViolation.builder()
                                        .constraintId("HC-03")
                                        .message("Equipment " + eq.getName() + " is double-booked with "
                                                + existing.getSurgeryRequest().getSurgeryCode())
                                        .entityType("Equipment")
                                        .entityId(eq.getId())
                                        .build());
                                break;
                            }
                        }
                    }
                }
            }
        }

        // HC-09: Required Qualifications matched
        if (request.getRequiredQualifications() != null && !request.getRequiredQualifications().isEmpty()) {
            Set<Long> requiredQualIds = new HashSet<>();
            for (SurgeryRequiredQualification rq : request.getRequiredQualifications()) {
                requiredQualIds.add(rq.getQualification().getId());
            }

            Set<Long> heldQualIds = new HashSet<>();
            for (CandidateSlot.StaffAssignment sa : candidate.getAssignedStaff()) {
                Staff staff = sa.getStaff();
                if (staff.getQualifications() != null) {
                    for (StaffQualification sq : staff.getQualifications()) {
                        // Check expiry
                        if (sq.getExpiryDate() == null || !sq.getExpiryDate().isBefore(scheduleDate)) {
                            heldQualIds.add(sq.getQualification().getId());
                        }
                    }
                }
            }

            for (Long requiredId : requiredQualIds) {
                if (!heldQualIds.contains(requiredId)) {
                    violations.add(ConstraintViolation.builder()
                            .constraintId("HC-09")
                            .message("Assigned staff team lacks mandatory qualification ID: " + requiredId)
                            .entityType("Qualification")
                            .entityId(requiredId)
                            .build());
                }
            }
        }

        return violations;
    }

    public boolean intervalsOverlap(LocalDateTime start1, LocalDateTime end1, LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    private boolean checkRoomOperatingHours(
            OperatingRoom room,
            LocalDate date,
            LocalTime start,
            LocalTime end,
            List<RoomOperatingHours> operatingHours) {

        if (operatingHours == null || operatingHours.isEmpty()) {
            return true; // No explicit hours defined means 24/7 available
        }

        int dayOfWeek = date.getDayOfWeek().getValue();

        // Check for exception first
        Optional<RoomOperatingHours> exception = operatingHours.stream()
                .filter(h -> h.getRoom().getId().equals(room.getId()) && h.isException())
                .filter(h -> h.getEffectiveFrom() != null && !date.isBefore(h.getEffectiveFrom())
                        && (h.getEffectiveTo() == null || !date.isAfter(h.getEffectiveTo())))
                .findFirst();

        if (exception.isPresent()) {
            return !start.isBefore(exception.get().getStartTime()) && !end.isAfter(exception.get().getEndTime());
        }

        // Check recurring hours
        List<RoomOperatingHours> matchingRecurring = operatingHours.stream()
                .filter(h -> h.getRoom().getId().equals(room.getId()) && !h.isException())
                .filter(h -> h.getDayOfWeek() != null && h.getDayOfWeek() == dayOfWeek)
                .toList();

        if (matchingRecurring.isEmpty()) {
            // A room that defines hours for other days is closed on this one
            boolean roomHasAnyHours = operatingHours.stream()
                    .anyMatch(h -> h.getRoom().getId().equals(room.getId()) && !h.isException());
            return !roomHasAnyHours;
        }

        for (RoomOperatingHours h : matchingRecurring) {
            if (!start.isBefore(h.getStartTime()) && !end.isAfter(h.getEndTime())) {
                return true;
            }
        }

        return false;
    }

    public boolean isStaffOnShift(Staff staff, LocalDate date, LocalTime start, LocalTime end, List<StaffShift> shifts) {
        return checkStaffShift(staff, date, start, end, shifts);
    }

    private boolean checkStaffShift(
            Staff staff,
            LocalDate date,
            LocalTime start,
            LocalTime end,
            List<StaffShift> shifts) {

        if (shifts == null || shifts.isEmpty()) {
            return true;
        }

        int dayOfWeek = date.getDayOfWeek().getValue();

        // Check leave first
        boolean hasLeave = shifts.stream()
                .filter(s -> s.getStaff().getId().equals(staff.getId()) && s.isLeave())
                .anyMatch(s -> s.getEffectiveFrom() != null && !date.isBefore(s.getEffectiveFrom())
                        && (s.getEffectiveTo() == null || !date.isAfter(s.getEffectiveTo())));

        if (hasLeave) {
            return false; // On leave
        }

        // Specific dated shifts
        Optional<StaffShift> specificShift = shifts.stream()
                .filter(s -> s.getStaff().getId().equals(staff.getId()) && !s.isRecurring() && !s.isLeave())
                .filter(s -> s.getEffectiveFrom() != null && !date.isBefore(s.getEffectiveFrom())
                        && (s.getEffectiveTo() == null || !date.isAfter(s.getEffectiveTo())))
                .findFirst();

        if (specificShift.isPresent()) {
            return !start.isBefore(specificShift.get().getStartTime()) && !end.isAfter(specificShift.get().getEndTime());
        }

        // Recurring shift
        List<StaffShift> recurringShifts = shifts.stream()
                .filter(s -> s.getStaff().getId().equals(staff.getId()) && s.isRecurring() && !s.isLeave())
                .filter(s -> s.getDayOfWeek() != null && s.getDayOfWeek() == dayOfWeek)
                .toList();

        if (recurringShifts.isEmpty()) {
            // Staff who have shifts defined for other days of the week are off today
            boolean hasAnyRecurring = shifts.stream()
                    .anyMatch(s -> s.getStaff().getId().equals(staff.getId()) && s.isRecurring() && !s.isLeave());
            return !hasAnyRecurring;
        }

        for (StaffShift s : recurringShifts) {
            if (!start.isBefore(s.getStartTime()) && !end.isAfter(s.getEndTime())) {
                return true;
            }
        }

        return false;
    }
}
