package com.orscheduler.service;

import com.orscheduler.dto.request.ShiftRequest;
import com.orscheduler.dto.response.ShiftResponse;
import com.orscheduler.entity.Staff;
import com.orscheduler.entity.StaffShift;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.repository.StaffRepository;
import com.orscheduler.repository.StaffShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShiftService {

    private final StaffShiftRepository shiftRepository;
    private final StaffRepository staffRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ShiftResponse> getStaffShifts(Long staffId) {
        return shiftRepository.findByStaffId(staffId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StaffShift> getShiftsForDate(LocalDate date) {
        int dayOfWeek = date.getDayOfWeek().getValue();
        return shiftRepository.findActiveShiftsForDate(dayOfWeek, date);
    }

    @Transactional
    public ShiftResponse createShift(ShiftRequest request) {
        Staff staff = staffRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff", request.getStaffId()));

        java.time.LocalTime from = java.time.LocalTime.parse(request.getStartTime());
        java.time.LocalTime to = java.time.LocalTime.parse(request.getEndTime());
        if (!from.isBefore(to)) {
            throw new IllegalArgumentException("Shift start time must be before end time");
        }
        if (request.isRecurring() && !request.isLeave() && request.getDayOfWeek() == null) {
            throw new IllegalArgumentException("Day of week is required for a recurring shift");
        }
        if ((request.isLeave() || !request.isRecurring())
                && (request.getEffectiveFrom() == null || request.getEffectiveFrom().isBlank())) {
            throw new IllegalArgumentException("A start date is required for leave or one-off shifts");
        }

        StaffShift shift = StaffShift.builder()
                .staff(staff)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime() != null ? java.time.LocalTime.parse(request.getStartTime()) : null)
                .endTime(request.getEndTime() != null ? java.time.LocalTime.parse(request.getEndTime()) : null)
                .effectiveFrom(request.getEffectiveFrom() != null && !request.getEffectiveFrom().isBlank() ? LocalDate.parse(request.getEffectiveFrom()) : null)
                .effectiveTo(request.getEffectiveTo() != null && !request.getEffectiveTo().isBlank() ? LocalDate.parse(request.getEffectiveTo()) : null)
                .isRecurring(request.isRecurring())
                .isLeave(request.isLeave())
                .leaveReason(request.getLeaveReason())
                .build();

        StaffShift saved = shiftRepository.save(shift);
        auditService.logAction("CREATE_SHIFT", "StaffShift", saved.getId(), null, "Staff: " + staff.getFullName() + ", Day: " + request.getDayOfWeek());
        return toResponse(saved);
    }

    @Transactional
    public void deleteShift(Long staffId, Long id) {
        StaffShift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StaffShift", id));
        if (!shift.getStaff().getId().equals(staffId)) {
            throw new ResourceNotFoundException("StaffShift", id);
        }
        shiftRepository.delete(shift);
        auditService.logAction("DELETE_SHIFT", "StaffShift", id, null, null);
    }

    public ShiftResponse toResponse(StaffShift s) {
        return ShiftResponse.builder()
                .id(s.getId())
                .staffId(s.getStaff().getId())
                .staffName(s.getStaff().getFullName())
                .dayOfWeek(s.getDayOfWeek())
                .startTime(s.getStartTime() != null ? s.getStartTime().toString() : null)
                .endTime(s.getEndTime() != null ? s.getEndTime().toString() : null)
                .effectiveFrom(s.getEffectiveFrom() != null ? s.getEffectiveFrom().toString() : null)
                .effectiveTo(s.getEffectiveTo() != null ? s.getEffectiveTo().toString() : null)
                .isRecurring(s.isRecurring())
                .isLeave(s.isLeave())
                .leaveReason(s.getLeaveReason())
                .build();
    }
}
