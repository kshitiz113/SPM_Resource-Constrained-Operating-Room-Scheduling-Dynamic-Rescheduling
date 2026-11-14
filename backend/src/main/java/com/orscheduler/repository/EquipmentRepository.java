package com.orscheduler.repository;

import com.orscheduler.entity.Equipment;
import com.orscheduler.enums.EquipmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    Optional<Equipment> findBySerialNumber(String serialNumber);
    boolean existsBySerialNumber(String serialNumber);
    List<Equipment> findByStatus(EquipmentStatus status);
    Page<Equipment> findByStatus(EquipmentStatus status, Pageable pageable);
    Page<Equipment> findByEquipmentTypeIgnoreCase(String type, Pageable pageable);
    Page<Equipment> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT e FROM Equipment e WHERE " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:type IS NULL OR e.equipmentType = :type) AND " +
           "(:search IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Equipment> findWithFilters(
            @Param("status") EquipmentStatus status,
            @Param("type") String type,
            @Param("search") String search,
            Pageable pageable);
}
