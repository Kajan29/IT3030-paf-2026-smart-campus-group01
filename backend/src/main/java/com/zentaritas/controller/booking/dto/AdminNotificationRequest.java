package com.zentaritas.controller.booking.dto;

import com.zentaritas.model.booking.BookingNotification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AdminNotificationRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    @NotNull(message = "Audience is required")
    private TargetAudience audience;

    private BookingNotification.NotificationType type = BookingNotification.NotificationType.ADMIN_ALERT;

    private List<Long> userIds;

    private String targetPath;

    public enum TargetAudience {
        ALL_USERS,
        STUDENTS,
        STAFF,
        ADMINS,
        SELECTED_USERS
    }
}