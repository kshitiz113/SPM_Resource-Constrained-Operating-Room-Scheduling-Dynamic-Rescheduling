package com.orscheduler.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EquipmentResponse {
    private Long id;
    private String name;
    private String equipmentType;
    private String serialNumber;
    private String status;
    private String description;
    private LocalDateTime createdAt;
}
