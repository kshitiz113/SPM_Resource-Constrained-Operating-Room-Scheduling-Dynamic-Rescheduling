package com.orscheduler.service;

import com.orscheduler.dto.request.EquipmentRequest;
import com.orscheduler.dto.response.EquipmentResponse;
import com.orscheduler.entity.Equipment;
import com.orscheduler.entity.EquipmentAvailability;
import com.orscheduler.enums.EquipmentStatus;
import com.orscheduler.exception.ConflictException;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.repository.EquipmentAvailabilityRepository;
import com.orscheduler.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentAvailabilityRepository availabilityRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<EquipmentResponse> getAllEquipment(EquipmentStatus status, String type, String search, Pageable pageable) {
        final String term = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;
        final String typeTerm = (type != null && !type.isBlank()) ? type.trim() : null;
        Page<Equipment> page;
        if (status == null && term == null && typeTerm == null) {
            page = equipmentRepository.findAll(pageable);
        } else {
            List<Equipment> filtered = equipmentRepository.findAll(pageable.getSort()).stream()
                    .filter(e -> status == null || e.getStatus() == status)
                    .filter(e -> typeTerm == null || typeTerm.equalsIgnoreCase(e.getEquipmentType()))
                    .filter(e -> term == null
                            || e.getName().toLowerCase().contains(term)
                            || (e.getSerialNumber() != null && e.getSerialNumber().toLowerCase().contains(term)))
                    .collect(java.util.stream.Collectors.toList());
            page = com.orscheduler.util.PageUtils.page(filtered, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public EquipmentResponse getEquipmentById(Long id) {
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));
        return toResponse(eq);
    }

    @Transactional(readOnly = true)
    public List<Equipment> getAllAvailableEquipment() {
        return equipmentRepository.findByStatus(EquipmentStatus.AVAILABLE);
    }

    @Transactional
    public EquipmentResponse createEquipment(EquipmentRequest request) {
        if (request.getSerialNumber() != null && equipmentRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new ConflictException("Equipment with serial number " + request.getSerialNumber() + " already exists");
        }

        Equipment equipment = Equipment.builder()
                .name(request.getName())
                .equipmentType(request.getEquipmentType())
                .serialNumber(request.getSerialNumber())
                .status(request.getStatus() != null ? request.getStatus() : EquipmentStatus.AVAILABLE)
                .description(request.getDescription())
                .build();

        Equipment saved = equipmentRepository.save(equipment);
        auditService.logAction("CREATE_EQUIPMENT", "Equipment", saved.getId(), null, saved.getName());
        return toResponse(saved);
    }

    @Transactional
    public EquipmentResponse updateEquipment(Long id, EquipmentRequest request) {
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));

        if (request.getSerialNumber() != null && !request.getSerialNumber().equalsIgnoreCase(eq.getSerialNumber())
                && equipmentRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new ConflictException("Serial number " + request.getSerialNumber() + " already exists");
        }

        eq.setName(request.getName());
        eq.setEquipmentType(request.getEquipmentType());
        eq.setSerialNumber(request.getSerialNumber());
        if (request.getStatus() != null) {
            eq.setStatus(request.getStatus());
        }
        eq.setDescription(request.getDescription());

        Equipment updated = equipmentRepository.save(eq);
        auditService.logAction("UPDATE_EQUIPMENT", "Equipment", updated.getId(), null, updated.getName());
        return toResponse(updated);
    }

    @Transactional
    public void scheduleMaintenance(Long id, java.time.LocalDateTime from, java.time.LocalDateTime to, String reason) {
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));

        if (from == null || to == null) {
            throw new IllegalArgumentException("Maintenance window start and end are required");
        }
        if (!from.isBefore(to)) {
            throw new IllegalArgumentException("Maintenance window start must be before its end");
        }

        EquipmentAvailability ea = EquipmentAvailability.builder()
                .equipment(eq)
                .unavailableFrom(from)
                .unavailableTo(to)
                .reason(reason != null && reason.length() > 200 ? reason.substring(0, 200) : reason)
                .build();

        availabilityRepository.save(ea);
        auditService.logAction("SCHEDULE_MAINTENANCE", "Equipment", eq.getId(), null, "From " + from + " to " + to + ": " + reason);
    }

    public EquipmentResponse toResponse(Equipment e) {
        return EquipmentResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .equipmentType(e.getEquipmentType())
                .serialNumber(e.getSerialNumber())
                .status(e.getStatus() != null ? e.getStatus().name() : null)
                .description(e.getDescription())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
