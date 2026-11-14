package com.orscheduler.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShiftResponse {
    private Long id;
    private Long staffId;
    private String staffName;
    private Integer dayOfWeek;
    private String startTime;
    private String endTime;
    private String effectiveFrom;
    private String effectiveTo;
    private Boolean isRecurring;
    private Boolean isLeave;
    private String leaveReason;
}
