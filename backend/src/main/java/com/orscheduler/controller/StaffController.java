package com.orscheduler.controller;

import com.orscheduler.dto.request.ShiftRequest;
import com.orscheduler.dto.request.StaffRequest;
import com.orscheduler.dto.response.ShiftResponse;
import com.orscheduler.dto.response.StaffResponse;
import com.orscheduler.enums.StaffType;
import com.orscheduler.service.ShiftService;
import com.orscheduler.service.StaffService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@Tag(name = "Staff", description = "Clinical staff, surgeons, anesthetists, and nurse management endpoints")
public class StaffController {

    private final StaffService staffService;
    private final ShiftService shiftService;

    @GetMapping
    @Operation(summary = "List staff with pagination, role filtering, and search")
    public ResponseEntity<Page<StaffResponse>> getAllStaff(
            @RequestParam(required = false) StaffType staffType,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(staffService.getAllStaff(staffType, search, pageable));
    }

    @GetMapping("/active")
    @Operation(summary = "List all active clinical staff")
    public ResponseEntity<List<StaffResponse>> getActiveStaff() {
        return ResponseEntity.ok(staffService.getActiveStaffResponses());
    }

    @GetMapping("/qualifications")
    @Operation(summary = "List all clinical qualifications / certifications")
    public ResponseEntity<List<com.orscheduler.dto.response.QualificationResponse>> getQualifications() {
        return ResponseEntity.ok(staffService.getAllQualifications());
    }

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Reactivate a previously deactivated staff member")
    public ResponseEntity<StaffResponse> reactivateStaff(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.reactivateStaff(id));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get staff member details by ID")
    public ResponseEntity<StaffResponse> getStaffById(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.getStaffById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Register new staff member")
    public ResponseEntity<StaffResponse> createStaff(@Valid @RequestBody StaffRequest request) {
        return new ResponseEntity<>(staffService.createStaff(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Update staff details")
    public ResponseEntity<StaffResponse> updateStaff(@PathVariable Long id, @Valid @RequestBody StaffRequest request) {
        return ResponseEntity.ok(staffService.updateStaff(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Deactivate staff member")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/shifts")
    @Operation(summary = "Get shift schedule for staff member")
    public ResponseEntity<List<ShiftResponse>> getStaffShifts(@PathVariable Long id) {
        return ResponseEntity.ok(shiftService.getStaffShifts(id));
    }

    @DeleteMapping("/{id}/shifts/{shiftId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Remove a shift or leave record")
    public ResponseEntity<Void> deleteShift(@PathVariable Long id, @PathVariable Long shiftId) {
        shiftService.deleteShift(id, shiftId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/shifts")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Add shift or leave for staff member")
    public ResponseEntity<ShiftResponse> addShift(@PathVariable Long id, @Valid @RequestBody ShiftRequest request) {
        request.setStaffId(id);
        return new ResponseEntity<>(shiftService.createShift(request), HttpStatus.CREATED);
    }
}
