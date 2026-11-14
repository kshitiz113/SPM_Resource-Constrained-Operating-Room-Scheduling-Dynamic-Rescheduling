package com.orscheduler.service;

import java.time.LocalDateTime;

import com.orscheduler.entity.ScheduleEntryStaff;

import com.orscheduler.enums.EntryStatus;

import com.orscheduler.enums.ScheduleStatus;

import com.orscheduler.dto.response.AnalyticsResponse;
import com.orscheduler.entity.*;
import com.orscheduler.enums.Priority;
import com.orscheduler.enums.SurgeryStatus;
import com.orscheduler.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OperatingRoomRepository roomRepository;
    private final ScheduleEntryRepository scheduleEntryRepository;
    private final SurgeryRequestRepository surgeryRequestRepository;
    private final DisruptionRepository disruptionRepository;
    private final ScheduleVersionRepository scheduleVersionRepository;

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(LocalDate startDate, LocalDate endDate) {
        final LocalDate start = (startDate != null) ? startDate : LocalDate.now().minusDays(7);
        final LocalDate end = (endDate != null) ? endDate : LocalDate.now().plusDays(7);

        List<OperatingRoom> rooms = roomRepository.findAll();
        List<ScheduleEntry> entries = scheduleEntryRepository.findAll().stream()
                .filter(e -> e.getScheduleVersion() != null
                        && (e.getScheduleVersion().getStatus() == ScheduleStatus.PUBLISHED
                        || e.getScheduleVersion().getStatus() == ScheduleStatus.APPROVED))
                .filter(e -> e.getEntryStatus() != EntryStatus.CANCELLED)
                .filter(e -> e.getPlannedStart() != null)
                .filter(e -> !e.getPlannedStart().toLocalDate().isBefore(start) && !e.getPlannedStart().toLocalDate().isAfter(end))
                .toList();

        List<SurgeryRequest> requests = surgeryRequestRepository.findAll();
        long daysBetween = Math.max(1, Duration.between(start.atStartOfDay(), end.atTime(23, 59)).toDays() + 1);

        // 1. Room utilization
        List<AnalyticsResponse.RoomUtilizationStat> roomStats = new ArrayList<>();
        double totalAvailableHoursAllRooms = 0;
        double totalOccupiedHoursAllRooms = 0;

        for (OperatingRoom r : rooms) {
            double availHours = daysBetween * 12.0; // Assume 12 operating hours/day
            totalAvailableHoursAllRooms += availHours;

            List<ScheduleEntry> roomEntries = entries.stream()
                    .filter(e -> e.getOperatingRoom() != null && e.getOperatingRoom().getId().equals(r.getId()))
                    .sorted(Comparator.comparing(ScheduleEntry::getPrepStart))
                    .toList();

            long totalOccupiedMin = 0;
            long totalIdleMin = 0;
            for (int i = 0; i < roomEntries.size(); i++) {
                ScheduleEntry e = roomEntries.get(i);
                totalOccupiedMin += Duration.between(e.getPrepStart(), e.getCleanupEnd()).toMinutes();
                if (i < roomEntries.size() - 1) {
                    ScheduleEntry next = roomEntries.get(i + 1);
                    long gap = Duration.between(e.getCleanupEnd(), next.getPrepStart()).toMinutes();
                    if (gap > 0) totalIdleMin += gap;
                }
            }

            double occupiedHours = totalOccupiedMin / 60.0;
            totalOccupiedHoursAllRooms += occupiedHours;
            double utilRate = Math.min(1.0, occupiedHours / Math.max(1.0, availHours));
            double avgIdleMin = roomEntries.size() > 1 ? (double) totalIdleMin / (roomEntries.size() - 1) : 0.0;

            roomStats.add(AnalyticsResponse.RoomUtilizationStat.builder()
                    .roomId(r.getId())
                    .roomName(r.getName())
                    .roomType(r.getRoomType())
                    .totalOperatingHours(Math.round(availHours * 10.0) / 10.0)
                    .totalOccupiedHours(Math.round(occupiedHours * 10.0) / 10.0)
                    .utilizationRate(Math.round(utilRate * 100.0) / 100.0)
                    .totalSurgeriesScheduled(roomEntries.size())
                    .avgIdleMinutesBetweenSurgeries(Math.round(avgIdleMin * 10.0) / 10.0)
                    .build());
        }

        // 2. Waiting time statistics
        double emergencyWaitSum = 0, urgentWaitSum = 0, electiveWaitSum = 0;
        int emergencyCount = 0, urgentCount = 0, electiveCount = 0;

        for (ScheduleEntry e : entries) {
            SurgeryRequest req = e.getSurgeryRequest();
            if (req != null && req.getRequestedAt() != null) {
                double waitHours = Math.max(0, Duration.between(req.getRequestedAt(), e.getPlannedStart()).toMinutes() / 60.0);
                Priority p = req.getPriority() != null ? req.getPriority() : Priority.ELECTIVE;
                switch (p) {
                    case EMERGENCY: emergencyWaitSum += waitHours; emergencyCount++; break;
                    case URGENT: urgentWaitSum += waitHours; urgentCount++; break;
                    case ELECTIVE: electiveWaitSum += waitHours; electiveCount++; break;
                }
            }
        }

        double totalWaitSum = emergencyWaitSum + urgentWaitSum + electiveWaitSum;
        int totalAnalyzed = emergencyCount + urgentCount + electiveCount;

        AnalyticsResponse.WaitingTimeStat waitingStats = AnalyticsResponse.WaitingTimeStat.builder()
                .avgWaitingHoursEmergency(emergencyCount > 0 ? Math.round((emergencyWaitSum / emergencyCount) * 10.0) / 10.0 : 0.0)
                .avgWaitingHoursUrgent(urgentCount > 0 ? Math.round((urgentWaitSum / urgentCount) * 10.0) / 10.0 : 0.0)
                .avgWaitingHoursElective(electiveCount > 0 ? Math.round((electiveWaitSum / electiveCount) * 10.0) / 10.0 : 0.0)
                .overallAvgWaitingHours(totalAnalyzed > 0 ? Math.round((totalWaitSum / totalAnalyzed) * 10.0) / 10.0 : 0.0)
                .totalSurgeriesAnalyzed(totalAnalyzed)
                .build();

        // 3. Overtime statistics
        Map<String, Integer> overtimeByStaff = new java.util.TreeMap<>();
        for (ScheduleEntry e : entries) {
            LocalDateTime shiftEnd = e.getPlannedStart().toLocalDate().atTime(19, 0);
            if (e.getPlannedEnd() != null && e.getPlannedEnd().isAfter(shiftEnd) && e.getAssignedStaff() != null) {
                int over = (int) Duration.between(
                        e.getPlannedStart().isAfter(shiftEnd) ? e.getPlannedStart() : shiftEnd, e.getPlannedEnd()).toMinutes();
                for (ScheduleEntryStaff ses : e.getAssignedStaff()) {
                    overtimeByStaff.merge(ses.getStaff().getFullName(), over, Integer::sum);
                }
            }
        }
        AnalyticsResponse.OvertimeStat overtimeStats = AnalyticsResponse.OvertimeStat.builder()
                .totalOvertimeMinutes(overtimeByStaff.values().stream().mapToInt(Integer::intValue).sum())
                .staffWithOvertimeCount(overtimeByStaff.size())
                .overtimePerStaffMember(overtimeByStaff)
                .build();

        // 4. Deferral statistics
        long awaitingCount = requests.stream().filter(r -> r.getStatus() == SurgeryStatus.REQUESTED).count();
        long deferredCount = requests.stream().filter(r -> r.getStatus() == SurgeryStatus.DEFERRED).count();
        long unscheduledCount = awaitingCount + deferredCount;
        Map<String, Integer> reasons = new java.util.LinkedHashMap<>();
        if (awaitingCount > 0) reasons.put("Awaiting Scheduling", (int) awaitingCount);
        if (deferredCount > 0) reasons.put("Deferred (Capacity / Disruption)", (int) deferredCount);
        AnalyticsResponse.DeferralStat deferralStats = AnalyticsResponse.DeferralStat.builder()
                .totalUnscheduledCases((int) unscheduledCount)
                .deferralsByDisruption((int) disruptionRepository.count())
                .reasonCounts(reasons)
                .build();

        // 5. Summary statistics
        long completedCount = requests.stream().filter(r -> r.getStatus() == SurgeryStatus.COMPLETED).count();
        long cancelledCount = requests.stream().filter(r -> r.getStatus() == SurgeryStatus.CANCELLED).count();
        double overallUtil = totalAvailableHoursAllRooms > 0 ?
                Math.round((totalOccupiedHoursAllRooms / totalAvailableHoursAllRooms) * 100.0) / 100.0 : 0.0;

        List<ScheduleVersion> versions = scheduleVersionRepository.findByDateRange(start, end);
        double avgScore = 0.0;
        if (!versions.isEmpty()) {
            var scored = versions.stream().filter(v -> v.getTotalScore() != null).toList();
            if (!scored.isEmpty()) {
                double sumScore = scored.stream().mapToDouble(v -> v.getTotalScore().doubleValue()).sum();
                avgScore = Math.round((sumScore / scored.size()) * 10.0) / 10.0;
            }
        }

        AnalyticsResponse.SummaryStat summaryStats = AnalyticsResponse.SummaryStat.builder()
                .totalSurgeriesRequested(requests.size())
                .totalSurgeriesScheduled(entries.size())
                .totalSurgeriesCompleted((int) completedCount)
                .totalSurgeriesCancelled((int) cancelledCount)
                .totalDisruptionsRecorded((int) disruptionRepository.count())
                .averageScheduleScore(avgScore)
                .averageRoomUtilization(overallUtil)
                .build();

        return AnalyticsResponse.builder()
                .startDate(start)
                .endDate(end)
                .roomUtilizations(roomStats)
                .waitingTimeStats(waitingStats)
                .overtimeStats(overtimeStats)
                .deferralStats(deferralStats)
                .summaryStats(summaryStats)
                .build();
    }

    public String exportCsv(LocalDate startDate, LocalDate endDate) {
        AnalyticsResponse data = getAnalytics(startDate, endDate);
        StringBuilder sb = new StringBuilder();
        sb.append("Room Name,Room Type,Operating Hours,Occupied Hours,Utilization Rate,Surgeries Scheduled,Avg Idle Minutes\n");
        for (var r : data.getRoomUtilizations()) {
            sb.append(String.format("\"%s\",\"%s\",%.1f,%.1f,%.2f,%d,%.1f\n",
                    r.getRoomName(), r.getRoomType(), r.getTotalOperatingHours(), r.getTotalOccupiedHours(),
                    r.getUtilizationRate(), r.getTotalSurgeriesScheduled(), r.getAvgIdleMinutesBetweenSurgeries()));
        }
        sb.append("\nSummary Metric,Value\n");
        sb.append("Total Surgeries Requested,").append(data.getSummaryStats().getTotalSurgeriesRequested()).append("\n");
        sb.append("Total Surgeries Scheduled,").append(data.getSummaryStats().getTotalSurgeriesScheduled()).append("\n");
        sb.append("Average Room Utilization,").append(data.getSummaryStats().getAverageRoomUtilization()).append("\n");
        sb.append("Average Waiting Time (Hours),").append(data.getWaitingTimeStats().getOverallAvgWaitingHours()).append("\n");
        return sb.toString();
    }
}
