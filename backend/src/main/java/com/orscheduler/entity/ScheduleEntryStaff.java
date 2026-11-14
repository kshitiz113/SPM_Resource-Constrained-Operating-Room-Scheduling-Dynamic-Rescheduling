package com.orscheduler.entity;

import com.orscheduler.enums.StaffType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "schedule_entry_staff")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ScheduleEntryStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_entry_id", nullable = false)
    private ScheduleEntry scheduleEntry;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Enumerated(EnumType.STRING)
    @Column(name = "assigned_role", nullable = false, length = 30)
    private StaffType assignedRole;
}
