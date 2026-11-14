package com.orscheduler.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleRequest {
    @NotNull(message = "Disruption ID is required")
    private Long disruptionId;

    @NotNull(message = "Active schedule version ID is required")
    private Long activeScheduleVersionId;

    @Builder.Default
    private Integer maxAlternatives = 3;
}
