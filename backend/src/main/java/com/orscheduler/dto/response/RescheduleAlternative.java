package com.orscheduler.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleAlternative {
    private int alternativeId;
    private String label;
    private String strategy;
    private String description;
    private ScheduleResponse.ScheduleVersionDto schedule;
    private ScheduleDiffDto diff;
    private AlternativeMetricsDto metrics;
    private ValidationResult validationResult;
    private BigDecimal totalScore;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleDiffDto {
        @Builder.Default
        private List<DiffEntryDto> added = new ArrayList<>();

        @Builder.Default
        private List<MovedEntryDto> moved = new ArrayList<>();

        @Builder.Default
        private List<DiffEntryDto> deferred = new ArrayList<>();

        @Builder.Default
        private List<DiffEntryDto> cancelled = new ArrayList<>();

        @Builder.Default
        private List<DiffEntryDto> unchanged = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiffEntryDto {
        private Long surgeryRequestId;
        private String surgeryCode;
        private String procedureName;
        private String roomName;
        private LocalDateTime start;
        private LocalDateTime end;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovedEntryDto {
        private Long surgeryRequestId;
        private String surgeryCode;
        private String procedureName;
        private String originalRoom;
        private String newRoom;
        private LocalDateTime originalStart;
        private LocalDateTime originalEnd;
        private LocalDateTime newStart;
        private LocalDateTime newEnd;
        private long shiftMinutes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlternativeMetricsDto {
        private int affectedCases;
        private int movedCases;
        private int deferredCases;
        private double waitingTimeIncreaseHours;
        private int overtimeMinutes;
        private double roomUtilization;
    }
}
