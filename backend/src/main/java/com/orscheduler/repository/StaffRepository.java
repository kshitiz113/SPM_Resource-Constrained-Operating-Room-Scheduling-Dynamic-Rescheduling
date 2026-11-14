package com.orscheduler.repository;

import com.orscheduler.entity.Staff;
import com.orscheduler.enums.StaffType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByEmployeeId(String employeeId);
    boolean existsByEmployeeId(String employeeId);
    List<Staff> findByStaffTypeAndActiveTrue(StaffType staffType);
    Page<Staff> findByStaffTypeAndActiveTrue(StaffType staffType, Pageable pageable);
    Page<Staff> findByActiveTrue(Pageable pageable);
    Page<Staff> findByFullNameContainingIgnoreCase(String name, Pageable pageable);
    List<Staff> findByActiveTrueOrderByFullNameAsc();

    @Query("SELECT s FROM Staff s WHERE s.active = true AND " +
           "(:staffType IS NULL OR s.staffType = :staffType) AND " +
           "(:search IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Staff> findWithFilters(
            @Param("staffType") StaffType staffType,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT DISTINCT s FROM Staff s JOIN s.qualifications sq " +
           "WHERE sq.qualification.id = :qualificationId AND s.active = true AND s.staffType = :staffType")
    List<Staff> findByQualificationAndType(
            @Param("qualificationId") Long qualificationId,
            @Param("staffType") StaffType staffType);
}
