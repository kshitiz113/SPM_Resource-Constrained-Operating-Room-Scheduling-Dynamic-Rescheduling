package com.orscheduler.entity;

import com.orscheduler.enums.Priority;
import com.orscheduler.enums.SurgeryStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "surgery_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SurgeryRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "surgery_code", nullable = false, unique = true, length = 30)
    private String surgeryCode;

    @Column(name = "procedure_name", nullable = false, length = 200)
    private String procedureName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Priority priority = Priority.ELECTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SurgeryStatus status = SurgeryStatus.REQUESTED;

    @Column(name = "estimated_duration_minutes", nullable = false)
    private Integer estimatedDurationMinutes;

    @Column(name = "preparation_time_minutes", nullable = false)
    @Builder.Default
    private Integer preparationTimeMinutes = 15;

    @Column(name = "cleaning_time_minutes", nullable = false)
    @Builder.Default
    private Integer cleaningTimeMinutes = 20;

    @Column(name = "earliest_start")
    private LocalDateTime earliestStart;

    @Column(name = "scheduling_deadline")
    private LocalDateTime schedulingDeadline;

    @Column(name = "requested_at", nullable = false)
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_room_id")
    private OperatingRoom preferredRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_surgeon_id")
    private Staff preferredSurgeon;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "surgeryRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SurgeryRequiredStaff> requiredStaff = new ArrayList<>();

    @OneToMany(mappedBy = "surgeryRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SurgeryRequiredEquipment> requiredEquipment = new ArrayList<>();

    @OneToMany(mappedBy = "surgeryRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SurgeryRequiredQualification> requiredQualifications = new ArrayList<>();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
