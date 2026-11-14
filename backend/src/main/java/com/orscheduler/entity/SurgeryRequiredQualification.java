package com.orscheduler.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "surgery_required_qualifications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SurgeryRequiredQualification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surgery_request_id", nullable = false)
    private SurgeryRequest surgeryRequest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "qualification_id", nullable = false)
    private Qualification qualification;
}
