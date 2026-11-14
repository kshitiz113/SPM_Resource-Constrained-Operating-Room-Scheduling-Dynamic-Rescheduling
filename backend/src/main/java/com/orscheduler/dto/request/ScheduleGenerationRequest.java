package com.orscheduler.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleGenerationRequest {
    @NotNull(message = "Schedule date is required")
    private LocalDate scheduleDate;

    private List<Long> surgeryRequestIds;

    @Builder.Default
    private ObjectiveWeightsDto objectiveWeights = new ObjectiveWeightsDto();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ObjectiveWeightsDto {
        @Builder.Default
        private double waitingTimePenalty = 1.0;

        @Builder.Default
        private double idleTimePenalty = 0.8;

        @Builder.Default
        private double overtimePenalty = 1.5;

        @Builder.Default
        private double deferralPenalty = 2.0;

        @Builder.Default
        private double utilizationWeight = 0.5;
    }
}
