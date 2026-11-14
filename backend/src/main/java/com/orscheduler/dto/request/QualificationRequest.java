package com.orscheduler.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class QualificationRequest {
    @NotBlank(message = "Qualification name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    @Size(max = 500)
    private String description;
}
