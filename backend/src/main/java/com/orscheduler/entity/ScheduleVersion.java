package com.orscheduler.entity;

import com.orscheduler.enums.ScheduleStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schedule_versions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ScheduleVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "version_label", nullable = false, unique = true, length = 50)
    private String versionLabel;

    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ScheduleStatus status = ScheduleStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_version_id")
    private ScheduleVersion parentVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disruption_id")
    private Disruption disruption;

    @Column(name = "version_number", nullable = false)
    @Builder.Default
    private Integer versionNumber = 1;

    @Column(name = "total_score", precision = 10, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "generation_notes", columnDefinition = "TEXT")
    private String generationNotes;

    @OneToMany(mappedBy = "scheduleVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ScheduleEntry> entries = new ArrayList<>();

    @OneToMany(mappedBy = "scheduleVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UnscheduledCase> unscheduledCases = new ArrayList<>();
}
