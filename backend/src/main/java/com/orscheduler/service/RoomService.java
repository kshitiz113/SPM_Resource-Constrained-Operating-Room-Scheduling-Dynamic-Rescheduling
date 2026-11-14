package com.orscheduler.service;

import com.orscheduler.dto.request.RoomRequest;
import com.orscheduler.dto.response.RoomResponse;
import com.orscheduler.entity.OperatingRoom;
import com.orscheduler.entity.RoomOperatingHours;
import com.orscheduler.enums.RoomStatus;
import com.orscheduler.exception.ConflictException;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.repository.OperatingRoomRepository;
import com.orscheduler.repository.RoomOperatingHoursRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final OperatingRoomRepository roomRepository;
    private final RoomOperatingHoursRepository hoursRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<RoomResponse> getAllRooms(RoomStatus status, String search, Pageable pageable) {
        final String term = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;
        Page<OperatingRoom> rooms;
        if (status != null && term == null) {
            rooms = roomRepository.findByStatus(status, pageable);
        } else if (term != null) {
            List<OperatingRoom> filtered = roomRepository.findAll(pageable.getSort()).stream()
                    .filter(r -> status == null || r.getStatus() == status)
                    .filter(r -> r.getName().toLowerCase().contains(term)
                            || (r.getRoomType() != null && r.getRoomType().toLowerCase().contains(term)))
                    .collect(Collectors.toList());
            rooms = com.orscheduler.util.PageUtils.page(filtered, pageable);
        } else {
            rooms = roomRepository.findAll(pageable);
        }
        return rooms.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Long id) {
        OperatingRoom room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OperatingRoom", id));
        return toResponse(room);
    }

    @Transactional(readOnly = true)
    public List<OperatingRoom> getAllActiveRooms() {
        return roomRepository.findByStatusOrderByNameAsc(RoomStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getActiveRoomResponses() {
        return roomRepository.findByStatusOrderByNameAsc(RoomStatus.ACTIVE).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void validateHours(List<RoomRequest.OperatingHoursDto> hours) {
        if (hours == null) return;
        for (RoomRequest.OperatingHoursDto h : hours) {
            if (h.getStartTime() != null && h.getEndTime() != null && !h.getStartTime().isBefore(h.getEndTime())) {
                throw new IllegalArgumentException("Operating hours start time must be before end time");
            }
        }
    }

    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        validateHours(request.getOperatingHours());
        if (roomRepository.existsByName(request.getName())) {
            throw new ConflictException("Operating room with name " + request.getName() + " already exists");
        }

        OperatingRoom room = OperatingRoom.builder()
                .name(request.getName())
                .roomType(request.getRoomType())
                .status(request.getStatus() != null ? request.getStatus() : RoomStatus.ACTIVE)
                .capacity(request.getCapacity() != null ? request.getCapacity() : 1)
                .description(request.getDescription())
                .operatingHours(new ArrayList<>())
                .build();

        OperatingRoom saved = roomRepository.save(room);

        if (request.getOperatingHours() != null && !request.getOperatingHours().isEmpty()) {
            for (RoomRequest.OperatingHoursDto h : request.getOperatingHours()) {
                RoomOperatingHours hours = RoomOperatingHours.builder()
                        .room(saved)
                        .dayOfWeek(h.getDayOfWeek())
                        .startTime(h.getStartTime())
                        .endTime(h.getEndTime())
                        .effectiveFrom(h.getEffectiveFrom())
                        .effectiveTo(h.getEffectiveTo())
                        .isException(h.isException())
                        .build();
                hoursRepository.save(hours);
                saved.getOperatingHours().add(hours);
            }
        }

        if (request.getOperatingHours() == null || request.getOperatingHours().isEmpty()) {
            // Default institutional operating hours: Mon-Fri 07:00 - 19:00
            for (int day = 1; day <= 5; day++) {
                RoomOperatingHours hours = RoomOperatingHours.builder()
                        .room(saved)
                        .dayOfWeek(day)
                        .startTime(java.time.LocalTime.of(7, 0))
                        .endTime(java.time.LocalTime.of(19, 0))
                        .isException(false)
                        .build();
                hoursRepository.save(hours);
                saved.getOperatingHours().add(hours);
            }
        }

        auditService.logAction("CREATE_ROOM", "OperatingRoom", saved.getId(), null, saved.getName());
        return toResponse(saved);
    }

    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request) {
        OperatingRoom room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OperatingRoom", id));

        if (!room.getName().equalsIgnoreCase(request.getName()) && roomRepository.existsByName(request.getName())) {
            throw new ConflictException("Room name " + request.getName() + " is already taken");
        }

        room.setName(request.getName());
        room.setRoomType(request.getRoomType());
        if (request.getCapacity() != null) {
            room.setCapacity(request.getCapacity());
        }
        room.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            room.setStatus(request.getStatus());
        }

        if (request.getOperatingHours() != null) {
            validateHours(request.getOperatingHours());
            room.getOperatingHours().clear();
            for (RoomRequest.OperatingHoursDto h : request.getOperatingHours()) {
                room.getOperatingHours().add(RoomOperatingHours.builder()
                        .room(room)
                        .dayOfWeek(h.getDayOfWeek())
                        .startTime(h.getStartTime())
                        .endTime(h.getEndTime())
                        .effectiveFrom(h.getEffectiveFrom())
                        .effectiveTo(h.getEffectiveTo())
                        .isException(h.isException())
                        .build());
            }
        }

        OperatingRoom updated = roomRepository.save(room);
        auditService.logAction("UPDATE_ROOM", "OperatingRoom", updated.getId(), null, updated.getName());
        return toResponse(updated);
    }

    @Transactional
    public void deleteRoom(Long id) {
        OperatingRoom room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OperatingRoom", id));
        room.setStatus(RoomStatus.CLOSED);
        roomRepository.save(room);
        auditService.logAction("CLOSE_ROOM", "OperatingRoom", room.getId(), null, room.getName());
    }

    public RoomResponse toResponse(OperatingRoom r) {
        List<RoomResponse.OperatingHoursResponse> hours = r.getOperatingHours() != null ?
                r.getOperatingHours().stream().map(h -> RoomResponse.OperatingHoursResponse.builder()
                        .id(h.getId())
                        .dayOfWeek(h.getDayOfWeek())
                        .startTime(h.getStartTime())
                        .endTime(h.getEndTime())
                        .effectiveFrom(h.getEffectiveFrom())
                        .effectiveTo(h.getEffectiveTo())
                        .isException(h.isException())
                        .build()).collect(Collectors.toList()) :
                List.of();

        return RoomResponse.builder()
                .id(r.getId())
                .name(r.getName())
                .roomType(r.getRoomType())
                .status(r.getStatus())
                .capacity(r.getCapacity())
                .description(r.getDescription())
                .createdAt(r.getCreatedAt())
                .operatingHours(hours)
                .build();
    }
}
