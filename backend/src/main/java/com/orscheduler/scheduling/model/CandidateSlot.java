package com.orscheduler.scheduling.model;

import com.orscheduler.entity.Equipment;
import com.orscheduler.entity.OperatingRoom;
import com.orscheduler.entity.Staff;
import com.orscheduler.enums.StaffType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateSlot {
    private OperatingRoom room;
    private LocalDateTime prepStart;
    private LocalDateTime plannedStart;
    private LocalDateTime plannedEnd;
    private LocalDateTime cleanupEnd;

    @Builder.Default
    private List<StaffAssignment> assignedStaff = new ArrayList<>();

    @Builder.Default
    private List<EquipmentAssignment> assignedEquipment = new ArrayList<>();

    private double softScore;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StaffAssignment {
        private Staff staff;
        private StaffType role;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentAssignment {
        private Equipment equipment;
    }
}
