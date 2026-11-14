package com.orscheduler.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QualificationResponse {
    private Long id;
    private String name;
    private String category;
    private String description;
}
