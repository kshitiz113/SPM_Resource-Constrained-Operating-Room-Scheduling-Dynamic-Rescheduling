package com.orscheduler.dto.response;

import com.orscheduler.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private Long id;
    private String name;
    private String roomType;
    private RoomStatus status;
    private Integer capacity;
    private String description;
    private LocalDateTime createdAt;
    private List<OperatingHoursResponse> operatingHours;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperatingHoursResponse {
        private Long id;
        private Integer dayOfWeek;
        private LocalTime startTime;
        private LocalTime endTime;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;
        private boolean isException;
    }
}
