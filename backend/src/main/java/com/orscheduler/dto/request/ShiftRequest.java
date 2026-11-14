package com.orscheduler.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ShiftRequest {
    private Long staffId;

    @Min(1) @Max(7)
    private Integer dayOfWeek;

    @NotBlank(message = "Start time is required")
    private String startTime;

    @NotBlank(message = "End time is required")
    private String endTime;

    private String effectiveFrom;
    private String effectiveTo;
    private Boolean isRecurring = true;
    private Boolean isLeave = false;
    private String leaveReason;

    public boolean isRecurring() {
        return Boolean.TRUE.equals(this.isRecurring);
    }

    public boolean isLeave() {
        return Boolean.TRUE.equals(this.isLeave);
    }
}
