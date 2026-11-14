package com.orscheduler.controller;

import com.orscheduler.dto.request.RoomRequest;
import com.orscheduler.dto.response.RoomResponse;
import com.orscheduler.enums.RoomStatus;
import com.orscheduler.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Tag(name = "Operating Rooms", description = "Operating room management and availability endpoints")
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    @Operation(summary = "List all operating rooms with pagination and filters")
    public ResponseEntity<Page<RoomResponse>> getAllRooms(
            @RequestParam(required = false) RoomStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(roomService.getAllRooms(status, search, pageable));
    }

    @GetMapping("/active")
    @Operation(summary = "List all active operating rooms")
    public ResponseEntity<List<RoomResponse>> getActiveRooms() {
        return ResponseEntity.ok(roomService.getActiveRoomResponses());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get operating room by ID")
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Create new operating room")
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody RoomRequest request) {
        return new ResponseEntity<>(roomService.createRoom(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OR_MANAGER')")
    @Operation(summary = "Update operating room details")
    public ResponseEntity<RoomResponse> updateRoom(@PathVariable Long id, @Valid @RequestBody RoomRequest request) {
        return ResponseEntity.ok(roomService.updateRoom(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Close operating room")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}
