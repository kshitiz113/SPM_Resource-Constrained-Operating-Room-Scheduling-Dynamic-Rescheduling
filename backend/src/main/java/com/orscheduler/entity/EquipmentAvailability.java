package com.orscheduler.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_availability")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EquipmentAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(name = "unavailable_from", nullable = false)
    private LocalDateTime unavailableFrom;

    @Column(name = "unavailable_to", nullable = false)
    private LocalDateTime unavailableTo;

    @Column(length = 200)
    private String reason;
}
