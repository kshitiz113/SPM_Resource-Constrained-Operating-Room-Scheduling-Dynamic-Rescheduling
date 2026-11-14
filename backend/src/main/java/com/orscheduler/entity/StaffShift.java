package com.orscheduler.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "staff_shifts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StaffShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "is_recurring", nullable = false)
    @Builder.Default
    private Boolean isRecurring = true;

    @Column(name = "is_leave", nullable = false)
    @Builder.Default
    private Boolean isLeave = false;

    @Column(name = "leave_reason", length = 200)
    private String leaveReason;

    public boolean isRecurring() {
        return Boolean.TRUE.equals(this.isRecurring);
    }

    public boolean isLeave() {
        return Boolean.TRUE.equals(this.isLeave);
    }
}
