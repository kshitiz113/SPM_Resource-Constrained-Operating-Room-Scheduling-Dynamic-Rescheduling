package com.orscheduler.scheduling.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ObjectiveWeights {
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
