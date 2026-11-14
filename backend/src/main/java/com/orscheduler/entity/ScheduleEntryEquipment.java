package com.orscheduler.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "schedule_entry_equipment")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ScheduleEntryEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_entry_id", nullable = false)
    private ScheduleEntry scheduleEntry;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;
}
