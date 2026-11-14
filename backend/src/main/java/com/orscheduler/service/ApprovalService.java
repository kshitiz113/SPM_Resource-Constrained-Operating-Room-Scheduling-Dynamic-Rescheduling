package com.orscheduler.service;

import com.orscheduler.dto.response.ScheduleResponse;
import com.orscheduler.entity.ScheduleVersion;
import com.orscheduler.entity.User;
import com.orscheduler.enums.ScheduleStatus;
import com.orscheduler.exception.ConflictException;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.repository.ScheduleVersionRepository;
import com.orscheduler.repository.UserRepository;
import com.orscheduler.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovalService {

    private final ScheduleVersionRepository scheduleVersionRepository;
    private final UserRepository userRepository;
    private final ScheduleService scheduleService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Transactional
    public ScheduleResponse approveSchedule(Long scheduleVersionId) {
        ScheduleVersion version = scheduleVersionRepository.findById(scheduleVersionId)
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleVersion", scheduleVersionId));

        if (version.getStatus() != ScheduleStatus.PROPOSED && version.getStatus() != ScheduleStatus.DRAFT) {
            throw new ConflictException("Cannot approve schedule with status " + version.getStatus());
        }

        String username = SecurityUtils.getCurrentUsername().orElse("SYSTEM");
        User currentUser = userRepository.findByUsername(username).orElse(null);

        version.setStatus(ScheduleStatus.APPROVED);
        version.setApprovedBy(currentUser);
        version.setApprovedAt(LocalDateTime.now());

        ScheduleVersion saved = scheduleVersionRepository.save(version);
        auditService.logAction("APPROVE_SCHEDULE", "ScheduleVersion", saved.getId(), "PROPOSED", "APPROVED");

        notificationService.broadcastNotification(
                "SCHEDULE_APPROVED",
                "Schedule Approved: " + saved.getVersionLabel(),
                "Schedule for " + saved.getScheduleDate() + " has been approved by " + (currentUser != null ? currentUser.getFullName() : "Manager"),
                saved.getId(),
                "ScheduleVersion"
        );

        return scheduleService.toResponse(saved, null);
    }

    @Transactional
    public ScheduleResponse rejectSchedule(Long scheduleVersionId, String rejectionReason) {
        ScheduleVersion version = scheduleVersionRepository.findById(scheduleVersionId)
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleVersion", scheduleVersionId));

        if (version.getStatus() == ScheduleStatus.PUBLISHED) {
            throw new ConflictException("Cannot reject an already published schedule");
        }

        if (version.getStatus() == ScheduleStatus.REJECTED || version.getStatus() == ScheduleStatus.SUPERSEDED) {
            throw new ConflictException("Cannot reject a schedule with status " + version.getStatus());
        }

        // Return the surgeries of this proposal to the intake queue
        if (version.getEntries() != null) {
            for (var entry : version.getEntries()) {
                var req = entry.getSurgeryRequest();
                if (req != null && req.getStatus() == com.orscheduler.enums.SurgeryStatus.SCHEDULED) {
                    req.setStatus(com.orscheduler.enums.SurgeryStatus.REQUESTED);
                }
            }
        }

        ScheduleStatus oldStatus = version.getStatus();
        version.setStatus(ScheduleStatus.REJECTED);
        version.setGenerationNotes((version.getGenerationNotes() != null ? version.getGenerationNotes() + " | " : "") + "Rejection: " + rejectionReason);

        ScheduleVersion saved = scheduleVersionRepository.save(version);
        auditService.logAction("REJECT_SCHEDULE", "ScheduleVersion", saved.getId(), oldStatus.name(), "REJECTED: " + rejectionReason);

        notificationService.broadcastNotification(
                "SCHEDULE_REJECTED",
                "Schedule Rejected: " + saved.getVersionLabel(),
                "Reason: " + rejectionReason,
                saved.getId(),
                "ScheduleVersion"
        );

        return scheduleService.toResponse(saved, null);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ScheduleResponse publishSchedule(Long scheduleVersionId) {
        ScheduleVersion version = scheduleVersionRepository.findById(scheduleVersionId)
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleVersion", scheduleVersionId));

        if (version.getStatus() != ScheduleStatus.APPROVED && version.getStatus() != ScheduleStatus.PROPOSED) {
            throw new ConflictException("Schedule must be APPROVED or PROPOSED to be published. Current: " + version.getStatus());
        }

        var validation = scheduleService.validateScheduleById(scheduleVersionId);
        if (validation.getViolations() != null && validation.getViolations().stream()
                .anyMatch(v -> "HARD".equalsIgnoreCase(v.getSeverity()))) {
            throw new ConflictException("Schedule has hard constraint violations and cannot be published: "
                    + validation.getViolations().get(0).getMessage());
        }

        String username = SecurityUtils.getCurrentUsername().orElse("SYSTEM");
        User currentUser = userRepository.findByUsername(username).orElse(null);

        // Find existing published schedule for the same date and supersede it
        Optional<ScheduleVersion> activePublished = scheduleVersionRepository.findActiveScheduleForDate(version.getScheduleDate());
        if (activePublished.isPresent() && !activePublished.get().getId().equals(version.getId())) {
            ScheduleVersion previous = activePublished.get();
            previous.setStatus(ScheduleStatus.SUPERSEDED);
            scheduleVersionRepository.save(previous);
            auditService.logAction("SUPERSEDE_SCHEDULE", "ScheduleVersion", previous.getId(), "PUBLISHED", "SUPERSEDED by " + version.getVersionLabel());
        }

        version.setStatus(ScheduleStatus.PUBLISHED);
        version.setPublishedAt(LocalDateTime.now());
        if (version.getApprovedAt() == null) {
            version.setApprovedAt(LocalDateTime.now());
            version.setApprovedBy(currentUser);
        }

        ScheduleVersion saved = scheduleVersionRepository.save(version);
        auditService.logAction("PUBLISH_SCHEDULE", "ScheduleVersion", saved.getId(), "APPROVED", "PUBLISHED");

        notificationService.broadcastNotification(
                "SCHEDULE_PUBLISHED",
                "Operating Room Schedule Published: " + saved.getScheduleDate(),
                "Official schedule " + saved.getVersionLabel() + " is now active.",
                saved.getId(),
                "ScheduleVersion"
        );

        return scheduleService.toResponse(saved, null);
    }
}
