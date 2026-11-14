package com.orscheduler.repository;

import com.orscheduler.entity.SurgeryRequest;
import com.orscheduler.enums.Priority;
import com.orscheduler.enums.SurgeryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SurgeryRequestRepository extends JpaRepository<SurgeryRequest, Long> {
    Optional<SurgeryRequest> findBySurgeryCode(String surgeryCode);
    boolean existsBySurgeryCode(String surgeryCode);
    List<SurgeryRequest> findByStatus(SurgeryStatus status);
    Page<SurgeryRequest> findByStatus(SurgeryStatus status, Pageable pageable);
    List<SurgeryRequest> findByStatusIn(List<SurgeryStatus> statuses);
    Page<SurgeryRequest> findByStatusAndPriority(SurgeryStatus status, Priority priority, Pageable pageable);
    Page<SurgeryRequest> findByPriority(Priority priority, Pageable pageable);
    Page<SurgeryRequest> findByProcedureNameContainingIgnoreCase(String name, Pageable pageable);
    Optional<SurgeryRequest> findTopByPriorityAndStatusOrderByRequestedAtDesc(Priority priority, SurgeryStatus status);

    @Query("SELECT sr FROM SurgeryRequest sr WHERE " +
           "(:status IS NULL OR sr.status = :status) AND " +
           "(:priority IS NULL OR sr.priority = :priority) AND " +
           "(:search IS NULL OR LOWER(sr.procedureName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<SurgeryRequest> findWithFilters(
            @Param("status") SurgeryStatus status,
            @Param("priority") Priority priority,
            @Param("search") String search,
            Pageable pageable);

    List<SurgeryRequest> findByIdIn(List<Long> ids);
}
