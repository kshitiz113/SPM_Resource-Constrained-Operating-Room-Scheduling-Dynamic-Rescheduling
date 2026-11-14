package com.orscheduler.scheduling;

import com.orscheduler.entity.OperatingRoom;
import com.orscheduler.entity.ScheduleEntry;
import com.orscheduler.entity.Staff;
import com.orscheduler.entity.StaffShift;
import com.orscheduler.entity.SurgeryRequest;
import com.orscheduler.scheduling.model.CandidateSlot;
import com.orscheduler.scheduling.model.ObjectiveWeights;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class SoftObjectiveScorer {

    /**
     * Scores a single candidate slot for a request to pick the best slot among alternatives.
     * Lower score is better.
     */
    public double scoreCandidateSlot(
            SurgeryRequest request,
            CandidateSlot candidate,
            List<ScheduleEntry> currentEntries,
            ObjectiveWeights weights,
            LocalDateTime scheduleDayStart) {

        double penalty = 0.0;

        // Waiting time penalty: prefer earlier slots
        if (request.getRequestedAt() != null) {
            long waitingMinutes = Duration.between(request.getRequestedAt(), candidate.getPlannedStart()).toMinutes();
            penalty += (waitingMinutes / 60.0) * weights.getWaitingTimePenalty();
        } else {
            long minutesFromDayStart = Duration.between(scheduleDayStart, candidate.getPlannedStart()).toMinutes();
            penalty += (minutesFromDayStart / 60.0) * weights.getWaitingTimePenalty();
        }

        // Room idle time / fragmentation penalty:
        // Reward scheduling adjacent to existing surgery in same room to minimize idle gaps
        List<ScheduleEntry> roomEntries = currentEntries.stream()
                .filter(e -> e.getOperatingRoom() != null && e.getOperatingRoom().getId().equals(candidate.getRoom().getId()))
                .sorted(Comparator.comparing(ScheduleEntry::getCleanupEnd))
                .toList();

        if (!roomEntries.isEmpty()) {
            // Find closest preceding entry
            long minGap = Long.MAX_VALUE;
            for (ScheduleEntry e : roomEntries) {
                if (!e.getCleanupEnd().isAfter(candidate.getPrepStart())) {
                    long gap = Duration.between(e.getCleanupEnd(), candidate.getPrepStart()).toMinutes();
                    if (gap < minGap) {
                        minGap = gap;
                    }
                }
            }
            if (minGap != Long.MAX_VALUE) {
                penalty += (minGap / 30.0) * weights.getIdleTimePenalty();
            }
        }

        // Preference match bonus/penalty
        if (request.getPreferredRoom() != null) {
            if (!request.getPreferredRoom().getId().equals(candidate.getRoom().getId())) {
                penalty += 15.0; // Penalty for not getting preferred room
            }
        }

        if (request.getPreferredSurgeon() != null) {
            boolean hasPreferredSurgeon = candidate.getAssignedStaff().stream()
                    .anyMatch(sa -> sa.getStaff().getId().equals(request.getPreferredSurgeon().getId()));
            if (!hasPreferredSurgeon) {
                penalty += 25.0; // Penalty for not getting preferred surgeon
            }
        }

        return penalty;
    }

    /**
     * Calculates the overall composite score of an entire schedule.
     * Lower is better.
     */
    public double calculateOverallScheduleScore(
            List<ScheduleEntry> entries,
            List<SurgeryRequest> unscheduled,
            List<OperatingRoom> rooms,
            List<StaffShift> shifts,
            ObjectiveWeights weights,
            LocalDate scheduleDate) {

        double totalScore = 0.0;

        // 1. Patient waiting time
        double totalWaitHours = 0.0;
        for (ScheduleEntry entry : entries) {
            SurgeryRequest req = entry.getSurgeryRequest();
            if (req.getRequestedAt() != null) {
                long waitMin = Duration.between(req.getRequestedAt(), entry.getPlannedStart()).toMinutes();
                totalWaitHours += Math.max(0, waitMin / 60.0);
            }
        }
        totalScore += totalWaitHours * weights.getWaitingTimePenalty();

        // 2. Room idle time
        Map<Long, List<ScheduleEntry>> byRoom = entries.stream()
                .filter(e -> e.getOperatingRoom() != null)
                .collect(Collectors.groupingBy(e -> e.getOperatingRoom().getId()));

        double totalIdleHours = 0.0;
        for (List<ScheduleEntry> roomList : byRoom.values()) {
            roomList.sort(Comparator.comparing(ScheduleEntry::getPrepStart));
            for (int i = 0; i < roomList.size() - 1; i++) {
                ScheduleEntry current = roomList.get(i);
                ScheduleEntry next = roomList.get(i + 1);
                long idleMinutes = Duration.between(current.getCleanupEnd(), next.getPrepStart()).toMinutes();
                if (idleMinutes > 0) {
                    totalIdleHours += idleMinutes / 60.0;
                }
            }
        }
        totalScore += totalIdleHours * weights.getIdleTimePenalty();

        // 3. Staff overtime
        double totalOvertimeHours = 0.0;
        if (shifts != null && !shifts.isEmpty()) {
            for (ScheduleEntry entry : entries) {
                if (entry.getAssignedStaff() != null && entry.getPlannedEnd() != null) {
                    LocalTime plannedEnd = entry.getPlannedEnd().toLocalTime();
                    for (var sa : entry.getAssignedStaff()) {
                        Staff staff = sa.getStaff();
                        if (staff != null && staff.getId() != null) {
                            for (StaffShift s : shifts) {
                                if (s.getStaff() != null && s.getStaff().getId().equals(staff.getId()) && !s.isLeave()) {
                                    if (s.getEndTime() != null && plannedEnd.isAfter(s.getEndTime())) {
                                        long overtimeMin = Duration.between(s.getEndTime(), plannedEnd).toMinutes();
                                        totalOvertimeHours += overtimeMin / 60.0;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        totalScore += totalOvertimeHours * weights.getOvertimePenalty();

        // 4. Deferral penalty for unscheduled cases
        for (SurgeryRequest u : unscheduled) {
            double multiplier = 1.0;
            if (u.getPriority() != null) {
                switch (u.getPriority()) {
                    case EMERGENCY: multiplier = 10.0; break;
                    case URGENT: multiplier = 4.0; break;
                    case ELECTIVE: multiplier = 1.0; break;
                }
            }
            totalScore += weights.getDeferralPenalty() * 50.0 * multiplier;
        }

        // 5. Utilization score
        double totalOccupiedMinutes = 0.0;
        for (ScheduleEntry e : entries) {
            totalOccupiedMinutes += Duration.between(e.getPrepStart(), e.getCleanupEnd()).toMinutes();
        }
        double totalAvailableMinutes = Math.max(1, rooms.size() * 12 * 60); // 12h day per room
        double utilization = Math.min(1.0, totalOccupiedMinutes / totalAvailableMinutes);
        totalScore += (1.0 - utilization) * weights.getUtilizationWeight() * 100.0;

        return Math.round(totalScore * 100.0) / 100.0;
    }
}
