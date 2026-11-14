package com.orscheduler.service;

import com.orscheduler.dto.request.DisruptionRequest;
import com.orscheduler.dto.request.RescheduleRequest;
import com.orscheduler.dto.response.DisruptionResponse;
import com.orscheduler.dto.response.RescheduleAlternative;
import com.orscheduler.dto.response.ScheduleResponse;
import com.orscheduler.entity.*;
import com.orscheduler.enums.*;
import com.orscheduler.exception.ConflictException;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.repository.*;
import com.orscheduler.scheduling.ReschedulingEngine;
import com.orscheduler.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RescheduleService {

    private final DisruptionRepository disruptionRepository;
    private final ScheduleVersionRepository scheduleVersionRepository;
    private final ScheduleEntryRepository scheduleEntryRepository;
    private final OperatingRoomRepository roomRepository;
    private final StaffRepository staffRepository;
    private final EquipmentRepository equipmentRepository;
    private final SurgeryRequestRepository surgeryRequestRepository;
    private final RoomOperatingHoursRepository hoursRepository;
    private final StaffShiftRepository shiftRepository;
    private final EquipmentAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;
    private final SurgeryRequestService surgeryRequestService;
    private final ReschedulingEngine reschedulingEngine;
    private final ScheduleService scheduleService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    // Cache generated alternatives by disruptionId
    private final Map<Long, List<RescheduleAlternative>> alternativeCache = new ConcurrentHashMap<>();

    @Transactional
    public DisruptionResponse registerDisruption(DisruptionRequest request) {
        String username = SecurityUtils.getCurrentUsername().orElse("SYSTEM");
        User currentUser = userRepository.findByUsername(username).orElse(null);

        OperatingRoom room = null;
        if (request.getAffectedRoomId() != null) {
            room = roomRepository.findById(request.getAffectedRoomId()).orElse(null);
        }

        Staff staff = null;
        if (request.getAffectedStaffId() != null) {
            staff = staffRepository.findById(request.getAffectedStaffId()).orElse(null);
        }

        Equipment equipment = null;
        if (request.getAffectedEquipmentId() != null) {
            equipment = equipmentRepository.findById(request.getAffectedEquipmentId()).orElse(null);
        }

        ScheduleVersion scheduleVersion = null;
        if (request.getAffectedScheduleVersionId() != null) {
            scheduleVersion = scheduleVersionRepository.findById(request.getAffectedScheduleVersionId()).orElse(null);
        } else {
            // Pick active schedule for today or tomorrow
            scheduleVersion = scheduleVersionRepository.findActiveScheduleForDate(LocalDate.now()).orElse(null);
        }

        SurgeryRequest affectedSurgery = null;
        if (request.getAffectedSurgeryRequestId() != null) {
            affectedSurgery = surgeryRequestRepository.findById(request.getAffectedSurgeryRequestId()).orElse(null);
        }

        Disruption disruption = Disruption.builder()
                .disruptionType(request.getDisruptionType())
                .description(request.getDescription())
                .occurredAt(request.getOccurredAt() != null ? request.getOccurredAt() : LocalDateTime.now())
                .reportedAt(LocalDateTime.now())
                .reportedBy(currentUser)
                .affectedRoom(room)
                .affectedStaff(staff)
                .affectedEquipment(equipment)
                .affectedSurgery(affectedSurgery)
                .affectedScheduleVersion(scheduleVersion)
                .status("REGISTERED")
                .build();

        Disruption saved = disruptionRepository.save(disruption);
        auditService.logAction("REGISTER_DISRUPTION", "Disruption", saved.getId(), null, saved.getDisruptionType().name());

        // Handle Emergency Arrival surgery creation
        SurgeryRequest emergencySurgery = null;
        if (request.getDisruptionType() == DisruptionType.EMERGENCY_ARRIVAL && request.getEmergencySurgeryRequest() != null) {
            var createdDto = surgeryRequestService.createRequest(request.getEmergencySurgeryRequest());
            emergencySurgery = surgeryRequestRepository.findById(createdDto.getId()).orElse(null);
            if (emergencySurgery != null) {
                saved.setAffectedSurgery(emergencySurgery);
                saved = disruptionRepository.save(saved);
            }
        }

        // Case overrun: extend the affected procedure so rescheduling accounts for it
        if (request.getDisruptionType() == DisruptionType.DURATION_OVERRUN && affectedSurgery != null
                && request.getDurationOverrunMinutes() != null && request.getDurationOverrunMinutes() > 0) {
            int current = affectedSurgery.getEstimatedDurationMinutes() != null ? affectedSurgery.getEstimatedDurationMinutes() : 60;
            affectedSurgery.setEstimatedDurationMinutes(current + request.getDurationOverrunMinutes());
            surgeryRequestRepository.save(affectedSurgery);
        }

        // Identify affected and preserved surgeries
        List<String> affectedCodes = new ArrayList<>();
        List<String> preservedCodes = new ArrayList<>();

        if (scheduleVersion != null && scheduleVersion.getEntries() != null) {
            for (ScheduleEntry e : scheduleVersion.getEntries()) {
                boolean isAffected = false;
                if (e.isLocked() || e.getEntryStatus() == EntryStatus.IN_PROGRESS || e.getEntryStatus() == EntryStatus.COMPLETED) {
                    preservedCodes.add(e.getSurgeryRequest().getSurgeryCode());
                    continue;
                }

                if (room != null && e.getOperatingRoom() != null && e.getOperatingRoom().getId().equals(room.getId())) {
                    isAffected = true;
                }
                if (staff != null && e.getAssignedStaff() != null) {
                    for (ScheduleEntryStaff ses : e.getAssignedStaff()) {
                        if (ses.getStaff().getId().equals(staff.getId())) {
                            isAffected = true;
                            break;
                        }
                    }
                }
                if (equipment != null && e.getAssignedEquipment() != null) {
                    for (ScheduleEntryEquipment see : e.getAssignedEquipment()) {
                        if (see.getEquipment().getId().equals(equipment.getId())) {
                            isAffected = true;
                            break;
                        }
                    }
                }
                if (affectedSurgery != null && e.getSurgeryRequest() != null && e.getSurgeryRequest().getId().equals(affectedSurgery.getId())) {
                    isAffected = true;
                }

                if (isAffected) {
                    affectedCodes.add(e.getSurgeryRequest().getSurgeryCode());
                } else {
                    preservedCodes.add(e.getSurgeryRequest().getSurgeryCode());
                }
            }
        }

        notificationService.broadcastNotification(
                "DISRUPTION_ALERT",
                "Operational Disruption: " + saved.getDisruptionType().name(),
                saved.getDescription() + " - Affected surgeries: " + String.join(", ", affectedCodes),
                saved.getId(),
                "Disruption"
        );

        return DisruptionResponse.builder()
                .id(saved.getId())
                .disruptionType(saved.getDisruptionType())
                .description(saved.getDescription())
                .occurredAt(saved.getOccurredAt())
                .reportedAt(saved.getReportedAt())
                .reportedById(saved.getReportedBy() != null ? saved.getReportedBy().getId() : null)
                .reportedByName(saved.getReportedBy() != null ? saved.getReportedBy().getFullName() : null)
                .affectedRoomId(room != null ? room.getId() : null)
                .affectedRoomName(room != null ? room.getName() : null)
                .affectedStaffId(staff != null ? staff.getId() : null)
                .affectedStaffName(staff != null ? staff.getFullName() : null)
                .affectedEquipmentId(equipment != null ? equipment.getId() : null)
                .affectedEquipmentName(equipment != null ? equipment.getName() : null)
                .affectedSurgeryId(saved.getAffectedSurgery() != null ? saved.getAffectedSurgery().getId() : null)
                .affectedSurgeryCode(saved.getAffectedSurgery() != null ? saved.getAffectedSurgery().getSurgeryCode() : null)
                .affectedScheduleVersionId(scheduleVersion != null ? scheduleVersion.getId() : null)
                .status(saved.getStatus())
                .affectedSurgeries(affectedCodes)
                .preservedSurgeries(preservedCodes)
                .build();
    }

    @Transactional
    public List<RescheduleAlternative> generateAlternatives(RescheduleRequest request) {
        Disruption disruption = disruptionRepository.findById(request.getDisruptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Disruption", request.getDisruptionId()));

        ScheduleVersion activeSchedule = scheduleVersionRepository.findById(request.getActiveScheduleVersionId())
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleVersion", request.getActiveScheduleVersionId()));

        LocalDate date = activeSchedule.getScheduleDate();
        List<OperatingRoom> allRooms = roomRepository.findByStatusOrderByNameAsc(RoomStatus.ACTIVE);
        List<Staff> allStaff = staffRepository.findByActiveTrueOrderByFullNameAsc();
        List<Equipment> allEquipment = equipmentRepository.findAll().stream()
                .filter(e -> e.getStatus() == EquipmentStatus.AVAILABLE || e.getStatus() == EquipmentStatus.IN_USE)
                .collect(java.util.stream.Collectors.toList());
        List<RoomOperatingHours> hours = hoursRepository.findAll();
        List<StaffShift> shifts = shiftRepository.findActiveShiftsForDate(date.getDayOfWeek().getValue(), date);
        List<EquipmentAvailability> availabilities = availabilityRepository.findByUnavailableToGreaterThanEqual(date);

        // Find emergency request if applicable
        SurgeryRequest emergencyRequest = null;
        if (disruption.getDisruptionType() == DisruptionType.EMERGENCY_ARRIVAL) {
            if (disruption.getAffectedSurgery() != null
                    && disruption.getAffectedSurgery().getStatus() == SurgeryStatus.REQUESTED) {
                emergencyRequest = disruption.getAffectedSurgery();
            } else {
                emergencyRequest = surgeryRequestRepository.findTopByPriorityAndStatusOrderByRequestedAtDesc(
                        Priority.EMERGENCY, SurgeryStatus.REQUESTED).orElse(null);
            }
        }

        int maxAlts = request.getMaxAlternatives() != null ? request.getMaxAlternatives() : 3;

        List<RescheduleAlternative> alternatives = reschedulingEngine.generateAlternatives(
                activeSchedule,
                disruption,
                emergencyRequest,
                allRooms,
                allStaff,
                allEquipment,
                hours,
                shifts,
                availabilities,
                maxAlts
        );

        alternativeCache.put(disruption.getId(), alternatives);
        auditService.logAction("GENERATE_RESCHEDULE_ALTERNATIVES", "Disruption", disruption.getId(), null,
                "Generated " + alternatives.size() + " alternatives");

        return alternatives;
    }

    @Transactional(readOnly = true)
    public List<RescheduleAlternative> getAlternativesForDisruption(Long disruptionId) {
        if (alternativeCache.containsKey(disruptionId)) {
            return alternativeCache.get(disruptionId);
        }
        return List.of();
    }

    @Transactional
    public ScheduleResponse approveAlternative(Long disruptionId, int alternativeId) {
        Disruption disruption = disruptionRepository.findById(disruptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Disruption", disruptionId));

        List<RescheduleAlternative> alternatives = alternativeCache.get(disruptionId);
        if (alternatives == null || alternatives.isEmpty()) {
            // Re-generate
            alternatives = generateAlternatives(RescheduleRequest.builder()
                    .disruptionId(disruptionId)
                    .activeScheduleVersionId(disruption.getAffectedScheduleVersion() != null ?
                            disruption.getAffectedScheduleVersion().getId() : 1L)
                    .build());
        }

        RescheduleAlternative selected = alternatives.stream()
                .filter(a -> a.getAlternativeId() == alternativeId)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Alternative ID " + alternativeId + " not found"));

        ScheduleVersion baseVersion = disruption.getAffectedScheduleVersion();
        LocalDate scheduleDate = baseVersion != null ? baseVersion.getScheduleDate() : LocalDate.now();

        String username = SecurityUtils.getCurrentUsername().orElse("SYSTEM");
        User currentUser = userRepository.findByUsername(username).orElse(null);

        if ("RESOLVED".equals(disruption.getStatus())) {
            throw new com.orscheduler.exception.ConflictException("This disruption has already been resolved");
        }

        // Supersede previous version
        if (baseVersion != null) {
            baseVersion.setStatus(ScheduleStatus.SUPERSEDED);
            scheduleVersionRepository.save(baseVersion);
        }

        // Propagate surgery status for cases that drop out of the new schedule
        java.util.Set<Long> keptRequestIds = new java.util.HashSet<>();
        for (ScheduleResponse.ScheduleEntryDto ed : selected.getSchedule().getEntries()) {
            if (ed.getSurgeryRequestId() != null) keptRequestIds.add(ed.getSurgeryRequestId());
        }
        if (baseVersion != null && baseVersion.getEntries() != null) {
            for (ScheduleEntry oe : baseVersion.getEntries()) {
                SurgeryRequest r = oe.getSurgeryRequest();
                if (r == null || keptRequestIds.contains(r.getId())) continue;
                if (r.getStatus() == SurgeryStatus.COMPLETED || r.getStatus() == SurgeryStatus.IN_PROGRESS) continue;
                boolean cancelled = disruption.getDisruptionType() == DisruptionType.CANCELLATION
                        && disruption.getAffectedSurgery() != null
                        && disruption.getAffectedSurgery().getId().equals(r.getId());
                r.setStatus(cancelled ? SurgeryStatus.CANCELLED : SurgeryStatus.DEFERRED);
                surgeryRequestRepository.save(r);
            }
        }
        if (disruption.getDisruptionType() == DisruptionType.EMERGENCY_ARRIVAL && disruption.getAffectedSurgery() != null
                && !keptRequestIds.contains(disruption.getAffectedSurgery().getId())) {
            SurgeryRequest er = disruption.getAffectedSurgery();
            er.setStatus(SurgeryStatus.DEFERRED);
            surgeryRequestRepository.save(er);
        }

        int nextVer = scheduleVersionRepository.findMaxVersionNumberForDate(scheduleDate).orElse(1) + 1;

        ScheduleVersion newVersion = ScheduleVersion.builder()
                .versionLabel("SCH-" + scheduleDate + "-v" + nextVer + "-rescheduled")
                .scheduleDate(scheduleDate)
                .status(ScheduleStatus.PUBLISHED)
                .createdBy(currentUser)
                .approvedBy(currentUser)
                .createdAt(LocalDateTime.now())
                .approvedAt(LocalDateTime.now())
                .publishedAt(LocalDateTime.now())
                .parentVersion(baseVersion)
                .disruption(disruption)
                .versionNumber(nextVer)
                .totalScore(selected.getTotalScore())
                .generationNotes("Rescheduled via " + selected.getLabel() + ": " + selected.getDescription())
                .entries(new ArrayList<>())
                .build();

        ScheduleVersion savedVersion = scheduleVersionRepository.save(newVersion);

        // Map entries
        for (ScheduleResponse.ScheduleEntryDto edto : selected.getSchedule().getEntries()) {
            SurgeryRequest req = surgeryRequestRepository.findById(edto.getSurgeryRequestId()).orElse(null);
            OperatingRoom room = roomRepository.findById(edto.getOperatingRoomId()).orElse(null);

            ScheduleEntry se = ScheduleEntry.builder()
                    .scheduleVersion(savedVersion)
                    .surgeryRequest(req)
                    .operatingRoom(room)
                    .prepStart(edto.getPrepStart())
                    .plannedStart(edto.getPlannedStart())
                    .plannedEnd(edto.getPlannedEnd())
                    .cleanupEnd(edto.getCleanupEnd())
                    .entryStatus(edto.getEntryStatus())
                    .isLocked(edto.isLocked())
                    .assignedStaff(new ArrayList<>())
                    .assignedEquipment(new ArrayList<>())
                    .build();

            if (edto.getAssignedStaff() != null) {
                for (var sd : edto.getAssignedStaff()) {
                    Staff st = staffRepository.findById(sd.getStaffId()).orElse(null);
                    if (st != null) {
                        se.getAssignedStaff().add(ScheduleEntryStaff.builder()
                                .scheduleEntry(se)
                                .staff(st)
                                .assignedRole(sd.getStaffRole())
                                .build());
                    }
                }
            }

            if (edto.getAssignedEquipment() != null) {
                for (var eqDto : edto.getAssignedEquipment()) {
                    Equipment eq = equipmentRepository.findById(eqDto.getEquipmentId()).orElse(null);
                    if (eq != null) {
                        se.getAssignedEquipment().add(ScheduleEntryEquipment.builder()
                                .scheduleEntry(se)
                                .equipment(eq)
                                .build());
                    }
                }
            }

            savedVersion.getEntries().add(se);
            if (req != null) {
                req.setStatus(SurgeryStatus.SCHEDULED);
                surgeryRequestRepository.save(req);
            }
        }

        ScheduleVersion finalSaved = scheduleVersionRepository.save(savedVersion);

        // Update disruption status
        disruption.setStatus("RESOLVED");
        disruption.setResolvedAt(LocalDateTime.now());
        disruption.setResolutionNotes("Approved " + selected.getLabel() + " as published version " + finalSaved.getVersionLabel());
        disruptionRepository.save(disruption);

        auditService.logAction("APPROVE_RESCHEDULE", "ScheduleVersion", finalSaved.getId(), null,
                "Approved alternative " + alternativeId + " for disruption " + disruptionId);

        notificationService.broadcastNotification(
                "RESCHEDULE_PUBLISHED",
                "Dynamic Reschedule Published: " + finalSaved.getVersionLabel(),
                "New active schedule deployed resolving disruption #" + disruptionId,
                finalSaved.getId(),
                "ScheduleVersion"
        );

        return scheduleService.toResponse(finalSaved, null);
    }

    @Transactional(readOnly = true)
    public Page<DisruptionResponse> getDisruptions(Pageable pageable) {
        org.springframework.data.domain.Pageable sorted = pageable.getSort().isSorted() ? pageable
                : org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
        return disruptionRepository.findAll(sorted).map(this::toResponse);
    }

    private DisruptionResponse toResponse(Disruption d) {
        return DisruptionResponse.builder()
                .id(d.getId())
                .disruptionType(d.getDisruptionType())
                .description(d.getDescription())
                .occurredAt(d.getOccurredAt())
                .reportedAt(d.getReportedAt())
                .reportedById(d.getReportedBy() != null ? d.getReportedBy().getId() : null)
                .reportedByName(d.getReportedBy() != null ? d.getReportedBy().getFullName() : null)
                .affectedRoomId(d.getAffectedRoom() != null ? d.getAffectedRoom().getId() : null)
                .affectedRoomName(d.getAffectedRoom() != null ? d.getAffectedRoom().getName() : null)
                .affectedStaffId(d.getAffectedStaff() != null ? d.getAffectedStaff().getId() : null)
                .affectedStaffName(d.getAffectedStaff() != null ? d.getAffectedStaff().getFullName() : null)
                .affectedEquipmentId(d.getAffectedEquipment() != null ? d.getAffectedEquipment().getId() : null)
                .affectedEquipmentName(d.getAffectedEquipment() != null ? d.getAffectedEquipment().getName() : null)
                .affectedScheduleVersionId(d.getAffectedScheduleVersion() != null ? d.getAffectedScheduleVersion().getId() : null)
                .affectedSurgeryId(d.getAffectedSurgery() != null ? d.getAffectedSurgery().getId() : null)
                .affectedSurgeryCode(d.getAffectedSurgery() != null ? d.getAffectedSurgery().getSurgeryCode() : null)
                .status(d.getStatus())
                .resolutionNotes(d.getResolutionNotes())
                .resolvedAt(d.getResolvedAt())
                .build();
    }
}
