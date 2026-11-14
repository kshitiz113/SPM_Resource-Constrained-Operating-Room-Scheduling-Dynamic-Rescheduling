package com.orscheduler.scheduling.model;

import com.orscheduler.entity.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchedulingInput {
    private LocalDate scheduleDate;

    @Builder.Default
    private List<SurgeryRequest> surgeryRequests = new ArrayList<>();

    @Builder.Default
    private List<OperatingRoom> rooms = new ArrayList<>();

    @Builder.Default
    private List<Staff> staffMembers = new ArrayList<>();

    @Builder.Default
    private List<Equipment> equipmentList = new ArrayList<>();

    @Builder.Default
    private List<RoomOperatingHours> roomHours = new ArrayList<>();

    @Builder.Default
    private List<StaffShift> staffShifts = new ArrayList<>();

    @Builder.Default
    private List<EquipmentAvailability> equipmentAvailabilities = new ArrayList<>();

    @Builder.Default
    private List<ScheduleEntry> existingLockedEntries = new ArrayList<>();

    @Builder.Default
    private ObjectiveWeights objectiveWeights = new ObjectiveWeights();

    private Long scheduleVersionId;
}
