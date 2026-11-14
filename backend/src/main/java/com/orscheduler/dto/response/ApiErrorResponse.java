package com.orscheduler.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ApiErrorResponse {
    private int status;
    private String error;
    private String message;
    private String timestamp;
    private String path;
    private Map<String, String> fieldErrors;
}
