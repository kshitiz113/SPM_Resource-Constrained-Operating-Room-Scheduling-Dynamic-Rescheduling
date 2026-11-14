package com.orscheduler.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_equipment", uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "equipment_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RoomEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private OperatingRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(name = "is_permanent", nullable = false)
    @Builder.Default
    private Boolean isPermanent = false;
}
