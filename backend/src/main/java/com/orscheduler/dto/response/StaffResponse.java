package com.orscheduler.dto.response;

import com.orscheduler.enums.StaffType;
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
public class StaffResponse {
    private Long id;
    private String employeeId;
    private String fullName;
    private StaffType staffType;
    private String email;
    private String phone;
    private boolean active;
    private LocalDateTime createdAt;
    private List<QualificationResponse> qualifications;
}
