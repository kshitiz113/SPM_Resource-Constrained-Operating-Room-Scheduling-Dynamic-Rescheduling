package com.orscheduler.repository;

import com.orscheduler.entity.RoomOperatingHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoomOperatingHoursRepository extends JpaRepository<RoomOperatingHours, Long> {
    List<RoomOperatingHours> findByRoomId(Long roomId);
    List<RoomOperatingHours> findByRoomIdAndDayOfWeek(Long roomId, Integer dayOfWeek);
    void deleteByRoomId(Long roomId);
}
