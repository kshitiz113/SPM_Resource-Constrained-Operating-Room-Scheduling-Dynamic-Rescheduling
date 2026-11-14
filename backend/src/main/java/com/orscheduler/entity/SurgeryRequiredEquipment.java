package com.orscheduler.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "surgery_required_equipment")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SurgeryRequiredEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surgery_request_id", nullable = false)
    private SurgeryRequest surgeryRequest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @Column(name = "is_mandatory", nullable = false)
    @Builder.Default
    private boolean isMandatory = true;
}
