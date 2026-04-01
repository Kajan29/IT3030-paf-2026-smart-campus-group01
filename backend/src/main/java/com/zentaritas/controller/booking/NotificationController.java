package com.zentaritas.controller.booking;

import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.BookingNotification;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.booking.BookingNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller for Notifications
 * Endpoints: /api/notifications/**
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final BookingNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // ============= NOTIFICATION MANAGEMENT =============

    /**
     * Get all notifications for current user
     * GET /api/notifications
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingNotification>> getNotifications(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        log.debug("Fetching notifications for user {}", user.getId());
        return ResponseEntity.ok(notificationRepository.findNotificationsByUser(user.getId()));
    }

    /**
     * Get unread notifications for current user
     * GET /api/notifications/unread
     */
    @GetMapping("/unread")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingNotification>> getUnreadNotifications(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        log.debug("Fetching unread notifications for user {}", user.getId());
        return ResponseEntity.ok(notificationRepository.findUnreadNotifications(user.getId()));
    }

    /**
     * Count unread notifications
     * GET /api/notifications/unread/count
     */
    @GetMapping("/unread/count")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> countUnreadNotifications(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Long unreadCount = notificationRepository.countUnreadNotifications(user.getId());
        log.debug("Unread notifications count for user {}: {}", user.getId(), unreadCount);

        return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
    }

    /**
     * Mark a notification as read
     * PUT /api/notifications/{notificationId}/read
     */
    @PutMapping("/{notificationId}/read")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<?> markAsRead(@PathVariable Long notificationId) {
        log.info("Marking notification {} as read", notificationId);

        try {
            BookingNotification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Notification marked as read"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Mark all notifications as read
     * PUT /api/notifications/read-all
     */
    @PutMapping("/read-all")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        log.info("Marking all notifications as read for user {}", user.getId());

        try {
            List<BookingNotification> unreadNotifications = notificationRepository.findUnreadNotifications(user.getId());
            unreadNotifications.forEach(n -> {
                n.setIsRead(true);
                n.setReadAt(LocalDateTime.now());
            });
            notificationRepository.saveAll(unreadNotifications);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "All notifications marked as read",
                    "count", unreadNotifications.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Get notifications by type
     * GET /api/notifications/type/{type}
     */
    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<List<BookingNotification>> getNotificationsByType(@PathVariable String type) {
        log.debug("Fetching notifications of type {}", type);

        try {
            BookingNotification.NotificationType notificationType = BookingNotification.NotificationType.valueOf(type);
            return ResponseEntity.ok(notificationRepository.findByType(notificationType));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete a notification
     * DELETE /api/notifications/{notificationId}
     */
    @DeleteMapping("/{notificationId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<?> deleteNotification(@PathVariable Long notificationId) {
        log.info("Deleting notification {}", notificationId);

        try {
            notificationRepository.deleteById(notificationId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Notification deleted"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Delete all notifications for user
     * DELETE /api/notifications/delete-all
     */
    @DeleteMapping("/delete-all")
    @PreAuthorize("hasAnyRole('STUDENT', 'ACADEMIC_STAFF', 'NON_ACADEMIC_STAFF', 'ADMIN')")
    public ResponseEntity<?> deleteAllNotifications(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        log.info("Deleting all notifications for user {}", user.getId());

        try {
            List<BookingNotification> allNotifications = notificationRepository.findNotificationsByUser(user.getId());
            notificationRepository.deleteAll(allNotifications);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "All notifications deleted",
                    "count", allNotifications.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Admin: Get all pending notifications
     * GET /api/notifications/admin/pending
     */
    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingNotification>> getPendingNotifications() {
        log.debug("Fetching all pending notifications");
        return ResponseEntity.ok(notificationRepository.findUnsentNotifications());
    }
}
