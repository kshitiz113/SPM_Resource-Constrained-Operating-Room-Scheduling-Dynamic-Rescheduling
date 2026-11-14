package com.orscheduler.entity;

import com.orscheduler.enums.DisruptionType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "disruptions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Disruption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "disruption_type", nullable = false, length = 30)
    private DisruptionType disruptionType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "reported_at", nullable = false)
    @Builder.Default
    private LocalDateTime reportedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by")
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affected_room_id")
    private OperatingRoom affectedRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affected_staff_id")
    private Staff affectedStaff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affected_equipment_id")
    private Equipment affectedEquipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affected_schedule_version_id")
    private ScheduleVersion affectedScheduleVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affected_surgery_id")
    private SurgeryRequest affectedSurgery;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "REGISTERED";

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
