package com.orscheduler.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private LocalDate startDate;
    private LocalDate endDate;

    @Builder.Default
    private List<RoomUtilizationStat> roomUtilizations = new ArrayList<>();

    private WaitingTimeStat waitingTimeStats;
    private OvertimeStat overtimeStats;
    private DeferralStat deferralStats;
    private SummaryStat summaryStats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomUtilizationStat {
        private Long roomId;
        private String roomName;
        private String roomType;
        private double totalOperatingHours;
        private double totalOccupiedHours;
        private double utilizationRate;
        private int totalSurgeriesScheduled;
        private double avgIdleMinutesBetweenSurgeries;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WaitingTimeStat {
        private double avgWaitingHoursEmergency;
        private double avgWaitingHoursUrgent;
        private double avgWaitingHoursElective;
        private double overallAvgWaitingHours;
        private long totalSurgeriesAnalyzed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OvertimeStat {
        private int totalOvertimeMinutes;
        private int staffWithOvertimeCount;
        @Builder.Default
        private Map<String, Integer> overtimePerStaffMember = new HashMap<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeferralStat {
        private int totalUnscheduledCases;
        private int deferralsByDisruption;
        @Builder.Default
        private Map<String, Integer> reasonCounts = new HashMap<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryStat {
        private int totalSurgeriesRequested;
        private int totalSurgeriesScheduled;
        private int totalSurgeriesCompleted;
        private int totalSurgeriesCancelled;
        private int totalDisruptionsRecorded;
        private double averageScheduleScore;
        private double averageRoomUtilization;
    }
}
