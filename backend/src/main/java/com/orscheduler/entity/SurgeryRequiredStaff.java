package com.orscheduler.entity;

import com.orscheduler.enums.StaffType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "surgery_required_staff")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SurgeryRequiredStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surgery_request_id", nullable = false)
    private SurgeryRequest surgeryRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "staff_role", nullable = false, length = 30)
    private StaffType staffRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "specific_staff_id")
    private Staff specificStaff;

    @Column(name = "is_mandatory", nullable = false)
    @Builder.Default
    private boolean isMandatory = true;
}
