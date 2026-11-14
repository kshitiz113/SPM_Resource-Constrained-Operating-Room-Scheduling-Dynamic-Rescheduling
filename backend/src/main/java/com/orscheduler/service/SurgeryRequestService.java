package com.orscheduler.service;

import com.orscheduler.dto.request.SurgeryRequestDto;
import com.orscheduler.dto.response.QualificationResponse;
import com.orscheduler.dto.response.SurgeryResponse;
import com.orscheduler.entity.*;
import com.orscheduler.enums.Priority;
import com.orscheduler.enums.SurgeryStatus;
import com.orscheduler.exception.ConflictException;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SurgeryRequestService {

    private final SurgeryRequestRepository surgeryRequestRepository;
    private final OperatingRoomRepository roomRepository;
    private final StaffRepository staffRepository;
    private final EquipmentRepository equipmentRepository;
    private final QualificationRepository qualificationRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<SurgeryResponse> getAllRequests(SurgeryStatus status, Priority priority, String search, Pageable pageable) {
        Page<SurgeryRequest> page;
        if (status != null && priority != null) {
            page = surgeryRequestRepository.findByStatusAndPriority(status, priority, pageable);
        } else if (status != null) {
            page = surgeryRequestRepository.findByStatus(status, pageable);
        } else if (priority != null) {
            page = surgeryRequestRepository.findByPriority(priority, pageable);
        } else if (search != null && !search.isBlank()) {
            page = surgeryRequestRepository.findByProcedureNameContainingIgnoreCase(search, pageable);
        } else {
            page = surgeryRequestRepository.findAll(pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public SurgeryResponse getRequestById(Long id) {
        SurgeryRequest req = surgeryRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SurgeryRequest", id));
        return toResponse(req);
    }

    @Transactional
    public SurgeryResponse createRequest(SurgeryRequestDto dto) {
        if (dto.getEarliestStart() != null && dto.getSchedulingDeadline() != null
                && !dto.getSchedulingDeadline().isAfter(dto.getEarliestStart())) {
            throw new IllegalArgumentException("Scheduling deadline must be after the earliest start time");
        }

        String code = dto.getSurgeryCode();
        if (code == null || code.isBlank()) {
            code = "SURG-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } else if (surgeryRequestRepository.existsBySurgeryCode(code)) {
            throw new ConflictException("Surgery code " + code + " already exists");
        }

        OperatingRoom preferredRoom = null;
        if (dto.getPreferredRoomId() != null) {
            preferredRoom = roomRepository.findById(dto.getPreferredRoomId()).orElse(null);
        }

        Staff preferredSurgeon = null;
        if (dto.getPreferredSurgeonId() != null) {
            preferredSurgeon = staffRepository.findById(dto.getPreferredSurgeonId()).orElse(null);
        }

        SurgeryRequest request = SurgeryRequest.builder()
                .surgeryCode(code)
                .procedureName(dto.getProcedureName())
                .priority(dto.getPriority())
                .status(SurgeryStatus.REQUESTED)
                .estimatedDurationMinutes(dto.getEstimatedDurationMinutes())
                .preparationTimeMinutes(dto.getPreparationTimeMinutes() != null ? dto.getPreparationTimeMinutes() : 15)
                .cleaningTimeMinutes(dto.getCleaningTimeMinutes() != null ? dto.getCleaningTimeMinutes() : 15)
                .earliestStart(dto.getEarliestStart())
                .schedulingDeadline(dto.getSchedulingDeadline())
                .requestedAt(LocalDateTime.now())
                .preferredRoom(preferredRoom)
                .preferredSurgeon(preferredSurgeon)
                .notes(dto.getNotes())
                .requiredStaff(new ArrayList<>())
                .requiredEquipment(new ArrayList<>())
                .requiredQualifications(new ArrayList<>())
                .build();

        // Required staff
        if (dto.getRequiredStaff() != null) {
            for (SurgeryRequestDto.RequiredStaffDto rsd : dto.getRequiredStaff()) {
                Staff specificStaff = null;
                if (rsd.getSpecificStaffId() != null) {
                    specificStaff = staffRepository.findById(rsd.getSpecificStaffId()).orElse(null);
                }
                SurgeryRequiredStaff srs = SurgeryRequiredStaff.builder()
                        .surgeryRequest(request)
                        .staffRole(rsd.getStaffRole())
                        .specificStaff(specificStaff)
                        .isMandatory(rsd.isMandatory())
                        .build();
                request.getRequiredStaff().add(srs);
            }
        }

        // Required equipment
        if (dto.getRequiredEquipment() != null) {
            for (SurgeryRequestDto.RequiredEquipmentDto red : dto.getRequiredEquipment()) {
                Equipment eq = equipmentRepository.findById(red.getEquipmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Equipment", red.getEquipmentId()));
                SurgeryRequiredEquipment sre = SurgeryRequiredEquipment.builder()
                        .surgeryRequest(request)
                        .equipment(eq)
                        .isMandatory(red.isMandatory())
                        .build();
                request.getRequiredEquipment().add(sre);
            }
        }

        // Required qualifications
        if (dto.getRequiredQualificationIds() != null) {
            for (Long qId : dto.getRequiredQualificationIds()) {
                Qualification qual = qualificationRepository.findById(qId)
                        .orElseThrow(() -> new ResourceNotFoundException("Qualification", qId));
                SurgeryRequiredQualification srq = SurgeryRequiredQualification.builder()
                        .surgeryRequest(request)
                        .qualification(qual)
                        .build();
                request.getRequiredQualifications().add(srq);
            }
        }

        SurgeryRequest saved = surgeryRequestRepository.save(request);
        auditService.logAction("CREATE_SURGERY_REQUEST", "SurgeryRequest", saved.getId(), null, saved.getSurgeryCode());

        if (saved.getPriority() == Priority.EMERGENCY) {
            notificationService.broadcastNotification(
                    "EMERGENCY_SURGERY",
                    "Emergency Surgery Created: " + saved.getProcedureName(),
                    "Immediate scheduling required for " + saved.getSurgeryCode(),
                    saved.getId(),
                    "SurgeryRequest"
            );
        }

        return toResponse(saved);
    }

    @Transactional
    public SurgeryResponse updateStatus(Long id, SurgeryStatus newStatus) {
        SurgeryRequest req = surgeryRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SurgeryRequest", id));

        SurgeryStatus oldStatus = req.getStatus();
        if (oldStatus == newStatus) {
            return toResponse(req);
        }
        if (oldStatus == SurgeryStatus.COMPLETED || oldStatus == SurgeryStatus.CANCELLED) {
            throw new ConflictException("Cannot change status of a " + oldStatus + " surgery request");
        }
        req.setStatus(newStatus);
        SurgeryRequest saved = surgeryRequestRepository.save(req);

        auditService.logAction("UPDATE_SURGERY_STATUS", "SurgeryRequest", saved.getId(), oldStatus.name(), newStatus.name());
        return toResponse(saved);
    }

    @Transactional
    public void cancelRequest(Long id) {
        updateStatus(id, SurgeryStatus.CANCELLED);
    }

    public SurgeryResponse toResponse(SurgeryRequest r) {
        Long waitHours = 0L;
        if (r.getRequestedAt() != null) {
            waitHours = Duration.between(r.getRequestedAt(), LocalDateTime.now()).toHours();
        }

        List<SurgeryResponse.SurgeryRequiredStaffResponse> staff = r.getRequiredStaff() != null ?
                r.getRequiredStaff().stream().map(s -> SurgeryResponse.SurgeryRequiredStaffResponse.builder()
                        .id(s.getId())
                        .staffRole(s.getStaffRole())
                        .specificStaffId(s.getSpecificStaff() != null ? s.getSpecificStaff().getId() : null)
                        .specificStaffName(s.getSpecificStaff() != null ? s.getSpecificStaff().getFullName() : null)
                        .mandatory(s.isMandatory())
                        .build()).collect(Collectors.toList()) :
                List.of();

        List<SurgeryResponse.SurgeryRequiredEquipmentResponse> equipment = r.getRequiredEquipment() != null ?
                r.getRequiredEquipment().stream().map(e -> SurgeryResponse.SurgeryRequiredEquipmentResponse.builder()
                        .id(e.getId())
                        .equipmentId(e.getEquipment().getId())
                        .equipmentName(e.getEquipment().getName())
                        .equipmentType(e.getEquipment().getEquipmentType())
                        .mandatory(e.isMandatory())
                        .build()).collect(Collectors.toList()) :
                List.of();

        List<QualificationResponse> qualifications = r.getRequiredQualifications() != null ?
                r.getRequiredQualifications().stream().map(q -> QualificationResponse.builder()
                        .id(q.getQualification().getId())
                        .name(q.getQualification().getName())
                        .category(q.getQualification().getCategory() != null ? q.getQualification().getCategory().name() : null)
                        .description(q.getQualification().getDescription())
                        .build()).collect(Collectors.toList()) :
                List.of();

        return SurgeryResponse.builder()
                .id(r.getId())
                .surgeryCode(r.getSurgeryCode())
                .procedureName(r.getProcedureName())
                .priority(r.getPriority())
                .status(r.getStatus())
                .estimatedDurationMinutes(r.getEstimatedDurationMinutes())
                .preparationTimeMinutes(r.getPreparationTimeMinutes())
                .cleaningTimeMinutes(r.getCleaningTimeMinutes())
                .earliestStart(r.getEarliestStart())
                .schedulingDeadline(r.getSchedulingDeadline())
                .requestedAt(r.getRequestedAt())
                .preferredRoomId(r.getPreferredRoom() != null ? r.getPreferredRoom().getId() : null)
                .preferredRoomName(r.getPreferredRoom() != null ? r.getPreferredRoom().getName() : null)
                .preferredSurgeonId(r.getPreferredSurgeon() != null ? r.getPreferredSurgeon().getId() : null)
                .preferredSurgeonName(r.getPreferredSurgeon() != null ? r.getPreferredSurgeon().getFullName() : null)
                .notes(r.getNotes())
                .waitingDurationHours(waitHours)
                .createdAt(r.getCreatedAt())
                .requiredStaff(staff)
                .requiredEquipment(equipment)
                .requiredQualifications(qualifications)
                .build();
    }
}
