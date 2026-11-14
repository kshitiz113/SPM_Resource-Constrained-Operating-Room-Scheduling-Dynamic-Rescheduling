package com.orscheduler.service;

import com.orscheduler.dto.request.StaffRequest;
import com.orscheduler.dto.response.QualificationResponse;
import com.orscheduler.dto.response.StaffResponse;
import com.orscheduler.entity.Qualification;
import com.orscheduler.entity.Staff;
import com.orscheduler.entity.StaffQualification;
import com.orscheduler.enums.StaffType;
import com.orscheduler.exception.ConflictException;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.repository.QualificationRepository;
import com.orscheduler.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffRepository staffRepository;
    private final QualificationRepository qualificationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<StaffResponse> getAllStaff(StaffType staffType, String search, Pageable pageable) {
        final String term = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;
        Page<Staff> page;
        if (staffType == null && term == null) {
            page = staffRepository.findAll(pageable);
        } else {
            List<Staff> filtered = staffRepository.findAll(pageable.getSort()).stream()
                    .filter(s -> staffType == null || s.getStaffType() == staffType)
                    .filter(s -> term == null
                            || s.getFullName().toLowerCase().contains(term)
                            || s.getEmployeeId().toLowerCase().contains(term))
                    .collect(Collectors.toList());
            page = com.orscheduler.util.PageUtils.page(filtered, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public StaffResponse getStaffById(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", id));
        return toResponse(staff);
    }

    @Transactional(readOnly = true)
    public List<Staff> getAllActiveStaff() {
        return staffRepository.findByActiveTrueOrderByFullNameAsc();
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> getActiveStaffResponses() {
        return staffRepository.findByActiveTrueOrderByFullNameAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<QualificationResponse> getAllQualifications() {
        return qualificationRepository.findAll().stream()
                .map(q -> QualificationResponse.builder()
                        .id(q.getId())
                        .name(q.getName())
                        .category(q.getCategory() != null ? q.getCategory().name() : null)
                        .description(q.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public StaffResponse reactivateStaff(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", id));
        staff.setActive(true);
        Staff saved = staffRepository.save(staff);
        auditService.logAction("REACTIVATE_STAFF", "Staff", saved.getId(), null, saved.getFullName());
        return toResponse(saved);
    }

    @Transactional
    public StaffResponse createStaff(StaffRequest request) {
        if (staffRepository.existsByEmployeeId(request.getEmployeeId())) {
            throw new ConflictException("Staff with employee ID " + request.getEmployeeId() + " already exists");
        }

        Staff staff = Staff.builder()
                .employeeId(request.getEmployeeId())
                .fullName(request.getFullName())
                .staffType(request.getStaffType())
                .email(request.getEmail())
                .phone(request.getPhone())
                .active(true)
                .qualifications(new ArrayList<>())
                .shifts(new ArrayList<>())
                .build();

        Staff saved = staffRepository.save(staff);

        if (request.getQualifications() != null) {
            for (StaffRequest.StaffQualificationDto qDto : request.getQualifications()) {
                Qualification qualification = qualificationRepository.findById(qDto.getQualificationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Qualification", qDto.getQualificationId()));

                StaffQualification sq = StaffQualification.builder()
                        .staff(saved)
                        .qualification(qualification)
                        .certifiedDate(qDto.getCertifiedDate() != null ? qDto.getCertifiedDate() : LocalDate.now())
                        .expiryDate(qDto.getExpiryDate())
                        .build();

                saved.getQualifications().add(sq);
            }
            saved = staffRepository.save(saved);
        }

        auditService.logAction("CREATE_STAFF", "Staff", saved.getId(), null, saved.getFullName());
        return toResponse(saved);
    }

    @Transactional
    public StaffResponse updateStaff(Long id, StaffRequest request) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", id));

        if (!staff.getEmployeeId().equalsIgnoreCase(request.getEmployeeId()) &&
                staffRepository.existsByEmployeeId(request.getEmployeeId())) {
            throw new ConflictException("Employee ID " + request.getEmployeeId() + " is already taken");
        }

        staff.setEmployeeId(request.getEmployeeId());
        staff.setFullName(request.getFullName());
        staff.setStaffType(request.getStaffType());
        staff.setEmail(request.getEmail());
        staff.setPhone(request.getPhone());
        if (request.getActive() != null) {
            staff.setActive(request.getActive());
        }

        if (request.getQualifications() != null) {
            staff.getQualifications().clear();
            java.util.Set<Long> seen = new java.util.HashSet<>();
            for (StaffRequest.StaffQualificationDto qDto : request.getQualifications()) {
                if (!seen.add(qDto.getQualificationId())) continue;
                Qualification qualification = qualificationRepository.findById(qDto.getQualificationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Qualification", qDto.getQualificationId()));
                staff.getQualifications().add(StaffQualification.builder()
                        .staff(staff)
                        .qualification(qualification)
                        .certifiedDate(qDto.getCertifiedDate() != null ? qDto.getCertifiedDate() : LocalDate.now())
                        .expiryDate(qDto.getExpiryDate())
                        .build());
            }
        }

        Staff updated = staffRepository.save(staff);
        auditService.logAction("UPDATE_STAFF", "Staff", updated.getId(), null, updated.getFullName());
        return toResponse(updated);
    }

    @Transactional
    public void deleteStaff(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", id));
        staff.setActive(false);
        staffRepository.save(staff);
        auditService.logAction("DEACTIVATE_STAFF", "Staff", staff.getId(), null, staff.getFullName());
    }

    public StaffResponse toResponse(Staff s) {
        List<QualificationResponse> quals = s.getQualifications() != null ?
                s.getQualifications().stream()
                        .map(sq -> QualificationResponse.builder()
                                .id(sq.getQualification().getId())
                                .name(sq.getQualification().getName())
                                .category(sq.getQualification().getCategory() != null ? sq.getQualification().getCategory().name() : null)
                                .description(sq.getQualification().getDescription())
                                .build())
                        .collect(Collectors.toList()) :
                List.of();

        return StaffResponse.builder()
                .id(s.getId())
                .employeeId(s.getEmployeeId())
                .fullName(s.getFullName())
                .staffType(s.getStaffType())
                .email(s.getEmail())
                .phone(s.getPhone())
                .active(s.isActive())
                .createdAt(s.getCreatedAt())
                .qualifications(quals)
                .build();
    }
}
