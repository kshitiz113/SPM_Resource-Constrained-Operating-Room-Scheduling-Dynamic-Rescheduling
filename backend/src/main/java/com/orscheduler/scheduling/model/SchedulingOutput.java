package com.orscheduler.scheduling.model;

import com.orscheduler.entity.ScheduleEntry;
import com.orscheduler.entity.SurgeryRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchedulingOutput {
    @Builder.Default
    private List<ScheduleEntry> scheduledEntries = new ArrayList<>();

    @Builder.Default
    private List<UnscheduledRecord> unscheduledCases = new ArrayList<>();

    @Builder.Default
    private List<ConstraintViolation> violations = new ArrayList<>();

    @Builder.Default
    private List<String> warnings = new ArrayList<>();

    private double totalScore;

    @Builder.Default
    private Map<String, Object> metrics = new HashMap<>();

    public boolean isValid() {
        return violations.isEmpty();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnscheduledRecord {
        private SurgeryRequest surgeryRequest;
        private String reason;
    }
}
