package com.orscheduler.dto.request;

import com.orscheduler.enums.StaffType;
import jakarta.validation.constraints.*;
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
public class StaffRequest {
    @NotBlank(message = "Employee ID is required")
    @Size(max = 30)
    private String employeeId;

    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    private String fullName;

    @NotNull(message = "Staff type is required")
    private StaffType staffType;

    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 30)
    private String phone;

    private Boolean active;

    private List<StaffQualificationDto> qualifications;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StaffQualificationDto {
        @NotNull
        private Long qualificationId;
        private LocalDate certifiedDate;
        private LocalDate expiryDate;
    }
}
