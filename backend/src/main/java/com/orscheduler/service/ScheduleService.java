package com.orscheduler.service;

import com.orscheduler.dto.request.ScheduleGenerationRequest;
import com.orscheduler.dto.response.ScheduleResponse;
import com.orscheduler.dto.response.ValidationResult;
import com.orscheduler.entity.*;
import com.orscheduler.enums.*;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.exception.SchedulingException;
import com.orscheduler.repository.*;
import com.orscheduler.scheduling.ScheduleValidator;
import com.orscheduler.scheduling.SchedulingEngine;
import com.orscheduler.scheduling.model.ObjectiveWeights;
import com.orscheduler.scheduling.model.SchedulingInput;
import com.orscheduler.scheduling.model.SchedulingOutput;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleService {

    private final ScheduleVersionRepository scheduleVersionRepository;
    private final ScheduleEntryRepository scheduleEntryRepository;
    private final SurgeryRequestRepository surgeryRequestRepository;
    private final OperatingRoomRepository roomRepository;
    private final StaffRepository staffRepository;
    private final EquipmentRepository equipmentRepository;
    private final RoomOperatingHoursRepository hoursRepository;
    private final StaffShiftRepository shiftRepository;
    private final EquipmentAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;
    private final SchedulingEngine schedulingEngine;
    private final ScheduleValidator scheduleValidator;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public ScheduleResponse generateSchedule(ScheduleGenerationRequest request) {
        LocalDate date = request.getScheduleDate();
        log.info("Generating schedule for date: {}", date);

        List<OperatingRoom> rooms = roomRepository.findByStatusOrderByNameAsc(RoomStatus.ACTIVE);
        List<Staff> staff = staffRepository.findByActiveTrueOrderByFullNameAsc();
        List<Equipment> equipment = equipmentRepository.findByStatus(EquipmentStatus.AVAILABLE);
        List<RoomOperatingHours> hours = hoursRepository.findAll();
        List<StaffShift> shifts = shiftRepository.findActiveShiftsForDate(date.getDayOfWeek().getValue(), date);
        List<EquipmentAvailability> availabilities = availabilityRepository.findByUnavailableToGreaterThanEqual(date);

        // Fetch candidate surgery requests
        List<SurgeryRequest> surgeryRequests;
        if (request.getSurgeryRequestIds() != null && !request.getSurgeryRequestIds().isEmpty()) {
            surgeryRequests = surgeryRequestRepository.findAllById(request.getSurgeryRequestIds()).stream()
                    .filter(r -> r.getStatus() == SurgeryStatus.REQUESTED || r.getStatus() == SurgeryStatus.DEFERRED
                            || r.getStatus() == SurgeryStatus.SCHEDULED)
                    .collect(Collectors.toList());
        } else {
            surgeryRequests = surgeryRequestRepository.findByStatusIn(List.of(SurgeryStatus.REQUESTED, SurgeryStatus.DEFERRED));
        }

        if (surgeryRequests.isEmpty()) {
            throw new SchedulingException("There are no pending surgery requests to schedule");
        }

        // Configure objective weights
        ScheduleGenerationRequest.ObjectiveWeightsDto wDto = request.getObjectiveWeights() != null
                ? request.getObjectiveWeights()
                : new ScheduleGenerationRequest.ObjectiveWeightsDto();
        ObjectiveWeights weights = ObjectiveWeights.builder()
                .waitingTimePenalty(wDto.getWaitingTimePenalty())
                .idleTimePenalty(wDto.getIdleTimePenalty())
                .overtimePenalty(wDto.getOvertimePenalty())
                .deferralPenalty(wDto.getDeferralPenalty())
                .utilizationWeight(wDto.getUtilizationWeight())
                .build();

        SchedulingInput input = SchedulingInput.builder()
                .scheduleDate(date)
                .surgeryRequests(surgeryRequests)
                .rooms(rooms)
                .staffMembers(staff)
                .equipmentList(equipment)
                .roomHours(hours)
                .staffShifts(shifts)
                .equipmentAvailabilities(availabilities)
                .objectiveWeights(weights)
                .build();

        SchedulingOutput output = schedulingEngine.generateSchedule(input);

        // Create new ScheduleVersion
        String username = SecurityUtils.getCurrentUsername().orElse("SYSTEM");
        User currentUser = userRepository.findByUsername(username).orElse(null);

        int nextVersionNumber = scheduleVersionRepository.findMaxVersionNumberForDate(date).orElse(0) + 1;
        String versionLabel = "SCH-" + date + "-v" + nextVersionNumber;

        ScheduleVersion version = ScheduleVersion.builder()
                .versionLabel(versionLabel)
                .scheduleDate(date)
                .status(ScheduleStatus.PROPOSED)
                .createdBy(currentUser)
                .createdAt(LocalDateTime.now())
                .versionNumber(nextVersionNumber)
                .totalScore(BigDecimal.valueOf(output.getTotalScore()))
                .generationNotes("Generated deterministic schedule with " + output.getScheduledEntries().size()
                        + " surgeries and " + output.getUnscheduledCases().size() + " unscheduled.")
                .entries(new ArrayList<>())
                .unscheduledCases(new ArrayList<>())
                .build();

        ScheduleVersion savedVersion = scheduleVersionRepository.save(version);

        // Save entries
        for (ScheduleEntry se : output.getScheduledEntries()) {
            se.setScheduleVersion(savedVersion);
            // Link back child entities
            if (se.getAssignedStaff() != null) {
                for (ScheduleEntryStaff ses : se.getAssignedStaff()) {
                    ses.setScheduleEntry(se);
                }
            }
            if (se.getAssignedEquipment() != null) {
                for (ScheduleEntryEquipment see : se.getAssignedEquipment()) {
                    see.setScheduleEntry(se);
                }
            }
            savedVersion.getEntries().add(se);

            // Update surgery request status to SCHEDULED
            SurgeryRequest req = se.getSurgeryRequest();
            req.setStatus(SurgeryStatus.SCHEDULED);
            surgeryRequestRepository.save(req);
        }

        // Save unscheduled cases
        for (SchedulingOutput.UnscheduledRecord ur : output.getUnscheduledCases()) {
            UnscheduledCase uc = UnscheduledCase.builder()
                    .scheduleVersion(savedVersion)
                    .surgeryRequest(ur.getSurgeryRequest())
                    .reason(ur.getReason())
                    .build();
            savedVersion.getUnscheduledCases().add(uc);
        }

        ScheduleVersion persisted = scheduleVersionRepository.save(savedVersion);
        auditService.logAction("GENERATE_SCHEDULE", "ScheduleVersion", persisted.getId(), null, persisted.getVersionLabel());

        notificationService.broadcastNotification(
                "SCHEDULE_PROPOSED",
                "New Schedule Proposed: " + persisted.getVersionLabel(),
                "A new schedule has been generated for " + date + " awaiting OR Manager review.",
                persisted.getId(),
                "ScheduleVersion"
        );

        return toResponse(persisted, output);
    }

    @Transactional(readOnly = true)
    public Page<ScheduleResponse.ScheduleVersionDto> getScheduleVersions(LocalDate date, ScheduleStatus status, Pageable pageable) {
        Page<ScheduleVersion> page;
        if (date != null && status != null) {
            page = scheduleVersionRepository.findByScheduleDateAndStatus(date, status, pageable);
        } else if (date != null) {
            page = scheduleVersionRepository.findByScheduleDateOrderByVersionNumberDesc(date, pageable);
        } else {
            page = scheduleVersionRepository.findAll(pageable);
        }
        return page.map(v -> toVersionDto(v, true));
    }

    @Transactional(readOnly = true)
    public ScheduleResponse getScheduleById(Long id) {
        ScheduleVersion v = scheduleVersionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleVersion", id));
        return toResponse(v, null);
    }

    @Transactional(readOnly = true)
    public Optional<ScheduleResponse> getActiveSchedule(LocalDate date) {
        return scheduleVersionRepository.findActiveScheduleForDate(date)
                .map(v -> toResponse(v, null));
    }

    @Transactional(readOnly = true)
    public ValidationResult validateScheduleById(Long id) {
        ScheduleVersion v = scheduleVersionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleVersion", id));

        List<OperatingRoom> rooms = roomRepository.findAll();
        List<RoomOperatingHours> hours = hoursRepository.findAll();
        List<StaffShift> shifts = shiftRepository.findActiveShiftsForDate(v.getScheduleDate().getDayOfWeek().getValue(), v.getScheduleDate());
        List<EquipmentAvailability> availabilities = availabilityRepository.findByUnavailableToGreaterThanEqual(v.getScheduleDate());

        return scheduleValidator.validateSchedule(v.getEntries(), rooms, hours, shifts, availabilities);
    }

    public ScheduleResponse toResponse(ScheduleVersion v, SchedulingOutput output) {
        ValidationResult valResult = (output != null) ?
                ValidationResult.builder()
                        .valid(output.isValid())
                        .warnings(output.getWarnings())
                        .build() :
                validateScheduleById(v.getId());

        List<ScheduleResponse.UnscheduledCaseDto> unscheduled = v.getUnscheduledCases() != null ?
                v.getUnscheduledCases().stream().map(uc -> ScheduleResponse.UnscheduledCaseDto.builder()
                        .id(uc.getId())
                        .surgeryRequestId(uc.getSurgeryRequest().getId())
                        .surgeryCode(uc.getSurgeryRequest().getSurgeryCode())
                        .procedureName(uc.getSurgeryRequest().getProcedureName())
                        .priority(uc.getSurgeryRequest().getPriority())
                        .reason(uc.getReason())
                        .build()).collect(Collectors.toList()) :
                List.of();

        ScheduleResponse.ScheduleMetricsDto metrics = calculateMetrics(v);

        return ScheduleResponse.builder()
                .scheduleVersion(toVersionDto(v, true))
                .unscheduledCases(unscheduled)
                .validationResult(valResult)
                .metrics(metrics)
                .build();
    }

    public ScheduleResponse.ScheduleVersionDto toVersionDto(ScheduleVersion v, boolean includeEntries) {
        List<ScheduleResponse.ScheduleEntryDto> entryDtos = new ArrayList<>();
        if (includeEntries && v.getEntries() != null) {
            for (ScheduleEntry e : v.getEntries()) {
                entryDtos.add(toEntryDto(e));
            }
        }

        return ScheduleResponse.ScheduleVersionDto.builder()
                .id(v.getId())
                .versionLabel(v.getVersionLabel())
                .scheduleDate(v.getScheduleDate())
                .status(v.getStatus())
                .createdById(v.getCreatedBy() != null ? v.getCreatedBy().getId() : null)
                .createdByName(v.getCreatedBy() != null ? v.getCreatedBy().getFullName() : null)
                .approvedById(v.getApprovedBy() != null ? v.getApprovedBy().getId() : null)
                .approvedByName(v.getApprovedBy() != null ? v.getApprovedBy().getFullName() : null)
                .createdAt(v.getCreatedAt())
                .approvedAt(v.getApprovedAt())
                .publishedAt(v.getPublishedAt())
                .parentVersionId(v.getParentVersion() != null ? v.getParentVersion().getId() : null)
                .disruptionId(v.getDisruption() != null ? v.getDisruption().getId() : null)
                .versionNumber(v.getVersionNumber())
                .totalScore(v.getTotalScore())
                .generationNotes(v.getGenerationNotes())
                .entries(entryDtos)
                .build();
    }

    public ScheduleResponse.ScheduleEntryDto toEntryDto(ScheduleEntry e) {
        List<ScheduleResponse.AssignedStaffDto> staff = e.getAssignedStaff() != null ?
                e.getAssignedStaff().stream().map(s -> ScheduleResponse.AssignedStaffDto.builder()
                        .id(s.getId())
                        .staffId(s.getStaff().getId())
                        .staffName(s.getStaff().getFullName())
                        .staffRole(s.getAssignedRole())
                        .build()).collect(Collectors.toList()) :
                List.of();

        List<ScheduleResponse.AssignedEquipmentDto> eq = e.getAssignedEquipment() != null ?
                e.getAssignedEquipment().stream().map(q -> ScheduleResponse.AssignedEquipmentDto.builder()
                        .id(q.getId())
                        .equipmentId(q.getEquipment().getId())
                        .equipmentName(q.getEquipment().getName())
                        .equipmentType(q.getEquipment().getEquipmentType())
                        .build()).collect(Collectors.toList()) :
                List.of();

        return ScheduleResponse.ScheduleEntryDto.builder()
                .id(e.getId())
                .scheduleVersionId(e.getScheduleVersion() != null ? e.getScheduleVersion().getId() : null)
                .surgeryRequestId(e.getSurgeryRequest() != null ? e.getSurgeryRequest().getId() : null)
                .surgeryCode(e.getSurgeryRequest() != null ? e.getSurgeryRequest().getSurgeryCode() : "")
                .procedureName(e.getSurgeryRequest() != null ? e.getSurgeryRequest().getProcedureName() : "")
                .priority(e.getSurgeryRequest() != null ? e.getSurgeryRequest().getPriority() : Priority.ELECTIVE)
                .operatingRoomId(e.getOperatingRoom() != null ? e.getOperatingRoom().getId() : null)
                .operatingRoomName(e.getOperatingRoom() != null ? e.getOperatingRoom().getName() : "")
                .prepStart(e.getPrepStart())
                .plannedStart(e.getPlannedStart())
                .plannedEnd(e.getPlannedEnd())
                .cleanupEnd(e.getCleanupEnd())
                .entryStatus(e.getEntryStatus())
                .locked(e.isLocked())
                .actualStart(e.getActualStart())
                .actualEnd(e.getActualEnd())
                .notes(e.getNotes())
                .assignedStaff(staff)
                .assignedEquipment(eq)
                .build();
    }

    private ScheduleResponse.ScheduleMetricsDto calculateMetrics(ScheduleVersion v) {
        int scheduled = v.getEntries() != null ? v.getEntries().size() : 0;
        int unscheduled = v.getUnscheduledCases() != null ? v.getUnscheduledCases().size() : 0;

        Map<String, Double> roomUtil = new HashMap<>();
        double avgWaitingHours = 0.0;
        long totalIdleMinutes = 0;
        long totalOvertimeMinutes = 0;

        if (v.getEntries() != null && !v.getEntries().isEmpty()) {
            // Room utilization
            Map<String, Long> roomMinutes = v.getEntries().stream()
                    .filter(e -> e.getOperatingRoom() != null)
                    .collect(Collectors.groupingBy(
                            e -> e.getOperatingRoom().getName(),
                            Collectors.summingLong(e -> java.time.Duration.between(e.getPrepStart(), e.getCleanupEnd()).toMinutes())
                    ));

            for (Map.Entry<String, Long> entry : roomMinutes.entrySet()) {
                roomUtil.put(entry.getKey(), Math.round((entry.getValue() / (12.0 * 60.0)) * 100.0) / 100.0);
            }

            // Average waiting hours (from requestedAt or scheduleDate start to plannedStart)
            double totalWaitingHours = 0.0;
            int countWithWait = 0;
            for (ScheduleEntry e : v.getEntries()) {
                if (e.getPlannedStart() != null) {
                    LocalDateTime baseline = (e.getSurgeryRequest() != null && e.getSurgeryRequest().getRequestedAt() != null)
                            ? e.getSurgeryRequest().getRequestedAt()
                            : v.getScheduleDate().atTime(7, 0);
                    if (e.getPlannedStart().isAfter(baseline)) {
                        totalWaitingHours += java.time.Duration.between(baseline, e.getPlannedStart()).toMinutes() / 60.0;
                    }
                    countWithWait++;
                }
            }
            if (countWithWait > 0) {
                avgWaitingHours = Math.round((totalWaitingHours / countWithWait) * 10.0) / 10.0;
            }

            // Room idle minutes between consecutive cases
            Map<Long, List<ScheduleEntry>> byRoom = v.getEntries().stream()
                    .filter(e -> e.getOperatingRoom() != null && e.getPrepStart() != null && e.getCleanupEnd() != null)
                    .collect(Collectors.groupingBy(e -> e.getOperatingRoom().getId()));

            for (List<ScheduleEntry> roomList : byRoom.values()) {
                roomList.sort(Comparator.comparing(ScheduleEntry::getPrepStart));
                for (int i = 0; i < roomList.size() - 1; i++) {
                    ScheduleEntry curr = roomList.get(i);
                    ScheduleEntry next = roomList.get(i + 1);
                    if (next.getPrepStart().isAfter(curr.getCleanupEnd())) {
                        totalIdleMinutes += java.time.Duration.between(curr.getCleanupEnd(), next.getPrepStart()).toMinutes();
                    }
                }
                // Check room overtime beyond 19:00
                if (!roomList.isEmpty()) {
                    ScheduleEntry last = roomList.get(roomList.size() - 1);
                    LocalDateTime dayEnd = v.getScheduleDate().atTime(19, 0);
                    if (last.getCleanupEnd().isAfter(dayEnd)) {
                        totalOvertimeMinutes += java.time.Duration.between(dayEnd, last.getCleanupEnd()).toMinutes();
                    }
                }
            }
        }

        double overallUtil = 0.0;
        if (!roomUtil.isEmpty()) {
            double sumUtil = roomUtil.values().stream().mapToDouble(Double::doubleValue).sum();
            overallUtil = Math.round((sumUtil / roomUtil.size()) * 100.0) / 100.0;
        }

        return ScheduleResponse.ScheduleMetricsDto.builder()
                .totalSurgeries(scheduled + unscheduled)
                .scheduledCount(scheduled)
                .unscheduledCount(unscheduled)
                .avgWaitingHours(avgWaitingHours)
                .totalIdleMinutes((int) totalIdleMinutes)
                .totalOvertimeMinutes((int) totalOvertimeMinutes)
                .roomUtilization(roomUtil)
                .overallUtilization(overallUtil)
                .build();
    }
}
