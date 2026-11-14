package com.orscheduler.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "staff_qualifications",
       uniqueConstraints = @UniqueConstraint(columnNames = {"staff_id", "qualification_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StaffQualification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "qualification_id", nullable = false)
    private Qualification qualification;

    @Column(name = "certified_date")
    private LocalDate certifiedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;
}
