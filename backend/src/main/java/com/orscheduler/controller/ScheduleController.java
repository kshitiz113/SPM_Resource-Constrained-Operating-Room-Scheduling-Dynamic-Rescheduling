package com.orscheduler.controller;

import com.orscheduler.dto.request.ScheduleGenerationRequest;
import com.orscheduler.dto.response.ScheduleResponse;
import com.orscheduler.dto.response.ValidationResult;
import com.orscheduler.enums.ScheduleStatus;
import com.orscheduler.service.ApprovalService;
import com.orscheduler.service.ScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@Tag(name = "Schedules", description = "Deterministic schedule generation, validation, and lifecycle endpoints")
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final ApprovalService approvalService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER', 'SCHEDULER')")
    @Operation(summary = "Generate a deterministic constraint-based schedule for a given date")
    public ResponseEntity<ScheduleResponse> generateSchedule(@Valid @RequestBody ScheduleGenerationRequest request) {
        return new ResponseEntity<>(scheduleService.generateSchedule(request), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List schedule versions with date and status filters")
    public ResponseEntity<Page<ScheduleResponse.ScheduleVersionDto>> getScheduleVersions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) ScheduleStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(scheduleService.getScheduleVersions(date, status, pageable));
    }

    @GetMapping("/active")
    @Operation(summary = "Get current active published schedule for a specific date")
    public ResponseEntity<ScheduleResponse> getActiveSchedule(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return scheduleService.getActiveSchedule(targetDate)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full schedule details including entries, staff, and equipment by ID")
    public ResponseEntity<ScheduleResponse> getScheduleById(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.getScheduleById(id));
    }

    @PostMapping("/{id}/validate")
    @Operation(summary = "Execute independent constraint validation on schedule version")
    public ResponseEntity<ValidationResult> validateSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.validateScheduleById(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Approve proposed schedule")
    public ResponseEntity<ScheduleResponse> approveSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(approvalService.approveSchedule(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Reject schedule version")
    public ResponseEntity<ScheduleResponse> rejectSchedule(
            @PathVariable Long id,
            @RequestBody(required = false) RejectionRequest request) {
        String reason = (request != null && request.getReason() != null) ? request.getReason() : "Rejected by OR Manager";
        return ResponseEntity.ok(approvalService.rejectSchedule(id, reason));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Publish approved schedule making it the active official schedule")
    public ResponseEntity<ScheduleResponse> publishSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(approvalService.publishSchedule(id));
    }

    @Data
    public static class RejectionRequest {
        private String reason;
    }
}
