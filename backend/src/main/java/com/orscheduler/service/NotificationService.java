package com.orscheduler.service;

import com.orscheduler.dto.response.NotificationResponse;
import com.orscheduler.entity.Notification;
import com.orscheduler.entity.User;
import com.orscheduler.exception.ResourceNotFoundException;
import com.orscheduler.repository.NotificationRepository;
import com.orscheduler.repository.UserRepository;
import com.orscheduler.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void sendNotification(Long userId, String type, String title, String message, Long refId, String refType) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = Notification.builder()
                .user(user)
                .notificationType(type)
                .title(title)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .referenceEntityId(refId)
                .referenceEntityType(refType)
                .build();

        notificationRepository.save(notification);
    }

    @Transactional
    public void broadcastNotification(String type, String title, String message, Long refId, String refType) {
        List<User> activeUsers = userRepository.findByActiveTrue();
        for (User u : activeUsers) {
            sendNotification(u.getId(), type, title, message, refId, refType);
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getCurrentUserNotifications(Pageable pageable) {
        String username = SecurityUtils.getCurrentUsername().orElseThrow(() -> new ResourceNotFoundException("Not authenticated"));
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        String username = SecurityUtils.getCurrentUsername().orElse(null);
        if (username == null || notification.getUser() == null
                || !username.equals(notification.getUser().getUsername())) {
            throw new ResourceNotFoundException("Notification", notificationId);
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public int markAllAsRead() {
        String username = SecurityUtils.getCurrentUsername().orElseThrow(() -> new ResourceNotFoundException("Not authenticated"));
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(user.getId());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return unread.size();
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        String username = SecurityUtils.getCurrentUsername().orElseThrow(() -> new ResourceNotFoundException("Not authenticated"));
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUser().getId())
                .notificationType(n.getNotificationType())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .referenceEntityId(n.getReferenceEntityId())
                .referenceEntityType(n.getReferenceEntityType())
                .build();
    }
}
