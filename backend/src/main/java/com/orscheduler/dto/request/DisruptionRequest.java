package com.orscheduler.dto.request;

import com.orscheduler.enums.DisruptionType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisruptionRequest {
    @NotNull(message = "Disruption type is required")
    private DisruptionType disruptionType;

    private String description;

    @NotNull(message = "Occurred timestamp is required")
    private LocalDateTime occurredAt;

    private Long affectedScheduleVersionId;
    private Long affectedRoomId;
    private Long affectedStaffId;
    private Long affectedEquipmentId;
    private Long affectedSurgeryRequestId;
    private Integer durationOverrunMinutes;

    private SurgeryRequestDto emergencySurgeryRequest;
}
