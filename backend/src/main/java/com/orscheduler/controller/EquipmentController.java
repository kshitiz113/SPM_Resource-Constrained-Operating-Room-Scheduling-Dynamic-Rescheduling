package com.orscheduler.controller;

import com.orscheduler.dto.request.EquipmentRequest;
import com.orscheduler.dto.response.EquipmentResponse;
import com.orscheduler.enums.EquipmentStatus;
import com.orscheduler.service.EquipmentService;
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
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@Tag(name = "Equipment", description = "Surgical equipment inventory and maintenance endpoints")
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    @Operation(summary = "List surgical equipment with filters and pagination")
    public ResponseEntity<Page<EquipmentResponse>> getAllEquipment(
            @RequestParam(required = false) EquipmentStatus status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(equipmentService.getAllEquipment(status, type, search, pageable));
    }

    @GetMapping("/available")
    @Operation(summary = "List all available equipment items")
    public ResponseEntity<List<EquipmentResponse>> getAvailableEquipment() {
        return ResponseEntity.ok(equipmentService.getAllAvailableEquipment().stream()
                .map(equipmentService::toResponse)
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get equipment details by ID")
    public ResponseEntity<EquipmentResponse> getEquipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Register new equipment item")
    public ResponseEntity<EquipmentResponse> createEquipment(@Valid @RequestBody EquipmentRequest request) {
        return new ResponseEntity<>(equipmentService.createEquipment(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Update equipment item")
    public ResponseEntity<EquipmentResponse> updateEquipment(@PathVariable Long id, @Valid @RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.updateEquipment(id, request));
    }

    @PostMapping("/{id}/maintenance")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Schedule equipment maintenance window")
    public ResponseEntity<Void> scheduleMaintenance(
            @PathVariable Long id,
            @RequestBody MaintenanceRequest request) {
        equipmentService.scheduleMaintenance(id, request.getUnavailableFrom(), request.getUnavailableTo(), request.getReason());
        return ResponseEntity.ok().build();
    }

    @Data
    public static class MaintenanceRequest {
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.orscheduler.util.FlexibleDateTimeDeserializer.class)
        private java.time.LocalDateTime unavailableFrom;
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.orscheduler.util.FlexibleDateTimeDeserializer.EndOfDay.class)
        private java.time.LocalDateTime unavailableTo;
        private String reason;
    }
}
