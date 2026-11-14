package com.orscheduler.scheduling;

import com.orscheduler.entity.*;
import com.orscheduler.enums.EquipmentStatus;
import com.orscheduler.enums.RoomStatus;
import com.orscheduler.enums.StaffType;
import com.orscheduler.scheduling.model.CandidateSlot;
import com.orscheduler.scheduling.model.ObjectiveWeights;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class CandidateSlotGenerator {

    private final HardConstraintChecker hardConstraintChecker;
    private final SoftObjectiveScorer softObjectiveScorer;

    private static final int TIME_STEP_MINUTES = 15;

    public List<CandidateSlot> generateFeasibleSlots(
            SurgeryRequest request,
            LocalDate scheduleDate,
            List<OperatingRoom> rooms,
            List<Staff> staffMembers,
            List<Equipment> equipmentList,
            List<RoomOperatingHours> operatingHours,
            List<StaffShift> shifts,
            List<EquipmentAvailability> equipmentAvailabilities,
            List<ScheduleEntry> currentEntries,
            ObjectiveWeights weights) {

        List<CandidateSlot> feasibleSlots = new ArrayList<>();

        int prepMinutes = request.getPreparationTimeMinutes() != null ? request.getPreparationTimeMinutes() : 15;
        int durationMinutes = request.getEstimatedDurationMinutes() != null ? request.getEstimatedDurationMinutes() : 60;
        int cleanMinutes = request.getCleaningTimeMinutes() != null ? request.getCleaningTimeMinutes() : 15;

        LocalTime dayStartTime = LocalTime.of(7, 0);
        LocalTime dayEndTime = LocalTime.of(20, 0);
        LocalDateTime dayStart = LocalDateTime.of(scheduleDate, dayStartTime);

        // Sort rooms: preferred room first if specified
        List<OperatingRoom> sortedRooms = new ArrayList<>(rooms);
        if (request.getPreferredRoom() != null) {
            sortedRooms.sort((r1, r2) -> {
                if (r1.getId().equals(request.getPreferredRoom().getId())) return -1;
                if (r2.getId().equals(request.getPreferredRoom().getId())) return 1;
                return 0;
            });
        }

        for (OperatingRoom room : sortedRooms) {
            if (room.getStatus() != RoomStatus.ACTIVE) {
                continue;
            }

            LocalTime currentTime = dayStartTime;
            while (!currentTime.plusMinutes(prepMinutes + durationMinutes + cleanMinutes).isAfter(dayEndTime)) {
                LocalDateTime prepStart = LocalDateTime.of(scheduleDate, currentTime);
                LocalDateTime plannedStart = prepStart.plusMinutes(prepMinutes);
                LocalDateTime plannedEnd = plannedStart.plusMinutes(durationMinutes);
                LocalDateTime cleanupEnd = plannedEnd.plusMinutes(cleanMinutes);

                // Check earliest start and deadline
                if (request.getEarliestStart() != null && plannedStart.isBefore(request.getEarliestStart())) {
                    currentTime = currentTime.plusMinutes(TIME_STEP_MINUTES);
                    continue;
                }
                if (request.getSchedulingDeadline() != null && plannedEnd.isAfter(request.getSchedulingDeadline())) {
                    break; // Later slots will only be further after deadline
                }

                // Check room collision quickly
                boolean roomCollides = currentEntries.stream()
                        .filter(e -> e.getOperatingRoom() != null && e.getOperatingRoom().getId().equals(room.getId()))
                        .anyMatch(e -> hardConstraintChecker.intervalsOverlap(prepStart, cleanupEnd, e.getPrepStart(), e.getCleanupEnd()));

                if (roomCollides) {
                    currentTime = currentTime.plusMinutes(TIME_STEP_MINUTES);
                    continue;
                }

                // Assemble required staff team
                List<CandidateSlot.StaffAssignment> staffAssignments = findStaffAssignments(
                        request, plannedStart, plannedEnd, staffMembers, currentEntries, shifts, scheduleDate);

                if (staffAssignments == null) {
                    currentTime = currentTime.plusMinutes(TIME_STEP_MINUTES);
                    continue; // Incomplete staff team
                }

                // Assemble required equipment
                List<CandidateSlot.EquipmentAssignment> equipmentAssignments = findEquipmentAssignments(
                        request, plannedStart, plannedEnd, equipmentList, currentEntries, equipmentAvailabilities, scheduleDate);

                if (equipmentAssignments == null) {
                    currentTime = currentTime.plusMinutes(TIME_STEP_MINUTES);
                    continue; // Equipment unavailable
                }

                CandidateSlot candidate = CandidateSlot.builder()
                        .room(room)
                        .prepStart(prepStart)
                        .plannedStart(plannedStart)
                        .plannedEnd(plannedEnd)
                        .cleanupEnd(cleanupEnd)
                        .assignedStaff(staffAssignments)
                        .assignedEquipment(equipmentAssignments)
                        .build();

                // Check all hard constraints
                var violations = hardConstraintChecker.checkCandidate(
                        request, candidate, currentEntries, operatingHours, shifts, equipmentAvailabilities);

                if (violations.isEmpty()) {
                    double score = softObjectiveScorer.scoreCandidateSlot(
                            request, candidate, currentEntries, weights, dayStart);
                    candidate.setSoftScore(score);
                    feasibleSlots.add(candidate);
                }

                currentTime = currentTime.plusMinutes(TIME_STEP_MINUTES);
            }
        }

        // Sort feasible slots by score (best first)
        feasibleSlots.sort(Comparator.comparingDouble(CandidateSlot::getSoftScore));
        return feasibleSlots;
    }

    private List<CandidateSlot.StaffAssignment> findStaffAssignments(
            SurgeryRequest request,
            LocalDateTime start,
            LocalDateTime end,
            List<Staff> staffMembers,
            List<ScheduleEntry> currentEntries,
            List<StaffShift> shifts,
            LocalDate scheduleDate) {

        List<CandidateSlot.StaffAssignment> assignments = new ArrayList<>();
        Set<Long> alreadyAssignedStaffIds = new HashSet<>();

        if (request.getRequiredStaff() == null || request.getRequiredStaff().isEmpty()) {
            // Default: 1 Surgeon, 1 Anesthetist, 1 Nurse
            Staff surgeon = findAvailableStaff(StaffType.SURGEON, request.getPreferredSurgeon() != null ? request.getPreferredSurgeon().getId() : null,
                    start, end, staffMembers, currentEntries, alreadyAssignedStaffIds, shifts);
            if (surgeon == null) return null;
            assignments.add(new CandidateSlot.StaffAssignment(surgeon, StaffType.SURGEON));
            alreadyAssignedStaffIds.add(surgeon.getId());

            Staff anesthetist = findAvailableStaff(StaffType.ANESTHETIST, null, start, end, staffMembers, currentEntries, alreadyAssignedStaffIds, shifts);
            if (anesthetist != null) {
                assignments.add(new CandidateSlot.StaffAssignment(anesthetist, StaffType.ANESTHETIST));
                alreadyAssignedStaffIds.add(anesthetist.getId());
            }

            Staff nurse = findAvailableStaff(StaffType.NURSE, null, start, end, staffMembers, currentEntries, alreadyAssignedStaffIds, shifts);
            if (nurse != null) {
                assignments.add(new CandidateSlot.StaffAssignment(nurse, StaffType.NURSE));
                alreadyAssignedStaffIds.add(nurse.getId());
            }

            return assignments;
        }

        for (SurgeryRequiredStaff rs : request.getRequiredStaff()) {
            Long targetStaffId = rs.getSpecificStaff() != null ? rs.getSpecificStaff().getId() : null;
            if (targetStaffId == null && rs.getStaffRole() == StaffType.SURGEON && request.getPreferredSurgeon() != null) {
                targetStaffId = request.getPreferredSurgeon().getId();
            }

            Staff staff = findAvailableStaff(rs.getStaffRole(), targetStaffId, start, end, staffMembers, currentEntries, alreadyAssignedStaffIds, shifts);
            if (staff == null) {
                if (rs.isMandatory()) {
                    return null; // Required staff not available
                }
            } else {
                assignments.add(new CandidateSlot.StaffAssignment(staff, rs.getStaffRole()));
                alreadyAssignedStaffIds.add(staff.getId());
            }
        }

        return assignments;
    }

    private Staff findAvailableStaff(
            StaffType role,
            Long specificStaffId,
            LocalDateTime start,
            LocalDateTime end,
            List<Staff> staffMembers,
            List<ScheduleEntry> currentEntries,
            Set<Long> alreadyAssignedStaffIds,
            List<StaffShift> shifts) {

        for (Staff staff : staffMembers) {
            if (!staff.isActive()) continue;
            if (alreadyAssignedStaffIds.contains(staff.getId())) continue;
            if (role != null && staff.getStaffType() != role) continue;
            if (!hardConstraintChecker.isStaffOnShift(staff, start.toLocalDate(), start.toLocalTime(), end.toLocalTime(), shifts)) continue;

            if (specificStaffId != null && !staff.getId().equals(specificStaffId)) {
                continue;
            }

            // Check if already occupied in currentEntries
            boolean busy = false;
            for (ScheduleEntry entry : currentEntries) {
                if (entry.getAssignedStaff() != null) {
                    for (ScheduleEntryStaff ses : entry.getAssignedStaff()) {
                        if (ses.getStaff().getId().equals(staff.getId())) {
                            if (hardConstraintChecker.intervalsOverlap(start, end, entry.getPlannedStart(), entry.getPlannedEnd())) {
                                busy = true;
                                break;
                            }
                        }
                    }
                }
                if (busy) break;
            }

            if (!busy) {
                return staff;
            }
        }

        // If specific staff requested wasn't available, but not strictly forbidden to fall back
        if (specificStaffId != null) {
            return findAvailableStaff(role, null, start, end, staffMembers, currentEntries, alreadyAssignedStaffIds, shifts);
        }

        return null;
    }

    private List<CandidateSlot.EquipmentAssignment> findEquipmentAssignments(
            SurgeryRequest request,
            LocalDateTime start,
            LocalDateTime end,
            List<Equipment> equipmentList,
            List<ScheduleEntry> currentEntries,
            List<EquipmentAvailability> equipmentAvailabilities,
            LocalDate scheduleDate) {

        List<CandidateSlot.EquipmentAssignment> assignments = new ArrayList<>();
        Set<Long> alreadyAssignedEquipmentIds = new HashSet<>();

        if (request.getRequiredEquipment() == null || request.getRequiredEquipment().isEmpty()) {
            return assignments;
        }

        for (SurgeryRequiredEquipment re : request.getRequiredEquipment()) {
            Equipment eq = re.getEquipment();
            if (eq == null) continue;

            // Check status
            if (eq.getStatus() == EquipmentStatus.MAINTENANCE || eq.getStatus() == EquipmentStatus.DECOMMISSIONED) {
                if (re.isMandatory()) return null;
                continue;
            }

            // Check maintenance windows
            if (equipmentAvailabilities != null) {
                boolean inMaintenance = equipmentAvailabilities.stream()
                        .filter(a -> a.getEquipment().getId().equals(eq.getId()))
                        .anyMatch(a -> hardConstraintChecker.intervalsOverlap(start, end, a.getUnavailableFrom(), a.getUnavailableTo()));
                if (inMaintenance) {
                    if (re.isMandatory()) return null;
                    continue;
                }
            }

            // Check overlap
            boolean busy = false;
            for (ScheduleEntry entry : currentEntries) {
                if (entry.getAssignedEquipment() != null) {
                    for (ScheduleEntryEquipment see : entry.getAssignedEquipment()) {
                        if (see.getEquipment().getId().equals(eq.getId())) {
                            if (hardConstraintChecker.intervalsOverlap(start, end, entry.getPlannedStart(), entry.getPlannedEnd())) {
                                busy = true;
                                break;
                            }
                        }
                    }
                }
                if (busy) break;
            }

            if (busy) {
                if (re.isMandatory()) return null;
            } else {
                assignments.add(new CandidateSlot.EquipmentAssignment(eq));
                alreadyAssignedEquipmentIds.add(eq.getId());
            }
        }

        return assignments;
    }
}
