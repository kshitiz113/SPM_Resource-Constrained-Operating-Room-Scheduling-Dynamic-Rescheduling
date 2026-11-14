package com.orscheduler.controller;

import com.orscheduler.dto.request.SurgeryRequestDto;
import com.orscheduler.dto.response.SurgeryResponse;
import com.orscheduler.enums.Priority;
import com.orscheduler.enums.SurgeryStatus;
import com.orscheduler.service.SurgeryRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/surgery-requests")
@RequiredArgsConstructor
@Tag(name = "Surgery Requests", description = "Surgery request lifecycle, priority queuing, and resource specification endpoints")
public class SurgeryRequestController {

    private final SurgeryRequestService surgeryRequestService;

    @GetMapping
    @Operation(summary = "List surgery requests with pagination and status/priority filters")
    public ResponseEntity<Page<SurgeryResponse>> getAllRequests(
            @RequestParam(required = false) SurgeryStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(surgeryRequestService.getAllRequests(status, priority, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get surgery request details by ID")
    public ResponseEntity<SurgeryResponse> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(surgeryRequestService.getRequestById(id));
    }

    @PostMapping
    @Operation(summary = "Create new surgery request")
    public ResponseEntity<SurgeryResponse> createRequest(@Valid @RequestBody SurgeryRequestDto request) {
        return new ResponseEntity<>(surgeryRequestService.createRequest(request), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update surgery request status (e.g., IN_PROGRESS, COMPLETED)")
    public ResponseEntity<SurgeryResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest request) {
        if (request == null || request.getStatus() == null) {
            throw new IllegalArgumentException("Status is required");
        }
        return ResponseEntity.ok(surgeryRequestService.updateStatus(id, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER', 'SCHEDULER')")
    @Operation(summary = "Cancel surgery request")
    public ResponseEntity<Void> cancelRequest(@PathVariable Long id) {
        surgeryRequestService.cancelRequest(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class StatusUpdateRequest {
        private SurgeryStatus status;
    }
}
