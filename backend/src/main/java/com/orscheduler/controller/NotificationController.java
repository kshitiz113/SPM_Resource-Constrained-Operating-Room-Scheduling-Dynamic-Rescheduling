package com.orscheduler.controller;

import com.orscheduler.dto.response.NotificationResponse;
import com.orscheduler.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Real-time alerts and user notification endpoints")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get current user notifications")
    public ResponseEntity<Page<NotificationResponse>> getNotifications(Pageable pageable) {
        return ResponseEntity.ok(notificationService.getCurrentUserNotifications(pageable));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get number of unread notifications for the current user")
    public ResponseEntity<java.util.Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(java.util.Map.of("count", notificationService.countUnread()));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications of the current user as read")
    public ResponseEntity<java.util.Map<String, Integer>> markAllAsRead() {
        return ResponseEntity.ok(java.util.Map.of("updated", notificationService.markAllAsRead()));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}
