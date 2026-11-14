package com.orscheduler.controller;

import com.orscheduler.dto.response.AuditLogResponse;
import com.orscheduler.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Immutable audit log query endpoints")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "List immutable audit logs with pagination")
    public ResponseEntity<Page<AuditLogResponse>> getAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(auditService.getAuditLogs(pageable));
    }

    @GetMapping("/entity")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Get audit logs for a specific entity type and ID")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByEntity(
            @RequestParam String entityType,
            @RequestParam Long entityId,
            Pageable pageable) {
        return ResponseEntity.ok(auditService.getLogsByEntity(entityType, entityId, pageable));
    }
}
