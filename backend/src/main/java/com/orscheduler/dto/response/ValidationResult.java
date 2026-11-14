package com.orscheduler.dto.response;

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
public class ValidationResult {
    @Builder.Default
    private boolean valid = true;

    @Builder.Default
    private List<ConstraintViolationDto> violations = new ArrayList<>();

    @Builder.Default
    private List<String> warnings = new ArrayList<>();

    public List<ConstraintViolationDto> getHardViolations() {
        return violations != null ? violations.stream()
                .filter(v -> "HARD".equalsIgnoreCase(v.getSeverity()))
                .toList() : List.of();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConstraintViolationDto {
        private String constraintId;
        private String message;
        private String entityType;
        private Long entityId;
        private String severity;
    }
}
