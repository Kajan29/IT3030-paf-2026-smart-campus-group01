package com.zentaritas.service.booking;

import com.zentaritas.model.auth.Role;
import com.zentaritas.model.auth.User;
import com.zentaritas.model.booking.BookingNotification;
import com.zentaritas.repository.auth.UserRepository;
import com.zentaritas.repository.booking.BookingNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final BookingNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public BookingNotification createNotification(
            User recipient,
            BookingNotification.NotificationType type,
            String title,
            String message,
            Long relatedBookingId,
            Long relatedTicketId,
            String targetPath,
            LocalDateTime eventDate
    ) {
        BookingNotification notification = BookingNotification.builder()
                .user(recipient)
                .type(type)
                .relatedBookingId(relatedBookingId)
                .relatedTicketId(relatedTicketId)
                .title(title)
                .message(message)
                .targetPath(normalizePath(targetPath))
                .eventDate(eventDate)
                .status(BookingNotification.NotificationStatus.PENDING)
                .build();

        return notificationRepository.save(notification);
    }

    public int createForUsers(
            List<User> recipients,
            BookingNotification.NotificationType type,
            String title,
            String message,
            Long relatedBookingId,
            Long relatedTicketId,
            String targetPath,
            LocalDateTime eventDate
    ) {
        LinkedHashMap<Long, User> uniqueRecipients = new LinkedHashMap<>();
        for (User user : recipients) {
            if (user != null && user.getId() != null && Boolean.TRUE.equals(user.getIsActive())) {
                uniqueRecipients.put(user.getId(), user);
            }
        }

        if (uniqueRecipients.isEmpty()) {
            return 0;
        }

        List<BookingNotification> notifications = new ArrayList<>();
        for (User recipient : uniqueRecipients.values()) {
            notifications.add(BookingNotification.builder()
                    .user(recipient)
                    .type(type)
                    .relatedBookingId(relatedBookingId)
                    .relatedTicketId(relatedTicketId)
                    .title(title)
                    .message(message)
                    .targetPath(normalizePath(targetPath))
                    .eventDate(eventDate)
                    .status(BookingNotification.NotificationStatus.PENDING)
                    .build());
        }

        notificationRepository.saveAll(notifications);
        return notifications.size();
    }

    public int notifyAdmins(
            BookingNotification.NotificationType type,
            String title,
            String message,
            Long relatedBookingId,
            Long relatedTicketId,
            String targetPath
    ) {
        List<User> admins = userRepository.findByRoleAndIsActive(Role.ADMIN, true);
        int sent = createForUsers(admins, type, title, message, relatedBookingId, relatedTicketId, targetPath, null);
        log.debug("Admin notifications sent: {} for type {}", sent, type);
        return sent;
    }

    public int broadcastAdminNotification(
            String audience,
            List<Long> userIds,
            BookingNotification.NotificationType type,
            String title,
            String message,
            String targetPath
    ) {
        List<User> recipients = resolveRecipients(audience, userIds);
        return createForUsers(recipients, type, title, message, null, null, targetPath, null);
    }

    public List<User> resolveRecipients(String audience, List<Long> userIds) {
        if (!StringUtils.hasText(audience)) {
            throw new IllegalArgumentException("Audience is required");
        }

        String normalizedAudience = audience.trim().toUpperCase();
        return switch (normalizedAudience) {
            case "ALL_USERS" -> userRepository.findByIsActive(true);
            case "STUDENTS" -> userRepository.findByRoleAndIsActive(Role.STUDENT, true);
            case "STAFF" -> {
                List<User> staff = new ArrayList<>();
                staff.addAll(userRepository.findByRoleAndIsActive(Role.ACADEMIC_STAFF, true));
                staff.addAll(userRepository.findByRoleAndIsActive(Role.NON_ACADEMIC_STAFF, true));
                yield staff;
            }
            case "ADMINS" -> userRepository.findByRoleAndIsActive(Role.ADMIN, true);
            case "SELECTED_USERS" -> {
                if (userIds == null || userIds.isEmpty()) {
                    throw new IllegalArgumentException("At least one user must be selected");
                }

                List<User> selected = userRepository.findAllById(userIds)
                        .stream()
                        .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                        .toList();

                if (selected.isEmpty()) {
                    throw new IllegalArgumentException("No active users found for selected IDs");
                }

                yield selected;
            }
            default -> throw new IllegalArgumentException("Unsupported audience: " + audience);
        };
    }

    private String normalizePath(String targetPath) {
        if (!StringUtils.hasText(targetPath)) {
            return null;
        }

        String normalized = targetPath.trim();
        if (!normalized.startsWith("/")) {
            return "/" + normalized;
        }
        return normalized;
    }
}