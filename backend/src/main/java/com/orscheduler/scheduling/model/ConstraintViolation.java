package com.orscheduler.scheduling.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConstraintViolation {
    private String constraintId;
    private String message;
    private String entityType;
    private Long entityId;
    @Builder.Default
    private String severity = "HARD";
}
