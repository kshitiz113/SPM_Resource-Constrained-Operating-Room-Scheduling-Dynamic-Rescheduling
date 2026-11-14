package com.orscheduler.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orscheduler.dto.response.AuditLogResponse;
import com.orscheduler.entity.AuditLog;
import com.orscheduler.entity.User;
import com.orscheduler.repository.AuditLogRepository;
import com.orscheduler.repository.UserRepository;
import com.orscheduler.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String action, String entityType, Long entityId, Object beforeValue, Object afterValue) {
        try {
            String username = SecurityUtils.getCurrentUsername().orElse("SYSTEM");
            User user = userRepository.findByUsername(username).orElse(null);

            String beforeJson = beforeValue != null ? (beforeValue instanceof String ? (String) beforeValue : objectMapper.writeValueAsString(beforeValue)) : null;
            String afterJson = afterValue != null ? (afterValue instanceof String ? (String) afterValue : objectMapper.writeValueAsString(afterValue)) : null;

            AuditLog logEntry = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .beforeValue(beforeJson)
                    .afterValue(afterJson)
                    .timestamp(LocalDateTime.now())
                    .build();

            auditLogRepository.save(logEntry);
            log.info("AUDIT: User [{}] executed [{}] on [{}:{}]", username, action, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getLogsByEntity(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId, pageable)
                .map(this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog l) {
        return AuditLogResponse.builder()
                .id(l.getId())
                .userId(l.getUser() != null ? l.getUser().getId() : null)
                .username(l.getUser() != null ? l.getUser().getUsername() : "SYSTEM")
                .userFullName(l.getUser() != null ? l.getUser().getFullName() : "System Process")
                .action(l.getAction())
                .entityType(l.getEntityType())
                .entityId(l.getEntityId())
                .beforeValue(l.getBeforeValue())
                .afterValue(l.getAfterValue())
                .timestamp(l.getTimestamp())
                .ipAddress(l.getIpAddress())
                .build();
    }
}
