package com.orscheduler.dto.response;

import com.orscheduler.enums.Priority;
import com.orscheduler.enums.StaffType;
import com.orscheduler.enums.SurgeryStatus;
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
public class SurgeryResponse {
    private Long id;
    private String surgeryCode;
    private String procedureName;
    private Priority priority;
    private SurgeryStatus status;
    private Integer estimatedDurationMinutes;
    private Integer preparationTimeMinutes;
    private Integer cleaningTimeMinutes;
    private LocalDateTime earliestStart;
    private LocalDateTime schedulingDeadline;
    private LocalDateTime requestedAt;
    private Long preferredRoomId;
    private String preferredRoomName;
    private Long preferredSurgeonId;
    private String preferredSurgeonName;
    private String notes;
    private Long waitingDurationHours;
    private LocalDateTime createdAt;

    private List<SurgeryRequiredStaffResponse> requiredStaff;
    private List<SurgeryRequiredEquipmentResponse> requiredEquipment;
    private List<QualificationResponse> requiredQualifications;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SurgeryRequiredStaffResponse {
        private Long id;
        private StaffType staffRole;
        private Long specificStaffId;
        private String specificStaffName;
        private boolean mandatory;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SurgeryRequiredEquipmentResponse {
        private Long id;
        private Long equipmentId;
        private String equipmentName;
        private String equipmentType;
        private boolean mandatory;
    }
}
