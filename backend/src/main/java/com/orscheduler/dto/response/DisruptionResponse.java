package com.orscheduler.dto.response;

import com.orscheduler.enums.DisruptionType;
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
public class DisruptionResponse {
    private Long id;
    private DisruptionType disruptionType;
    private String description;
    private LocalDateTime occurredAt;
    private LocalDateTime reportedAt;
    private Long reportedById;
    private String reportedByName;
    private Long affectedRoomId;
    private String affectedRoomName;
    private Long affectedStaffId;
    private String affectedStaffName;
    private Long affectedEquipmentId;
    private String affectedEquipmentName;
    private Long affectedSurgeryId;
    private String affectedSurgeryCode;
    private Long affectedScheduleVersionId;
    private String status;
    private String resolutionNotes;
    private LocalDateTime resolvedAt;

    @Builder.Default
    private List<String> affectedSurgeries = new ArrayList<>();

    @Builder.Default
    private List<String> preservedSurgeries = new ArrayList<>();
}
