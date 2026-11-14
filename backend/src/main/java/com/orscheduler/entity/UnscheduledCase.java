package com.orscheduler.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "unscheduled_cases")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UnscheduledCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_version_id", nullable = false)
    private ScheduleVersion scheduleVersion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "surgery_request_id", nullable = false)
    private SurgeryRequest surgeryRequest;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;
}
