package com.orscheduler.repository;

import com.orscheduler.entity.OperatingRoom;
import com.orscheduler.enums.RoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperatingRoomRepository extends JpaRepository<OperatingRoom, Long> {
    Optional<OperatingRoom> findByName(String name);
    boolean existsByName(String name);
    List<OperatingRoom> findByStatus(RoomStatus status);
    List<OperatingRoom> findByStatusOrderByNameAsc(RoomStatus status);
    Page<OperatingRoom> findByStatus(RoomStatus status, Pageable pageable);
    Page<OperatingRoom> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT r FROM OperatingRoom r WHERE r.status = :status AND " +
           "(:roomType IS NULL OR r.roomType = :roomType)")
    Page<OperatingRoom> findByStatusAndOptionalType(
            @Param("status") RoomStatus status,
            @Param("roomType") String roomType,
            Pageable pageable);
}
