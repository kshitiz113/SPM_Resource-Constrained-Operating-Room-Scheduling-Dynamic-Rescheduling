package com.orscheduler.controller;

import com.orscheduler.dto.request.DisruptionRequest;
import com.orscheduler.dto.request.RescheduleRequest;
import com.orscheduler.dto.response.DisruptionResponse;
import com.orscheduler.dto.response.RescheduleAlternative;
import com.orscheduler.dto.response.ScheduleResponse;
import com.orscheduler.service.RescheduleService;
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

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Disruptions & Rescheduling", description = "Operational disruptions and dynamic rescheduling workflow endpoints")
public class RescheduleController {

    private final RescheduleService rescheduleService;

    @PostMapping("/disruptions")
    @Operation(summary = "Register operational disruption (emergency arrival, cancellation, staff absence, equipment failure, etc.)")
    public ResponseEntity<DisruptionResponse> registerDisruption(@Valid @RequestBody DisruptionRequest request) {
        return new ResponseEntity<>(rescheduleService.registerDisruption(request), HttpStatus.CREATED);
    }

    @GetMapping("/disruptions")
    @Operation(summary = "List registered disruptions with pagination")
    public ResponseEntity<Page<DisruptionResponse>> getDisruptions(Pageable pageable) {
        return ResponseEntity.ok(rescheduleService.getDisruptions(pageable));
    }

    @PostMapping("/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER', 'SCHEDULER')")
    @Operation(summary = "Trigger dynamic rescheduling and generate 2-3 feasible alternatives with before/after diffs")
    public ResponseEntity<List<RescheduleAlternative>> generateAlternatives(@Valid @RequestBody RescheduleRequest request) {
        return ResponseEntity.ok(rescheduleService.generateAlternatives(request));
    }

    @GetMapping("/reschedule/{disruptionId}/alternatives")
    @Operation(summary = "Get generated reschedule alternatives for a disruption")
    public ResponseEntity<List<RescheduleAlternative>> getAlternatives(@PathVariable Long disruptionId) {
        return ResponseEntity.ok(rescheduleService.getAlternativesForDisruption(disruptionId));
    }

    @PostMapping("/reschedule/{disruptionId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Approve and publish a reschedule alternative, superseding the previous active schedule")
    public ResponseEntity<ScheduleResponse> approveAlternative(
            @PathVariable Long disruptionId,
            @RequestBody ApproveAlternativeRequest request) {
        return ResponseEntity.ok(rescheduleService.approveAlternative(disruptionId, request.getAlternativeId()));
    }

    @Data
    public static class ApproveAlternativeRequest {
        private int alternativeId;
    }
}
