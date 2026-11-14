package com.orscheduler.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomRequest {
    @NotBlank(message = "Room name is required")
    @Size(max = 50)
    private String name;

    @NotBlank(message = "Room type is required")
    @Size(max = 50)
    private String roomType;

    @Builder.Default
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity = 1;

    @Size(max = 500)
    private String description;

    private com.orscheduler.enums.RoomStatus status;

    private List<OperatingHoursDto> operatingHours;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperatingHoursDto {
        @NotNull @Min(1) @Max(7)
        private Integer dayOfWeek;

        @NotNull
        private LocalTime startTime;

        @NotNull
        private LocalTime endTime;

        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;
        @Builder.Default
        private boolean isException = false;
    }
}
