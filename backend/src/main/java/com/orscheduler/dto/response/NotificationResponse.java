package com.orscheduler.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private Long userId;
    private String notificationType;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
    private Long referenceEntityId;
    private String referenceEntityType;
}
