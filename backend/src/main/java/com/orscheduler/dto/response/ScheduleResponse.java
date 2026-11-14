package com.orscheduler.dto.response;

import com.orscheduler.enums.EntryStatus;
import com.orscheduler.enums.Priority;
import com.orscheduler.enums.ScheduleStatus;
import com.orscheduler.enums.StaffType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleResponse {
    private ScheduleVersionDto scheduleVersion;

    @Builder.Default
    private List<UnscheduledCaseDto> unscheduledCases = new ArrayList<>();

    private ValidationResult validationResult;
    private ScheduleMetricsDto metrics;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleVersionDto {
        private Long id;
        private String versionLabel;
        private LocalDate scheduleDate;
        private ScheduleStatus status;
        private Long createdById;
        private String createdByName;
        private Long approvedById;
        private String approvedByName;
        private LocalDateTime createdAt;
        private LocalDateTime approvedAt;
        private LocalDateTime publishedAt;
        private Long parentVersionId;
        private Long disruptionId;
        private Integer versionNumber;
        private BigDecimal totalScore;
        private String generationNotes;

        @Builder.Default
        private List<ScheduleEntryDto> entries = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleEntryDto {
        private Long id;
        private Long scheduleVersionId;
        private Long surgeryRequestId;
        private String surgeryCode;
        private String procedureName;
        private Priority priority;
        private Long operatingRoomId;
        private String operatingRoomName;
        private LocalDateTime plannedStart;
        private LocalDateTime plannedEnd;
        private LocalDateTime prepStart;
        private LocalDateTime cleanupEnd;
        private EntryStatus entryStatus;
        private boolean locked;
        private LocalDateTime actualStart;
        private LocalDateTime actualEnd;
        private String notes;

        @Builder.Default
        private List<AssignedStaffDto> assignedStaff = new ArrayList<>();

        @Builder.Default
        private List<AssignedEquipmentDto> assignedEquipment = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignedStaffDto {
        private Long id;
        private Long staffId;
        private String staffName;
        private StaffType staffRole;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignedEquipmentDto {
        private Long id;
        private Long equipmentId;
        private String equipmentName;
        private String equipmentType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnscheduledCaseDto {
        private Long id;
        private Long surgeryRequestId;
        private String surgeryCode;
        private String procedureName;
        private Priority priority;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleMetricsDto {
        private int totalSurgeries;
        private int scheduledCount;
        private int unscheduledCount;
        private double avgWaitingHours;
        private int totalIdleMinutes;
        private int totalOvertimeMinutes;
        private Map<String, Double> roomUtilization;
        private double overallUtilization;
    }
}
