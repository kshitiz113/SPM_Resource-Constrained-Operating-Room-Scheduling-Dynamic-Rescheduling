package com.orscheduler.scheduling.model;

import com.orscheduler.entity.ScheduleEntry;
import com.orscheduler.entity.SurgeryRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDiff {
    @Builder.Default
    private List<ScheduleEntry> added = new ArrayList<>();

    @Builder.Default
    private List<MovedItem> moved = new ArrayList<>();

    @Builder.Default
    private List<SurgeryRequest> deferred = new ArrayList<>();

    @Builder.Default
    private List<ScheduleEntry> cancelled = new ArrayList<>();

    @Builder.Default
    private List<ScheduleEntry> unchanged = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MovedItem {
        private ScheduleEntry originalEntry;
        private ScheduleEntry newEntry;
        private long shiftMinutes;
    }
}
