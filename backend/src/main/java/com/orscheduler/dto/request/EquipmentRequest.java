package com.orscheduler.dto.request;

import com.orscheduler.enums.EquipmentStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class EquipmentRequest {
    @NotBlank(message = "Equipment name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Equipment type is required")
    @Size(max = 50)
    private String equipmentType;

    @NotBlank(message = "Serial number is required")
    @Size(max = 50)
    private String serialNumber;

    private EquipmentStatus status = EquipmentStatus.AVAILABLE;

    @Size(max = 500)
    private String description;
}
