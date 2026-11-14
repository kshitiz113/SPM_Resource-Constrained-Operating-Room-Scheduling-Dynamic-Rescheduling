package com.orscheduler.entity;

import com.orscheduler.enums.QualificationCategory;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "qualifications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Qualification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private QualificationCategory category;

    @Column(columnDefinition = "TEXT")
    private String description;
}
