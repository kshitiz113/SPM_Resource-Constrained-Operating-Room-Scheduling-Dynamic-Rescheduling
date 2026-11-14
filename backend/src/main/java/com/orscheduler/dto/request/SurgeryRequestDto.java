package com.orscheduler.dto.request;

import com.orscheduler.enums.Priority;
import com.orscheduler.enums.StaffType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurgeryRequestDto {
    private String surgeryCode;

    @NotBlank(message = "Procedure name is required")
    @Size(max = 200)
    private String procedureName;

    @NotNull(message = "Priority is required")
    private Priority priority;

    @NotNull(message = "Estimated duration is required")
    @Min(value = 15, message = "Duration must be at least 15 minutes")
    @Max(value = 720, message = "Duration cannot exceed 12 hours")
    private Integer estimatedDurationMinutes;

    @Builder.Default
    @Min(0)
    private Integer preparationTimeMinutes = 15;

    @Builder.Default
    @Min(0)
    private Integer cleaningTimeMinutes = 15;

    @NotNull(message = "Earliest start time is required")
    private LocalDateTime earliestStart;

    @NotNull(message = "Scheduling deadline is required")
    private LocalDateTime schedulingDeadline;

    private Long preferredRoomId;
    private Long preferredSurgeonId;
    private String notes;

    private List<RequiredStaffDto> requiredStaff;
    private List<RequiredEquipmentDto> requiredEquipment;
    private List<Long> requiredQualificationIds;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequiredStaffDto {
        @NotNull(message = "Staff role is required")
        private StaffType staffRole;
        private Long specificStaffId;
        private boolean mandatory = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RequiredEquipmentDto {
        @NotNull(message = "Equipment ID is required")
        private Long equipmentId;
        private boolean mandatory = true;
    }
}
