package com.orscheduler.entity;

import com.orscheduler.enums.EntryStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schedule_entries")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ScheduleEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_version_id", nullable = false)
    private ScheduleVersion scheduleVersion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "surgery_request_id", nullable = false)
    private SurgeryRequest surgeryRequest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "operating_room_id", nullable = false)
    private OperatingRoom operatingRoom;

    @Column(name = "planned_start", nullable = false)
    private LocalDateTime plannedStart;

    @Column(name = "planned_end", nullable = false)
    private LocalDateTime plannedEnd;

    @Column(name = "prep_start", nullable = false)
    private LocalDateTime prepStart;

    @Column(name = "cleanup_end", nullable = false)
    private LocalDateTime cleanupEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_status", nullable = false, length = 20)
    @Builder.Default
    private EntryStatus entryStatus = EntryStatus.SCHEDULED;

    @Column(name = "is_locked", nullable = false)
    @Builder.Default
    private Boolean isLocked = false;

    @Column(name = "actual_start")
    private LocalDateTime actualStart;

    @Column(name = "actual_end")
    private LocalDateTime actualEnd;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "scheduleEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ScheduleEntryStaff> assignedStaff = new ArrayList<>();

    @OneToMany(mappedBy = "scheduleEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ScheduleEntryEquipment> assignedEquipment = new ArrayList<>();

    public boolean isLocked() {
        return Boolean.TRUE.equals(isLocked);
    }
}
